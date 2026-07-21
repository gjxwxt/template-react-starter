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
  listDepartments,
  removeDepartments,
  saveDepartment,
  type DepartmentRecord,
  type SaveDepartmentInput,
} from '../../../api';
import { useAppContext } from '../../../app/providers';
import { hasPermissionCode } from '../../../app/permissions';
import { TemplateSectionEmpty } from '../../../components/feedback';
import {
  buildTreeSelectData,
  extractErrorMessage,
  RecordStatusTag,
} from '../../../modules/system-management/page-helpers';

type DialogMode = 'create' | 'edit';

const TreeSelectField = ProTreeSelect as unknown as React.ComponentType<Record<string, unknown>>;
const TREE_CARD_MIN_HEIGHT = 420;
const TREE_CARD_MAX_HEIGHT = 760;
const TREE_CARD_MOBILE_HEIGHT = 360;
const TREE_CARD_VIEWPORT_OFFSET = 220;
const TREE_BODY_OFFSET = 132;

const getTreeCardHeight = () => {
  if (typeof window === 'undefined') {
    return 620;
  }

  if (window.innerWidth <= 960) {
    return TREE_CARD_MOBILE_HEIGHT;
  }

  return Math.max(
    TREE_CARD_MIN_HEIGHT,
    Math.min(TREE_CARD_MAX_HEIGHT, window.innerHeight - TREE_CARD_VIEWPORT_OFFSET),
  );
};

const DepartmentManagePage: React.FC = () => {
  const { session, t } = useAppContext();
  const formRef = React.useRef<ProFormRef>(null);
  const [currentDepartmentId, setCurrentDepartmentId] = React.useState('all');
  const [queryValues, setQueryValues] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [referenceLoading, setReferenceLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [departmentRows, setDepartmentRows] = React.useState<DepartmentRecord[]>([]);
  const [departmentTree, setDepartmentTree] = React.useState<
    Awaited<ReturnType<typeof getDepartmentTree>>
  >([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<DialogMode>('create');
  const [editingRecord, setEditingRecord] = React.useState<DepartmentRecord | null>(null);
  const [treeCardHeight, setTreeCardHeight] = React.useState(getTreeCardHeight);

  const canCreate = hasPermissionCode(session, 'DepartmentManagement:addDepartment');
  const canEdit = hasPermissionCode(session, 'DepartmentManagement:editDepartment');
  const canDelete = hasPermissionCode(session, 'DepartmentManagement:deleteDepartment');
  const treeHeight = React.useMemo(() => {
    return Math.max(240, treeCardHeight - TREE_BODY_OFFSET);
  }, [treeCardHeight]);

  const treeData = React.useMemo(() => {
    return [
      {
        key: 'all',
        title: t.systemDepartments.allDepartments,
        children: departmentTree,
      },
    ];
  }, [departmentTree, t.systemDepartments.allDepartments]);

  const departmentTreeSelectData = React.useMemo(() => {
    return buildTreeSelectData(departmentTree);
  }, [departmentTree]);

  const loadDepartments = React.useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // 左树右表页的核心约束是“树只负责上下文过滤，右侧列表仍然保留独立查询条件”。
      const result = await listDepartments({
        keyword: typeof queryValues.keyword === 'string' ? queryValues.keyword : undefined,
        parentId: currentDepartmentId === 'all' ? undefined : currentDepartmentId,
        status:
          typeof queryValues.status === 'string'
            ? (queryValues.status as 'active' | 'disabled')
            : undefined,
      });
      setDepartmentRows(result);
    } catch (loadError) {
      setError(extractErrorMessage(loadError, t.loadFailed));
      setDepartmentRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentDepartmentId, queryValues, t.loadFailed]);

  const loadDepartmentTree = React.useCallback(async () => {
    setReferenceLoading(true);

    try {
      const nextDepartmentTree = await getDepartmentTree();
      setDepartmentTree(nextDepartmentTree);
    } catch (loadError) {
      setError(extractErrorMessage(loadError, t.loadFailed));
    } finally {
      setReferenceLoading(false);
    }
  }, [t.loadFailed]);

  React.useEffect(() => {
    void loadDepartmentTree();
  }, [loadDepartmentTree]);

  React.useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  React.useEffect(() => {
    const handleResize = () => {
      setTreeCardHeight(getTreeCardHeight());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const reloadAll = React.useCallback(async () => {
    await Promise.all([loadDepartmentTree(), loadDepartments()]);
  }, [loadDepartmentTree, loadDepartments]);

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const openEditDialog = (record: DepartmentRecord) => {
    setDialogMode('edit');
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleDeleteDepartments = React.useCallback(
    async (ids: string[], title: string) => {
      if (ids.length === 0) {
        return;
      }

      Modal.confirm({
        title,
        onOk: async () => {
          await removeDepartments(ids);
          message.success(t.systemDepartments.deleteSuccess);
          await reloadAll();
        },
      });
    },
    [reloadAll, t.systemDepartments.deleteSuccess],
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
      await saveDepartment({
        id: editingRecord?.id,
        name: String(values.name ?? ''),
        parentId:
          typeof values.parentId === 'string' && values.parentId !== 'all'
            ? values.parentId
            : undefined,
        manager: String(values.manager ?? ''),
        status: (values.status as SaveDepartmentInput['status']) ?? 'active',
        description: typeof values.description === 'string' ? values.description : undefined,
      });
      message.success(t.systemDepartments.saveSuccess);
      setDialogOpen(false);
      await reloadAll();
    } catch (submitError) {
      message.error(extractErrorMessage(submitError, t.loadFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const emptyState = error ? (
    <TemplateSectionEmpty
      title={t.systemDepartments.loadFailedTitle}
      description={error}
      actionLabel={t.retry}
      onAction={() => {
        void reloadAll();
      }}
    />
  ) : (
    <TemplateSectionEmpty
      title={t.systemDepartments.emptyTitle}
      description={t.systemCommon.emptyDescription}
    />
  );

  return (
    <div className="template-page template-system-layout">
      <ProCard
        header={t.systemDepartments.treeTitle}
        shadow="never"
        className="template-system-layout__tree-card"
        style={{ height: treeCardHeight }}
        bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <ProTree
          className="template-system-layout__tree"
          style={{ flex: 1, minHeight: 0 }}
          treeData={treeData}
          selectedKeys={[currentDepartmentId]}
          onSelect={(keys) => {
            setCurrentDepartmentId(String(keys[0] ?? 'all'));
          }}
          showSearch
          panel={false}
          // 组织树默认展开前两层，既保留结构上下文，也避免真实大树首屏全部炸开。
          defaultExpandLevel={2}
          treeHeight={treeHeight}
          toolbar={
            <Space size={4}>
              {canCreate ? (
                <ProButton type="text" size="small" onClick={openCreateDialog}>
                  {t.systemCommon.create}
                </ProButton>
              ) : null}
              <ProButton
                type="text"
                size="small"
                onClick={() => {
                  void loadDepartmentTree();
                }}
              >
                {t.refresh}
              </ProButton>
            </Space>
          }
        />
      </ProCard>

      <div className="template-system-layout__content">
        <ProCard shadow="never">
          <SearchForm
            columns={2}
            collapsible
            stripEmptyValues
            labelAlign="right"
            fields={[
              {
                type: 'text',
                name: 'keyword',
                label: t.systemCommon.keyword,
                placeholder: t.systemDepartments.keywordPlaceholder,
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
          <ProTable<DepartmentRecord>
            rowKey="id"
            loading={loading || referenceLoading}
            rowSelection={{}}
            columns={[
              { key: 'name', title: t.systemDepartments.name, dataIndex: 'name' },
              { key: 'parentName', title: t.systemDepartments.parentName, dataIndex: 'parentName' },
              { key: 'manager', title: t.systemDepartments.manager, dataIndex: 'manager' },
              {
                key: 'memberCount',
                title: t.systemDepartments.memberCount,
                dataIndex: 'memberCount',
              },
              {
                key: 'status',
                title: t.systemDepartments.status,
                dataIndex: 'status',
                render: (value) => (
                  <RecordStatusTag
                    status={String(value)}
                    activeText={t.systemCommon.active}
                    disabledText={t.systemCommon.disabled}
                  />
                ),
              },
              { key: 'updatedAt', title: t.systemDepartments.updatedAt, dataIndex: 'updatedAt' },
              {
                key: 'description',
                title: t.systemDepartments.description,
                dataIndex: 'description',
              },
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
                    {canDelete ? (
                      <ProButton
                        type="link"
                        danger
                        onClick={() => {
                          void handleDeleteDepartments(
                            [record.id],
                            t.systemDepartments.deleteConfirmSingleTitle,
                          );
                        }}
                      >
                        {t.systemCommon.delete}
                      </ProButton>
                    ) : null}
                  </Space>
                ),
              },
            ]}
            dataSource={departmentRows}
            toolbarLeft={
              canCreate ? (
                <ProButton type="primary" onClick={openCreateDialog}>
                  {t.systemDepartments.createButton}
                </ProButton>
              ) : undefined
            }
            batchActions={[
              ...(canDelete
                ? [
                    {
                      key: 'delete-departments',
                      label: t.systemCommon.delete,
                      danger: true as const,
                      disabled: (context: { selectedCount: number }) => context.selectedCount === 0,
                      onClick: (context: { selectedRowKeys: React.Key[] }) => {
                        void handleDeleteDepartments(
                          context.selectedRowKeys.map((item) => String(item)),
                          t.systemDepartments.deleteConfirmTitle,
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
            columnPersistenceKey="template-react-department-columns"
            onRefresh={reloadAll}
            pagination={false}
            locale={{
              emptyText: !loading && departmentRows.length === 0 ? emptyState : undefined,
            }}
          />
        )}
      </div>

      <ProDialog
        open={dialogOpen}
        title={
          dialogMode === 'create'
            ? t.systemDepartments.createDialogTitle
            : t.systemDepartments.editDialogTitle
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
            name: editingRecord?.name ?? '',
            parentId: editingRecord?.parentId,
            manager: editingRecord?.manager ?? '',
            status: editingRecord?.status ?? 'active',
            description: editingRecord?.description,
          }}
          fields={[
            {
              key: 'name',
              label: t.systemDepartments.name,
              type: 'input',
              placeholder: t.systemDepartments.name,
              formItemProps: {
                rules: [{ required: true, message: t.systemDepartments.name }],
              },
            },
            {
              key: 'parentId',
              label: t.systemDepartments.parentName,
              type: 'input',
              component: TreeSelectField,
              componentProps: {
                treeData: departmentTreeSelectData,
                placeholder: t.systemDepartments.parentName,
                style: { width: '100%' },
              },
            },
            {
              key: 'manager',
              label: t.systemDepartments.manager,
              type: 'input',
              placeholder: t.systemDepartments.manager,
              formItemProps: {
                rules: [{ required: true, message: t.systemDepartments.manager }],
              },
            },
            {
              key: 'status',
              label: t.systemDepartments.status,
              type: 'select',
              options: [
                { label: t.systemCommon.active, value: 'active' },
                { label: t.systemCommon.disabled, value: 'disabled' },
              ],
            },
            {
              key: 'description',
              label: t.systemDepartments.description,
              type: 'textarea',
              placeholder: t.systemDepartments.description,
              componentProps: {
                rows: 3,
              },
            },
          ]}
        />
      </ProDialog>
    </div>
  );
};

export default DepartmentManagePage;
