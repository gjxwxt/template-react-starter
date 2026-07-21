import { ApiError } from '../core';
import type { AssetDetail } from '../models';
import { wait } from './shared';

let assetRecord: AssetDetail = {
  id: 'asset-001',
  name: '核心资产主机',
  status: '运行中',
  owner: '陈舟',
  level: '一级',
  description: '承载审批流、任务调度和报表聚合的关键资产节点。',
};

export const mockGetAssetDetail = async (assetId: string): Promise<AssetDetail> => {
  await wait();
  if (assetRecord.id !== assetId) {
    throw new ApiError(404, '资产不存在。', 'ASSET_NOT_FOUND');
  }
  return assetRecord;
};

export const mockUpdateAssetDetail = async (
  assetId: string,
  values: Partial<AssetDetail>,
): Promise<AssetDetail> => {
  await wait();
  if (assetRecord.id !== assetId) {
    throw new ApiError(404, '资产不存在。', 'ASSET_NOT_FOUND');
  }
  assetRecord = {
    ...assetRecord,
    ...values,
  };
  return assetRecord;
};
