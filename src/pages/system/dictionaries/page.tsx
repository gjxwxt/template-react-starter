import React from 'react';
import { Modal, Space, message } from 'antd';

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
  listDictionaries,
  listDictionaryItems,
  removeDictionaries,
  removeDictionaryItems,
  saveDictionary,
  saveDictionaryItem,
  type DictionaryEntryRecord,
  type DictionaryRecord,
  type SaveDictionaryEntryInput,
  type SaveDictionaryInput,
} from '../../../api';
import { useAppContext } from '../../../app/providers';
import { hasPermissionCode } from '../../../app/permissions';
import { TemplateSectionEmpty } from '../../../components/feedback';
import {
  extractErrorMessage,
  RecordStatusTag,
} from '../../../modules/system-management/page-helpers';

type DialogMode = 'create' | 'edit';

const DictionaryManagePage: React.FC = () => {
  const { session, t } = useAppContext();
  const dictionaryFormRef = React.useRef<ProFormRef>(null);
  const itemFormRef = React.useRef<ProFormRef>(null);
  const [queryValues, setQueryValues] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [itemLoading, setItemLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [dictionaryRows, setDictionaryRows] = React.useState<DictionaryRecord[]>([]);
  const [itemRows, setItemRows] = React.useState<DictionaryEntryRecord[]>([]);
  const [activeDictionary, setActiveDictionary] = React.useState<DictionaryRecord | null>(null);
  const [dictionaryDialogOpen, setDictionaryDialogOpen] = React.useState(false);
  const [dictionaryDialogMode, setDictionaryDialogMode] = React.useState<DialogMode>('create');
  const [editingDictionary, setEditingDictionary] = React.useState<DictionaryRecord | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = React.useState(false);
  const [itemDialogMode, setItemDialogMode] = React.useState<DialogMode>('create');
  const [editingItem, setEditingItem] = React.useState<DictionaryEntryRecord | null>(null);

  const canCreateDictionary = hasPermissionCode(session, 'DictionaryManagement:addDictionary');
  const canEditDictionary = hasPermissionCode(session, 'DictionaryManagement:editDictionary');
  const canDeleteDictionary = hasPermissionCode(session, 'DictionaryManagement:deleteDictionary');
  const canManageItem = hasPermissionCode(session, 'DictionaryManagement:manageItem');
  const canEditItem = hasPermissionCode(session, 'DictionaryManagement:editItem');

  const fetchDictionaries = React.useCallback(async () => {
    return listDictionaries({
      keyword: typeof queryValues.keyword === 'string' ? queryValues.keyword : undefined,
      status:
        typeof queryValues.status === 'string'
          ? (queryValues.status as 'active' | 'disabled')
          : undefined,
    });
  }, [queryValues]);

  const loadDictionaries = React.useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fetchDictionaries();
      setDictionaryRows(result);
      if (activeDictionary) {
        setActiveDictionary(result.find((item) => item.id === activeDictionary.id) ?? null);
      }
    } catch (loadError) {
      setError(extractErrorMessage(loadError, t.loadFailed));
      setDictionaryRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeDictionary, fetchDictionaries, t.loadFailed]);

  const loadDictionaryItems = React.useCallback(
    async (dictId: string) => {
      setItemLoading(true);
      setError('');

      try {
        const result = await listDictionaryItems(dictId);
        setItemRows(result);
      } catch (loadError) {
        setError(extractErrorMessage(loadError, t.loadFailed));
        setItemRows([]);
      } finally {
        setItemLoading(false);
      }
    },
    [t.loadFailed],
  );

  React.useEffect(() => {
    void loadDictionaries();
  }, [loadDictionaries]);

  const reloadDetail = React.useCallback(async () => {
    if (!activeDictionary) {
      await loadDictionaries();
      return;
    }

    // 详情态也要同步主表数据，保证字典项数量和当前字典状态始终一致。
    const nextDictionaries = await fetchDictionaries();
    setDictionaryRows(nextDictionaries);
    const nextActiveDictionary =
      nextDictionaries.find((item) => item.id === activeDictionary.id) ?? null;
    setActiveDictionary(nextActiveDictionary);

    if (nextActiveDictionary) {
      await loadDictionaryItems(nextActiveDictionary.id);
    } else {
      setItemRows([]);
    }
  }, [activeDictionary, fetchDictionaries, loadDictionaries, loadDictionaryItems]);

  const openCreateDictionaryDialog = () => {
    setDictionaryDialogMode('create');
    setEditingDictionary(null);
    setDictionaryDialogOpen(true);
  };

  const openEditDictionaryDialog = (record: DictionaryRecord) => {
    setDictionaryDialogMode('edit');
    setEditingDictionary(record);
    setDictionaryDialogOpen(true);
  };

  const openDictionaryDetail = async (record: DictionaryRecord) => {
    setActiveDictionary(record);
    await loadDictionaryItems(record.id);
  };

  const openCreateItemDialog = () => {
    setItemDialogMode('create');
    setEditingItem(null);
    setItemDialogOpen(true);
  };

  const openEditItemDialog = (record: DictionaryEntryRecord) => {
    setItemDialogMode('edit');
    setEditingItem(record);
    setItemDialogOpen(true);
  };

  const handleDeleteDictionaries = React.useCallback(
    async (ids: string[], title: string) => {
      if (ids.length === 0) {
        return;
      }

      Modal.confirm({
        title,
        onOk: async () => {
          await removeDictionaries(ids);
          message.success(t.systemDictionaries.deleteSuccess);
          await loadDictionaries();
        },
      });
    },
    [loadDictionaries, t.systemDictionaries.deleteSuccess],
  );

  const handleDeleteItems = React.useCallback(
    async (ids: string[], title: string) => {
      if (!activeDictionary || ids.length === 0) {
        return;
      }

      Modal.confirm({
        title,
        onOk: async () => {
          await removeDictionaryItems(activeDictionary.id, ids);
          message.success(t.systemDictionaries.itemDeleteSuccess);
          await reloadDetail();
        },
      });
    },
    [activeDictionary, reloadDetail, t.systemDictionaries.itemDeleteSuccess],
  );

  const handleDictionarySubmit = async () => {
    let values: Record<string, unknown> | undefined;

    try {
      values = await dictionaryFormRef.current?.validate();
    } catch {
      return;
    }

    if (!values) {
      return;
    }

    setSubmitting(true);
    try {
      await saveDictionary({
        id: editingDictionary?.id,
        name: String(values.name ?? ''),
        code: String(values.code ?? ''),
        status: (values.status as SaveDictionaryInput['status']) ?? 'active',
        remark: typeof values.remark === 'string' ? values.remark : undefined,
      });
      message.success(t.systemDictionaries.saveSuccess);
      setDictionaryDialogOpen(false);
      await loadDictionaries();
    } catch (submitError) {
      message.error(extractErrorMessage(submitError, t.loadFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemSubmit = async () => {
    let values: Record<string, unknown> | undefined;

    try {
      values = await itemFormRef.current?.validate();
    } catch {
      return;
    }

    if (!values || !activeDictionary) {
      return;
    }

    setSubmitting(true);
    try {
      await saveDictionaryItem({
        id: editingItem?.id,
        dictId: activeDictionary.id,
        label: String(values.label ?? ''),
        value: String(values.value ?? ''),
        sortOrder: Number(values.sortOrder ?? 0),
        status: (values.status as SaveDictionaryEntryInput['status']) ?? 'active',
        remark: typeof values.remark === 'string' ? values.remark : undefined,
      });
      message.success(t.systemDictionaries.itemSaveSuccess);
      setItemDialogOpen(false);
      await reloadDetail();
    } catch (submitError) {
      message.error(extractErrorMessage(submitError, t.loadFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const dictionaryEmptyState = error ? (
    <TemplateSectionEmpty
      title={t.systemDictionaries.loadFailedTitle}
      description={error}
      actionLabel={t.retry}
      onAction={() => {
        void loadDictionaries();
      }}
    />
  ) : (
    <TemplateSectionEmpty
      title={t.systemDictionaries.emptyTitle}
      description={t.systemCommon.emptyDescription}
    />
  );

  const itemEmptyState = error ? (
    <TemplateSectionEmpty
      title={t.systemDictionaries.loadFailedTitle}
      description={error}
      actionLabel={t.retry}
      onAction={() => {
        if (activeDictionary) {
          void loadDictionaryItems(activeDictionary.id);
        }
      }}
    />
  ) : (
    <TemplateSectionEmpty
      title={t.systemDictionaries.itemEmptyTitle}
      description={t.systemCommon.emptyDescription}
    />
  );

  if (activeDictionary) {
    return (
      <div className="template-page">
        <ProCard shadow="never">
          <div className="template-master-detail">
            <div className="template-master-detail__header">
              <ProButton onClick={() => setActiveDictionary(null)}>{t.back}</ProButton>
              <div className="template-master-detail__title-group">
                <h3 className="template-master-detail__title">
                  {t.systemDictionaries.detailTitle}
                </h3>
                <p className="template-master-detail__description">
                  {activeDictionary.name} / {activeDictionary.code} ·{' '}
                  {t.systemDictionaries.detailDescription}
                </p>
              </div>
            </div>

            <div className="template-master-detail__meta">
              <span>{t.systemDictionaries.status}</span>
              <RecordStatusTag
                status={activeDictionary.status}
                activeText={t.systemCommon.active}
                disabledText={t.systemCommon.disabled}
              />
              <span>
                {t.systemDictionaries.entryCount}: {activeDictionary.entryCount}
              </span>
            </div>
          </div>
        </ProCard>

        <ProTable<DictionaryEntryRecord>
          rowKey="id"
          loading={itemLoading}
          rowSelection={{}}
          columns={[
            { key: 'label', title: t.systemDictionaries.itemLabel, dataIndex: 'label' },
            { key: 'value', title: t.systemDictionaries.itemValue, dataIndex: 'value' },
            { key: 'sortOrder', title: t.systemDictionaries.itemSortOrder, dataIndex: 'sortOrder' },
            {
              key: 'status',
              title: t.systemDictionaries.status,
              dataIndex: 'status',
              render: (value) => (
                <RecordStatusTag
                  status={String(value)}
                  activeText={t.systemCommon.active}
                  disabledText={t.systemCommon.disabled}
                />
              ),
            },
            { key: 'updatedAt', title: t.systemDictionaries.updatedAt, dataIndex: 'updatedAt' },
            { key: 'remark', title: t.systemDictionaries.remark, dataIndex: 'remark' },
            {
              key: 'actions',
              title: t.systemCommon.actions,
              render: (_, record) => (
                <Space size={4}>
                  {canEditItem ? (
                    <ProButton type="link" onClick={() => openEditItemDialog(record)}>
                      {t.edit}
                    </ProButton>
                  ) : null}
                  {canManageItem ? (
                    <ProButton
                      type="link"
                      danger
                      onClick={() => {
                        void handleDeleteItems(
                          [record.id],
                          t.systemDictionaries.itemDeleteConfirmSingleTitle,
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
          dataSource={itemRows}
          toolbarLeft={
            canManageItem ? (
              <ProButton type="primary" onClick={openCreateItemDialog}>
                {t.systemDictionaries.itemCreateButton}
              </ProButton>
            ) : undefined
          }
          batchActions={[
            ...(canManageItem
              ? [
                  {
                    key: 'delete-dictionary-items',
                    label: t.systemCommon.delete,
                    danger: true as const,
                    disabled: (context: { selectedCount: number }) => context.selectedCount === 0,
                    onClick: (context: { selectedRowKeys: React.Key[] }) => {
                      void handleDeleteItems(
                        context.selectedRowKeys.map((item) => String(item)),
                        t.systemDictionaries.itemDeleteConfirmTitle,
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
          columnPersistenceKey="template-react-dictionary-item-columns"
          onRefresh={reloadDetail}
          pagination={false}
          locale={{
            emptyText: !itemLoading && itemRows.length === 0 ? itemEmptyState : undefined,
          }}
        />

        <ProDialog
          open={itemDialogOpen}
          title={
            itemDialogMode === 'create'
              ? t.systemDictionaries.itemCreateDialogTitle
              : t.systemDictionaries.itemEditDialogTitle
          }
          width={680}
          maxHeight={520}
          confirmLoading={submitting}
          onClose={() => setItemDialogOpen(false)}
          onCancel={() => setItemDialogOpen(false)}
          onSubmit={handleItemSubmit}
        >
          <ProForm
            key={`${itemDialogMode}-${editingItem?.id ?? 'new'}`}
            ref={itemFormRef}
            layout="horizontal"
            labelWidth={96}
            labelAlign="right"
            showFootButton={false}
            initialValues={{
              label: editingItem?.label ?? '',
              value: editingItem?.value ?? '',
              sortOrder: editingItem?.sortOrder ?? 10,
              status: editingItem?.status ?? 'active',
              remark: editingItem?.remark,
            }}
            fields={[
              {
                key: 'label',
                label: t.systemDictionaries.itemLabel,
                type: 'input',
                placeholder: t.systemDictionaries.itemLabel,
                formItemProps: {
                  rules: [{ required: true, message: t.systemDictionaries.itemLabel }],
                },
              },
              {
                key: 'value',
                label: t.systemDictionaries.itemValue,
                type: 'input',
                placeholder: t.systemDictionaries.itemValue,
                formItemProps: {
                  rules: [{ required: true, message: t.systemDictionaries.itemValue }],
                },
              },
              {
                key: 'sortOrder',
                label: t.systemDictionaries.itemSortOrder,
                type: 'number',
                placeholder: t.systemDictionaries.itemSortOrder,
              },
              {
                key: 'status',
                label: t.systemDictionaries.status,
                type: 'select',
                options: [
                  { label: t.systemCommon.active, value: 'active' },
                  { label: t.systemCommon.disabled, value: 'disabled' },
                ],
              },
              {
                key: 'remark',
                label: t.systemDictionaries.remark,
                type: 'textarea',
                placeholder: t.systemDictionaries.remark,
                componentProps: {
                  rows: 3,
                },
              },
            ]}
          />
        </ProDialog>
      </div>
    );
  }

  return (
    <div className="template-page">
      <ProCard shadow="never">
        <div className="template-page__intro">{t.systemDictionaries.pageHint}</div>
      </ProCard>

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
              placeholder: t.systemDictionaries.keywordPlaceholder,
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
        <ProCard shadow="never">{dictionaryEmptyState}</ProCard>
      ) : (
        <ProTable<DictionaryRecord>
          rowKey="id"
          loading={loading}
          rowSelection={{}}
          columns={[
            { key: 'name', title: t.systemDictionaries.name, dataIndex: 'name' },
            { key: 'code', title: t.systemDictionaries.code, dataIndex: 'code' },
            { key: 'entryCount', title: t.systemDictionaries.entryCount, dataIndex: 'entryCount' },
            {
              key: 'status',
              title: t.systemDictionaries.status,
              dataIndex: 'status',
              render: (value) => (
                <RecordStatusTag
                  status={String(value)}
                  activeText={t.systemCommon.active}
                  disabledText={t.systemCommon.disabled}
                />
              ),
            },
            { key: 'updatedAt', title: t.systemDictionaries.updatedAt, dataIndex: 'updatedAt' },
            { key: 'remark', title: t.systemDictionaries.remark, dataIndex: 'remark' },
            {
              key: 'actions',
              title: t.systemCommon.actions,
              render: (_, record) => (
                <Space size={4}>
                  {canManageItem ? (
                    <ProButton type="link" onClick={() => void openDictionaryDetail(record)}>
                      {t.systemDictionaries.manageItemsAction}
                    </ProButton>
                  ) : null}
                  {canEditDictionary ? (
                    <ProButton type="link" onClick={() => openEditDictionaryDialog(record)}>
                      {t.edit}
                    </ProButton>
                  ) : null}
                  {canDeleteDictionary ? (
                    <ProButton
                      type="link"
                      danger
                      onClick={() => {
                        void handleDeleteDictionaries(
                          [record.id],
                          t.systemDictionaries.deleteConfirmSingleTitle,
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
          dataSource={dictionaryRows}
          toolbarLeft={
            canCreateDictionary ? (
              <ProButton type="primary" onClick={openCreateDictionaryDialog}>
                {t.systemDictionaries.createButton}
              </ProButton>
            ) : undefined
          }
          batchActions={[
            ...(canDeleteDictionary
              ? [
                  {
                    key: 'delete-dictionaries',
                    label: t.systemCommon.delete,
                    danger: true as const,
                    disabled: (context: { selectedCount: number }) => context.selectedCount === 0,
                    onClick: (context: { selectedRowKeys: React.Key[] }) => {
                      void handleDeleteDictionaries(
                        context.selectedRowKeys.map((item) => String(item)),
                        t.systemDictionaries.deleteConfirmTitle,
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
          columnPersistenceKey="template-react-dictionary-columns"
          onRefresh={loadDictionaries}
          pagination={false}
          locale={{
            emptyText: !loading && dictionaryRows.length === 0 ? dictionaryEmptyState : undefined,
          }}
        />
      )}

      <ProDialog
        open={dictionaryDialogOpen}
        title={
          dictionaryDialogMode === 'create'
            ? t.systemDictionaries.createDialogTitle
            : t.systemDictionaries.editDialogTitle
        }
        width={680}
        maxHeight={520}
        confirmLoading={submitting}
        onClose={() => setDictionaryDialogOpen(false)}
        onCancel={() => setDictionaryDialogOpen(false)}
        onSubmit={handleDictionarySubmit}
      >
        <ProForm
          key={`${dictionaryDialogMode}-${editingDictionary?.id ?? 'new'}`}
          ref={dictionaryFormRef}
          layout="horizontal"
          labelWidth={96}
          labelAlign="right"
          showFootButton={false}
          initialValues={{
            name: editingDictionary?.name ?? '',
            code: editingDictionary?.code ?? '',
            status: editingDictionary?.status ?? 'active',
            remark: editingDictionary?.remark,
          }}
          fields={[
            {
              key: 'name',
              label: t.systemDictionaries.name,
              type: 'input',
              placeholder: t.systemDictionaries.name,
              formItemProps: {
                rules: [{ required: true, message: t.systemDictionaries.name }],
              },
            },
            {
              key: 'code',
              label: t.systemDictionaries.code,
              type: 'input',
              placeholder: t.systemDictionaries.code,
              formItemProps: {
                rules: [{ required: true, message: t.systemDictionaries.code }],
              },
            },
            {
              key: 'status',
              label: t.systemDictionaries.status,
              type: 'select',
              options: [
                { label: t.systemCommon.active, value: 'active' },
                { label: t.systemCommon.disabled, value: 'disabled' },
              ],
            },
            {
              key: 'remark',
              label: t.systemDictionaries.remark,
              type: 'textarea',
              placeholder: t.systemDictionaries.remark,
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

export default DictionaryManagePage;
