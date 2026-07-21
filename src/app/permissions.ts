import type { AppSession } from './session';

export const hasPermissionCode = (
  session: Pick<AppSession, 'permissionCodes'> | null | undefined,
  permissionCode?: string | null,
) => {
  // 模板阶段缺少权限配置时默认放行，方便联调和排查。
  if (!permissionCode) {
    return true;
  }

  if (!session?.permissionCodes) {
    return true;
  }

  return session.permissionCodes.includes(permissionCode);
};
