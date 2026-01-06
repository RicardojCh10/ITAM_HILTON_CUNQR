import { defineStore } from 'pinia';
import { ref } from 'vue';
import { propertyService } from '../services/property.service';
import type { Property, CreatePropertyPayload, UpdatePropertyPayload } from '../types/property.types';

export const usePropertyStore = defineStore('property', () => {
  const properties = ref<Property[]>([]);
  const totalRecords = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProperties(page: number = 1, perPage: number = 15, search: string = '') {
    isLoading.value = true;
    try {
      const response = await propertyService.getAll(page, perPage, search);
      properties.value = response.data;
      totalRecords.value = response.meta?.total || response.data.length; 
    } catch (err: any) {
      console.error(err);
      error.value = 'Error al cargar propiedades';
    } finally {
      isLoading.value = false;
    }
  }

  async function createProperty(payload: CreatePropertyPayload) {
    isLoading.value = true;
    try {
      await propertyService.create(payload);
    } finally {
      isLoading.value = false;
    }
  }

  async function updateProperty(id: number, payload: UpdatePropertyPayload) {
    isLoading.value = true;
    try {
      await propertyService.update(id, payload);
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteProperty(id: number) {
    isLoading.value = true;
    try {
      await propertyService.delete(id);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    properties,
    totalRecords,
    isLoading,
    error,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty
  };
});