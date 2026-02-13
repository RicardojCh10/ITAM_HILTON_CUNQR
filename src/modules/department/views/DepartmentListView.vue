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
const selectedDepartments = ref<Department[]>([]);
const selectedDepartmentToDelete = ref<Department | null>(null);
const searchValue = ref('');

// Formulario
const form = ref({
    id: 0,
    name: '',
     created_at: ''
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
const onSearchInput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        lazyParams.value.first = 0;
        lazyParams.value.page = 0;
        loadLazyData();
    }, 500);
};

// Utilidades
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX',{
        year: 'numeric',
        month: 'long',   
        day: 'numeric'
    });
};

const openNew = () => {
    form.value = {
        id: 0,
        name: '',
        created_at: ''
    };
    submitted.value = false;
    isEditMode.value = false;
    departmentDialog.value = true;
};

const editDepartment = (depart: Department) => {
    form.value = { ...depart };
    submitted.value = false;
    isEditMode.value = true;
    departmentDialog.value = true;
};

const saveDepartment = async () => {
    submitted.value = true;
    if (!form.value.name.trim()) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre es requerido.', life: 3000 });
        return;
    }

    try {
        if (isEditMode.value) {
            await departmentStore.updateDepartment(form.value);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Departamento actualizado exitosamente.', life: 3000 });
        } else {
            await departmentStore.createDepartment(form.value);
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Departamento creado exitosamente.', life: 3000 });
        }
        departmentDialog.value = false;
        loadLazyData();
    } catch (error) {
    }
};

const confirmDeleteDepartment = (depart: Department) => {
    selectedDepartmentToDelete.value = depart;
    deleteDialog.value = true;
};

const deleteDepartment = async () => {
    if (selectedDepartmentToDelete.value) {
        await departmentStore.deleteDepartment(selectedDepartmentToDelete.value.id);
        deleteDialog.value = false;
        selectedDepartmentToDelete.value = null;
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Departamento eliminado exitosamente.', life: 3000 });
        loadLazyData();
    }
};

</script>

<template>

</template>