import { ApiError, type HttpMethod, type QueryRecord } from '../core';
import { mockGetAssetDetail, mockUpdateAssetDetail } from './assets';
import { mockLoginByPassword } from './auth';
import {
  mockGetCurrentShellContext,
  mockUpdateCurrentPassword,
  mockUpdateCurrentProfile,
} from './user-context';
import {
  mockAssignUserRoles,
  mockGetDepartmentTree,
  mockGetMenuPermissionTree,
  mockGetRoleTree,
  mockListDepartments,
  mockListDictionaries,
  mockListDictionaryItems,
  mockListRoleMatrix,
  mockListRoles,
  mockListUsers,
  mockRemoveDepartments,
  mockRemoveDictionaries,
  mockRemoveDictionaryItems,
  mockRemoveRoles,
  mockRemoveUsers,
  mockSaveDepartment,
  mockSaveDictionary,
  mockSaveDictionaryItem,
  mockSaveRole,
  mockSaveUser,
  parseDepartmentQuery,
  parseDictionaryQuery,
  parseRoleQuery,
  parseUserQuery,
} from './system';
import { mockListTasks, mockSaveTask } from './tasks';

interface MockRequestOptions {
  authorization: string | null;
  body?: unknown;
  headers: Record<string, string>;
  method: HttpMethod;
  path: string;
  query?: QueryRecord;
}

const assertAuthorized = (authorization: string | null) => {
  if (!authorization) {
    throw new ApiError(401, '登录态已过期，请重新登录。', 'UNAUTHORIZED');
  }
};

export const handleMockRequest = async <TResponse>(options: MockRequestOptions) => {
  if (options.method === 'POST' && options.path === '/auth/login') {
    return mockLoginByPassword(options.body as never) as Promise<TResponse>;
  }

  assertAuthorized(options.authorization);

  if (options.method === 'POST' && options.path === '/tasks/query') {
    return mockListTasks(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'POST' && options.path === '/tasks') {
    return mockSaveTask(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/app/context') {
    return mockGetCurrentShellContext() as Promise<TResponse>;
  }

  if (options.method === 'PUT' && options.path === '/app/profile') {
    return mockUpdateCurrentProfile(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'PUT' && options.path === '/app/password') {
    return mockUpdateCurrentPassword(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/system/users') {
    return mockListUsers(parseUserQuery(options.query)) as Promise<TResponse>;
  }

  if (options.method === 'POST' && options.path === '/system/users') {
    return mockSaveUser(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'DELETE' && options.path === '/system/users') {
    const ids = Array.isArray(options.query?.id)
      ? options.query?.id.filter((item): item is string => typeof item === 'string')
      : typeof options.query?.id === 'string'
        ? [options.query.id]
        : [];
    return mockRemoveUsers(ids) as Promise<TResponse>;
  }

  if (options.method === 'PUT' && options.path === '/system/users/roles') {
    return mockAssignUserRoles(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/system/roles/matrix') {
    return mockListRoleMatrix() as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/system/roles') {
    return mockListRoles(parseRoleQuery(options.query)) as Promise<TResponse>;
  }

  if (options.method === 'POST' && options.path === '/system/roles') {
    return mockSaveRole(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'DELETE' && options.path === '/system/roles') {
    const ids = Array.isArray(options.query?.id)
      ? options.query?.id.filter((item): item is string => typeof item === 'string')
      : typeof options.query?.id === 'string'
        ? [options.query.id]
        : [];
    return mockRemoveRoles(ids) as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/system/roles/tree') {
    return mockGetRoleTree() as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/system/roles/menu-tree') {
    return mockGetMenuPermissionTree() as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/system/departments') {
    return mockListDepartments(parseDepartmentQuery(options.query)) as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/system/departments/tree') {
    return mockGetDepartmentTree() as Promise<TResponse>;
  }

  if (options.method === 'POST' && options.path === '/system/departments') {
    return mockSaveDepartment(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'DELETE' && options.path === '/system/departments') {
    const ids = Array.isArray(options.query?.id)
      ? options.query?.id.filter((item): item is string => typeof item === 'string')
      : typeof options.query?.id === 'string'
        ? [options.query.id]
        : [];
    return mockRemoveDepartments(ids) as Promise<TResponse>;
  }

  if (options.method === 'GET' && options.path === '/system/dictionaries') {
    return mockListDictionaries(parseDictionaryQuery(options.query)) as Promise<TResponse>;
  }

  if (options.method === 'POST' && options.path === '/system/dictionaries') {
    return mockSaveDictionary(options.body as never) as Promise<TResponse>;
  }

  if (options.method === 'DELETE' && options.path === '/system/dictionaries') {
    const ids = Array.isArray(options.query?.id)
      ? options.query?.id.filter((item): item is string => typeof item === 'string')
      : typeof options.query?.id === 'string'
        ? [options.query.id]
        : [];
    return mockRemoveDictionaries(ids) as Promise<TResponse>;
  }

  const dictionaryItemsMatch = options.path.match(/^\/system\/dictionaries\/([^/]+)\/items$/);
  if (dictionaryItemsMatch && options.method === 'GET') {
    return mockListDictionaryItems(dictionaryItemsMatch[1]) as Promise<TResponse>;
  }

  if (dictionaryItemsMatch && options.method === 'POST') {
    return mockSaveDictionaryItem(options.body as never) as Promise<TResponse>;
  }

  if (dictionaryItemsMatch && options.method === 'DELETE') {
    const ids = Array.isArray(options.query?.id)
      ? options.query?.id.filter((item): item is string => typeof item === 'string')
      : typeof options.query?.id === 'string'
        ? [options.query.id]
        : [];
    return mockRemoveDictionaryItems(dictionaryItemsMatch[1], ids) as Promise<TResponse>;
  }

  const assetMatch = options.path.match(/^\/assets\/([^/]+)$/);
  if (assetMatch && options.method === 'GET') {
    return mockGetAssetDetail(assetMatch[1]) as Promise<TResponse>;
  }

  if (assetMatch && options.method === 'PUT') {
    return mockUpdateAssetDetail(assetMatch[1], options.body as never) as Promise<TResponse>;
  }

  throw new ApiError(
    404,
    `未实现的 Mock 接口: ${options.method} ${options.path}`,
    'MOCK_NOT_FOUND',
  );
};
