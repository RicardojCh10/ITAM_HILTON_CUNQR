import { httpClient } from '@/core/api/httpClient';
import type { MaintenanceListResponse, CreateMaintenancePayload, MaintenanceLog } from '../types/maintenance.types';

class MaintenanceService {
    private readonly BASE_URL = '/maintenance-logs';

    async getAll(page = 1, perPage = 15, assetId?: number, eventType?: string): Promise<MaintenanceListResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        
        if (assetId) params.append('asset_id', assetId.toString());
        if (eventType) params.append('event_type', eventType);

        const response = await httpClient.get<MaintenanceListResponse>(`${this.BASE_URL}?${params.toString()}`);
        return response.data;
    }

    async create(payload: CreateMaintenancePayload): Promise<MaintenanceLog> {
        const response = await httpClient.post<{ data: MaintenanceLog }>(this.BASE_URL, payload);
        return response.data.data;
    }

    async update(id: number, payload: CreateMaintenancePayload): Promise<MaintenanceLog> {
        const response = await httpClient.put<{ data: MaintenanceLog }>(`${this.BASE_URL}/${id}`, payload);
        return response.data.data;
    }

    async delete(id: number): Promise<void> {
        await httpClient.delete(`${this.BASE_URL}/${id}`);
    }
}

export const maintenanceService = new MaintenanceService();