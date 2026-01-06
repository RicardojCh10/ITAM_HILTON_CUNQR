import { httpClient } from '@/core/api/httpClient';
import type { Asset, AssetListResponse, CreateAssetPayload } from '../types/asset.types';

class AssetService {
  private readonly BASE_URL = '/assets';

  async getAll(
    page: number = 1, 
    perPage: number = 15, 
    search: string = '', 
    propertyId?: number,
    category?: string,
    status?: string,
    memberId?: number
  ): Promise<AssetListResponse> {
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    if (search) params.append('search', search);
    if (propertyId) params.append('property_id', propertyId.toString());
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (memberId) params.append('member_id', memberId.toString());

    const response = await httpClient.get<AssetListResponse>(`${this.BASE_URL}?${params.toString()}`);
    return response.data; 
  }

  async getById(id: number): Promise<Asset> {
    const response = await httpClient.get<{ data: Asset }>(`${this.BASE_URL}/${id}`);
    return response.data.data || response.data;
  }

  async create(payload: CreateAssetPayload): Promise<Asset> {
    const response = await httpClient.post<{ data: Asset }>(this.BASE_URL, payload);
    return response.data.data || response.data;
  }

  async update(id: number, payload: CreateAssetPayload): Promise<Asset> {
    const response = await httpClient.put<{ data: Asset }>(`${this.BASE_URL}/${id}`, payload);
    return response.data.data || response.data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/${id}`);
  }
}

export const assetService = new AssetService();