import { httpClient } from '@/core/api/httpClient';
import type { PlatformPermission, CreatePlatformPermissionPayload, UpdatePlatformPermissionPayload } from '../types/platformPermission.types';

class PlatformPermissionService {
    private readonly BASE_URL = '/platform-permissions';

    async getByPlatform(platformId: number): Promise<PlatformPermission[]> {
        const response = await httpClient.get<{ data: PlatformPermission[] }>(`/platforms/${platformId}/permissions`);
        return response.data.data || (response.data as unknown as PlatformPermission[]);
    }

    async create(payload: CreatePlatformPermissionPayload): Promise<PlatformPermission> {
        const response = await httpClient.post<{ data: PlatformPermission }>(this.BASE_URL, payload);
        return response.data.data;
    }

    async update(id: number, payload: UpdatePlatformPermissionPayload): Promise<PlatformPermission> {
        const response = await httpClient.put<{ data: PlatformPermission }>(`${this.BASE_URL}/${id}`, payload);
        return response.data.data;
    }

    async delete(id: number): Promise<void> {
        await httpClient.delete(`${this.BASE_URL}/${id}`);
    }
}

export const platformPermissionService = new PlatformPermissionService();