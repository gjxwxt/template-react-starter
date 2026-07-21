import React from 'react';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BookOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';

import AssetDetailPage from '../../pages/assets/asset-detail';
import DashboardPage from '../../pages/workbench/dashboard';
import DepartmentManagePage from '../../pages/system/departments';
import DictionaryManagePage from '../../pages/system/dictionaries';
import RoleManagePage from '../../pages/system/roles';
import TaskListPage from '../../pages/workbench/tasks';
import UserManagePage from '../../pages/system/users';
import type { AppText } from '../i18n';
import type { AppRole, AppSession } from '../session';

export type AppRouteId =
  | 'dashboard'
  | 'tasks'
  | 'assetDetail'
  | 'userManage'
  | 'roleManage'
  | 'departmentManage'
  | 'dictionaryManage';
export type SidebarGroupKey = 'groupWorkbench' | 'groupAsset' | 'groupSystem';
export type TopNavKey = 'workbench' | 'asset' | 'system';

type AppTextKey = keyof AppText;

export interface AppRouteDefinition {
  affix?: boolean;
  element: React.ReactElement;
  icon: React.ReactElement;
  id: AppRouteId;
  labelKey: AppTextKey;
  path: string;
  roles?: AppRole[];
  serverPermissionCode?: string;
  serverRoutePath?: string;
  sidebarGroup: SidebarGroupKey;
  topNavKey: TopNavKey;
}

export interface SidebarGroupDefinition {
  key: SidebarGroupKey;
  labelKey: AppTextKey;
}

// 页面注册保留在本地，方便稳定控制布局、懒加载和兜底路由。
export const appSidebarGroups: SidebarGroupDefinition[] = [
  { key: 'groupWorkbench', labelKey: 'groupWorkbench' },
  { key: 'groupAsset', labelKey: 'groupAsset' },
  { key: 'groupSystem', labelKey: 'groupSystem' },
];

// `serverRoutePath` 和 `serverPermissionCode` 只负责把后端菜单映射回已注册页面。
export const appRoutes: AppRouteDefinition[] = [
  {
    affix: true,
    element: <DashboardPage />,
    icon: <DashboardOutlined />,
    id: 'dashboard',
    labelKey: 'menuDashboard',
    path: '/dashboard',
    serverPermissionCode: 'Dashboard:read',
    serverRoutePath: 'workbench/Dashboard',
    sidebarGroup: 'groupWorkbench',
    topNavKey: 'workbench',
  },
  {
    element: <TaskListPage />,
    icon: <DeploymentUnitOutlined />,
    id: 'tasks',
    labelKey: 'menuTasks',
    path: '/tasks',
    roles: ['admin', 'operator'],
    serverPermissionCode: 'TaskManagement:list',
    serverRoutePath: 'workbench/TaskManagement',
    sidebarGroup: 'groupWorkbench',
    topNavKey: 'workbench',
  },
  {
    element: <AssetDetailPage />,
    icon: <AppstoreOutlined />,
    id: 'assetDetail',
    labelKey: 'menuAssetDetail',
    path: '/assets/asset-001',
    serverPermissionCode: 'AssetCenter:getAssetDetail',
    serverRoutePath: 'assets/AssetCenter',
    sidebarGroup: 'groupAsset',
    topNavKey: 'asset',
  },
  {
    element: <UserManagePage />,
    icon: <TeamOutlined />,
    id: 'userManage',
    labelKey: 'menuUsers',
    path: '/system/users',
    roles: ['admin', 'operator'],
    serverPermissionCode: 'UserManagement:getUserManagementList',
    serverRoutePath: 'permissions/UserManagement',
    sidebarGroup: 'groupSystem',
    topNavKey: 'system',
  },
  {
    element: <RoleManagePage />,
    icon: <SafetyCertificateOutlined />,
    id: 'roleManage',
    labelKey: 'menuRoles',
    path: '/system/roles',
    roles: ['admin'],
    serverPermissionCode: 'RoleManagement:getRoleManagementList',
    serverRoutePath: 'permissions/RoleManagement',
    sidebarGroup: 'groupSystem',
    topNavKey: 'system',
  },
  {
    element: <DepartmentManagePage />,
    icon: <ApartmentOutlined />,
    id: 'departmentManage',
    labelKey: 'menuDepartments',
    path: '/system/departments',
    roles: ['admin'],
    serverPermissionCode: 'DepartmentManagement:getDepartmentList',
    serverRoutePath: 'permissions/DepartmentManagement',
    sidebarGroup: 'groupSystem',
    topNavKey: 'system',
  },
  {
    element: <DictionaryManagePage />,
    icon: <BookOutlined />,
    id: 'dictionaryManage',
    labelKey: 'menuDictionaries',
    path: '/system/dictionaries',
    roles: ['admin', 'operator'],
    serverPermissionCode: 'DictionaryManagement:getDictionaryList',
    serverRoutePath: 'permissions/DictionaryManagement',
    sidebarGroup: 'groupSystem',
    topNavKey: 'system',
  },
];

export const getRouteLabel = (route: AppRouteDefinition, texts: AppText) => {
  return String(texts[route.labelKey]);
};

export const isRouteAllowed = (
  route: AppRouteDefinition,
  session: Pick<AppSession, 'allowedRouteIds' | 'role'> | null | undefined,
) => {
  if (!session) {
    return false;
  }

  const roleAllowed = !route.roles || route.roles.includes(session.role);
  // 服务端模式用路由 id 收口可见范围，本地模式退回角色兜底。
  const routeAllowed =
    !session.allowedRouteIds ||
    session.allowedRouteIds.length === 0 ||
    session.allowedRouteIds.includes(route.id);

  return roleAllowed && routeAllowed;
};

export const getAccessibleRoutes = (
  session: Pick<AppSession, 'allowedRouteIds' | 'role'> | null,
) => {
  return appRoutes.filter((route) => isRouteAllowed(route, session));
};

export const getDefaultRoutePath = (routes: AppRouteDefinition[]) => {
  return routes.find((route) => route.affix)?.path ?? routes[0]?.path ?? '';
};
