import type { AppRole, AppSession, SessionNavigationGroup } from '../app/session';

export interface LoginParams {
  loginName: string;
  password: string;
  role?: AppRole;
}

export type TaskStatus = 'running' | 'pending' | 'done';
export type TaskPriority = 'P0' | 'P1' | 'P2';

export interface TaskRecord {
  id: string;
  name: string;
  owner: string;
  status: TaskStatus;
  priority: TaskPriority;
  updatedAt: string;
}

export interface ListTaskParams {
  current: number;
  pageSize: number;
  queryValues: Record<string, unknown>;
}

export interface SaveTaskInput {
  id?: string;
  name: string;
  owner: string;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface AssetDetail {
  id: string;
  name: string;
  status: string;
  owner: string;
  level: string;
  description: string;
}

export type RecordStatus = 'active' | 'disabled';

export interface UserRecord {
  departmentId?: string;
  id: string;
  loginName?: string;
  email?: string;
  phone?: string;
  roleCodes?: string[];
  username: string;
  department: string;
  role: string;
  state: string;
  updatedAt?: string;
}

export interface RoleMatrixRecord {
  id: string;
  role: string;
  scope: string;
}

export interface ListUserParams {
  departmentId?: string;
  keyword?: string;
  state?: RecordStatus;
}

export interface SaveUserInput {
  departmentId?: string;
  email?: string;
  id?: string;
  loginName: string;
  phone?: string;
  roleCodes?: string[];
  state: RecordStatus;
  username: string;
}

export interface AssignUserRolesInput {
  id: string;
  roleCodes: string[];
}

export interface SystemTreeNode {
  children?: SystemTreeNode[];
  key: string;
  title: string;
}

export interface RolePermissionRecord {
  department: string;
  departmentId?: string;
  departmentIds: string[];
  description?: string;
  id: string;
  menuPermissionCodes: string[];
  menuPermissionCount: number;
  roleCode: string;
  roleName: string;
  departmentPermissionCount: number;
  status: RecordStatus;
  updatedAt: string;
}

export interface ListRoleParams {
  departmentId?: string;
  keyword?: string;
  status?: RecordStatus;
}

export interface SaveRoleInput {
  departmentId?: string;
  departmentIds: string[];
  description?: string;
  id?: string;
  menuPermissionCodes: string[];
  roleCode: string;
  roleName: string;
  status: RecordStatus;
}

export interface DepartmentRecord {
  description?: string;
  id: string;
  manager: string;
  memberCount: number;
  name: string;
  parentId?: string | null;
  parentName?: string;
  status: RecordStatus;
  updatedAt: string;
}

export interface ListDepartmentParams {
  keyword?: string;
  parentId?: string;
  status?: RecordStatus;
}

export interface SaveDepartmentInput {
  description?: string;
  id?: string;
  manager: string;
  name: string;
  parentId?: string | null;
  status: RecordStatus;
}

export interface DictionaryRecord {
  code: string;
  entryCount: number;
  id: string;
  name: string;
  remark?: string;
  status: RecordStatus;
  updatedAt: string;
}

export interface DictionaryEntryRecord {
  dictId: string;
  id: string;
  label: string;
  remark?: string;
  sortOrder: number;
  status: RecordStatus;
  updatedAt: string;
  value: string;
}

export interface ListDictionaryParams {
  keyword?: string;
  status?: RecordStatus;
}

export interface SaveDictionaryInput {
  code: string;
  id?: string;
  name: string;
  remark?: string;
  status: RecordStatus;
}

export interface SaveDictionaryEntryInput {
  dictId: string;
  id?: string;
  label: string;
  remark?: string;
  sortOrder: number;
  status: RecordStatus;
  value: string;
}

export type NavigationGroupRecord = SessionNavigationGroup;

export type BackendMenuType = 1 | 2 | 3;

export interface BackendMenuRecord {
  children?: BackendMenuRecord[] | null;
  createtime?: string | null;
  creator?: string | null;
  defaultPermission?: number | null;
  description?: string | null;
  icon?: string | null;
  id: string;
  isCache?: boolean | null;
  isExternalUrl?: boolean | null;
  lastchangetime?: string | null;
  lastmodifier?: string | null;
  menuName: string;
  openType?: number | null;
  parentId?: string | null;
  permissionCode?: string | null;
  roleType?: number | null;
  routeParam?: string | null;
  sortOrder?: number | null;
  state?: number | null;
  type: BackendMenuType;
  url?: string | null;
}

export interface ServerNavigationSnapshot {
  allowedRouteIds: string[];
  navigationGroups: NavigationGroupRecord[];
  permissionCodes: string[];
}

export interface UserProfile {
  department?: string;
  displayName: string;
  email?: string;
  loginName: string;
  phone?: string;
  role: AppRole;
}

export interface UpdateProfileInput {
  department?: string;
  displayName: string;
  email?: string;
  phone?: string;
}

export interface UpdatePasswordInput {
  confirmPassword: string;
  currentPassword: string;
  nextPassword: string;
}

export interface AppShellContext extends AppSession {
  allowedRouteIds: string[];
  navigationGroups: NavigationGroupRecord[];
  permissionCodes: string[];
}

export type AuthSession = AppSession;
