import type { AppRole } from '../../app/session';
import type { BackendMenuRecord } from '../models';

const cloneMenus = (records: BackendMenuRecord[]) => {
  return JSON.parse(JSON.stringify(records)) as BackendMenuRecord[];
};

const createActionNode = (
  id: string,
  parentId: string,
  menuName: string,
  permissionCode: string,
  sortOrder: number,
): BackendMenuRecord => ({
  id,
  parentId,
  children: null,
  menuName,
  isExternalUrl: null,
  url: null,
  routeParam: null,
  isCache: null,
  permissionCode,
  sortOrder,
  defaultPermission: 1,
  state: 1,
  type: 3,
  icon: null,
  openType: null,
  description: '',
  roleType: 1,
});

const createPageNode = (config: {
  id: string;
  parentId: string;
  menuName: string;
  url: string;
  permissionCode: string;
  sortOrder: number;
  icon: string;
  children?: BackendMenuRecord[];
}): BackendMenuRecord => ({
  id: config.id,
  parentId: config.parentId,
  children: config.children ?? null,
  menuName: config.menuName,
  isExternalUrl: false,
  url: config.url,
  routeParam: null,
  isCache: false,
  permissionCode: config.permissionCode,
  sortOrder: config.sortOrder,
  defaultPermission: 1,
  state: 1,
  type: 2,
  icon: config.icon,
  openType: 1,
  description: '',
  roleType: 4,
});

const createGroupNode = (config: {
  id: string;
  menuName: string;
  sortOrder: number;
  icon: string;
  children: BackendMenuRecord[];
}): BackendMenuRecord => ({
  id: config.id,
  parentId: null,
  children: config.children,
  menuName: config.menuName,
  isExternalUrl: null,
  url: null,
  routeParam: null,
  isCache: null,
  permissionCode: null,
  sortOrder: config.sortOrder,
  defaultPermission: 1,
  state: 1,
  type: 1,
  icon: config.icon,
  openType: null,
  description: '',
  roleType: 4,
});

const workbenchGroup = createGroupNode({
  id: 'menu-workbench',
  menuName: '工作台',
  sortOrder: 0,
  icon: 'DashboardOutlined',
  children: [
    createPageNode({
      id: 'menu-dashboard',
      parentId: 'menu-workbench',
      menuName: '系统概览',
      url: 'workbench/Dashboard',
      permissionCode: 'Dashboard:read',
      sortOrder: 0,
      icon: 'DashboardOutlined',
    }),
    createPageNode({
      id: 'menu-tasks',
      parentId: 'menu-workbench',
      menuName: '任务列表',
      url: 'workbench/TaskManagement',
      permissionCode: 'TaskManagement:list',
      sortOrder: 1,
      icon: 'DeploymentUnitOutlined',
      children: [
        createActionNode(
          'action-task-create',
          'menu-tasks',
          '新建任务',
          'TaskManagement:create',
          0,
        ),
        createActionNode('action-task-edit', 'menu-tasks', '编辑任务', 'TaskManagement:edit', 1),
        createActionNode(
          'action-task-assign',
          'menu-tasks',
          '批量指派',
          'TaskManagement:batchAssign',
          2,
        ),
        createActionNode(
          'action-task-export',
          'menu-tasks',
          '导出任务',
          'TaskManagement:export',
          3,
        ),
      ],
    }),
  ],
});

const assetGroup = createGroupNode({
  id: 'menu-asset',
  menuName: '资产中心',
  sortOrder: 1,
  icon: 'AppstoreOutlined',
  children: [
    createPageNode({
      id: 'menu-asset-detail',
      parentId: 'menu-asset',
      menuName: '资产详情',
      url: 'assets/AssetCenter',
      permissionCode: 'AssetCenter:getAssetDetail',
      sortOrder: 0,
      icon: 'AppstoreOutlined',
      children: [
        createActionNode(
          'action-asset-edit',
          'menu-asset-detail',
          '编辑资产',
          'AssetCenter:edit',
          0,
        ),
      ],
    }),
  ],
});

const assetGroupViewer = createGroupNode({
  id: 'menu-asset',
  menuName: '资产中心',
  sortOrder: 1,
  icon: 'AppstoreOutlined',
  children: [
    createPageNode({
      id: 'menu-asset-detail',
      parentId: 'menu-asset',
      menuName: '资产详情',
      url: 'assets/AssetCenter',
      permissionCode: 'AssetCenter:getAssetDetail',
      sortOrder: 0,
      icon: 'AppstoreOutlined',
    }),
  ],
});

const systemGroup = createGroupNode({
  id: 'menu-system',
  menuName: '系统管理',
  sortOrder: 2,
  icon: 'SettingOutlined',
  children: [
    createPageNode({
      id: 'menu-user-manage',
      parentId: 'menu-system',
      menuName: '用户管理',
      url: 'permissions/UserManagement',
      permissionCode: 'UserManagement:getUserManagementList',
      sortOrder: 0,
      icon: 'TeamOutlined',
      children: [
        createActionNode(
          'action-user-create',
          'menu-user-manage',
          '新建用户',
          'UserManagement:addUser',
          0,
        ),
        createActionNode(
          'action-user-assign-role',
          'menu-user-manage',
          '角色授权',
          'UserManagement:assignRole',
          1,
        ),
        createActionNode(
          'action-user-delete',
          'menu-user-manage',
          '删除用户',
          'UserManagement:deleteUser',
          2,
        ),
        createActionNode(
          'action-user-edit',
          'menu-user-manage',
          '编辑用户',
          'UserManagement:editUser',
          3,
        ),
      ],
    }),
    createPageNode({
      id: 'menu-role-manage',
      parentId: 'menu-system',
      menuName: '角色管理',
      url: 'permissions/RoleManagement',
      permissionCode: 'RoleManagement:getRoleManagementList',
      sortOrder: 1,
      icon: 'SafetyCertificateOutlined',
      children: [
        createActionNode(
          'action-role-create',
          'menu-role-manage',
          '新建角色',
          'RoleManagement:addRole',
          0,
        ),
        createActionNode(
          'action-role-assign',
          'menu-role-manage',
          '权限配置',
          'RoleManagement:assignPermission',
          1,
        ),
        createActionNode(
          'action-role-delete',
          'menu-role-manage',
          '删除角色',
          'RoleManagement:deleteRole',
          2,
        ),
        createActionNode(
          'action-role-edit',
          'menu-role-manage',
          '编辑角色',
          'RoleManagement:editRole',
          3,
        ),
      ],
    }),
    createPageNode({
      id: 'menu-department-manage',
      parentId: 'menu-system',
      menuName: '部门管理',
      url: 'permissions/DepartmentManagement',
      permissionCode: 'DepartmentManagement:getDepartmentList',
      sortOrder: 2,
      icon: 'ApartmentOutlined',
      children: [
        createActionNode(
          'action-department-create',
          'menu-department-manage',
          '新建部门',
          'DepartmentManagement:addDepartment',
          0,
        ),
        createActionNode(
          'action-dept-delete',
          'menu-dept-manage',
          '删除部门',
          'DepartmentManagement:deleteDepartment',
          1,
        ),
        createActionNode(
          'action-dept-edit',
          'menu-dept-manage',
          '编辑部门',
          'DepartmentManagement:editDepartment',
          2,
        ),
      ],
    }),
    createPageNode({
      id: 'menu-dictionary-manage',
      parentId: 'menu-system',
      menuName: '字典管理',
      url: 'permissions/DictionaryManagement',
      permissionCode: 'DictionaryManagement:getDictionaryList',
      sortOrder: 3,
      icon: 'BookOutlined',
      children: [
        createActionNode(
          'action-dictionary-create',
          'menu-dictionary-manage',
          '新建字典',
          'DictionaryManagement:addDictionary',
          0,
        ),
        createActionNode(
          'action-dictionary-delete',
          'menu-dictionary-manage',
          '删除字典',
          'DictionaryManagement:deleteDictionary',
          1,
        ),
        createActionNode(
          'action-dict-manage-item',
          'menu-dict-manage',
          '字典项管理',
          'DictionaryManagement:manageItem',
          2,
        ),
        createActionNode(
          'action-dict-edit',
          'menu-dict-manage',
          '编辑字典',
          'DictionaryManagement:editDictionary',
          3,
        ),
        createActionNode(
          'action-dict-edit-item',
          'menu-dict-manage',
          '编辑字典项',
          'DictionaryManagement:editItem',
          4,
        ),
      ],
    }),
  ],
});

const adminMenus: BackendMenuRecord[] = [workbenchGroup, assetGroup, systemGroup];

const operatorMenus: BackendMenuRecord[] = [
  workbenchGroup,
  assetGroup,
  createGroupNode({
    id: 'menu-system',
    menuName: '系统管理',
    sortOrder: 2,
    icon: 'SettingOutlined',
    children: [
      createPageNode({
        id: 'menu-user-manage',
        parentId: 'menu-system',
        menuName: '用户管理',
        url: 'permissions/UserManagement',
        permissionCode: 'UserManagement:getUserManagementList',
        sortOrder: 0,
        icon: 'TeamOutlined',
      }),
      createPageNode({
        id: 'menu-dictionary-manage',
        parentId: 'menu-system',
        menuName: '字典管理',
        url: 'permissions/DictionaryManagement',
        permissionCode: 'DictionaryManagement:getDictionaryList',
        sortOrder: 1,
        icon: 'BookOutlined',
        children: [
          createActionNode(
            'action-dictionary-manage-item',
            'menu-dictionary-manage',
            '维护字典项',
            'DictionaryManagement:manageItem',
            0,
          ),
          createActionNode(
            'action-dict-edit-item',
            'menu-dictionary-manage',
            '编辑字典项',
            'DictionaryManagement:editItem',
            1,
          ),
        ],
      }),
    ],
  }),
];

const viewerMenus: BackendMenuRecord[] = [
  createGroupNode({
    id: 'menu-workbench',
    menuName: '工作台',
    sortOrder: 0,
    icon: 'DashboardOutlined',
    children: [
      createPageNode({
        id: 'menu-dashboard',
        parentId: 'menu-workbench',
        menuName: '系统概览',
        url: 'workbench/Dashboard',
        permissionCode: 'Dashboard:read',
        sortOrder: 0,
        icon: 'DashboardOutlined',
      }),
    ],
  }),
  assetGroupViewer,
];

const roleMenuMap: Record<AppRole, BackendMenuRecord[]> = {
  admin: adminMenus,
  operator: operatorMenus,
  viewer: viewerMenus,
};

export const getMockServerMenus = (role: AppRole) => {
  // 每次返回新副本，避免适配器或测试原地修改污染下一次读取。
  return cloneMenus(roleMenuMap[role] ?? roleMenuMap.viewer);
};
