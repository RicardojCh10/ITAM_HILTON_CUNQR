import { defineStore } from "pinia";
import { ref } from "vue";
import { departmentService } from "../services/department.service";
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from "../types/department.types";

export const useDepartmentStore = defineStore('department', () => {
    const departments = ref<Department[]>([]);
    const totalRecords = ref(0);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchDepartments(page: number = 1, perPage: number = 15, search: string = '') {
        isLoading.value = true;
        try {
            const response = await departmentService.getAll(page, perPage, search);
            departments.value = response.data;
            totalRecords.value = response.meta?.total || response.data.length; 
        } catch (err: any) {
            console.error(err);
            error.value = 'Error al cargar departamentos';
        } finally {
            isLoading.value = false;
        } 
    }

    async function createDepartment(payload: CreateDepartmentPayload) {
        isLoading.value = true;
        try {
            await departmentService.create(payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function updateDepartment(id: number, payload: UpdateDepartmentPayload) {
        isLoading.value = true;
        try {
            await departmentService.update(id, payload);
        } finally {
            isLoading.value = false;
        }   
    }

    async function deleteDepartment(id: number) {
        isLoading.value = true;
        try {
            await departmentService.delete(id);
        } finally {
            isLoading.value = false;
        }
    }

    return {
        departments,
        totalRecords,
        isLoading,
        error,
        fetchDepartments,
        createDepartment,
        updateDepartment,
        deleteDepartment
    }
});