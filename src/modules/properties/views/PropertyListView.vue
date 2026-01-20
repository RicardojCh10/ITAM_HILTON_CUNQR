<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePropertyStore } from '../store/property.store';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import type { Property } from '../types/property.types';

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

const propertyStore = usePropertyStore();
const toast = useToast();

// --- ESTADO LOCAL ---
const propertyDialog = ref(false);
const deleteDialog = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);
const selectedProperties = ref<Property[]>([]);
const selectedPropertyToDelete = ref<Property | null>(null);
const searchValue = ref('');

// Formulario
const form = ref({
    id: 0,
    name: '',
    code: ''
});

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
    propertyStore.fetchProperties(page, lazyParams.value.rows, searchValue.value);
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

// --- CRUD ---
const openNew = () => {
    form.value = { id: 0, name: '', code: '' };
    submitted.value = false;
    isEditMode.value = false;
    propertyDialog.value = true;
};

const editProperty = (prop: Property) => {
    form.value = { ...prop };
    submitted.value = false;
    isEditMode.value = true;
    propertyDialog.value = true;
};

const saveProperty = async () => {
    submitted.value = true;
    if (!form.value.name.trim() || !form.value.code.trim()) return;

    // Normalizamos el código a Mayúsculas
    const payload = {
        name: form.value.name,
        code: form.value.code.toUpperCase()
    };

    try {
        if (isEditMode.value && form.value.id) {
            await propertyStore.updateProperty(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Propiedad actualizada', life: 3000 });
        } else {
            await propertyStore.createProperty(payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Propiedad creada', life: 3000 });
        }
        propertyDialog.value = false;
        loadLazyData();
    } catch (e) {
        // Error manejado en store
    }
};

const confirmDelete = (prop: Property) => {
    selectedPropertyToDelete.value = prop;
    deleteDialog.value = true;
};

const deleteProperty = async () => {
    if (selectedPropertyToDelete.value) {
        await propertyStore.deleteProperty(selectedPropertyToDelete.value.id);
        deleteDialog.value = false;
        selectedPropertyToDelete.value = null;
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Propiedad eliminada', life: 3000 });
        loadLazyData();
    }
};
</script>

<template>
    <div class="w-full max-w-none p-4">

        <Toolbar class="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <template #start>
                <Button label="Nueva Propiedad" icon="pi pi-plus" class="bg-blue-500 hover:bg-blue-600 text-white mr-3"
                    @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="propertyStore.properties" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="propertyStore.totalRecords" :loading="propertyStore.isLoading" @page="onPage" dataKey="id"
            class="shadow" :rowsPerPageOptions="[5, 10, 15, 25]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} propiedades">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0 text-lg font-bold">Gestión de Propiedades</h4>
                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search text-gray-500" />
                        </InputIcon>
                        <InputText v-model="searchValue" @input="onSearch" placeholder="Buscar..."
                            class="border border-gray-300 rounded-md p-2 w-64" />
                    </IconField>
                </div>
            </template>

            <Column header="#">
                <template #body="slotProps">
                    {{ lazyParams.page * lazyParams.rows + slotProps.index + 1 }}
                </template>
            </Column>

            <Column class="text-sm" field="name" header="Nombre" />

            <Column field="code" header="Código">
                <template #body="slotProps">
                    <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-primary-700 font-bold">
                        {{ slotProps.data.code }}
                    </span>
                </template>
            </Column>

            <Column field="created_at" header="Fecha Creación">
                <template #body="slotProps">
                    <span class="text-sm">
                        {{ formatDate(slotProps.data.created_at) }}
                    </span>
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="slotProps">
                    <div class="flex space-x-2">
                        <Button icon="pi pi-pencil" severity="info"
                            class="p-button-rounded p-button-outlined text-white"
                            @click="editProperty(slotProps.data)" />
                        <Button icon="pi pi-trash" severity="danger"
                            class="p-button-rounded p-button-outlined text-white"
                            @click="confirmDelete(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog :header="isEditMode ? 'Editar Propiedad' : 'Nueva Propiedad'" v-model:visible="propertyDialog" modal
            class="w-96">
            <div class="space-y-4">
                <div>
                    <label for="name" class="block text-sm font-medium primary">Nombre <span
                            class="text-red-500">*</span></label>
                    <InputText id="name" v-model="form.name" class="w-full mt-1 border border-gray-300 rounded-md p-2"
                        autofocus />
                    <small v-if="submitted && !form.name" class="text-red-500">El nombre es obligatorio.</small>
                </div>
                <div>
                    <label for="code" class="block text-sm font-medium primary">Código <span
                            class="text-red-500">*</span></label>
                    <InputText id="code" v-model="form.code"
                        class="w-full mt-1 border border-gray-300 rounded-md p-2 uppercase" placeholder="Ej. H-CUN"
                        maxlength="10" />
                    <small v-if="submitted && !form.code" class="text-red-500">El código es obligatorio.</small>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" text @click="propertyDialog = false"
                        class="text-gray-500" />
                    <Button label="Guardar" icon="pi pi-check" @click="saveProperty" :loading="propertyStore.isLoading"
                        class="bg-blue-500 text-white" />
                </div>
            </template>
        </Dialog>

        <Dialog header="Confirmar" v-model:visible="deleteDialog" modal class="w-96">
            <div class="flex items-center space-x-3">
                <i class="pi pi-exclamation-triangle text-3xl text-orange-400"></i>
                <span>¿Eliminar la propiedad <b>{{ selectedPropertyToDelete?.name }}</b>?</span>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-2 mt-4">
                    <Button label="No" icon="pi pi-times" text @click="deleteDialog = false" />
                    <Button label="Sí, eliminar" severity="danger" icon="pi pi-check" @click="deleteProperty"
                        :loading="propertyStore.isLoading" />
                </div>
            </template>
        </Dialog>
    </div>
</template>