export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type QueryValue = string | number | boolean | null | undefined;
export type QueryRecord = Record<string, QueryValue | QueryValue[]>;

export interface RequestOptions<TBody = unknown> {
  body?: TBody;
  headers?: Record<string, string>;
  method: HttpMethod;
  path: string;
  query?: QueryRecord;
  skipAuth?: boolean;
  timeoutMs?: number;
}

export class ApiError extends Error {
  code?: string;
  details?: unknown;
  status: number;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
