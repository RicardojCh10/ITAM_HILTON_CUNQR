import { defineStore } from 'pinia';
import { ref } from 'vue';
import { memberService } from '../services/member.service';
import type { Member, CreateMemberPayload, SimpleStatsResponse } from '../types/member.types';

export const useMemberStore = defineStore('member', () => {
    // Estado
    const members = ref<Member[]>([]);
    const totalRecords = ref(0);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const currentMember = ref<Member | null>(null);
    const stats = ref<SimpleStatsResponse | null>(null);

    // Acciones
    async function fetchMembers(page: number = 1, perPage: number = 15, search: string = '', propertyId?: number, department?: string, status?: string) {
        isLoading.value = true;
        try {
            const response = await memberService.getAll(page, perPage, search, propertyId, department, status);
            members.value = response.data;
            totalRecords.value = response.meta?.total || response.data.length;
        } catch (err: any) {
            console.error(err);
            error.value = 'Error al cargar miembros';
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchMemberById(id: number) {
        isLoading.value = true;
        try {
            currentMember.value = await memberService.getById(id);
        } catch (e) {
            console.error(e);
            error.value = 'No se pudo cargar el miembro';
        } finally {
            isLoading.value = false;
        }
    }

    async function createMember(payload: CreateMemberPayload) {
        isLoading.value = true;
        try {
            await memberService.create(payload);
        } finally {
            isLoading.value = false;
        }
    }

    async function updateMember(id: number, payload: CreateMemberPayload) {
        isLoading.value = true;
        try {
            await memberService.update(id, payload);
        } finally {
            isLoading.value = false;
        }
    }

    // Acción para IT: Dar acceso
    async function admitMemberIT(id: number) {
        isLoading.value = true;
        try {
            await memberService.admitMember(id);
        } finally {
            isLoading.value = false;
        }
    }

    // Acción para IT: Baja técnica
    async function deleteMember(id: number) {
        isLoading.value = true;
        try {
            await memberService.retireMember(id);
        } finally {
            isLoading.value = false;
        }
    }

    async function downloadAccessPdf(id: number, memberName: string) {
        isLoading.value = true;
        try {
            await memberService.downloadAccessPdf(id, memberName);
        } finally {
            isLoading.value = false;
        }
    }

    async function importMembers(file: File) {
        isLoading.value = true;
        try {
            const formData = new FormData();
            formData.append('file', file);
            await memberService.import(formData);
        } catch (e) {
            throw e; 
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchStats() {
        try {
            stats.value = await memberService.getStats();
        } catch (e) {
            console.error("Error stats", e);
        }
    }

    return {
        members,
        totalRecords,
        isLoading,
        error,
        currentMember,
        stats,
        fetchMembers,
        fetchMemberById,
        createMember,
        updateMember,
        deleteMember,
        admitMemberIT,
        downloadAccessPdf,
        importMembers,
        fetchStats
    };
});