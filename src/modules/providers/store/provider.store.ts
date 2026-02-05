import { defineStore } from 'pinia';
import { ref } from 'vue';
import { providerService } from '../services/provider.service';
import type { Provider, ProviderPayload } from '../types/provider.types';

export const useProviderStore = defineStore('provider', () => {
    // Estado
    const providers = ref<Provider[]>([]);
    const dropdownList = ref<{ id: number; name: string }[]>([]); // Lista ligera
    const totalRecords = ref(0);
    const isLoading = ref(false);

    // Acciones
    async function fetchProviders(page = 1, perPage = 15, search = '') {
        isLoading.value = true;
        try {
            const response = await providerService.getAll(page, perPage, search);
            providers.value = response.data;
            totalRecords.value = response.meta.total;
        } catch (error) {
            console.error('Error fetching providers:', error);
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchDropdown() {
        // Ideal para llamar al montar el formulario de Assets
        try {
            dropdownList.value = await providerService.getDropdown();
        } catch (error) {
            console.error('Error loading provider dropdown:', error);
        }
    }

    async function createProvider(payload: ProviderPayload) {
        isLoading.value = true;
        try {
            await providerService.create(payload);
            // No recargamos aquí, la vista decidirá si recargar
        } finally {
            isLoading.value = false;
        }
    }

    async function updateProvider(id: number, payload: ProviderPayload) {
        isLoading.value = true;
        try {
            await providerService.update(id, payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteProvider(id: number) {
        isLoading.value = true;
        try {
            await providerService.delete(id);
        } finally {
            isLoading.value = false;
        }
    }

    return {
        providers,
        dropdownList,
        totalRecords,
        isLoading,
        fetchProviders,
        fetchDropdown,
        createProvider,
        updateProvider,
        deleteProvider
    };
});