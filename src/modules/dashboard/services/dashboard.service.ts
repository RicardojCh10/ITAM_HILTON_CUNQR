import { httpClient } from "@/core/api/httpClient";
import type { MasterDashboardResponse } from "../types/dashboard.types";

class DashboardService {
    async getMasterMetrics(): Promise<MasterDashboardResponse> {
        const response = await httpClient.get<MasterDashboardResponse>('/dashboard/master-metrics');
        return response.data;
    }
}
export const dashboardService = new DashboardService();