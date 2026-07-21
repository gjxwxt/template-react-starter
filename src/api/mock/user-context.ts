import { appRoutes } from '../../app/router';
import type { AppRole, AppSession, SessionNavigationGroup } from '../../app/session';
import { adaptServerMenus } from '../../app/server-menu';
import { readSession } from '../../app/session';
import { ApiError } from '../core';
import type {
  AppShellContext,
  UpdatePasswordInput,
  UpdateProfileInput,
  UserProfile,
} from '../models';
import { getMockServerMenus } from './server-menu';
import { wait } from './shared';

interface MockUserRecord extends UserProfile {
  password: string;
}

const roleDisplayNames: Record<AppRole, string> = {
  admin: '平台管理员',
  operator: '运营负责人',
  viewer: '只读访客',
};

const roleDepartments: Record<AppRole, string> = {
  admin: '平台研发中心',
  operator: '运营交付中心',
  viewer: '审计与只读接入组',
};

// 登录只解决身份识别，壳层导航单独从后端风格菜单树推导。
const buildRoleNavigation = (
  role: AppRole,
): {
  allowedRouteIds: string[];
  navigationGroups: SessionNavigationGroup[];
  permissionCodes: string[];
} => {
  return adaptServerMenus(getMockServerMenus(role), appRoutes);
};

const userStore = new Map<string, MockUserRecord>();

export const resolveRole = (loginName: string, explicitRole?: AppRole): AppRole => {
  if (explicitRole) {
    return explicitRole;
  }

  // 通过登录名推断角色，降低演示账号成本，同时覆盖三种典型分支。
  const normalized = loginName.toLowerCase();

  if (
    normalized.includes('viewer') ||
    normalized.includes('guest') ||
    normalized.includes('read')
  ) {
    return 'viewer';
  }

  if (
    normalized.includes('operator') ||
    normalized.includes('ops') ||
    normalized.includes('operate') ||
    normalized.includes('yunying')
  ) {
    return 'operator';
  }

  return 'admin';
};

const buildDefaultProfile = (
  loginName: string,
  role: AppRole,
  password: string,
): MockUserRecord => {
  return {
    department: roleDepartments[role],
    displayName: roleDisplayNames[role],
    email: `${loginName}@cvicse.local`,
    loginName,
    password,
    phone:
      role === 'viewer'
        ? '0531-8000-0303'
        : role === 'operator'
          ? '0531-8000-0202'
          : '0531-8000-0101',
    role,
  };
};

const getOrCreateUser = (
  loginName: string,
  role: AppRole,
  password = '12345678a',
): MockUserRecord => {
  const existing = userStore.get(loginName);

  if (existing) {
    existing.role = role;
    if (!existing.password) {
      existing.password = password;
    }
    return existing;
  }

  const nextUser = buildDefaultProfile(loginName, role, password);
  userStore.set(loginName, nextUser);
  return nextUser;
};

const requireCurrentSession = () => {
  const session = readSession();

  if (!session) {
    throw new ApiError(401, '登录态已过期，请重新登录。', 'UNAUTHORIZED');
  }

  return session;
};

const requireCurrentUser = () => {
  const session = requireCurrentSession();
  const user = getOrCreateUser(session.loginName, session.role);

  return {
    session,
    user,
  };
};

export const buildMockSession = (
  loginName: string,
  password: string,
  explicitRole?: AppRole,
): AppSession => {
  const role = resolveRole(loginName, explicitRole);
  const user = getOrCreateUser(loginName, role, password);
  const navigation = buildRoleNavigation(role);

  return {
    allowedRouteIds: navigation.allowedRouteIds,
    department: user.department,
    displayName: user.displayName,
    email: user.email,
    loginName: user.loginName,
    navigationGroups: navigation.navigationGroups,
    permissionCodes: navigation.permissionCodes,
    phone: user.phone,
    role,
    token: `mock-token-${role}-${Date.now()}`,
  };
};

export const mockGetCurrentShellContext = async (): Promise<AppShellContext> => {
  await wait();

  const { session, user } = requireCurrentUser();
  const navigation = buildRoleNavigation(user.role);

  // 壳层上下文独立于登录接口，方便真实项目单独刷新菜单和资料。
  return {
    allowedRouteIds: navigation.allowedRouteIds,
    department: user.department,
    displayName: user.displayName,
    email: user.email,
    loginName: user.loginName,
    navigationGroups: navigation.navigationGroups,
    permissionCodes: navigation.permissionCodes,
    phone: user.phone,
    role: user.role,
    token: session.token,
  };
};

export const mockUpdateCurrentProfile = async (input: UpdateProfileInput): Promise<UserProfile> => {
  await wait();

  const { user } = requireCurrentUser();

  if (
    (input.email && input.email.toLowerCase().includes('duplicate')) ||
    (input.phone && input.phone.includes('0000'))
  ) {
    throw new ApiError(409, '资料已被其他账号使用。', 'PROFILE_CONFLICT');
  }

  user.displayName = input.displayName.trim() || user.displayName;
  user.department = input.department?.trim() || undefined;
  user.email = input.email?.trim() || undefined;
  user.phone = input.phone?.trim() || undefined;

  return {
    department: user.department,
    displayName: user.displayName,
    email: user.email,
    loginName: user.loginName,
    phone: user.phone,
    role: user.role,
  };
};

export const mockUpdateCurrentPassword = async (
  input: UpdatePasswordInput,
): Promise<{ success: boolean }> => {
  await wait();

  const { user } = requireCurrentUser();

  if (input.currentPassword !== user.password) {
    throw new ApiError(400, '当前密码不正确。', 'INVALID_PASSWORD');
  }

  if (input.nextPassword === input.currentPassword) {
    throw new ApiError(400, '新密码不能与当前密码一致。', 'PASSWORD_SAME_AS_OLD');
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(input.nextPassword)) {
    throw new ApiError(400, '新密码强度不足。', 'PASSWORD_WEAK');
  }

  user.password = input.nextPassword;
  return { success: true };
};
