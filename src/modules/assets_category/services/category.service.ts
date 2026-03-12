import { httpClient } from "@/core/api/httpClient";
import type { Category, CategoryListResponse, CreateCategoryPayload, UpdateCategoryPayload } from "../types/category.types";

export type { Category };

class CategoryService {
    private readonly BASE_URL = '/asset-categories';

    async getAll(page: number = 1, perPage: number = 15, search: string = ''): Promise<CategoryListResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());
        if (search) params.append('search', search);

        const response = await httpClient.get<CategoryListResponse>(`${this.BASE_URL}?${params.toString()}`);
        return response.data;
    }

    async getListForSelect(): Promise<Category[]> {
        const response = await httpClient.get<{ data: Category[] }>(`${this.BASE_URL}?per_page=100`);
        if ('data' in response.data && Array.isArray((response.data as any).data)) {
            return (response.data as any).data;
        }
        // throw new Error("Unexpected response format");
        return response.data as unknown as Category[];
    }

    async create(payload: CreateCategoryPayload): Promise<Category> {
        const response = await httpClient.post<{ data: Category }>(this.BASE_URL, payload);
        return response.data.data || response.data;
    }

    async update(id: number, payload: UpdateCategoryPayload): Promise<Category> {
        const response = await httpClient.put<{ data: Category }>(`${this.BASE_URL}/${id}`, payload);
        return response.data.data || response.data;
    }

    async delete(id: number): Promise<void> {
        await httpClient.delete(`${this.BASE_URL}/${id}`);
    }

}

export const categoryService = new CategoryService();
export const listCategories = () => categoryService.getListForSelect();
