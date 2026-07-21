export type AppRole = 'admin' | 'operator' | 'viewer';
export type AppLocaleKey = 'zh-CN' | 'en-US';
export type AppThemeKey = 'light' | 'dark' | 'brand';

export interface SessionNavigationItem {
  label?: string;
  routeId: string;
}

export interface SessionNavigationGroup {
  key: string;
  label?: string;
  items?: SessionNavigationItem[];
  routeIds: string[];
}

export interface AppSession {
  department?: string;
  loginName: string;
  displayName: string;
  email?: string;
  navigationGroups?: SessionNavigationGroup[];
  permissionCodes?: string[];
  phone?: string;
  role: AppRole;
  token: string;
  allowedRouteIds?: string[];
}

const STORAGE_PREFIX = 'cvicse-template-react';

const storageKeys = {
  loginName: `${STORAGE_PREFIX}:loginName`,
  displayName: `${STORAGE_PREFIX}:displayName`,
  role: `${STORAGE_PREFIX}:role`,
  token: `${STORAGE_PREFIX}:token`,
  department: `${STORAGE_PREFIX}:department`,
  email: `${STORAGE_PREFIX}:email`,
  phone: `${STORAGE_PREFIX}:phone`,
  allowedRouteIds: `${STORAGE_PREFIX}:allowedRouteIds`,
  navigationGroups: `${STORAGE_PREFIX}:navigationGroups`,
  permissionCodes: `${STORAGE_PREFIX}:permissionCodes`,
  locale: `${STORAGE_PREFIX}:locale`,
  themeKey: `${STORAGE_PREFIX}:themeKey`,
  collapsed: `${STORAGE_PREFIX}:collapsed`,
  visitedTabs: `${STORAGE_PREFIX}:visitedTabs`,
} as const;

const readStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
};

const writeOptionalStorage = (key: string, value?: string) => {
  if (value == null || value === '') {
    removeStorage(key);
    return;
  }

  writeStorage(key, value);
};

const removeStorage = (key: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
};

export const readSession = (): AppSession | null => {
  const loginName = readStorage(storageKeys.loginName);
  const displayName = readStorage(storageKeys.displayName);
  const role = readStorage(storageKeys.role) as AppRole | null;
  const token = readStorage(storageKeys.token);
  const department = readStorage(storageKeys.department) ?? undefined;
  const email = readStorage(storageKeys.email) ?? undefined;
  const phone = readStorage(storageKeys.phone) ?? undefined;
  const rawAllowedRouteIds = readStorage(storageKeys.allowedRouteIds);
  const rawNavigationGroups = readStorage(storageKeys.navigationGroups);
  const rawPermissionCodes = readStorage(storageKeys.permissionCodes);

  if (!loginName || !displayName || !role || !token) {
    return null;
  }

  let allowedRouteIds: string[] | undefined;
  let navigationGroups: SessionNavigationGroup[] | undefined;
  let permissionCodes: string[] | undefined;

  // 本地存储只是缓存，解析失败不能影响应用启动。
  if (rawAllowedRouteIds) {
    try {
      const parsed = JSON.parse(rawAllowedRouteIds) as unknown;
      if (Array.isArray(parsed)) {
        allowedRouteIds = parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      allowedRouteIds = undefined;
    }
  }

  // 菜单缓存结构保持宽松，避免后端壳层数据微调时直接报错。
  if (rawNavigationGroups) {
    try {
      const parsed = JSON.parse(rawNavigationGroups) as unknown;
      if (Array.isArray(parsed)) {
        navigationGroups = parsed
          .filter(
            (item): item is SessionNavigationGroup =>
              typeof item === 'object' &&
              item !== null &&
              'key' in item &&
              typeof item.key === 'string' &&
              'routeIds' in item &&
              Array.isArray(item.routeIds),
          )
          .map((item) => ({
            key: item.key,
            label: 'label' in item && typeof item.label === 'string' ? item.label : undefined,
            items:
              'items' in item && Array.isArray(item.items)
                ? item.items
                    .filter(
                      (menuItem): menuItem is SessionNavigationItem =>
                        typeof menuItem === 'object' &&
                        menuItem !== null &&
                        'routeId' in menuItem &&
                        typeof menuItem.routeId === 'string',
                    )
                    .map((menuItem) => ({
                      routeId: menuItem.routeId,
                      label:
                        'label' in menuItem && typeof menuItem.label === 'string'
                          ? menuItem.label
                          : undefined,
                    }))
                : undefined,
            routeIds: item.routeIds.filter(
              (routeId): routeId is string => typeof routeId === 'string',
            ),
          }));
      }
    } catch {
      navigationGroups = undefined;
    }
  }

  if (rawPermissionCodes) {
    try {
      const parsed = JSON.parse(rawPermissionCodes) as unknown;
      if (Array.isArray(parsed)) {
        permissionCodes = parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      permissionCodes = undefined;
    }
  }

  return {
    department,
    loginName,
    displayName,
    email,
    navigationGroups,
    permissionCodes,
    phone,
    role,
    token,
    allowedRouteIds,
  };
};

export const writeSession = (session: AppSession) => {
  // 壳层关键会话字段统一在这里落盘，避免出现半更新状态。
  writeStorage(storageKeys.loginName, session.loginName);
  writeStorage(storageKeys.displayName, session.displayName);
  writeStorage(storageKeys.role, session.role);
  writeStorage(storageKeys.token, session.token);
  writeOptionalStorage(storageKeys.department, session.department);
  writeOptionalStorage(storageKeys.email, session.email);
  writeOptionalStorage(storageKeys.phone, session.phone);
  writeStorage(storageKeys.allowedRouteIds, JSON.stringify(session.allowedRouteIds ?? []));
  writeStorage(storageKeys.navigationGroups, JSON.stringify(session.navigationGroups ?? []));
  writeStorage(storageKeys.permissionCodes, JSON.stringify(session.permissionCodes ?? []));
};

export const clearSession = () => {
  removeStorage(storageKeys.loginName);
  removeStorage(storageKeys.displayName);
  removeStorage(storageKeys.role);
  removeStorage(storageKeys.token);
  removeStorage(storageKeys.department);
  removeStorage(storageKeys.email);
  removeStorage(storageKeys.phone);
  removeStorage(storageKeys.allowedRouteIds);
  removeStorage(storageKeys.navigationGroups);
  removeStorage(storageKeys.permissionCodes);
};

export const readLocale = (): AppLocaleKey | null => {
  const locale = readStorage(storageKeys.locale);
  if (locale === 'zh-CN' || locale === 'en-US') {
    return locale;
  }
  return null;
};

export const writeLocale = (locale: AppLocaleKey) => {
  writeStorage(storageKeys.locale, locale);
};

export const readThemeKey = (): AppThemeKey | null => {
  const themeKey = readStorage(storageKeys.themeKey);
  if (themeKey === 'light' || themeKey === 'dark' || themeKey === 'brand') {
    return themeKey;
  }
  return null;
};

export const writeThemeKey = (themeKey: AppThemeKey) => {
  writeStorage(storageKeys.themeKey, themeKey);
};

export const readCollapsed = (): boolean => {
  return readStorage(storageKeys.collapsed) === 'true';
};

export const writeCollapsed = (collapsed: boolean) => {
  writeStorage(storageKeys.collapsed, String(collapsed));
};

export const readVisitedTabs = (): string[] => {
  const rawValue = readStorage(storageKeys.visitedTabs);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
};

export const writeVisitedTabs = (paths: string[]) => {
  writeStorage(storageKeys.visitedTabs, JSON.stringify(paths));
};
