import { httpClient } from "@/core/api/httpClient";
import type { DashboardResponse } from "../types/dashboard.types";

class DashboardService {
    private readonly BASE_URL = '/dashboard';

    async getStats(): Promise<DashboardResponse> {
        const response = await httpClient.get<DashboardResponse>(`${this.BASE_URL}/stats`);
        return response.data;
    }
}

export const dashboardService = new DashboardService();