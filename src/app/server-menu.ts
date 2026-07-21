import type { BackendMenuRecord, ServerNavigationSnapshot } from '../api/models';
import type { AppRouteDefinition, AppRouteId } from './router';
import type { SessionNavigationItem } from './session';

interface RouteLookup {
  byPath: Map<string, AppRouteDefinition>;
  byPermissionCode: Map<string, AppRouteDefinition>;
}

interface NavigationGroupBucket {
  items: SessionNavigationItem[];
  key: string;
  label?: string;
}

// 统一后端路径格式，避免前后斜杠差异导致映射失败。
const normalizePathKey = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return value.trim().replace(/^\/+/, '').replace(/\/+$/, '');
};

const isEnabledMenu = (record: BackendMenuRecord) => {
  return record.state == null || record.state === 1;
};

const sortMenus = (records: BackendMenuRecord[]) => {
  return [...records].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
};

const getChildren = (record: BackendMenuRecord) => {
  return Array.isArray(record.children) ? sortMenus(record.children) : [];
};

// 本地路由仍是真源，后端菜单只回映到这张查找表。
const buildRouteLookup = (routes: AppRouteDefinition[]): RouteLookup => {
  const byPath = new Map<string, AppRouteDefinition>();
  const byPermissionCode = new Map<string, AppRouteDefinition>();

  routes.forEach((route) => {
    const pathKeys = [route.path, route.serverRoutePath];
    pathKeys.forEach((pathKey) => {
      const normalizedPathKey = normalizePathKey(pathKey);
      if (normalizedPathKey) {
        byPath.set(normalizedPathKey, route);
      }
    });

    const permissionKeys = [route.serverPermissionCode];
    permissionKeys.forEach((permissionKey) => {
      if (permissionKey) {
        byPermissionCode.set(permissionKey, route);
      }
    });
  });

  return {
    byPath,
    byPermissionCode,
  };
};

const resolveRouteFromMenu = (record: BackendMenuRecord, lookup: RouteLookup) => {
  if (record.type !== 2 || record.isExternalUrl) {
    return null;
  }

  // 优先使用权限码映射，企业项目里菜单 URL 往往没有权限码稳定。
  if (record.permissionCode && lookup.byPermissionCode.has(record.permissionCode)) {
    return lookup.byPermissionCode.get(record.permissionCode) ?? null;
  }

  const normalizedPathKey = normalizePathKey(record.url);
  if (!normalizedPathKey) {
    return null;
  }

  return lookup.byPath.get(normalizedPathKey) ?? null;
};

const appendRouteToGroup = (
  group: NavigationGroupBucket,
  routeId: AppRouteId,
  assignedRouteIds: Set<AppRouteId>,
  label?: string,
) => {
  if (assignedRouteIds.has(routeId)) {
    return;
  }

  assignedRouteIds.add(routeId);
  group.items.push({
    routeId,
    label,
  });
};

const collectPageRoutes = (
  records: BackendMenuRecord[],
  lookup: RouteLookup,
  group: NavigationGroupBucket,
  assignedRouteIds: Set<AppRouteId>,
) => {
  sortMenus(records).forEach((record) => {
    if (!isEnabledMenu(record)) {
      return;
    }

    const route = resolveRouteFromMenu(record, lookup);
    if (route) {
      appendRouteToGroup(group, route.id, assignedRouteIds, record.menuName);
      return;
    }

    // 目录节点可能继续嵌套，递归下钻到真实页面节点。
    const children = getChildren(record);
    if (children.length > 0) {
      collectPageRoutes(children, lookup, group, assignedRouteIds);
    }
  });
};

const collectPermissionCodes = (records: BackendMenuRecord[]) => {
  const permissionCodeSet = new Set<string>();

  const visit = (currentRecords: BackendMenuRecord[]) => {
    currentRecords.forEach((record) => {
      if (!isEnabledMenu(record)) {
        return;
      }

      if (record.permissionCode?.trim()) {
        permissionCodeSet.add(record.permissionCode.trim());
      }

      const children = getChildren(record);
      if (children.length > 0) {
        visit(children);
      }
    });
  };

  visit(sortMenus(records));
  return [...permissionCodeSet];
};

export const adaptServerMenus = (
  records: BackendMenuRecord[],
  routes: AppRouteDefinition[],
): ServerNavigationSnapshot => {
  // 这里只产出壳层可消费的数据，不负责注册未知运行时页面。
  const lookup = buildRouteLookup(routes);
  const assignedRouteIds = new Set<AppRouteId>();
  const groupBucketMap = new Map<string, NavigationGroupBucket>();
  const orderedGroupBuckets: NavigationGroupBucket[] = [];

  const ensureGroupBucket = (key: string, label?: string) => {
    const existing = groupBucketMap.get(key);

    if (existing) {
      if (!existing.label && label) {
        existing.label = label;
      }
      return existing;
    }

    const nextGroup: NavigationGroupBucket = {
      key,
      label,
      items: [],
    };

    groupBucketMap.set(key, nextGroup);
    orderedGroupBuckets.push(nextGroup);
    return nextGroup;
  };

  sortMenus(records).forEach((record) => {
    if (!isEnabledMenu(record)) {
      return;
    }

    if (record.type === 1) {
      const group = ensureGroupBucket(`menu:${record.id}`, record.menuName);
      collectPageRoutes(getChildren(record), lookup, group, assignedRouteIds);
      return;
    }

    const route = resolveRouteFromMenu(record, lookup);
    if (!route) {
      return;
    }

    const fallbackGroup = ensureGroupBucket(route.sidebarGroup);
    appendRouteToGroup(fallbackGroup, route.id, assignedRouteIds, record.menuName);
  });

  return {
    allowedRouteIds: [...assignedRouteIds],
    navigationGroups: orderedGroupBuckets
      .filter((group) => group.items.length > 0)
      .map((group) => ({
        key: group.key,
        label: group.label,
        items: group.items,
        routeIds: group.items.map((item) => item.routeId),
      })),
    permissionCodes: collectPermissionCodes(records),
  };
};
