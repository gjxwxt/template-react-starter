import React from 'react';
import { Modal, Space, message } from 'antd';

import {
  ProButton,
  ProCard,
  ProDialog,
  ProForm,
  ProTable,
  ProTreeSelect,
  SearchForm,
  type ProFormRef,
} from '@gjxwxt/react-components';
import {
  assignUserRoles,
  getDepartmentTree,
  getRoleTree,
  listUsers,
  removeUsers,
  saveUser,
  type SaveUserInput,
  type UserRecord,
} from '../../../api';
import { useAppContext } from '../../../app/providers';
import { hasPermissionCode } from '../../../app/permissions';
import { TemplateSectionEmpty } from '../../../components/feedback';
import {
  buildTreeOptions,
  buildTreeSelectData,
  extractErrorMessage,
  RecordStatusTag,
} from '../../../modules/system-management/page-helpers';

type DialogMode = 'create' | 'edit';

const TreeSelectField = ProTreeSelect as unknown as React.ComponentType<Record<string, unknown>>;

const UserManagePage: React.FC = () => {
  const { session, t } = useAppContext();
  const formRef = React.useRef<ProFormRef>(null);
  const assignFormRef = React.useRef<ProFormRef>(null);
  const [queryValues, setQueryValues] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [referenceLoading, setReferenceLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [userRows, setUserRows] = React.useState<UserRecord[]>([]);
  const [departmentTree, setDepartmentTree] = React.useState<
    Awaited<ReturnType<typeof getDepartmentTree>>
  >([]);
  const [roleTree, setRoleTree] = React.useState<Awaited<ReturnType<typeof getRoleTree>>>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<DialogMode>('create');
  const [editingRecord, setEditingRecord] = React.useState<UserRecord | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [assigningRecord, setAssigningRecord] = React.useState<UserRecord | null>(null);

  const canCreate = hasPermissionCode(session, 'UserManagement:addUser');
  const canEdit = hasPermissionCode(session, 'UserManagement:editUser');
  const canAssignRole = hasPermissionCode(session, 'UserManagement:assignRole');
  const canDelete = hasPermissionCode(session, 'UserManagement:deleteUser');

  const departmentOptions = React.useMemo(() => {
    return buildTreeOptions(departmentTree, {
      label: t.systemDepartments.allDepartments,
      value: 'all',
    });
  }, [departmentTree, t.systemDepartments.allDepartments]);

  const departmentTreeSelectData = React.useMemo(() => {
    return buildTreeSelectData(departmentTree);
  }, [departmentTree]);

  const roleOptions = React.useMemo(() => {
    const roleNodes =
      roleTree.length === 1 && roleTree[0].children ? roleTree[0].children : roleTree;
    return buildTreeOptions(roleNodes);
  }, [roleTree]);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // 查询条件完全由页面托管，ProTable 只消费结果，方便后续切换真实分页接口。
      const result = await listUsers({
        keyword: typeof queryValues.keyword === 'string' ? queryValues.keyword : undefined,
        departmentId:
          typeof queryValues.departmentId === 'string' && queryValues.departmentId !== 'all'
            ? queryValues.departmentId
            : undefined,
        state:
          typeof queryValues.state === 'string'
            ? (queryValues.state as 'active' | 'disabled')
            : undefined,
      });
      setUserRows(result);
    } catch (loadError) {
      setError(extractErrorMessage(loadError, t.loadFailed));
      setUserRows([]);
    } finally {
      setLoading(false);
    }
  }, [queryValues, t.loadFailed]);

  const loadReferenceData = React.useCallback(async () => {
    setReferenceLoading(true);

    try {
      const [nextDepartmentTree, nextRoleTree] = await Promise.all([
        getDepartmentTree(),
        getRoleTree(),
      ]);
      setDepartmentTree(nextDepartmentTree);
      setRoleTree(nextRoleTree);
    } catch (loadError) {
      setError(extractErrorMessage(loadError, t.loadFailed));
    } finally {
      setReferenceLoading(false);
    }
  }, [t.loadFailed]);

  React.useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const openEditDialog = (record: UserRecord) => {
    setDialogMode('edit');
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const openAssignRoleDialog = (record: UserRecord) => {
    setAssigningRecord(record);
    setAssignDialogOpen(true);
  };

  const handleDeleteUsers = React.useCallback(
    async (ids: string[], title: string) => {
      if (ids.length === 0) {
        return;
      }

      Modal.confirm({
        title,
        onOk: async () => {
          await removeUsers(ids);
          message.success(t.systemUsers.deleteSuccess);
          await loadUsers();
        },
      });
    },
    [loadUsers, t.systemUsers.deleteSuccess],
  );

  const handleSubmit = async () => {
    let values: Record<string, unknown> | undefined;

    try {
      values = await formRef.current?.validate();
    } catch {
      return;
    }

    if (!values) {
      return;
    }

    setSubmitting(true);
    try {
      await saveUser({
        id: editingRecord?.id,
        loginName: String(values.loginName ?? ''),
        username: String(values.username ?? ''),
        departmentId: typeof values.departmentId === 'string' ? values.departmentId : undefined,
        email: typeof values.email === 'string' ? values.email : undefined,
        phone: typeof values.phone === 'string' ? values.phone : undefined,
        roleCodes: Array.isArray(values.roleCodes)
          ? values.roleCodes.filter((item): item is string => typeof item === 'string')
          : [],
        state: (values.state as SaveUserInput['state']) ?? 'active',
      });
      message.success(t.systemUsers.saveSuccess);
      setDialogOpen(false);
      await loadUsers();
    } catch (submitError) {
      message.error(extractErrorMessage(submitError, t.loadFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubmit = async () => {
    let values: Record<string, unknown> | undefined;

    try {
      values = await assignFormRef.current?.validate();
    } catch {
      return;
    }

    if (!values || !assigningRecord) {
      return;
    }

    setSubmitting(true);
    try {
      // 角色授权单独拆弹窗，保留列表页最常见的“资料维护 / 权限维护”双入口结构。
      await assignUserRoles({
        id: assigningRecord.id,
        roleCodes: Array.isArray(values.roleCodes)
          ? values.roleCodes.filter((item): item is string => typeof item === 'string')
          : [],
      });
      message.success(t.systemUsers.assignRoleSuccess);
      setAssignDialogOpen(false);
      await loadUsers();
    } catch (submitError) {
      message.error(extractErrorMessage(submitError, t.loadFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const emptyState = error ? (
    <TemplateSectionEmpty
      title={t.systemUsers.loadFailedTitle}
      description={error}
      actionLabel={t.retry}
      onAction={() => {
        void Promise.all([loadReferenceData(), loadUsers()]);
      }}
    />
  ) : (
    <TemplateSectionEmpty
      title={t.systemUsers.emptyTitle}
      description={t.systemCommon.emptyDescription}
    />
  );

  return (
    <div className="template-page">
      <ProCard shadow="never">
        <div className="template-page__intro">{t.systemUsers.pageHint}</div>
      </ProCard>

      <ProCard shadow="never">
        <SearchForm
          columns={3}
          collapsible
          stripEmptyValues
          labelAlign="right"
          fields={[
            {
              type: 'text',
              name: 'keyword',
              label: t.systemCommon.keyword,
              placeholder: t.systemUsers.keywordPlaceholder,
            },
            {
              type: 'select',
              name: 'departmentId',
              label: t.systemUsers.department,
              placeholder: t.systemDepartments.allDepartments,
              options: departmentOptions,
            },
            {
              type: 'select',
              name: 'state',
              label: t.systemCommon.status,
              placeholder: t.systemCommon.allStatus,
              options: [
                { label: t.systemCommon.active, value: 'active' },
                { label: t.systemCommon.disabled, value: 'disabled' },
              ],
            },
          ]}
          onSearch={(values) => setQueryValues(values)}
          onReset={(values) => setQueryValues(values)}
        />
      </ProCard>

      {error && !loading ? (
        <ProCard shadow="never">{emptyState}</ProCard>
      ) : (
        <ProTable<UserRecord>
          rowKey="id"
          loading={loading || referenceLoading}
          rowSelection={{}}
          columns={[
            { key: 'loginName', title: t.systemUsers.loginName, dataIndex: 'loginName' },
            { key: 'username', title: t.systemUsers.username, dataIndex: 'username' },
            { key: 'department', title: t.systemUsers.department, dataIndex: 'department' },
            { key: 'role', title: t.systemUsers.role, dataIndex: 'role' },
            { key: 'email', title: t.systemUsers.email, dataIndex: 'email' },
            { key: 'phone', title: t.systemUsers.phone, dataIndex: 'phone' },
            {
              key: 'state',
              title: t.systemUsers.state,
              dataIndex: 'state',
              render: (value) => (
                <RecordStatusTag
                  status={String(value)}
                  activeText={t.systemCommon.active}
                  disabledText={t.systemCommon.disabled}
                />
              ),
            },
            { key: 'updatedAt', title: t.systemUsers.updatedAt, dataIndex: 'updatedAt' },
            {
              key: 'actions',
              title: t.systemCommon.actions,
              render: (_, record) => (
                <Space size={4}>
                  {canEdit ? (
                    <ProButton type="link" onClick={() => openEditDialog(record)}>
                      {t.edit}
                    </ProButton>
                  ) : null}
                  {canAssignRole ? (
                    <ProButton type="link" onClick={() => openAssignRoleDialog(record)}>
                      {t.systemUsers.assignRoleAction}
                    </ProButton>
                  ) : null}
                  {canDelete ? (
                    <ProButton
                      type="link"
                      danger
                      onClick={() => {
                        void handleDeleteUsers([record.id], t.systemUsers.deleteConfirmSingleTitle);
                      }}
                    >
                      {t.systemUsers.deleteAction}
                    </ProButton>
                  ) : null}
                </Space>
              ),
            },
          ]}
          dataSource={userRows}
          toolbarLeft={
            canCreate ? (
              <ProButton type="primary" onClick={openCreateDialog}>
                {t.systemUsers.createButton}
              </ProButton>
            ) : undefined
          }
          batchActions={[
            ...(canDelete
              ? [
                  {
                    key: 'delete-users',
                    label: t.systemCommon.delete,
                    danger: true as const,
                    disabled: (context: { selectedCount: number }) => context.selectedCount === 0,
                    onClick: (context: { selectedRowKeys: React.Key[] }) => {
                      void handleDeleteUsers(
                        context.selectedRowKeys.map((item) => String(item)),
                        t.systemUsers.deleteConfirmTitle,
                      );
                    },
                  },
                ]
              : []),
          ]}
          tableAlertRender={({ selectedRowKeys }) => (
            <span>
              {t.systemCommon.selectedCount} {selectedRowKeys.length}
            </span>
          )}
          showRefresh
          showColumnSetting
          columnPersistenceKey="template-react-user-columns"
          onRefresh={loadUsers}
          pagination={false}
          locale={{
            emptyText: !loading && userRows.length === 0 ? emptyState : undefined,
          }}
        />
      )}

      <ProDialog
        open={dialogOpen}
        title={
          dialogMode === 'create' ? t.systemUsers.createDialogTitle : t.systemUsers.editDialogTitle
        }
        width={720}
        maxHeight={560}
        confirmLoading={submitting}
        onClose={() => setDialogOpen(false)}
        onCancel={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      >
        <ProForm
          key={`${dialogMode}-${editingRecord?.id ?? 'new'}`}
          ref={formRef}
          layout="horizontal"
          labelWidth={96}
          labelAlign="right"
          showFootButton={false}
          initialValues={{
            loginName: editingRecord?.loginName ?? '',
            username: editingRecord?.username ?? '',
            departmentId: editingRecord?.departmentId,
            email: editingRecord?.email,
            phone: editingRecord?.phone,
            roleCodes: editingRecord?.roleCodes ?? [],
            state: editingRecord?.state ?? 'active',
          }}
          fields={[
            {
              key: 'loginName',
              label: t.systemUsers.loginName,
              type: 'input',
              placeholder: t.systemUsers.loginName,
              formItemProps: {
                rules: [{ required: true, message: t.systemUsers.loginName }],
              },
            },
            {
              key: 'username',
              label: t.systemUsers.username,
              type: 'input',
              placeholder: t.systemUsers.username,
              formItemProps: {
                rules: [{ required: true, message: t.systemUsers.username }],
              },
            },
            {
              key: 'departmentId',
              label: t.systemUsers.department,
              type: 'input',
              component: TreeSelectField,
              componentProps: {
                treeData: departmentTreeSelectData,
                placeholder: t.systemUsers.department,
                style: { width: '100%' },
              },
            },
            {
              key: 'roleCodes',
              label: t.systemUsers.role,
              type: 'multiSelect',
              options: roleOptions,
              placeholder: t.systemUsers.role,
            },
            {
              key: 'email',
              label: t.systemUsers.email,
              type: 'input',
              placeholder: t.systemUsers.email,
            },
            {
              key: 'phone',
              label: t.systemUsers.phone,
              type: 'input',
              placeholder: t.systemUsers.phone,
            },
            {
              key: 'state',
              label: t.systemUsers.state,
              type: 'select',
              options: [
                { label: t.systemCommon.active, value: 'active' },
                { label: t.systemCommon.disabled, value: 'disabled' },
              ],
            },
          ]}
        />
      </ProDialog>

      <ProDialog
        open={assignDialogOpen}
        title={t.systemUsers.assignRoleDialogTitle}
        width={560}
        confirmLoading={submitting}
        onClose={() => setAssignDialogOpen(false)}
        onCancel={() => setAssignDialogOpen(false)}
        onSubmit={handleAssignSubmit}
      >
        <ProForm
          key={`assign-${assigningRecord?.id ?? 'empty'}`}
          ref={assignFormRef}
          layout="horizontal"
          labelWidth={96}
          labelAlign="right"
          showFootButton={false}
          initialValues={{
            roleCodes: assigningRecord?.roleCodes ?? [],
          }}
          fields={[
            {
              key: 'roleCodes',
              label: t.systemUsers.role,
              type: 'multiSelect',
              options: roleOptions,
              placeholder: t.systemUsers.role,
              formItemProps: {
                rules: [{ required: true, message: t.systemUsers.role }],
              },
            },
          ]}
        />
      </ProDialog>
    </div>
  );
};

export default UserManagePage;
