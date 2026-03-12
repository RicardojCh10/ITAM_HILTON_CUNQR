import { httpClient } from "@/core/api/httpClient";

import type { Platform, PlatformListResponse, CreatePlatformPayload, UpdatePlatformPayload } from "../types/platform.types";

export type { Platform };

class PlatformService {
    private readonly BASE_URL = '/platforms';

    async getAllPlatforms(page: number = 1, perPage: number = 15, search: string = ''): Promise<PlatformListResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        if (search) params.append('search', search);

        const response = await httpClient.get<PlatformListResponse>(`${this.BASE_URL}?${params.toString()}`);
        return response.data;
    }

    async getListForSelect(): Promise<Platform[]> {
        const response = await httpClient.get<{ data: Platform[] }>(`${this.BASE_URL}?per_page=100`);
        if ('data' in response.data && Array.isArray((response.data as any).data)) {
            return (response.data as any).data;
        }
        return response.data as unknown as Platform[];
    }   

    async getPlatformById(id: number): Promise<Platform> {
        const response = await httpClient.get<{ data: Platform }>(`${this.BASE_URL}/${id}`);
        return response.data.data || (response.data as unknown as Platform);
    }

    async createPlatform(payload: CreatePlatformPayload): Promise<Platform> {
        const response = await httpClient.post<{ data: Platform }>(this.BASE_URL, payload);
        return response.data.data || response.data;
    }   

    async updatePlatform(id: number, payload: UpdatePlatformPayload): Promise<Platform> {
        const response = await httpClient.put<{ data: Platform }>(`${this.BASE_URL}/${id}`, payload);
        return response.data.data || response.data;
    }   

    async deletePlatform(id: number): Promise<void> {
        await httpClient.delete(`${this.BASE_URL}/${id}`);
    }       
}

export const platformService = new PlatformService();