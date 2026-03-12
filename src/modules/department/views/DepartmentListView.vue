<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDepartmentStore } from '../store/department.store';
import { useToast } from 'primevue/usetoast';
import type { Department } from '../types/department.types';

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

const departmentStore = useDepartmentStore();
const toast = useToast();

// --- ESTADO LOCAL ---
const departmentDialog = ref(false);
const deleteDialog = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);
const selectedDepartmentToDelete = ref<Department | null>(null);
const searchValue = ref('');

// Formulario
const form = ref({
    id: 0,
    name: ''
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
    departmentStore.fetchDepartments(page, lazyParams.value.rows, searchValue.value);
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
    form.value = { id: 0, name: '' };
    submitted.value = false;
    isEditMode.value = false;
    departmentDialog.value = true;
};

const editDepartment = (dept: Department) => {
    form.value = { ...dept };
    submitted.value = false;
    isEditMode.value = true;
    departmentDialog.value = true;
};

const saveDepartment = async () => {
    submitted.value = true;
    if (!form.value.name.trim()) return;

    const payload = {
        name: form.value.name
    };

    try {
        if (isEditMode.value && form.value.id) {
            await departmentStore.updateDepartment(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Departamento actualizado', life: 3000 });
        } else {
            await departmentStore.createDepartment(payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Departamento creado', life: 3000 });
        }
        departmentDialog.value = false;
        loadLazyData();
    } catch (e) {
        // Error manejado en store
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 3000 });
    }
};

const confirmDelete = (dept: Department) => {
    selectedDepartmentToDelete.value = dept;
    deleteDialog.value = true;
};

const deleteDepartment = async () => {
    if (selectedDepartmentToDelete.value) {
        try {
            await departmentStore.deleteDepartment(selectedDepartmentToDelete.value.id);
            deleteDialog.value = false;
            selectedDepartmentToDelete.value = null;
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Departamento eliminado', life: 3000 });
            loadLazyData();
        } catch (error) {
             toast.add({ severity: 'error', summary: 'Error', detail: 'No se puede eliminar (quizás tiene puestos asociados)', life: 5000 });
        }
    }
};
</script>

<template>
    <div class="w-full max-w-none p-4">

        <Toolbar class="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <template #start>
                <Button label="Nuevo Departamento" icon="pi pi-plus" class="bg-blue-500 hover:bg-blue-600 text-white mr-3"
                    @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="departmentStore.departments" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="departmentStore.totalRecords" :loading="departmentStore.isLoading" @page="onPage" dataKey="id"
            class="shadow" :rowsPerPageOptions="[5, 10, 15, 25]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} departamentos" stripedRows>
            
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0 text-xl font-bold">Gestión de Departamentos</h4>
                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search text-gray-500" />
                        </InputIcon>
                        <InputText v-model="searchValue" @input="onSearch" placeholder="Buscar..."
                            class="border border-gray-300 rounded-md p-2 w-64" />
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

            <Column field="name" header="Nombre del Departamento">
                <template #body="{ data }">
                    <span class="font-medium text-gray-800">{{ data.name }}</span>
                </template>
            </Column>

            <Column field="created_at" header="Fecha Creación" style="width: 200px">
                <template #body="slotProps">
                    <span class="text-sm text-gray-600">
                        {{ formatDate(slotProps.data.created_at) }}
                    </span>
                </template>
            </Column>

            <Column header="Acciones" style="width: 120px; text-align: right">
                <template #body="slotProps">
                    <div class="flex justify-end space-x-2">
                        <Button icon="pi pi-pencil" severity="info"
                            class="p-button-rounded p-button-outlined text-white"
                            @click="editDepartment(slotProps.data)" v-tooltip.top="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger"
                            class="p-button-rounded p-button-outlined text-white"
                            @click="confirmDelete(slotProps.data)" v-tooltip.top="'Eliminar'" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog :header="isEditMode ? 'Editar Departamento' : 'Nuevo Departamento'" v-model:visible="departmentDialog" modal
            class="w-96">
            <div class="space-y-4">
                <div>
                    <label for="name" class="block text-sm font-medium primary">Nombre <span
                            class="text-red-500">*</span></label>
                    <InputText id="name" v-model="form.name" class="w-full mt-1 border border-gray-300 rounded-md p-2"
                        autofocus :class="{'p-invalid': submitted && !form.name}" />
                    <small v-if="submitted && !form.name" class="text-red-500">El nombre es obligatorio.</small>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" text @click="departmentDialog = false"
                        class="text-gray-500" />
                    <Button label="Guardar" icon="pi pi-check" @click="saveDepartment" :loading="departmentStore.isLoading"
                        class="bg-blue-500 text-white hover:bg-blue-600" />
                </div>
            </template>
        </Dialog>

        <Dialog header="Confirmar Eliminación" v-model:visible="deleteDialog" modal class="w-96">
            <div class="flex items-center space-x-3">
                <i class="pi pi-exclamation-triangle text-3xl text-orange-400"></i>
                <div class="flex flex-col">
                    <span>¿Eliminar el departamento <b>{{ selectedDepartmentToDelete?.name }}</b>?</span>
                    <span class="text-xs text-gray-500 mt-1">Asegúrate de que no tenga puestos asignados.</span>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-2 mt-4">
                    <Button label="No" icon="pi pi-times" text @click="deleteDialog = false" />
                    <Button label="Sí, eliminar" severity="danger" icon="pi pi-check" @click="deleteDepartment"
                        :loading="departmentStore.isLoading" />
                </div>
            </template>
        </Dialog>
    </div>
</template>