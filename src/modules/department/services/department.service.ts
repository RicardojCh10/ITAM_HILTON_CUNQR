import { httpClient } from "@/core/api/httpClient";

import type { Department, DepartmentListResponse, CreateDepartmentPayload, UpdateDepartmentPayload } from "../types/department.types";

export type { Department };

class DepartmentService {
    private readonly BASE_URL = '/departments';

    async getAll(page: number = 1, perPage: number = 15, search: string = ''): Promise<DepartmentListResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        if (search) params.append('search', search);

        const response = await httpClient.get<DepartmentListResponse>(`${this.BASE_URL}?${params.toString()}`);
        return response.data;
    }

    async getListForSelect(): Promise<Department[]> {
        const response = await httpClient.get<{ data: Department[] }>(`${this.BASE_URL}?per_page=100`);
        if ('data' in response.data && Array.isArray((response.data as any).data)) {
            return (response.data as any).data;
        }
        return response.data as unknown as Department[];
    }

    async create(payload: CreateDepartmentPayload): Promise<Department> {
        const response = await httpClient.post<{ data: Department }>(this.BASE_URL, payload);
        return response.data.data || response.data;
    }

    async update(id: number, payload: UpdateDepartmentPayload): Promise<Department> {
        const response = await httpClient.put<{ data: Department }>(`${this.BASE_URL}/${id}`, payload);
        return response.data.data || response.data;
    }

    async delete(id: number): Promise<void> {
        await httpClient.delete(`${this.BASE_URL}/${id}`);
    }
}

export const departmentService = new DepartmentService();
export const listDepartments = () => departmentService.getListForSelect();