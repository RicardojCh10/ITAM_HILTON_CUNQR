import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardResponse } from '../types/dashboard.types';

export const useDashboardStore = defineStore('dashboard', () => {
    const data = ref<DashboardResponse | null>(null);
    const isLoading = ref<boolean>(false);

    const fetchDashboardData = async (forceRefresh = false) => {
        if (data.value && !forceRefresh) return; // Caché básico

        isLoading.value = true;
        try {
            data.value = await dashboardService.getStats();
        } catch (error) {
            console.error("Error al cargar dashboard:", error);
        } finally {
            isLoading.value = false;
        }
    };

    return { data, isLoading, fetchDashboardData };
});