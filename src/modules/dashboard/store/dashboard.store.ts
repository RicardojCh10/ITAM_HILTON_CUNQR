import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dashboardService } from '../services/dashboard.service';
import type { MasterDashboardResponse } from '../types/dashboard.types';

export const useDashboardStore = defineStore('dashboard', () => {
    const data = ref<MasterDashboardResponse | null>(null);
    const isLoading = ref<boolean>(false);

    const fetchDashboardData = async () => {
        isLoading.value = true;
        try {
            data.value = await dashboardService.getMasterMetrics();
        } catch (error) {
            console.error("Error al cargar metrics:", error);
        } finally {
            isLoading.value = false;
        }
    };

    return { data, isLoading, fetchDashboardData };
});