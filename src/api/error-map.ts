import { readLocale } from '../app/session';

const localeErrorMessages = {
  'zh-CN': {
    BAD_REQUEST: '请求参数不符合要求，请检查后重试。',
    FORBIDDEN: '当前账号没有这个操作权限。',
    INVALID_PASSWORD: '当前密码不正确，请重新输入。',
    MOCK_NOT_FOUND: '模板 Mock 接口尚未实现，请补齐真实接口或扩展 Mock。',
    PASSWORD_SAME_AS_OLD: '新密码不能与当前密码一致。',
    PASSWORD_WEAK: '新密码至少 8 位，且需要同时包含字母和数字。',
    PROFILE_CONFLICT: '资料已被其他账号使用，请检查邮箱或手机号。',
    REQUEST_TIMEOUT: '请求超时，请稍后重试。',
    SERVER_ERROR: '服务端暂时不可用，请稍后重试。',
    UNAUTHORIZED: '登录态已过期，请重新登录。',
  },
  'en-US': {
    BAD_REQUEST: 'The request is invalid. Please review the input and try again.',
    FORBIDDEN: 'Your current account cannot perform this action.',
    INVALID_PASSWORD: 'The current password is incorrect.',
    MOCK_NOT_FOUND:
      'The template mock endpoint is missing. Extend the mock or connect the real API.',
    PASSWORD_SAME_AS_OLD: 'The new password must differ from the current password.',
    PASSWORD_WEAK:
      'The new password must be at least 8 characters and include both letters and numbers.',
    PROFILE_CONFLICT:
      'This profile information is already in use. Please review the email or phone number.',
    REQUEST_TIMEOUT: 'The request timed out. Please try again later.',
    SERVER_ERROR: 'The service is temporarily unavailable. Please try again later.',
    UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  },
} as const;

const errorStatusByCode: Record<string, number> = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  INVALID_PASSWORD: 400,
  MOCK_NOT_FOUND: 404,
  PASSWORD_SAME_AS_OLD: 400,
  PASSWORD_WEAK: 400,
  PROFILE_CONFLICT: 409,
  REQUEST_TIMEOUT: 408,
  UNAUTHORIZED: 401,
};

const getLocaleErrorMessages = () => {
  return localeErrorMessages[readLocale() ?? 'zh-CN'];
};

export const resolveApiErrorStatus = (status: number, code?: string) => {
  if (code && errorStatusByCode[code]) {
    return errorStatusByCode[code];
  }

  return status >= 400 ? status : 400;
};

export const resolveApiErrorMessage = ({
  status,
  code,
  fallbackMessage,
}: {
  code?: string;
  fallbackMessage?: string;
  status: number;
}) => {
  const localeMessages = getLocaleErrorMessages();

  if (code && code in localeMessages) {
    return localeMessages[code as keyof typeof localeMessages];
  }

  if (fallbackMessage && fallbackMessage.trim() !== '') {
    return fallbackMessage;
  }

  if (status === 401) {
    return localeMessages.UNAUTHORIZED;
  }

  if (status === 403) {
    return localeMessages.FORBIDDEN;
  }

  if (status === 408) {
    return localeMessages.REQUEST_TIMEOUT;
  }

  if (status === 409) {
    return localeMessages.PROFILE_CONFLICT;
  }

  if (status >= 500) {
    return localeMessages.SERVER_ERROR;
  }

  return localeMessages.BAD_REQUEST;
};
