import { defineStore } from "pinia";
import { ref } from "vue";
import { platformService } from "../services/platform.service";
import type { Platform, CreatePlatformPayload, UpdatePlatformPayload } from "../types/platform.types";

export const usePlatformStore = defineStore('platform', () => {

    // --- ESTADO ---
    const platforms = ref<Platform[]>([]);
    const currentPlatform = ref<Platform | null>(null); // NUEVO: Estado para la plataforma activa
    const totalRecords = ref(0);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // --- ACCIONES ---
    async function fetchPlatforms(page: number = 1, perPage: number = 15, search: string = '') {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await platformService.getAllPlatforms(page, perPage, search);
            platforms.value = response.data;
            totalRecords.value = response.meta?.total || response.data.length;
        } catch (err: any) {
            console.error(err);
            error.value = 'Error al cargar plataformas';
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchPlatformById(id: number) {
        isLoading.value = true;
        error.value = null;
        try {
            const platform = await platformService.getPlatformById(id);
            currentPlatform.value = platform; // Guardamos en el estado global
            return platform; // Retornamos por si la vista lo necesita inmediatamente
        } catch (err: any) {
            console.error(err);
            error.value = 'Error al cargar los detalles de la plataforma';
            currentPlatform.value = null;
            throw err; // Propagamos el error para que la vista pueda reaccionar (ej. redireccionar si es 404)
        } finally {
            isLoading.value = false;
        }
    }

    async function createPlatform(payload: CreatePlatformPayload) {
        isLoading.value = true;
        try {
            await platformService.createPlatform(payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function updatePlatform(id: number, payload: UpdatePlatformPayload) {
        isLoading.value = true;
        try {
            await platformService.updatePlatform(id, payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function deletePlatform(id: number) {
        isLoading.value = true;
        try {
            await platformService.deletePlatform(id);
        } finally {
            isLoading.value = false;
        }
    }

    // --- EXPORTAR ---
    return {
        platforms,
        currentPlatform,
        totalRecords,
        isLoading,
        error,
        fetchPlatforms,
        fetchPlatformById,
        createPlatform,
        updatePlatform,
        deletePlatform
    }
});