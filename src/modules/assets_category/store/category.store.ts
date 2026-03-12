import { defineStore } from "pinia";
import { ref } from "vue";
import { categoryService } from "../services/category.service";
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from "../types/category.types";

export const useCategoryStore = defineStore('category', () => {
    const categories = ref<Category[]>([]);
    const totalRecords = ref(0); // Vuelve el total de registros
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchCategories(page: number = 1, perPage: number = 15, search: string = '') {
        isLoading.value = true;
        try {
            const response = await categoryService.getAll(page, perPage, search);
            categories.value = response.data;
            totalRecords.value = response.meta?.total || 0; // Guardamos el total del meta
        } catch (err: any) {
            console.error(err);
            error.value = 'Error al cargar categorías';
        } finally {
            isLoading.value = false;
        }
    }

    async function createCategory(payload: CreateCategoryPayload) {
        isLoading.value = true;
        try {
            await categoryService.create(payload);
        } finally {
            isLoading.value = false;
        }
    }   

    async function updateCategory(id: number, payload: UpdateCategoryPayload) {
        isLoading.value = true;
        try {
            await categoryService.update(id, payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteCategory(id: number) {
        isLoading.value = true;
        try {
            await categoryService.delete(id);
        } finally {
            isLoading.value = false;
        }
    }

    return {
        categories,
        totalRecords,
        isLoading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory
    }
});