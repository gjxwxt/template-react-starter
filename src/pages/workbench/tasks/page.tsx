import React from 'react';
import { message, Space, Tag } from 'antd';

import {
  ProButton,
  ProCard,
  ProDialog,
  ProForm,
  ProTable,
  SearchForm,
  type ProFormRef,
} from '@gjxwxt/react-components';
import {
  listTasks,
  saveTask,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
} from '../../../api';
import { useAppContext } from '../../../app/providers';
import { hasPermissionCode } from '../../../app/permissions';

type DialogMode = 'create' | 'edit';

const statusColorMap: Record<TaskStatus, string> = {
  running: 'processing',
  pending: 'warning',
  done: 'success',
};

const TaskListPage: React.FC = () => {
  const { session, t } = useAppContext();
  const formRef = React.useRef<ProFormRef>(null);
  const [queryValues, setQueryValues] = React.useState<Record<string, unknown>>({});
  const [current, setCurrent] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [items, setItems] = React.useState<TaskRecord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<DialogMode>('create');
  const [editingRecord, setEditingRecord] = React.useState<TaskRecord | null>(null);

  const canCreate = hasPermissionCode(session, 'TaskManagement:create');
  const canEdit = hasPermissionCode(session, 'TaskManagement:edit');
  const canBatchAssign = hasPermissionCode(session, 'TaskManagement:batchAssign');
  const canExport = hasPermissionCode(session, 'TaskManagement:export');

  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listTasks({ current, pageSize, queryValues });
      setItems(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [current, pageSize, queryValues]);

  React.useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const openCreate = () => {
    setDialogMode('create');
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const openEdit = (record: TaskRecord) => {
    setDialogMode('edit');
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async () => {
    let values: Record<string, unknown> | undefined;

    try {
      values = await formRef.current?.validate();
    } catch {
      return;
    }

    if (!values) return;

    setSubmitting(true);
    try {
      await saveTask({
        id: editingRecord?.id,
        name: String(values.name ?? ''),
        owner: String(values.owner ?? ''),
        status: values.status as TaskStatus,
        priority: values.priority as TaskPriority,
      });

      message.success(dialogMode === 'create' ? t.tasks.createSuccess : t.tasks.updateSuccess);
      setDialogOpen(false);
      await loadTasks();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="template-page">
      <ProCard shadow="never">
        <SearchForm
          collapsible
          stripEmptyValues
          columns={3}
          labelAlign="right"
          fields={[
            {
              type: 'text',
              name: 'keyword',
              label: t.tasks.keyword,
              placeholder: `${t.tasks.taskName} / ID / ${t.tasks.owner}`,
            },
            {
              type: 'select',
              name: 'status',
              label: t.tasks.status,
              placeholder: t.tasks.statusAll,
              options: [
                { label: t.tasks.statusRunning, value: 'running' },
                { label: t.tasks.statusPending, value: 'pending' },
                { label: t.tasks.statusDone, value: 'done' },
              ],
            },
            {
              type: 'text',
              name: 'owner',
              label: t.tasks.owner,
              placeholder: t.tasks.owner,
            },
            {
              type: 'dateRange',
              name: 'planRange',
              label: t.tasks.planRange,
              placeholder: t.tasks.planRange,
            },
            {
              type: 'select',
              name: 'priority',
              label: t.tasks.priority,
              placeholder: t.tasks.priority,
              options: [
                { label: t.tasks.priorityP0, value: 'P0' },
                { label: t.tasks.priorityP1, value: 'P1' },
                { label: t.tasks.priorityP2, value: 'P2' },
              ],
            },
          ]}
          onSearch={(values) => {
            setCurrent(1);
            setQueryValues(values);
          }}
          onReset={(values) => {
            setCurrent(1);
            setQueryValues(values);
          }}
        />
      </ProCard>

      <ProTable<TaskRecord>
        rowKey="id"
        loading={loading}
        rowSelection={{}}
        columns={[
          { key: 'name', title: t.tasks.taskName, dataIndex: 'name' },
          {
            key: 'owner',
            title: t.tasks.owner,
            dataIndex: 'owner',
            render: (value) => value || t.tasks.emptyOwner,
          },
          {
            key: 'status',
            title: t.tasks.status,
            dataIndex: 'status',
            render: (value) => {
              const status = value as TaskStatus;

              return (
                <Tag color={statusColorMap[status]}>
                  {status === 'running'
                    ? t.tasks.statusRunning
                    : status === 'pending'
                      ? t.tasks.statusPending
                      : t.tasks.statusDone}
                </Tag>
              );
            },
          },
          { key: 'priority', title: t.tasks.priority, dataIndex: 'priority' },
          { key: 'updatedAt', title: t.tasks.updatedAt, dataIndex: 'updatedAt' },
          {
            key: 'actions',
            title: t.tasks.actions,
            render: (_, record) => (
              <Space size={4}>
                {canEdit ? (
                  <ProButton type="link" onClick={() => openEdit(record)}>
                    {t.edit}
                  </ProButton>
                ) : null}
              </Space>
            ),
          },
        ]}
        dataSource={items}
        toolbarLeft={
          canCreate ? (
            <ProButton type="primary" onClick={openCreate}>
              {t.newTask}
            </ProButton>
          ) : null
        }
        toolbar={
          <Space>
            {canBatchAssign ? <ProButton dashed>{t.batchAction}</ProButton> : null}
            {canExport ? <ProButton>{t.export}</ProButton> : null}
          </Space>
        }
        batchActions={[
          ...(canBatchAssign
            ? [
                {
                  key: 'assign',
                  label: t.batchAssign,
                  type: 'dashed' as const,
                  disabled: (context: { selectedCount: number }) => context.selectedCount === 0,
                  onClick: () => message.info(t.batchAssign),
                },
              ]
            : []),
        ]}
        showRefresh
        showColumnSetting
        columnPersistenceKey="template-react-task-columns"
        onRefresh={loadTasks}
        pagination={{ current, pageSize, total }}
        onPageChange={(page, size) => {
          setCurrent(page);
          setPageSize(size);
        }}
        onPageSizeChange={(page, size) => {
          setCurrent(page);
          setPageSize(size);
        }}
      />

      <ProDialog
        open={dialogOpen}
        title={dialogMode === 'create' ? t.tasks.createDialogTitle : t.tasks.editDialogTitle}
        width={680}
        maxHeight={520}
        confirmLoading={submitting}
        onClose={() => setDialogOpen(false)}
        onCancel={() => setDialogOpen(false)}
        onSubmit={handleDialogSubmit}
      >
        <ProForm
          ref={formRef}
          layout="horizontal"
          labelWidth={88}
          labelAlign="right"
          showFootButton={false}
          initialValues={
            (editingRecord as unknown as Record<string, unknown> | null) ?? {
              status: 'running',
              priority: 'P1',
            }
          }
          fields={[
            {
              name: 'name',
              label: t.tasks.taskName,
              type: 'input',
              formItemProps: {
                rules: [{ required: true, message: t.tasks.taskName }],
              },
            },
            {
              name: 'owner',
              label: t.tasks.owner,
              type: 'input',
              formItemProps: {
                rules: [{ required: true, message: t.tasks.owner }],
              },
            },
            {
              name: 'status',
              label: t.tasks.status,
              type: 'select',
              options: [
                { label: t.tasks.statusRunning, value: 'running' },
                { label: t.tasks.statusPending, value: 'pending' },
                { label: t.tasks.statusDone, value: 'done' },
              ],
            },
            {
              name: 'priority',
              label: t.tasks.priority,
              type: 'select',
              options: [
                { label: t.tasks.priorityP0, value: 'P0' },
                { label: t.tasks.priorityP1, value: 'P1' },
                { label: t.tasks.priorityP2, value: 'P2' },
              ],
            },
          ]}
        />
      </ProDialog>
    </div>
  );
};

export default TaskListPage;
