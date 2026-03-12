import { defineStore } from "pinia";
import { ref } from "vue";
import { positionService } from "../services/position.service";
import type { Position, CreatePositionPayload, UpdatePositionPayload } from "../types/position.types";

export const usePositionStore = defineStore('position', () => {
    const positions = ref<Position[]>([]);
    const totalRecords = ref(0);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchPositions(page: number = 1, perPage: number = 15, search: string = '') {
        isLoading.value = true;
        try {
            const response = await positionService.getAll(page, perPage, search);
            positions.value = response.data;
            totalRecords.value = response.meta?.total || response.data.length;
        } catch (err: any) {
            console.error(err);
            error.value = 'Error al cargar puestos';
        } finally {
            isLoading.value = false;
        }
    }

    async function createPosition(payload: CreatePositionPayload) {
        isLoading.value = true;
        try {
            await positionService.create(payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function updatePosition(id: number, payload: UpdatePositionPayload) {
        isLoading.value = true;
        try {
            await positionService.update(id, payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function deletePosition(id: number) {
        isLoading.value = true;
        try {
            await positionService.delete(id);
        } finally {
            isLoading.value = false;
        }
    }

    return {
        positions,
        totalRecords,
        isLoading,
        error,
        fetchPositions,
        createPosition,
        updatePosition,
        deletePosition
    }
});