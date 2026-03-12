import { defineStore } from 'pinia';
import { ref } from 'vue';
import { platformPermissionService } from '../services/platformPermission.service';
import type { PlatformPermission, CreatePlatformPermissionPayload, UpdatePlatformPermissionPayload } from '../types/platformPermission.types';

export const usePlatformPermissionStore = defineStore('platformPermission', () => {
    const permissions = ref<PlatformPermission[]>([]);
    const isLoading = ref(false);

    async function fetchByPlatform(platformId: number) {
        isLoading.value = true;
        try {
            permissions.value = await platformPermissionService.getByPlatform(platformId);
        } catch (e) {
            console.error('Error al cargar permisos', e);
            permissions.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function createPermission(payload: CreatePlatformPermissionPayload) {
        isLoading.value = true;
        try {
            await platformPermissionService.create(payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function updatePermission(id: number, payload: UpdatePlatformPermissionPayload) {
        isLoading.value = true;
        try {
            await platformPermissionService.update(id, payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function deletePermission(id: number) {
        isLoading.value = true;
        try {
            await platformPermissionService.delete(id);
        } catch (error: any) {
            // Propagamos el error para que la vista muestre el mensaje exacto del backend (abort 400)
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    // Limpia la tabla cuando se deselecciona una plataforma
    function clearPermissions() {
        permissions.value = [];
    }

    return { 
        permissions, isLoading, 
        fetchByPlatform, createPermission, updatePermission, deletePermission, clearPermissions 
    };
});