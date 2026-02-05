import { defineStore } from 'pinia';
import { ref } from 'vue';
import { maintenanceService } from '../services/maintenance.service';
import type { MaintenanceLog, CreateMaintenancePayload } from '../types/maintenance.types';

export const useMaintenanceStore = defineStore('maintenance', () => {
    const logs = ref<MaintenanceLog[]>([]);
    const totalRecords = ref(0);
    const isLoading = ref(false);

    async function fetchLogs(page = 1, perPage = 15, assetId?: number, eventType?: string) {
        isLoading.value = true;
        try {
            const response = await maintenanceService.getAll(page, perPage, assetId, eventType);
            logs.value = response.data;
            totalRecords.value = response.meta.total;
        } finally {
            isLoading.value = false;
        }
    }


    async function createLog(payload: CreateMaintenancePayload) {
        isLoading.value = true;
        try {
            await maintenanceService.create(payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function updateLog(id: number, payload: CreateMaintenancePayload) {
        isLoading.value = true;
        try {
            await maintenanceService.update(id, payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteLog(id: number) {
        isLoading.value = true;
        try {
            await maintenanceService.delete(id);
        } finally {
            isLoading.value = false;
        }
    }

    const totalCostVisible = () => logs.value.reduce((acc, log) => acc + log.details.cost, 0);

    return {
        logs,
        totalRecords,
        isLoading,
        fetchLogs,
        createLog,
        updateLog, 
        deleteLog,
        totalCostVisible
    };
});