import { apiClient } from './client';
import type { QueryRecord } from './core';
import type {
  AssignUserRolesInput,
  DepartmentRecord,
  DictionaryEntryRecord,
  DictionaryRecord,
  ListDepartmentParams,
  ListDictionaryParams,
  ListRoleParams,
  ListUserParams,
  RolePermissionRecord,
  RoleMatrixRecord,
  SaveDepartmentInput,
  SaveDictionaryEntryInput,
  SaveDictionaryInput,
  SaveRoleInput,
  SaveUserInput,
  SystemTreeNode,
  UserRecord,
} from './models';

const asQueryRecord = <T extends object>(query?: T) => {
  return query as QueryRecord | undefined;
};

export const listUsers = (query?: ListUserParams) => {
  return apiClient.get<UserRecord[]>('/system/users', asQueryRecord(query));
};

export const saveUser = (input: SaveUserInput) => {
  return apiClient.post<UserRecord, SaveUserInput>('/system/users', input);
};

export const removeUsers = (ids: string[]) => {
  return apiClient.delete<{ success: boolean }>('/system/users', { id: ids });
};

export const assignUserRoles = (input: AssignUserRolesInput) => {
  return apiClient.put<UserRecord, AssignUserRolesInput>('/system/users/roles', input);
};

export const listRoleMatrix = () => {
  return apiClient.get<RoleMatrixRecord[]>('/system/roles/matrix');
};

export const listRoles = (query?: ListRoleParams) => {
  return apiClient.get<RolePermissionRecord[]>('/system/roles', asQueryRecord(query));
};

export const saveRole = (input: SaveRoleInput) => {
  return apiClient.post<RolePermissionRecord, SaveRoleInput>('/system/roles', input);
};

export const removeRoles = (ids: string[]) => {
  return apiClient.delete<{ success: boolean }>('/system/roles', { id: ids });
};

export const getRoleTree = () => {
  return apiClient.get<SystemTreeNode[]>('/system/roles/tree');
};

export const getMenuPermissionTree = () => {
  return apiClient.get<SystemTreeNode[]>('/system/roles/menu-tree');
};

export const listDepartments = (query?: ListDepartmentParams) => {
  return apiClient.get<DepartmentRecord[]>('/system/departments', asQueryRecord(query));
};

export const getDepartmentTree = () => {
  return apiClient.get<SystemTreeNode[]>('/system/departments/tree');
};

export const saveDepartment = (input: SaveDepartmentInput) => {
  return apiClient.post<DepartmentRecord, SaveDepartmentInput>('/system/departments', input);
};

export const removeDepartments = (ids: string[]) => {
  return apiClient.delete<{ success: boolean }>('/system/departments', { id: ids });
};

export const listDictionaries = (query?: ListDictionaryParams) => {
  return apiClient.get<DictionaryRecord[]>('/system/dictionaries', asQueryRecord(query));
};

export const saveDictionary = (input: SaveDictionaryInput) => {
  return apiClient.post<DictionaryRecord, SaveDictionaryInput>('/system/dictionaries', input);
};

export const removeDictionaries = (ids: string[]) => {
  return apiClient.delete<{ success: boolean }>('/system/dictionaries', { id: ids });
};

export const listDictionaryItems = (dictId: string) => {
  return apiClient.get<DictionaryEntryRecord[]>(`/system/dictionaries/${dictId}/items`);
};

export const saveDictionaryItem = (input: SaveDictionaryEntryInput) => {
  return apiClient.post<DictionaryEntryRecord, SaveDictionaryEntryInput>(
    `/system/dictionaries/${input.dictId}/items`,
    input,
  );
};

export const removeDictionaryItems = (dictId: string, ids: string[]) => {
  return apiClient.delete<{ success: boolean }>(`/system/dictionaries/${dictId}/items`, {
    id: ids,
  });
};
