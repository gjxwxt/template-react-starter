import React from 'react';
import { Modal, Space, message } from 'antd';

import {
  ProButton,
  ProCard,
  ProDialog,
  ProForm,
  ProTable,
  ProTree,
  ProTreeSelect,
  SearchForm,
  type ProFormRef,
} from '@gjxwxt/react-components';
import {
  getDepartmentTree,
  getMenuPermissionTree,
  listRoles,
  removeRoles,
  saveRole,
  type RolePermissionRecord,
  type SaveRoleInput,
} from '../../../api';
import { useAppContext } from '../../../app/providers';
import { hasPermissionCode } from '../../../app/permissions';
import { TemplateSectionEmpty } from '../../../components/feedback';
import {
  buildTreeOptions,
  buildTreeSelectData,
  extractErrorMessage,
  normalizeCheckedKeys,
  RecordStatusTag,
} from '../../../modules/system-management/page-helpers';

type DialogMode = 'create' | 'edit';

const TreeSelectField = ProTreeSelect as unknown as React.ComponentType<Record<string, unknown>>;

const RoleManagePage: React.FC = () => {
  const { session, t } = useAppContext();
  const formRef = React.useRef<ProFormRef>(null);
  const [queryValues, setQueryValues] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [referenceLoading, setReferenceLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [roleRows, setRoleRows] = React.useState<RolePermissionRecord[]>([]);
  const [departmentTree, setDepartmentTree] = React.useState<
    Awaited<ReturnType<typeof getDepartmentTree>>
  >([]);
  const [menuTree, setMenuTree] = React.useState<Awaited<ReturnType<typeof getMenuPermissionTree>>>(
    [],
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<DialogMode>('create');
  const [editingRecord, setEditingRecord] = React.useState<RolePermissionRecord | null>(null);
  const [permissionDialogOpen, setPermissionDialogOpen] = React.useState(false);
  const [permissionRecord, setPermissionRecord] = React.useState<RolePermissionRecord | null>(null);
  const [checkedMenuKeys, setCheckedMenuKeys] = React.useState<string[]>([]);
  const [checkedDepartmentKeys, setCheckedDepartmentKeys] = React.useState<string[]>([]);

  const canCreate = hasPermissionCode(session, 'RoleManagement:addRole');
  const canEdit = hasPermissionCode(session, 'RoleManagement:editRole');
  const canAssignPermission = hasPermissionCode(session, 'RoleManagement:assignPermission');
  const canDelete = hasPermissionCode(session, 'RoleManagement:deleteRole');

  const departmentOptions = React.useMemo(() => {
    return buildTreeOptions(departmentTree, {
      label: t.systemDepartments.allDepartments,
      value: 'all',
    });
  }, [departmentTree, t.systemDepartments.allDepartments]);

  const departmentTreeSelectData = React.useMemo(() => {
    return buildTreeSelectData(departmentTree);
  }, [departmentTree]);

  const loadRoles = React.useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await listRoles({
        keyword: typeof queryValues.keyword === 'string' ? queryValues.keyword : undefined,
        departmentId:
          typeof queryValues.departmentId === 'string' && queryValues.departmentId !== 'all'
            ? queryValues.departmentId
            : undefined,
        status:
          typeof queryValues.status === 'string'
            ? (queryValues.status as 'active' | 'disabled')
            : undefined,
      });
      setRoleRows(result);
    } catch (loadError) {
      setError(extractErrorMessage(loadError, t.loadFailed));
      setRoleRows([]);
    } finally {
      setLoading(false);
    }
  }, [queryValues, t.loadFailed]);

  const loadReferenceData = React.useCallback(async () => {
    setReferenceLoading(true);

    try {
      const [nextDepartmentTree, nextMenuTree] = await Promise.all([
        getDepartmentTree(),
        getMenuPermissionTree(),
      ]);
      setDepartmentTree(nextDepartmentTree);
      setMenuTree(nextMenuTree);
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
    void loadRoles();
  }, [loadRoles]);

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const openEditDialog = (record: RolePermissionRecord) => {
    setDialogMode('edit');
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const openPermissionDialog = (record: RolePermissionRecord) => {
    setPermissionRecord(record);
    setCheckedMenuKeys(record.menuPermissionCodes);
    setCheckedDepartmentKeys(record.departmentIds);
    setPermissionDialogOpen(true);
  };

  const handleDeleteRoles = React.useCallback(
    async (ids: string[], title: string) => {
      if (ids.length === 0) {
        return;
      }

      Modal.confirm({
        title,
        onOk: async () => {
          await removeRoles(ids);
          message.success(t.systemRoles.deleteSuccess);
          await loadRoles();
        },
      });
    },
    [loadRoles, t.systemRoles.deleteSuccess],
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
      await saveRole({
        id: editingRecord?.id,
        roleName: String(values.roleName ?? ''),
        roleCode: String(values.roleCode ?? ''),
        departmentId: typeof values.departmentId === 'string' ? values.departmentId : undefined,
        description: typeof values.description === 'string' ? values.description : undefined,
        menuPermissionCodes: editingRecord?.menuPermissionCodes ?? [],
        departmentIds: editingRecord?.departmentIds ?? [],
        status: (values.status as SaveRoleInput['status']) ?? 'active',
      });
      message.success(t.systemRoles.saveSuccess);
      setDialogOpen(false);
      await loadRoles();
    } catch (submitError) {
      message.error(extractErrorMessage(submitError, t.loadFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermissionSubmit = async () => {
    if (!permissionRecord) {
      return;
    }

    setSubmitting(true);
    try {
      // 目录节点只是权限树分组，真正写回角色的是叶子和页面级 permissionCode。
      await saveRole({
        id: permissionRecord.id,
        roleName: permissionRecord.roleName,
        roleCode: permissionRecord.roleCode,
        departmentId: permissionRecord.departmentId,
        description: permissionRecord.description,
        departmentIds: checkedDepartmentKeys,
        menuPermissionCodes: checkedMenuKeys.filter((item) => !item.startsWith('menu:')),
        status: permissionRecord.status,
      });
      message.success(t.systemRoles.permissionSaveSuccess);
      setPermissionDialogOpen(false);
      await loadRoles();
    } catch (submitError) {
      message.error(extractErrorMessage(submitError, t.loadFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const emptyState = error ? (
    <TemplateSectionEmpty
      title={t.systemRoles.loadFailedTitle}
      description={error}
      actionLabel={t.retry}
      onAction={() => {
        void Promise.all([loadReferenceData(), loadRoles()]);
      }}
    />
  ) : (
    <TemplateSectionEmpty
      title={t.systemRoles.emptyTitle}
      description={t.systemCommon.emptyDescription}
    />
  );

  return (
    <div className="template-page">
      <ProCard shadow="never">
        <div className="template-page__intro">{t.systemRoles.pageHint}</div>
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
              placeholder: t.systemRoles.keywordPlaceholder,
            },
            {
              type: 'select',
              name: 'departmentId',
              label: t.systemRoles.department,
              placeholder: t.systemDepartments.allDepartments,
              options: departmentOptions,
            },
            {
              type: 'select',
              name: 'status',
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
        <ProTable<RolePermissionRecord>
          rowKey="id"
          loading={loading || referenceLoading}
          rowSelection={{}}
          columns={[
            { key: 'roleName', title: t.systemRoles.roleName, dataIndex: 'roleName' },
            { key: 'roleCode', title: t.systemRoles.roleCode, dataIndex: 'roleCode' },
            { key: 'department', title: t.systemRoles.department, dataIndex: 'department' },
            {
              key: 'menuPermissionCount',
              title: t.systemRoles.menuPermissionCount,
              dataIndex: 'menuPermissionCount',
            },
            {
              key: 'departmentPermissionCount',
              title: t.systemRoles.departmentPermissionCount,
              dataIndex: 'departmentPermissionCount',
            },
            {
              key: 'status',
              title: t.systemRoles.status,
              dataIndex: 'status',
              render: (value) => (
                <RecordStatusTag
                  status={String(value)}
                  activeText={t.systemCommon.active}
                  disabledText={t.systemCommon.disabled}
                />
              ),
            },
            { key: 'updatedAt', title: t.systemRoles.updatedAt, dataIndex: 'updatedAt' },
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
                  {canAssignPermission ? (
                    <ProButton type="link" onClick={() => openPermissionDialog(record)}>
                      {t.systemRoles.permissionAction}
                    </ProButton>
                  ) : null}
                  {canDelete ? (
                    <ProButton
                      type="link"
                      danger
                      onClick={() => {
                        void handleDeleteRoles([record.id], t.systemRoles.deleteConfirmSingleTitle);
                      }}
                    >
                      {t.systemCommon.delete}
                    </ProButton>
                  ) : null}
                </Space>
              ),
            },
          ]}
          dataSource={roleRows}
          toolbarLeft={
            canCreate ? (
              <ProButton type="primary" onClick={openCreateDialog}>
                {t.systemRoles.createButton}
              </ProButton>
            ) : undefined
          }
          batchActions={[
            ...(canDelete
              ? [
                  {
                    key: 'delete-roles',
                    label: t.systemCommon.delete,
                    danger: true as const,
                    disabled: (context: { selectedCount: number }) => context.selectedCount === 0,
                    onClick: (context: { selectedRowKeys: React.Key[] }) => {
                      void handleDeleteRoles(
                        context.selectedRowKeys.map((item) => String(item)),
                        t.systemRoles.deleteConfirmTitle,
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
          columnPersistenceKey="template-react-role-columns"
          onRefresh={loadRoles}
          pagination={false}
          locale={{
            emptyText: !loading && roleRows.length === 0 ? emptyState : undefined,
          }}
        />
      )}

      <ProDialog
        open={dialogOpen}
        title={
          dialogMode === 'create' ? t.systemRoles.createDialogTitle : t.systemRoles.editDialogTitle
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
            roleName: editingRecord?.roleName ?? '',
            roleCode: editingRecord?.roleCode ?? '',
            departmentId: editingRecord?.departmentId,
            description: editingRecord?.description,
            status: editingRecord?.status ?? 'active',
          }}
          fields={[
            {
              key: 'roleName',
              label: t.systemRoles.roleName,
              type: 'input',
              placeholder: t.systemRoles.roleName,
              formItemProps: {
                rules: [{ required: true, message: t.systemRoles.roleName }],
              },
            },
            {
              key: 'roleCode',
              label: t.systemRoles.roleCode,
              type: 'input',
              placeholder: t.systemRoles.roleCode,
              formItemProps: {
                rules: [{ required: true, message: t.systemRoles.roleCode }],
              },
            },
            {
              key: 'departmentId',
              label: t.systemRoles.department,
              type: 'input',
              component: TreeSelectField,
              componentProps: {
                treeData: departmentTreeSelectData,
                placeholder: t.systemRoles.department,
                style: { width: '100%' },
              },
            },
            {
              key: 'status',
              label: t.systemRoles.status,
              type: 'select',
              options: [
                { label: t.systemCommon.active, value: 'active' },
                { label: t.systemCommon.disabled, value: 'disabled' },
              ],
            },
            {
              key: 'description',
              label: t.systemRoles.description,
              type: 'textarea',
              placeholder: t.systemRoles.description,
              componentProps: {
                rows: 3,
              },
            },
          ]}
        />
      </ProDialog>

      <ProDialog
        open={permissionDialogOpen}
        title={t.systemRoles.permissionDialogTitle}
        width={980}
        maxHeight={640}
        confirmLoading={submitting}
        onClose={() => setPermissionDialogOpen(false)}
        onCancel={() => setPermissionDialogOpen(false)}
        onSubmit={handlePermissionSubmit}
      >
        <div className="template-permission-dialog">
          <div className="template-permission-dialog__summary">
            <div className="template-permission-dialog__summary-item">
              <span className="template-permission-dialog__summary-label">
                {t.systemRoles.roleName}
              </span>
              <strong>{permissionRecord?.roleName}</strong>
            </div>
            <div className="template-permission-dialog__summary-item">
              <span className="template-permission-dialog__summary-label">
                {t.systemRoles.roleCode}
              </span>
              <strong>{permissionRecord?.roleCode}</strong>
            </div>
            <div className="template-permission-dialog__summary-item">
              <span className="template-permission-dialog__summary-label">
                {t.systemRoles.department}
              </span>
              <strong>{permissionRecord?.department}</strong>
            </div>
          </div>

          <div className="template-permission-dialog__grid">
            <ProCard header={t.systemRoles.menuPermissionTab} shadow="never">
              <ProTree
                treeData={menuTree}
                checkable
                showSearch
                defaultExpandAll
                checkedKeys={checkedMenuKeys}
                onCheck={(value) => {
                  setCheckedMenuKeys(normalizeCheckedKeys(value));
                }}
                treeHeight={360}
              />
            </ProCard>

            <ProCard header={t.systemRoles.departmentPermissionTab} shadow="never">
              <ProTree
                treeData={departmentTree}
                checkable
                showSearch
                defaultExpandAll
                checkedKeys={checkedDepartmentKeys}
                onCheck={(value) => {
                  setCheckedDepartmentKeys(normalizeCheckedKeys(value));
                }}
                treeHeight={360}
              />
            </ProCard>
          </div>
        </div>
      </ProDialog>
    </div>
  );
};

export default RoleManagePage;
