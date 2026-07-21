import React from 'react';
import { Spin, message, Space, Tag } from 'antd';

import {
  ProButton,
  ProCard,
  ProDescription,
  ProForm,
  type ProFormRef,
} from '@gjxwxt/react-components';
import { getAssetDetail, updateAssetDetail, type AssetDetail } from '../../../api';
import { useAppContext } from '../../../app/providers';
import { hasPermissionCode } from '../../../app/permissions';
import { TemplateSectionEmpty } from '../../../components/feedback';

const AssetDetailPage: React.FC = () => {
  const { session, t } = useAppContext();
  const formRef = React.useRef<ProFormRef>(null);
  const mountedRef = React.useRef(true);
  const [mode, setMode] = React.useState<'detail' | 'edit'>('detail');
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [detailData, setDetailData] = React.useState<AssetDetail | null>(null);

  const canEdit = hasPermissionCode(session, 'AssetCenter:edit');

  const loadDetail = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const result = await getAssetDetail();
      if (mountedRef.current) {
        setDetailData(result);
      }
    } catch (error) {
      if (mountedRef.current) {
        setLoadError(error instanceof Error ? error.message : t.loadFailed);
        setDetailData(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [t.loadFailed]);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    void loadDetail();
  }, [loadDetail]);

  const handleSave = async () => {
    if (!detailData) {
      return;
    }

    let values: Record<string, unknown> | undefined;

    try {
      values = await formRef.current?.validate();
    } catch {
      return;
    }

    if (!values) return;

    setSaving(true);
    try {
      const result = await updateAssetDetail(detailData.id, values as Partial<AssetDetail>);
      setDetailData(result);
      setMode('detail');
      message.success(t.asset.saveSuccess);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="template-page">
        <ProCard shadow="never">
          <div className="template-page__loading">
            <Spin size="large" />
          </div>
        </ProCard>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="template-page">
        <ProCard shadow="never">
          <TemplateSectionEmpty
            title={t.asset.loadFailedTitle}
            description={loadError || t.asset.loadFailedBody}
            actionLabel={t.retry}
            onAction={() => {
              void loadDetail();
            }}
          />
        </ProCard>
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="template-page">
        <ProCard shadow="never">
          <TemplateSectionEmpty
            title={t.asset.emptyTitle}
            description={t.asset.emptyBody}
            actionLabel={t.retry}
            onAction={() => {
              void loadDetail();
            }}
          />
        </ProCard>
      </div>
    );
  }

  return (
    <div className="template-page">
      <div className="template-page__toolbar">
        <Space>
          <ProButton onClick={() => window.history.back()}>{t.back}</ProButton>
          <Tag color="blue">{t.asset.detailTag}</Tag>
        </Space>

        {mode === 'detail' ? (
          <Space>
            {canEdit ? (
              <ProButton type="primary" onClick={() => setMode('edit')}>
                {t.edit}
              </ProButton>
            ) : null}
          </Space>
        ) : (
          <Space>
            <ProButton onClick={() => setMode('detail')}>{t.cancel}</ProButton>
            {canEdit ? (
              <ProButton type="primary" loading={saving} onClick={handleSave}>
                {t.save}
              </ProButton>
            ) : null}
          </Space>
        )}
      </div>

      <ProCard>
        {mode === 'detail' ? (
          <ProDescription
            title={t.asset.basicInfo}
            data={detailData as unknown as Record<string, unknown>}
            schema={[
              { label: t.asset.assetName, prop: 'name' },
              { label: t.asset.assetStatus, prop: 'status' },
              { label: t.asset.assetOwner, prop: 'owner' },
              { label: t.asset.assetLevel, prop: 'level' },
              { label: t.asset.assetDesc, prop: 'description', span: 2 },
            ]}
            column={2}
          />
        ) : (
          <ProForm
            ref={formRef}
            showFootButton={false}
            initialValues={detailData as unknown as Record<string, unknown>}
            fields={[
              {
                name: 'name',
                label: t.asset.assetName,
                type: 'input',
                formItemProps: {
                  rules: [{ required: true, message: t.asset.assetName }],
                },
              },
              {
                name: 'status',
                label: t.asset.assetStatus,
                type: 'select',
                options: [
                  { label: '运行中', value: '运行中' },
                  { label: '维护中', value: '维护中' },
                  { label: '已停止', value: '已停止' },
                ],
              },
              {
                name: 'owner',
                label: t.asset.assetOwner,
                type: 'input',
                formItemProps: {
                  rules: [{ required: true, message: t.asset.assetOwner }],
                },
              },
              {
                name: 'level',
                label: t.asset.assetLevel,
                type: 'select',
                options: [
                  { label: '一级', value: '一级' },
                  { label: '二级', value: '二级' },
                  { label: '三级', value: '三级' },
                ],
              },
              {
                name: 'description',
                label: t.asset.assetDesc,
                type: 'textarea',
              },
            ]}
          />
        )}
      </ProCard>
    </div>
  );
};

export default AssetDetailPage;
