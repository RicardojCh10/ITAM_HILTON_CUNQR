<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePlatformStore } from '../store/platform.store';
import { useToast } from 'primevue/usetoast';
import type { Platform } from '../types/platform.types';

// Componentes PrimeVue
import type { DataTablePageEvent } from 'primevue/datatable';
import Toolbar from 'primevue/toolbar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';
import Tag from 'primevue/tag';

const router = useRouter();
const platformStore = usePlatformStore();
const toast = useToast();

// --- ESTADO LOCAL ---
const platformDialog = ref(false);
const deleteDialog = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);
const selectedPlatformToDelete = ref<Platform | null>(null);
const searchValue = ref('');

// Formulario tipado correctamente para manejar descripciones opcionales
const form = ref({
    id: 0,
    name: '',
    description: '' as string | undefined,
    is_active: true,
});


const goToPermissions = (platformId: number) => {
    router.push({ name: 'PlatformPermissions', params: { id: platformId } });
};

// Paginación
const lazyParams = ref({
    first: 0,
    rows: 15,
    page: 0
});

// --- CICLO DE VIDA ---
onMounted(() => {
    loadLazyData();
});

const loadLazyData = () => {
    const page = lazyParams.value.page + 1;
    platformStore.fetchPlatforms(page, lazyParams.value.rows, searchValue.value);
};

const onPage = (event: DataTablePageEvent) => {
    lazyParams.value = event;
    loadLazyData();
};

// --- BÚSQUEDA ---
let searchTimeout: ReturnType<typeof setTimeout>;
const onSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        lazyParams.value.first = 0;
        lazyParams.value.page = 0;
        loadLazyData();
    }, 500);
};

// --- UTILIDADES ---
const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

// --- FUNCIONES DE CRUD ---
const openNew = () => {
    form.value = {
        id: 0,
        name: '',
        description: '',
        is_active: true,
    };
    submitted.value = false;
    isEditMode.value = false;
    platformDialog.value = true;
};

// Mapeo seguro evitando arrastrar propiedades innecesarias como created_at
const editPlatform = (platform: Platform) => {
    form.value = {
        id: platform.id,
        name: platform.name,
        description: platform.description || '',
        is_active: Boolean(platform.is_active)
    };
    submitted.value = false;
    isEditMode.value = true;
    platformDialog.value = true;
};

const savePlatform = async () => {
    submitted.value = true;

    if (!form.value.name.trim()) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre es obligatorio.' });
        return;
    }

    const payload = {
        name: form.value.name,
        description: form.value.description,
        is_active: form.value.is_active
    };

    try {
        if (isEditMode.value) {
            await platformStore.updatePlatform(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Plataforma actualizada correctamente.' });
        } else {
            await platformStore.createPlatform(payload);
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Plataforma creada correctamente.' });
        }
        platformDialog.value = false;
        loadLazyData();
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar la plataforma.' });
    }
};

const confirmDelete = (platform: Platform) => {
    selectedPlatformToDelete.value = platform;
    deleteDialog.value = true;
};

const deletePlatform = async () => {
    if (selectedPlatformToDelete.value) {
        try {
            await platformStore.deletePlatform(selectedPlatformToDelete.value.id);
            toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Plataforma eliminada correctamente.' });
            loadLazyData();
        } catch (e) {
            console.error(e);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al eliminar la plataforma.' });
        } finally {
            deleteDialog.value = false;
            selectedPlatformToDelete.value = null;
        }
    }
};
</script>

<template>
    <div class="w-full max-w-none p-4">

        <Toolbar class="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <template #start>
                <Button label="Nueva Plataforma" icon="pi pi-plus" class="bg-blue-600 hover:bg-blue-700 text-white mr-3"
                    @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="platformStore.platforms" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="platformStore.totalRecords" :loading="platformStore.isLoading" @page="onPage" dataKey="id"
            class="shadow-sm border border-gray-200 rounded-lg overflow-hidden" :rowsPerPageOptions="[5, 10, 15, 25]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} plataformas" stripedRows>

            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between p-2">
                    <h4 class="m-0 text-xl font-bold text-gray-800">Gestión de Plataformas</h4>
                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search text-gray-500" />
                        </InputIcon>
                        <InputText v-model="searchValue" @input="onSearch" placeholder="Buscar plataforma..."
                            class="border border-gray-300 rounded-md p-2 w-full md:w-64" />
                    </IconField>
                </div>
            </template>

            <Column header="#" style="width: 3rem">
                <template #body="slotProps">
                    <span class="text-gray-500 font-mono">
                        {{ lazyParams.page * lazyParams.rows + slotProps.index + 1 }}
                    </span>
                </template>
            </Column>

            <Column field="name" header="Nombre de la Plataforma" sortable>
                <template #body="{ data }">
                    <span class="font-bold text-gray-800">{{ data.name }}</span>
                </template>
            </Column>

            <Column field="description" header="Descripción">
                <template #body="{ data }">
                    <span class="text-gray-600">{{ data.description || 'Sin descripción' }}</span>
                </template>
            </Column>

            <Column field="is_active" header="Estado">
                <template #body="{ data }">
                    <Tag :value="data.is_active ? 'ACTIVO' : 'INACTIVO'"
                        :severity="data.is_active ? 'success' : 'danger'" class="font-bold px-2 py-1" />
                </template>
            </Column>

            <Column field="created_at" header="Fecha Creación" style="width: 180px">
                <template #body="slotProps">
                    <span class="text-sm text-gray-500 font-medium">
                        {{ formatDate(slotProps.data.created_at) }}
                    </span>
                </template>
            </Column>

            <Column header="Acciones" style="width: 150px; text-align: right">
                <template #body="slotProps">
                    <div class="flex justify-end space-x-2">
                        <Button icon="pi pi-key" severity="warning" class="p-button-rounded p-button-outlined"
                            @click="goToPermissions(slotProps.data.id)" v-tooltip.top="'Gestionar Permisos'" />

                        <Button icon="pi pi-pencil" severity="info" class="p-button-rounded p-button-outlined"
                            @click="editPlatform(slotProps.data)" v-tooltip.top="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger" class="p-button-rounded p-button-outlined"
                            @click="confirmDelete(slotProps.data)" v-tooltip.top="'Eliminar'" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog :header="isEditMode ? 'Editar Plataforma' : 'Nueva Plataforma'" v-model:visible="platformDialog" modal
            class="w-full max-w-md" :draggable="false">

            <div class="flex flex-col gap-4 mt-2">
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span class="text-red-500">*</span>
                    </label>
                    <InputText id="name" v-model.trim="form.name" class="w-full" autofocus
                        :class="{ 'p-invalid': submitted && !form.name }" maxlength="100"
                        placeholder="Ej. Micros Oracle" />
                    <small v-if="submitted && !form.name" class="text-red-500 block mt-1">El nombre es
                        obligatorio.</small>
                </div>

                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <InputText id="description" v-model.trim="form.description" class="w-full"
                        placeholder="Detalles o propósito de la plataforma..." maxlength="255" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado Operativo <span
                            class="text-red-500">*</span></label>
                    <Select v-model="form.is_active"
                        :options="[{ label: 'ACTIVO', value: true }, { label: 'INACTIVO', value: false }]"
                        optionLabel="label" optionValue="value" class="w-full" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                    <Button label="Cancelar" icon="pi pi-times" severity="secondary" text
                        @click="platformDialog = false" />
                    <Button label="Guardar Plataforma" icon="pi pi-check" @click="savePlatform"
                        :loading="platformStore.isLoading" class="bg-blue-600 hover:bg-blue-700 text-white px-6" />
                </div>
            </template>
        </Dialog>

        <Dialog header="Confirmar Eliminación" v-model:visible="deleteDialog" modal class="w-full max-w-sm"
            :draggable="false">
            <div class="flex items-start space-x-4 pt-2">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500"></i>
                <div class="flex flex-col">
                    <span class="text-gray-800 font-medium mb-1">
                        ¿Eliminar la plataforma <b>{{ selectedPlatformToDelete?.name }}</b>?
                    </span>
                    <span class="text-sm text-gray-500">
                        Asegúrate de que no tenga permisos ni puestos asignados antes de proceder.
                    </span>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <Button label="Cancelar" icon="pi pi-times" severity="secondary" text
                        @click="deleteDialog = false" />
                    <Button label="Sí, Eliminar" severity="danger" icon="pi pi-trash" @click="deletePlatform"
                        :loading="platformStore.isLoading" class="px-4" />
                </div>
            </template>
        </Dialog>

    </div>
</template>