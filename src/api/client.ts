import { templateAppConfig } from '../app/config';
import { emitNavigation } from '../app/navigation';
import { clearSession, emitSessionExpired, readSession } from '../app/session';
import { resolveApiErrorMessage, resolveApiErrorStatus } from './error-map';
import { ApiError, type QueryRecord, type RequestOptions } from './core';
import { handleMockRequest } from './mock/dispatcher';

interface ApiResponseEnvelope<TData = unknown> {
  code?: number | string;
  data?: TData;
  message?: string;
  msg?: string;
  success?: boolean;
}

const SUCCESS_RESPONSE_CODES = new Set(['0', '200', 'SUCCESS', 'OK']);

// 查询串处理保持轻量，满足模板常见 CRUD 场景即可。
const buildQueryString = (query?: QueryRecord) => {
  if (!query) {
    return '';
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    if (value != null) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const getAuthorizationHeader = () => {
  const session = readSession();

  if (!session?.token) {
    return null;
  }

  return `${templateAppConfig.auth.tokenScheme} ${session.token}`;
};

const handleUnauthorized = (message?: string) => {
  clearSession();
  emitSessionExpired({ message });
};

const extractEnvelopeMessage = (payload: ApiResponseEnvelope) => {
  if (typeof payload.message === 'string' && payload.message.trim() !== '') {
    return payload.message;
  }

  if (typeof payload.msg === 'string' && payload.msg.trim() !== '') {
    return payload.msg;
  }

  return undefined;
};

const isApiResponseEnvelope = (payload: unknown): payload is ApiResponseEnvelope => {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  return 'code' in payload || 'success' in payload;
};

const createApiError = (
  status: number,
  code?: string,
  fallbackMessage?: string,
  details?: unknown,
) => {
  const resolvedStatus = resolveApiErrorStatus(status, code);
  const message = resolveApiErrorMessage({
    code,
    fallbackMessage,
    status: resolvedStatus,
  });

  return new ApiError(resolvedStatus, message, code, details);
};

const normalizeApiError = (error: ApiError) => {
  return createApiError(error.status, error.code, error.message, error.details);
};

const buildErrorNavigationState = (status: number, message: string) => {
  const fromPath =
    typeof window === 'undefined' ? undefined : window.location.pathname || undefined;

  return {
    fromPath,
    message,
    status,
  };
};

const handleApiError = (error: ApiError) => {
  // 请求异常统一转成路由级异常页，页面代码只关注业务态。
  if (error.status === 401) {
    handleUnauthorized(error.message);
    return;
  }

  if (error.status === 403) {
    emitNavigation({
      path: templateAppConfig.auth.forbiddenPath,
      replace: true,
      state: buildErrorNavigationState(error.status, error.message),
    });
    return;
  }

  if (error.status === 404) {
    emitNavigation({
      path: templateAppConfig.auth.notFoundPath,
      replace: true,
      state: buildErrorNavigationState(error.status, error.message),
    });
    return;
  }

  if (error.status >= 500) {
    emitNavigation({
      path: templateAppConfig.auth.serverErrorPath,
      replace: true,
      state: buildErrorNavigationState(error.status, error.message),
    });
  }
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const createRequestUrl = (path: string, query?: QueryRecord) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${templateAppConfig.api.baseUrl}${normalizedPath}${buildQueryString(query)}`;
};

const request = async <TResponse, TBody = unknown>(options: RequestOptions<TBody>) => {
  const authorization = options.skipAuth ? null : getAuthorizationHeader();

  if (templateAppConfig.api.useMock) {
    try {
      return await handleMockRequest<TResponse>({
        authorization,
        body: options.body,
        headers: options.headers ?? {},
        method: options.method,
        path: options.path,
        query: options.query,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const normalizedError = normalizeApiError(error);
        handleApiError(normalizedError);
        throw normalizedError;
      }
      throw error;
    }
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? templateAppConfig.api.timeoutMs,
  );

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    };

    if (authorization) {
      headers.Authorization = authorization;
    }

    const response = await fetch(createRequestUrl(options.path, options.query), {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers,
      method: options.method,
      signal: controller.signal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const errorCode =
        isApiResponseEnvelope(payload) && payload.code != null ? String(payload.code) : undefined;
      const apiError = createApiError(
        response.status,
        errorCode,
        isApiResponseEnvelope(payload)
          ? extractEnvelopeMessage(payload)
          : response.statusText || 'Request failed.',
        payload,
      );
      handleApiError(apiError);

      throw apiError;
    }

    if (isApiResponseEnvelope(payload)) {
      const responseCode = payload.code != null ? String(payload.code).toUpperCase() : undefined;
      // 兼容常见企业接口包裹格式，避免每个页面自己解析 `code/msg/data`。
      const responseSuccess =
        payload.success === true ||
        (payload.success !== false &&
          responseCode !== undefined &&
          SUCCESS_RESPONSE_CODES.has(responseCode));

      if (!responseSuccess && (payload.success === false || responseCode !== undefined)) {
        const apiError = createApiError(
          response.status,
          responseCode,
          extractEnvelopeMessage(payload),
          payload,
        );
        handleApiError(apiError);
        throw apiError;
      }

      if ('data' in payload) {
        return payload.data as TResponse;
      }
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw createApiError(408, 'REQUEST_TIMEOUT');
    }

    const apiError = createApiError(
      500,
      undefined,
      error instanceof Error ? error.message : 'Request failed.',
    );
    handleApiError(apiError);
    throw apiError;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const apiClient = {
  delete: <TResponse>(path: string, query?: QueryRecord) =>
    request<TResponse>({ method: 'DELETE', path, query }),
  get: <TResponse>(path: string, query?: QueryRecord) =>
    request<TResponse>({ method: 'GET', path, query }),
  patch: <TResponse, TBody>(path: string, body?: TBody) =>
    request<TResponse, TBody>({ body, method: 'PATCH', path }),
  post: <TResponse, TBody>(path: string, body?: TBody, skipAuth = false) =>
    request<TResponse, TBody>({ body, method: 'POST', path, skipAuth }),
  put: <TResponse, TBody>(path: string, body?: TBody) =>
    request<TResponse, TBody>({ body, method: 'PUT', path }),
  request,
};
