<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlatformPermissionStore } from '../store/platformPermission.store';
import { platformService } from '@/modules/platforms/services/platform.service';
import { usePlatformStore } from '@/modules/platforms/store/platform.store';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import type { PlatformPermission } from '../types/platformPermission.types';
import type { Platform } from '@/modules/platforms/types/platform.types';

// Componentes PrimeVue
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const route = useRoute();
const router = useRouter();
const permissionStore = usePlatformPermissionStore();
const platformStore = usePlatformStore();
const toast = useToast();

const platformId = Number(route.params.id); // Capturamos el ID de la URL
const currentPlatform = ref<Platform | null>(null);
const isInitializing = ref(true);

// --- ESTADO LOCAL ---
const permissionDialog = ref(false);
const deleteDialog = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);
const selectedPermissionToDelete = ref<PlatformPermission | null>(null);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const form = ref({
    id: 0,
    name: '',
    description: '' as string | undefined,
});

// --- CICLO DE VIDA ---

onMounted(async () => {
    if (!platformId || isNaN(platformId)) {
        router.push({ name: 'PlatformsList' });
        return;
    }

    try {
        isInitializing.value = true;
        // Peticiones en paralelo para mayor velocidad
        const [platformResponse] = await Promise.all([
            platformStore.fetchPlatformById(platformId),
            permissionStore.fetchByPlatform(platformId)
        ]);

        currentPlatform.value = platformResponse;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'La plataforma solicitada no existe o fue eliminada.' });
        router.push({ name: 'PlatformsList' });
    } finally {
        isInitializing.value = false;
    }
});

const goBack = () => {
    router.push({ name: 'PlatformsList' });
};

// --- CRUD ---
const openNew = () => {
    form.value = { id: 0, name: '', description: '' };
    submitted.value = false;
    isEditMode.value = false;
    permissionDialog.value = true;
};

const editPermission = (permission: PlatformPermission) => {
    form.value = {
        id: permission.id,
        name: permission.name,
        description: permission.description || ''
    };
    submitted.value = false;
    isEditMode.value = true;
    permissionDialog.value = true;
};

const savePermission = async () => {
    submitted.value = true;

    if (!form.value.name.trim()) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre es obligatorio.' });
        return;
    }

    const payload = {
        platform_id: platformId,
        name: form.value.name.trim(),
        description: form.value.description?.trim() || null,
    };

    try {
        if (isEditMode.value) {
            await permissionStore.updatePermission(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Permiso actualizado.' });
        } else {
            await permissionStore.createPermission(payload);
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Permiso creado correctamente.' });
        }
        permissionDialog.value = false;
        permissionStore.fetchByPlatform(platformId);
    } catch (e: any) {
        const errorMsg = e.response?.data?.message || 'Error al guardar el permiso.';
        toast.add({ severity: 'error', summary: 'Atención', detail: errorMsg, life: 5000 });
    }
};

const confirmDelete = (permission: PlatformPermission) => {
    selectedPermissionToDelete.value = permission;
    deleteDialog.value = true;
};

const deletePermission = async () => {
    if (selectedPermissionToDelete.value) {
        try {
            await permissionStore.deletePermission(selectedPermissionToDelete.value.id);
            toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Permiso eliminado.' });
            permissionStore.fetchByPlatform(platformId);
        } catch (e: any) {
            const errorMsg = e.response?.data?.message || 'No se pudo eliminar el permiso.';
            toast.add({ severity: 'warn', summary: 'Acción Denegada', detail: errorMsg, life: 6000 });
        } finally {
            deleteDialog.value = false;
            selectedPermissionToDelete.value = null;
        }
    }
};
</script>

<template>
    <div class="w-full max-w-none p-4">

        <div class="mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div class="flex items-center gap-4">
                <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="goBack"
                    class="bg-gray-50 hover:bg-gray-100" v-tooltip.bottom="'Volver a Plataformas'" />

                <div v-if="isInitializing" class="flex flex-col gap-2">
                    <Skeleton width="15rem" height="1.5rem" />
                    <Skeleton width="10rem" height="1rem" />
                </div>

                <div v-else>
                    <h2 class="text-2xl font-bold text-gray-800 m-0">Matriz de Permisos</h2>
                    <p class="text-gray-500 text-sm mt-1">
                        Plataforma: <span class="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{{
                            currentPlatform?.name }}</span>
                    </p>
                </div>
            </div>

            <Button label="Nuevo Permiso" icon="pi pi-plus" class="bg-blue-600 hover:bg-blue-700 text-white"
                @click="openNew" :disabled="isInitializing" />
        </div>

        <DataTable :value="permissionStore.permissions" :paginator="true" :rows="10"
            :loading="permissionStore.isLoading || isInitializing" dataKey="id" v-model:filters="filters"
            class="shadow-sm border border-gray-200 rounded-lg overflow-hidden" :rowsPerPageOptions="[10, 25, 50]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} permisos" stripedRows>

            <template #header>
                <div class="flex justify-end p-2">
                    <IconField iconPosition="left">
                        <InputIcon><i class="pi pi-search text-gray-500" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Buscar permiso..."
                            class="border border-gray-300 rounded-md p-2 w-full md:w-64" />
                    </IconField>
                </div>
            </template>

            <Column field="name" header="Nombre del Permiso" sortable style="width: 30%">
                <template #body="{ data }">
                    <span class="font-bold text-gray-800"><i class="pi pi-shield mr-2 text-blue-500 text-sm"></i>{{
                        data.name }}</span>
                </template>
            </Column>

            <Column field="description" header="Descripción">
                <template #body="{ data }">
                    <span class="text-gray-600">{{ data.description || 'Sin descripción' }}</span>
                </template>
            </Column>

            <Column header="Acciones" style="width: 120px; text-align: right">
                <template #body="slotProps">
                    <div class="flex justify-end space-x-2">
                        <Button icon="pi pi-pencil" severity="info" class="p-button-rounded p-button-outlined"
                            @click="editPermission(slotProps.data)" v-tooltip.top="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger" class="p-button-rounded p-button-outlined"
                            @click="confirmDelete(slotProps.data)" v-tooltip.top="'Eliminar'" />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="text-center p-12 text-gray-500">
                    <i class="pi pi-inbox text-5xl mb-4 text-gray-300 block"></i>
                    <h3 class="text-lg font-bold text-gray-600">Sin permisos registrados</h3>
                    <p class="text-sm mt-1">Haz clic en "Nuevo Permiso" para comenzar a configurar esta plataforma.</p>
                </div>
            </template>
        </DataTable>

        <Dialog :header="isEditMode ? 'Editar Permiso' : 'Nuevo Permiso'" v-model:visible="permissionDialog" modal
            class="w-full max-w-md" :draggable="false">
            <div class="flex flex-col gap-4 mt-2">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Permiso <span
                            class="text-red-500">*</span></label>
                    <InputText v-model.trim="form.name" class="w-full" autofocus
                        :class="{ 'p-invalid': submitted && !form.name }" maxlength="100"
                        placeholder="Ej. POS Card, Manager..." />
                    <small v-if="submitted && !form.name" class="text-red-500 block mt-1">El nombre es
                        obligatorio.</small>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                    <InputText v-model.trim="form.description" class="w-full"
                        placeholder="Nivel de acceso que otorga..." maxlength="255" />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                    <Button label="Cancelar" icon="pi pi-times" severity="secondary" text
                        @click="permissionDialog = false" />
                    <Button label="Guardar" icon="pi pi-check" @click="savePermission"
                        :loading="permissionStore.isLoading" class="bg-blue-600 text-white px-6" />
                </div>
            </template>
        </Dialog>

        <Dialog header="Confirmar Acción" v-model:visible="deleteDialog" modal class="w-full max-w-sm"
            :draggable="false">
            <div class="flex items-start space-x-4 pt-2">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500"></i>
                <div class="flex flex-col">
                    <span class="text-gray-800 font-medium mb-1">¿Eliminar el permiso <b>{{
                            selectedPermissionToDelete?.name
                            }}</b>?</span>
                    <span class="text-xs text-gray-500 mt-1">Si este permiso está asignado a un Miembro o a un Puesto,
                        la acción
                        será rechazada.</span>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <Button label="Cancelar" text severity="secondary" @click="deleteDialog = false" />
                    <Button label="Sí, Eliminar" severity="danger" @click="deletePermission"
                        :loading="permissionStore.isLoading" />
                </div>
            </template>
        </Dialog>

    </div>
</template>