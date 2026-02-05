import { httpClient } from '@/core/api/httpClient';
import type { Provider, ProviderPayload, ProviderListResponse } from '../types/provider.types';

export const providerService = {
    /**
     * Obtener lista paginada y filtrada (Para la Tabla)
     */
    async getAll(page = 1, perPage = 15, search = ''): Promise<ProviderListResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        if (search) params.append('search', search);

        const response = await httpClient.get<ProviderListResponse>(`/providers?${params.toString()}`);
        return response.data;
    },

    /**
     * Obtener lista ligera para Selects (Optimizado ?all=true)
     */
    async getDropdown(): Promise<{ id: number; name: string }[]> {
        const response = await httpClient.get<any>('/providers?all=true');
        return response.data; 
    },

    async create(payload: ProviderPayload): Promise<Provider> {
        const response = await httpClient.post<any>('/providers', payload);
        return response.data.data;
    },

    async update(id: number, payload: ProviderPayload): Promise<Provider> {
        const response = await httpClient.put<any>(`/providers/${id}`, payload);
        return response.data.data;
    },

    async delete(id: number): Promise<void> {
        await httpClient.delete(`/providers/${id}`);
    }
};