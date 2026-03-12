import { httpClient } from "@/core/api/httpClient";
import type { Position, PositionListResponse, CreatePositionPayload, UpdatePositionPayload } from "../types/position.types";

class PositionService {
    private readonly BASE_URL = '/positions';

    async getAll(page: number = 1, perPage: number = 15, search: string = ''): Promise<PositionListResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        if (search) params.append('search', search);

        const response = await httpClient.get<PositionListResponse>(`${this.BASE_URL}?${params.toString()}`);
        return response.data;
    }

    async getListForSelect(departmentId?: number): Promise<Position[]> {
        const params = new URLSearchParams();
        params.append('per_page', '100'); 
        if(departmentId) params.append('department_id', departmentId.toString());

        const response = await httpClient.get<{ data: Position[] }>(`${this.BASE_URL}?${params.toString()}`);
        
        // Manejo seguro de la respuesta de Laravel Resource
        if ('data' in response.data && Array.isArray((response.data as any).data)) {
            return (response.data as any).data;
        }
        return response.data as unknown as Position[];
    }

    async create(payload: CreatePositionPayload): Promise<Position> {
        const response = await httpClient.post<{ data: Position }>(this.BASE_URL, payload);
        return response.data.data || response.data;
    }

    async update(id: number, payload: UpdatePositionPayload): Promise<Position> {
        const response = await httpClient.put<{ data: Position }>(`${this.BASE_URL}/${id}`, payload);
        return response.data.data || response.data;
    }

    async delete(id: number): Promise<void> {
        await httpClient.delete(`${this.BASE_URL}/${id}`);
    }
}

export const positionService = new PositionService();