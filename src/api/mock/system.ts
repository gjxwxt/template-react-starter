import { ApiError, type QueryRecord } from '../core';
import type {
  AssignUserRolesInput,
  DepartmentRecord,
  DictionaryEntryRecord,
  DictionaryRecord,
  ListDepartmentParams,
  ListDictionaryParams,
  ListRoleParams,
  ListUserParams,
  RecordStatus,
  RoleMatrixRecord,
  RolePermissionRecord,
  SaveDepartmentInput,
  SaveDictionaryEntryInput,
  SaveDictionaryInput,
  SaveRoleInput,
  SaveUserInput,
  SystemTreeNode,
  UserRecord,
} from '../models';
import { getMockServerMenus } from './server-menu';
import { wait } from './shared';

const normalizeKeyword = (value: string | undefined) => value?.trim().toLowerCase() ?? '';

const createId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatTimestamp = () => {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

const asStatus = (value: unknown, fallback: RecordStatus = 'active'): RecordStatus => {
  return value === 'disabled' ? 'disabled' : fallback;
};

const departmentRows: DepartmentRecord[] = [
  {
    id: 'dept-platform',
    name: '平台研发中心',
    parentId: null,
    parentName: '根机构',
    manager: '陈舟',
    memberCount: 24,
    status: 'active',
    description: '负责模板、组件库和平台壳层能力建设。',
    updatedAt: '2026-07-14 09:20:00',
  },
  {
    id: 'dept-ops',
    name: '运营交付中心',
    parentId: null,
    parentName: '根机构',
    manager: '李青',
    memberCount: 16,
    status: 'active',
    description: '负责环境交付、上线保障和运营支撑。',
    updatedAt: '2026-07-14 09:10:00',
  },
  {
    id: 'dept-security',
    name: '安全审计组',
    parentId: 'dept-platform',
    parentName: '平台研发中心',
    manager: '王宁',
    memberCount: 6,
    status: 'active',
    description: '负责权限审计、基线核查和安全策略。',
    updatedAt: '2026-07-13 18:40:00',
  },
  {
    id: 'dept-data',
    name: '数据治理组',
    parentId: 'dept-platform',
    parentName: '平台研发中心',
    manager: '赵敏',
    memberCount: 8,
    status: 'active',
    description: '负责指标体系、字典治理和数据口径统一。',
    updatedAt: '2026-07-13 18:20:00',
  },
  {
    id: 'dept-siteops',
    name: '现场运维组',
    parentId: 'dept-ops',
    parentName: '运营交付中心',
    manager: '杜凯',
    memberCount: 9,
    status: 'disabled',
    description: '负责现场巡检、变更执行和故障响应。',
    updatedAt: '2026-07-12 16:05:00',
  },
];

const roleRows: RolePermissionRecord[] = [
  {
    id: 'role-admin',
    roleName: '平台管理员',
    roleCode: 'admin',
    department: '平台研发中心',
    departmentId: 'dept-platform',
    departmentIds: ['dept-platform', 'dept-security', 'dept-data'],
    description: '拥有模板内全部菜单和操作权限。',
    menuPermissionCodes: [
      'Dashboard:read',
      'TaskManagement:list',
      'TaskManagement:create',
      'TaskManagement:edit',
      'TaskManagement:batchAssign',
      'TaskManagement:export',
      'AssetCenter:getAssetDetail',
      'AssetCenter:edit',
      'UserManagement:getUserManagementList',
      'UserManagement:addUser',
      'UserManagement:editUser',
      'UserManagement:assignRole',
      'UserManagement:deleteUser',
      'RoleManagement:getRoleManagementList',
      'RoleManagement:addRole',
      'RoleManagement:editRole',
      'RoleManagement:assignPermission',
      'RoleManagement:deleteRole',
      'DepartmentManagement:getDepartmentList',
      'DepartmentManagement:addDepartment',
      'DepartmentManagement:editDepartment',
      'DepartmentManagement:deleteDepartment',
      'DictionaryManagement:getDictionaryList',
      'DictionaryManagement:addDictionary',
      'DictionaryManagement:editDictionary',
      'DictionaryManagement:deleteDictionary',
      'DictionaryManagement:manageItem',
      'DictionaryManagement:editItem',
    ],
    menuPermissionCount: 28,
    departmentPermissionCount: 3,
    status: 'active',
    updatedAt: '2026-07-14 09:30:00',
  },
  {
    id: 'role-operator',
    roleName: '运营负责人',
    roleCode: 'operator',
    department: '运营交付中心',
    departmentId: 'dept-ops',
    departmentIds: ['dept-ops', 'dept-siteops'],
    description: '侧重任务、用户和字典的运营配置。',
    menuPermissionCodes: [
      'Dashboard:read',
      'TaskManagement:list',
      'TaskManagement:create',
      'TaskManagement:edit',
      'TaskManagement:batchAssign',
      'TaskManagement:export',
      'AssetCenter:getAssetDetail',
      'AssetCenter:edit',
      'UserManagement:getUserManagementList',
      'DictionaryManagement:getDictionaryList',
      'DictionaryManagement:manageItem',
      'DictionaryManagement:editItem',
    ],
    menuPermissionCount: 12,
    departmentPermissionCount: 2,
    status: 'active',
    updatedAt: '2026-07-13 17:15:00',
  },
  {
    id: 'role-auditor',
    roleName: '审计访客',
    roleCode: 'viewer',
    department: '安全审计组',
    departmentId: 'dept-security',
    departmentIds: ['dept-security'],
    description: '仅保留概览和只读查询权限。',
    menuPermissionCodes: ['Dashboard:read', 'AssetCenter:getAssetDetail'],
    menuPermissionCount: 2,
    departmentPermissionCount: 1,
    status: 'disabled',
    updatedAt: '2026-07-12 14:30:00',
  },
];

const dictionaryRows: DictionaryRecord[] = [
  {
    id: 'dict-task-status',
    name: '任务状态',
    code: 'task_status',
    status: 'active',
    remark: '任务生命周期状态字典。',
    entryCount: 3,
    updatedAt: '2026-07-14 09:08:00',
  },
  {
    id: 'dict-priority',
    name: '优先级',
    code: 'task_priority',
    status: 'active',
    remark: '任务优先级配置。',
    entryCount: 3,
    updatedAt: '2026-07-13 18:10:00',
  },
  {
    id: 'dict-asset-level',
    name: '资产等级',
    code: 'asset_level',
    status: 'disabled',
    remark: '资产保护等级定义。',
    entryCount: 4,
    updatedAt: '2026-07-11 11:10:00',
  },
];

const dictionaryEntryRows: DictionaryEntryRecord[] = [
  {
    id: 'dict-entry-running',
    dictId: 'dict-task-status',
    label: '进行中',
    value: 'running',
    sortOrder: 10,
    status: 'active',
    remark: '任务执行中',
    updatedAt: '2026-07-14 09:08:00',
  },
  {
    id: 'dict-entry-pending',
    dictId: 'dict-task-status',
    label: '待验收',
    value: 'pending',
    sortOrder: 20,
    status: 'active',
    remark: '等待验收',
    updatedAt: '2026-07-14 09:08:00',
  },
  {
    id: 'dict-entry-done',
    dictId: 'dict-task-status',
    label: '已完成',
    value: 'done',
    sortOrder: 30,
    status: 'active',
    remark: '处理完成',
    updatedAt: '2026-07-14 09:08:00',
  },
  {
    id: 'dict-entry-p0',
    dictId: 'dict-priority',
    label: 'P0',
    value: 'P0',
    sortOrder: 10,
    status: 'active',
    remark: '最高优先级',
    updatedAt: '2026-07-13 18:10:00',
  },
  {
    id: 'dict-entry-p1',
    dictId: 'dict-priority',
    label: 'P1',
    value: 'P1',
    sortOrder: 20,
    status: 'active',
    remark: '中优先级',
    updatedAt: '2026-07-13 18:10:00',
  },
  {
    id: 'dict-entry-p2',
    dictId: 'dict-priority',
    label: 'P2',
    value: 'P2',
    sortOrder: 30,
    status: 'active',
    remark: '普通优先级',
    updatedAt: '2026-07-13 18:10:00',
  },
  {
    id: 'dict-entry-core',
    dictId: 'dict-asset-level',
    label: '核心',
    value: 'L1',
    sortOrder: 10,
    status: 'active',
    remark: '核心资产',
    updatedAt: '2026-07-11 11:10:00',
  },
  {
    id: 'dict-entry-important',
    dictId: 'dict-asset-level',
    label: '重要',
    value: 'L2',
    sortOrder: 20,
    status: 'active',
    remark: '重要资产',
    updatedAt: '2026-07-11 11:10:00',
  },
  {
    id: 'dict-entry-normal',
    dictId: 'dict-asset-level',
    label: '普通',
    value: 'L3',
    sortOrder: 30,
    status: 'disabled',
    remark: '普通资产',
    updatedAt: '2026-07-11 11:10:00',
  },
  {
    id: 'dict-entry-sandbox',
    dictId: 'dict-asset-level',
    label: '沙箱',
    value: 'L4',
    sortOrder: 40,
    status: 'disabled',
    remark: '测试资产',
    updatedAt: '2026-07-11 11:10:00',
  },
];

const userRows: UserRecord[] = [
  {
    id: 'user-chenzhou',
    loginName: 'chenzhou',
    username: '陈舟',
    departmentId: 'dept-platform',
    department: '平台研发中心',
    role: '平台管理员',
    roleCodes: ['admin'],
    email: 'chenzhou@cvicse.local',
    phone: '0531-8000-1001',
    state: 'active',
    updatedAt: '2026-07-14 08:55:00',
  },
  {
    id: 'user-liqing',
    loginName: 'liqing',
    username: '李青',
    departmentId: 'dept-ops',
    department: '运营交付中心',
    role: '运营负责人',
    roleCodes: ['operator'],
    email: 'liqing@cvicse.local',
    phone: '0531-8000-1002',
    state: 'active',
    updatedAt: '2026-07-13 17:20:00',
  },
  {
    id: 'user-wangning',
    loginName: 'wangning',
    username: '王宁',
    departmentId: 'dept-security',
    department: '安全审计组',
    role: '审计访客',
    roleCodes: ['viewer'],
    email: 'wangning@cvicse.local',
    phone: '0531-8000-1003',
    state: 'disabled',
    updatedAt: '2026-07-12 13:35:00',
  },
];

const getDepartmentMap = () => {
  return new Map(departmentRows.map((item) => [item.id, item]));
};

const getRoleMap = () => {
  return new Map(roleRows.map((item) => [item.roleCode, item]));
};

const getDepartmentTreeChildren = (parentId: string | null): SystemTreeNode[] => {
  return departmentRows
    .filter((item) => (item.parentId ?? null) === parentId)
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))
    .map((item) => ({
      key: item.id,
      title: item.name,
      children: getDepartmentTreeChildren(item.id),
    }));
};

const getDepartmentTreeNodes = () => {
  return getDepartmentTreeChildren(null);
};

const isDepartmentDescendant = (sourceId: string, targetId: string | null) => {
  if (!targetId) {
    return false;
  }

  const departmentMap = getDepartmentMap();
  let parentId: string | null = targetId;

  while (parentId) {
    if (parentId === sourceId) {
      return true;
    }

    parentId = departmentMap.get(parentId)?.parentId ?? null;
  }

  return false;
};

const resolveDepartmentName = (departmentId?: string | null) => {
  if (!departmentId) {
    return '根机构';
  }

  return getDepartmentMap().get(departmentId)?.name ?? '未归属';
};

const isInDepartmentBranch = (record: DepartmentRecord, selectedId?: string) => {
  if (!selectedId || selectedId === 'all') {
    return true;
  }

  if (record.id === selectedId) {
    return true;
  }

  const departmentMap = getDepartmentMap();
  let parentId = record.parentId ?? null;

  while (parentId) {
    if (parentId === selectedId) {
      return true;
    }

    parentId = departmentMap.get(parentId)?.parentId ?? null;
  }

  return false;
};

const syncDictionaryEntryCount = () => {
  dictionaryRows.forEach((dictionary) => {
    dictionary.entryCount = dictionaryEntryRows.filter(
      (item) => item.dictId === dictionary.id,
    ).length;
  });
};

const syncRoleDerivedFields = () => {
  roleRows.forEach((role) => {
    role.department = resolveDepartmentName(role.departmentId);
    role.menuPermissionCount = role.menuPermissionCodes.length;
    role.departmentPermissionCount = role.departmentIds.length;
  });
};

const syncUserDerivedFields = () => {
  const departmentMap = getDepartmentMap();
  const roleMap = getRoleMap();

  userRows.forEach((user) => {
    user.department = user.departmentId
      ? (departmentMap.get(user.departmentId)?.name ?? '未归属')
      : '根机构';
    user.role =
      user.roleCodes && user.roleCodes.length > 0
        ? user.roleCodes.map((code) => roleMap.get(code)?.roleName ?? code).join(' / ')
        : '未授权';
  });
};

const ensureSystemConsistency = () => {
  syncRoleDerivedFields();
  syncUserDerivedFields();
  syncDictionaryEntryCount();
};

const buildRoleScopeText = (role: RolePermissionRecord) => {
  return `${role.department} · ${role.menuPermissionCount}项菜单权限 · ${role.departmentPermissionCount}个部门范围`;
};

const listUsersByQuery = (query?: ListUserParams) => {
  ensureSystemConsistency();
  const keyword = normalizeKeyword(query?.keyword);

  return userRows.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.loginName?.toLowerCase().includes(keyword) ||
      item.username.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword);
    const matchDepartment =
      !query?.departmentId ||
      query.departmentId === 'all' ||
      item.departmentId === query.departmentId;
    const matchState = !query?.state || item.state === query.state;

    return Boolean(matchKeyword && matchDepartment && matchState);
  });
};

const listRolesByQuery = (query?: ListRoleParams) => {
  ensureSystemConsistency();
  const keyword = normalizeKeyword(query?.keyword);

  return roleRows.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.roleName.toLowerCase().includes(keyword) ||
      item.roleCode.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword);
    const matchDepartment =
      !query?.departmentId ||
      query.departmentId === 'all' ||
      item.departmentIds.includes(query.departmentId);
    const matchStatus = !query?.status || item.status === query.status;

    return Boolean(matchKeyword && matchDepartment && matchStatus);
  });
};

const listDepartmentsByQuery = (query?: ListDepartmentParams) => {
  const keyword = normalizeKeyword(query?.keyword);

  return departmentRows.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.manager.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword);
    const matchStatus = !query?.status || item.status === query.status;
    const matchBranch = isInDepartmentBranch(item, query?.parentId);

    return Boolean(matchKeyword && matchStatus && matchBranch);
  });
};

const listDictionariesByQuery = (query?: ListDictionaryParams) => {
  syncDictionaryEntryCount();
  const keyword = normalizeKeyword(query?.keyword);

  return dictionaryRows.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.code.toLowerCase().includes(keyword) ||
      item.remark?.toLowerCase().includes(keyword);
    const matchStatus = !query?.status || item.status === query.status;

    return Boolean(matchKeyword && matchStatus);
  });
};

const buildRoleTree = (): SystemTreeNode[] => {
  return [
    {
      key: 'role-root',
      title: '角色目录',
      children: roleRows.map((item) => ({
        key: item.roleCode,
        title: item.roleName,
      })),
    },
  ];
};

const buildMenuPermissionTree = (): SystemTreeNode[] => {
  const visit = (records: ReturnType<typeof getMockServerMenus>): SystemTreeNode[] => {
    return records.map((record) => ({
      key: record.permissionCode?.trim() || `menu:${record.id}`,
      title: record.menuName,
      children:
        Array.isArray(record.children) && record.children.length > 0
          ? visit(record.children)
          : undefined,
    }));
  };

  return visit(getMockServerMenus('admin'));
};

const saveUserInternal = (input: SaveUserInput) => {
  const departmentMap = getDepartmentMap();

  if (!input.loginName.trim() || !input.username.trim()) {
    throw new ApiError(400, '账号和用户名称不能为空。', 'INVALID_USER');
  }

  if (input.email && input.email.toLowerCase().includes('duplicate')) {
    throw new ApiError(409, '该邮箱已被其他用户占用。', 'USER_EMAIL_CONFLICT');
  }

  const duplicatedLoginName = userRows.find(
    (item) => item.loginName === input.loginName.trim() && item.id !== input.id,
  );

  if (duplicatedLoginName) {
    throw new ApiError(409, '该登录账号已存在。', 'USER_LOGIN_NAME_CONFLICT');
  }

  const currentDepartmentId = input.departmentId || null;
  const currentDepartmentName = currentDepartmentId
    ? departmentMap.get(currentDepartmentId)?.name
    : '根机构';

  if (!currentDepartmentName) {
    throw new ApiError(400, '所属部门不存在。', 'DEPARTMENT_NOT_FOUND');
  }

  if (input.id) {
    const existing = userRows.find((item) => item.id === input.id);

    if (!existing) {
      throw new ApiError(404, '用户不存在。', 'USER_NOT_FOUND');
    }

    existing.loginName = input.loginName.trim();
    existing.username = input.username.trim();
    existing.departmentId = currentDepartmentId ?? undefined;
    existing.department = currentDepartmentName;
    existing.email = input.email?.trim() || undefined;
    existing.phone = input.phone?.trim() || undefined;
    existing.roleCodes = input.roleCodes ?? existing.roleCodes;
    existing.state = input.state;
    existing.updatedAt = formatTimestamp();
    syncUserDerivedFields();
    return existing;
  }

  const nextUser: UserRecord = {
    id: createId('user'),
    loginName: input.loginName.trim(),
    username: input.username.trim(),
    departmentId: currentDepartmentId ?? undefined,
    department: currentDepartmentName,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    roleCodes: input.roleCodes ?? [],
    role: '未授权',
    state: input.state,
    updatedAt: formatTimestamp(),
  };

  userRows.unshift(nextUser);
  syncUserDerivedFields();
  return nextUser;
};

const saveRoleInternal = (input: SaveRoleInput) => {
  if (!input.roleName.trim() || !input.roleCode.trim()) {
    throw new ApiError(400, '角色名称和角色编码不能为空。', 'INVALID_ROLE');
  }

  const duplicatedRoleCode = roleRows.find(
    (item) => item.roleCode === input.roleCode.trim() && item.id !== input.id,
  );

  if (duplicatedRoleCode) {
    throw new ApiError(409, '角色编码已存在。', 'ROLE_CODE_CONFLICT');
  }

  const departmentId = input.departmentId || null;
  const departmentName = resolveDepartmentName(departmentId);

  if (input.id) {
    const existing = roleRows.find((item) => item.id === input.id);

    if (!existing) {
      throw new ApiError(404, '角色不存在。', 'ROLE_NOT_FOUND');
    }

    const previousRoleCode = existing.roleCode;
    const nextRoleCode = input.roleCode.trim();

    existing.roleName = input.roleName.trim();
    existing.roleCode = nextRoleCode;
    existing.departmentId = departmentId ?? undefined;
    existing.department = departmentName;
    existing.description = input.description?.trim() || undefined;
    existing.departmentIds = input.departmentIds;
    existing.menuPermissionCodes = input.menuPermissionCodes;
    existing.status = input.status;
    existing.updatedAt = formatTimestamp();
    if (previousRoleCode !== nextRoleCode) {
      userRows.forEach((user) => {
        user.roleCodes = (user.roleCodes ?? []).map((roleCode) =>
          roleCode === previousRoleCode ? nextRoleCode : roleCode,
        );
      });
    }
    syncRoleDerivedFields();
    syncUserDerivedFields();
    return existing;
  }

  const nextRole: RolePermissionRecord = {
    id: createId('role'),
    roleName: input.roleName.trim(),
    roleCode: input.roleCode.trim(),
    department: departmentName,
    departmentId: departmentId ?? undefined,
    departmentIds: input.departmentIds,
    description: input.description?.trim() || undefined,
    menuPermissionCodes: input.menuPermissionCodes,
    menuPermissionCount: input.menuPermissionCodes.length,
    departmentPermissionCount: input.departmentIds.length,
    status: input.status,
    updatedAt: formatTimestamp(),
  };

  roleRows.unshift(nextRole);
  syncRoleDerivedFields();
  return nextRole;
};

const saveDepartmentInternal = (input: SaveDepartmentInput) => {
  if (!input.name.trim()) {
    throw new ApiError(400, '部门名称不能为空。', 'INVALID_DEPARTMENT');
  }

  const nextParentId = input.parentId ?? null;

  if (input.id && nextParentId === input.id) {
    throw new ApiError(400, '上级部门不能选择自己。', 'DEPARTMENT_PARENT_INVALID');
  }

  if (input.id && isDepartmentDescendant(input.id, nextParentId)) {
    throw new ApiError(400, '上级部门不能挂到当前部门的下级节点。', 'DEPARTMENT_PARENT_CYCLE');
  }

  if (input.id) {
    const existing = departmentRows.find((item) => item.id === input.id);

    if (!existing) {
      throw new ApiError(404, '部门不存在。', 'DEPARTMENT_NOT_FOUND');
    }

    existing.name = input.name.trim();
    existing.parentId = nextParentId;
    existing.parentName = resolveDepartmentName(nextParentId);
    existing.manager = input.manager.trim() || '待分配';
    existing.status = input.status;
    existing.description = input.description?.trim() || undefined;
    existing.updatedAt = formatTimestamp();
    syncRoleDerivedFields();
    syncUserDerivedFields();
    return existing;
  }

  const nextDepartment: DepartmentRecord = {
    id: createId('dept'),
    name: input.name.trim(),
    parentId: nextParentId,
    parentName: resolveDepartmentName(nextParentId),
    manager: input.manager.trim() || '待分配',
    memberCount: 0,
    status: input.status,
    description: input.description?.trim() || undefined,
    updatedAt: formatTimestamp(),
  };

  departmentRows.unshift(nextDepartment);
  return nextDepartment;
};

const saveDictionaryInternal = (input: SaveDictionaryInput) => {
  if (!input.name.trim() || !input.code.trim()) {
    throw new ApiError(400, '字典名称和字典编码不能为空。', 'INVALID_DICTIONARY');
  }

  const duplicatedDictionaryCode = dictionaryRows.find(
    (item) => item.code === input.code.trim() && item.id !== input.id,
  );

  if (duplicatedDictionaryCode) {
    throw new ApiError(409, '字典编码已存在。', 'DICTIONARY_CODE_CONFLICT');
  }

  if (input.id) {
    const existing = dictionaryRows.find((item) => item.id === input.id);

    if (!existing) {
      throw new ApiError(404, '字典不存在。', 'DICTIONARY_NOT_FOUND');
    }

    existing.name = input.name.trim();
    existing.code = input.code.trim();
    existing.status = input.status;
    existing.remark = input.remark?.trim() || undefined;
    existing.updatedAt = formatTimestamp();
    return existing;
  }

  const nextDictionary: DictionaryRecord = {
    id: createId('dict'),
    name: input.name.trim(),
    code: input.code.trim(),
    status: input.status,
    remark: input.remark?.trim() || undefined,
    entryCount: 0,
    updatedAt: formatTimestamp(),
  };

  dictionaryRows.unshift(nextDictionary);
  return nextDictionary;
};

const saveDictionaryItemInternal = (input: SaveDictionaryEntryInput) => {
  if (!input.label.trim() || !input.value.trim()) {
    throw new ApiError(400, '字典标签和值不能为空。', 'INVALID_DICTIONARY_ITEM');
  }

  const currentDictionary = dictionaryRows.find((item) => item.id === input.dictId);

  if (!currentDictionary) {
    throw new ApiError(404, '所属字典不存在。', 'DICTIONARY_NOT_FOUND');
  }

  const duplicatedDictionaryItem = dictionaryEntryRows.find(
    (item) =>
      item.dictId === input.dictId && item.value === input.value.trim() && item.id !== input.id,
  );

  if (duplicatedDictionaryItem) {
    throw new ApiError(409, '同一字典下的条目值不能重复。', 'DICTIONARY_ITEM_VALUE_CONFLICT');
  }

  if (input.id) {
    const existing = dictionaryEntryRows.find((item) => item.id === input.id);

    if (!existing) {
      throw new ApiError(404, '字典条目不存在。', 'DICTIONARY_ITEM_NOT_FOUND');
    }

    existing.label = input.label.trim();
    existing.value = input.value.trim();
    existing.sortOrder = input.sortOrder;
    existing.status = input.status;
    existing.remark = input.remark?.trim() || undefined;
    existing.updatedAt = formatTimestamp();
    syncDictionaryEntryCount();
    return existing;
  }

  const nextItem: DictionaryEntryRecord = {
    id: createId('dict-item'),
    dictId: input.dictId,
    label: input.label.trim(),
    value: input.value.trim(),
    sortOrder: input.sortOrder,
    status: input.status,
    remark: input.remark?.trim() || undefined,
    updatedAt: formatTimestamp(),
  };

  dictionaryEntryRows.unshift(nextItem);
  syncDictionaryEntryCount();
  return nextItem;
};

export const parseUserQuery = (query?: QueryRecord): ListUserParams => ({
  departmentId: typeof query?.departmentId === 'string' ? query.departmentId : undefined,
  keyword: typeof query?.keyword === 'string' ? query.keyword : undefined,
  state:
    asStatus(query?.state, 'active') === 'active' && query?.state == null
      ? undefined
      : asStatus(query?.state),
});

export const parseRoleQuery = (query?: QueryRecord): ListRoleParams => ({
  departmentId: typeof query?.departmentId === 'string' ? query.departmentId : undefined,
  keyword: typeof query?.keyword === 'string' ? query.keyword : undefined,
  status:
    asStatus(query?.status, 'active') === 'active' && query?.status == null
      ? undefined
      : asStatus(query?.status),
});

export const parseDepartmentQuery = (query?: QueryRecord): ListDepartmentParams => ({
  keyword: typeof query?.keyword === 'string' ? query.keyword : undefined,
  parentId: typeof query?.parentId === 'string' ? query.parentId : undefined,
  status:
    asStatus(query?.status, 'active') === 'active' && query?.status == null
      ? undefined
      : asStatus(query?.status),
});

export const parseDictionaryQuery = (query?: QueryRecord): ListDictionaryParams => ({
  keyword: typeof query?.keyword === 'string' ? query.keyword : undefined,
  status:
    asStatus(query?.status, 'active') === 'active' && query?.status == null
      ? undefined
      : asStatus(query?.status),
});

export const mockListUsers = async (query?: ListUserParams): Promise<UserRecord[]> => {
  await wait();
  return listUsersByQuery(query);
};

export const mockSaveUser = async (input: SaveUserInput): Promise<UserRecord> => {
  await wait();
  return saveUserInternal(input);
};

export const mockRemoveUsers = async (ids: string[]): Promise<{ success: boolean }> => {
  await wait();
  if (ids.length === 0) {
    return { success: true };
  }

  ids.forEach((id) => {
    const index = userRows.findIndex((item) => item.id === id);
    if (index >= 0) {
      userRows.splice(index, 1);
    }
  });

  return { success: true };
};

export const mockAssignUserRoles = async (input: AssignUserRolesInput): Promise<UserRecord> => {
  await wait();
  const targetUser = userRows.find((item) => item.id === input.id);

  if (!targetUser) {
    throw new ApiError(404, '用户不存在。', 'USER_NOT_FOUND');
  }

  targetUser.roleCodes = input.roleCodes;
  targetUser.updatedAt = formatTimestamp();
  syncUserDerivedFields();
  return targetUser;
};

export const mockListRoleMatrix = async (): Promise<RoleMatrixRecord[]> => {
  await wait();
  ensureSystemConsistency();

  return roleRows.map((role) => ({
    id: role.id,
    role: role.roleName,
    scope: buildRoleScopeText(role),
  }));
};

export const mockListRoles = async (query?: ListRoleParams): Promise<RolePermissionRecord[]> => {
  await wait();
  return listRolesByQuery(query);
};

export const mockSaveRole = async (input: SaveRoleInput): Promise<RolePermissionRecord> => {
  await wait();
  return saveRoleInternal(input);
};

export const mockRemoveRoles = async (ids: string[]): Promise<{ success: boolean }> => {
  await wait();

  ids.forEach((id) => {
    const index = roleRows.findIndex((item) => item.id === id);

    if (index >= 0) {
      const removedRoleCode = roleRows[index].roleCode;
      roleRows.splice(index, 1);
      userRows.forEach((user) => {
        user.roleCodes = (user.roleCodes ?? []).filter((code) => code !== removedRoleCode);
      });
    }
  });

  syncUserDerivedFields();
  return { success: true };
};

export const mockGetRoleTree = async (): Promise<SystemTreeNode[]> => {
  await wait();
  return buildRoleTree();
};

export const mockGetMenuPermissionTree = async (): Promise<SystemTreeNode[]> => {
  await wait();
  return buildMenuPermissionTree();
};

export const mockListDepartments = async (
  query?: ListDepartmentParams,
): Promise<DepartmentRecord[]> => {
  await wait();
  return listDepartmentsByQuery(query);
};

export const mockGetDepartmentTree = async (): Promise<SystemTreeNode[]> => {
  await wait();
  return getDepartmentTreeNodes();
};

export const mockSaveDepartment = async (input: SaveDepartmentInput): Promise<DepartmentRecord> => {
  await wait();
  return saveDepartmentInternal(input);
};

export const mockRemoveDepartments = async (ids: string[]): Promise<{ success: boolean }> => {
  await wait();

  ids.forEach((id) => {
    const hasChildren = departmentRows.some((item) => item.parentId === id);

    if (hasChildren) {
      throw new ApiError(409, '当前部门下仍有子部门，不能直接删除。', 'DEPARTMENT_HAS_CHILDREN');
    }

    const hasUsers = userRows.some((item) => item.departmentId === id);
    if (hasUsers) {
      throw new ApiError(409, '当前部门下仍有用户，不能直接删除。', 'DEPARTMENT_HAS_USERS');
    }

    const index = departmentRows.findIndex((item) => item.id === id);
    if (index >= 0) {
      departmentRows.splice(index, 1);
    }
  });

  syncRoleDerivedFields();
  syncUserDerivedFields();
  return { success: true };
};

export const mockListDictionaries = async (
  query?: ListDictionaryParams,
): Promise<DictionaryRecord[]> => {
  await wait();
  return listDictionariesByQuery(query);
};

export const mockSaveDictionary = async (input: SaveDictionaryInput): Promise<DictionaryRecord> => {
  await wait();
  return saveDictionaryInternal(input);
};

export const mockRemoveDictionaries = async (ids: string[]): Promise<{ success: boolean }> => {
  await wait();

  ids.forEach((id) => {
    const currentIndex = dictionaryRows.findIndex((item) => item.id === id);

    if (currentIndex >= 0) {
      dictionaryRows.splice(currentIndex, 1);
    }

    for (let index = dictionaryEntryRows.length - 1; index >= 0; index -= 1) {
      if (dictionaryEntryRows[index].dictId === id) {
        dictionaryEntryRows.splice(index, 1);
      }
    }
  });

  syncDictionaryEntryCount();
  return { success: true };
};

export const mockListDictionaryItems = async (dictId: string): Promise<DictionaryEntryRecord[]> => {
  await wait();
  return dictionaryEntryRows
    .filter((item) => item.dictId === dictId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
};

export const mockSaveDictionaryItem = async (
  input: SaveDictionaryEntryInput,
): Promise<DictionaryEntryRecord> => {
  await wait();
  return saveDictionaryItemInternal(input);
};

export const mockRemoveDictionaryItems = async (
  dictId: string,
  ids: string[],
): Promise<{ success: boolean }> => {
  await wait();

  ids.forEach((id) => {
    const index = dictionaryEntryRows.findIndex((item) => item.dictId === dictId && item.id === id);
    if (index >= 0) {
      dictionaryEntryRows.splice(index, 1);
    }
  });

  syncDictionaryEntryCount();
  return { success: true };
};

export const getSystemCollections = () => ({
  departments: departmentRows,
  dictionaries: dictionaryRows,
  dictionaryItems: dictionaryEntryRows,
  roles: roleRows,
  users: userRows,
});

ensureSystemConsistency();
