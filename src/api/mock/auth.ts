import type { AuthSession, LoginParams } from '../models';
import { buildMockSession } from './user-context';
import { wait } from './shared';

export const mockLoginByPassword = async (params: LoginParams): Promise<AuthSession> => {
  await wait();

  const loginName = params.loginName.trim();
  const password = params.password.trim();

  if (!loginName || !password) {
    throw new Error('登录名和密码不能为空。');
  }

  return buildMockSession(loginName, password, params.role);
};
