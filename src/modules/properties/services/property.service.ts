import { httpClient } from '@/core/api/httpClient';
import type { Property, PropertyListResponse, CreatePropertyPayload, UpdatePropertyPayload } from '../types/property.types';

export type { Property }; 

class PropertyService {
  private readonly BASE_URL = '/properties';

  async getAll(page: number = 1, perPage: number = 15, search: string = ''): Promise<PropertyListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    if (search) params.append('search', search);

    const response = await httpClient.get<PropertyListResponse>(`${this.BASE_URL}?${params.toString()}`);
    return response.data; 
  }

  async getListForSelect(): Promise<Property[]> {
    const response = await httpClient.get<{ data: Property[] }>(`${this.BASE_URL}?per_page=100`);
    if ('data' in response.data && Array.isArray((response.data as any).data)) {
        return (response.data as any).data;
    }
    return response.data as unknown as Property[];
  }

  async create(payload: CreatePropertyPayload): Promise<Property> {
    const response = await httpClient.post<{ data: Property }>(this.BASE_URL, payload);
    return response.data.data || response.data;
  }

  async update(id: number, payload: UpdatePropertyPayload): Promise<Property> {
    const response = await httpClient.put<{ data: Property }>(`${this.BASE_URL}/${id}`, payload);
    return response.data.data || response.data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/${id}`);
  }
}

export const propertyService = new PropertyService();
export const listProperties = () => propertyService.getListForSelect();