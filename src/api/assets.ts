import { apiClient } from './client';
import type { AssetDetail } from './models';

export const getAssetDetail = (assetId = 'asset-001') => {
  return apiClient.get<AssetDetail>(`/assets/${assetId}`);
};

export const updateAssetDetail = (assetId: string, values: Partial<AssetDetail>) => {
  return apiClient.put<AssetDetail, Partial<AssetDetail>>(`/assets/${assetId}`, values);
};
