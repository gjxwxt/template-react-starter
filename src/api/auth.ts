import type { AuthSession, LoginParams } from './models';
import { apiClient } from './client';

export const loginByPassword = (params: LoginParams) => {
  return apiClient.post<AuthSession, LoginParams>('/auth/login', params, true);
};
