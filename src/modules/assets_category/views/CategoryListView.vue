<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue';
import { useCategoryStore } from '@/modules/assets_category/store/category.store';
import type { Category } from '@/modules/assets_category/types/category.types';
import type { DataTablePageEvent } from 'primevue/datatable';

// Componentes PrimeVue
import Toolbar from 'primevue/toolbar';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';

const availableIcons = ref([
    { label: 'Laptop', value: 'fa-solid fa-laptop' },
    { label: 'Desktop / PC', value: 'fa-solid fa-desktop' },
    { label: 'Monitor / Pantalla', value: 'fa-solid fa-display' },
    { label: 'Tablet / iPad', value: 'fa-solid fa-tablet-screen-button' },
    { label: 'Teléfono / Móvil', value: 'fa-solid fa-mobile-screen' },
    { label: 'Servidor', value: 'fa-solid fa-server' },
    { label: 'Red / Switch', value: 'fa-solid fa-network-wired' },
    { label: 'Impresora', value: 'fa-solid fa-print' },
    { label: 'General / Caja', value: 'fa-solid fa-box-open' }
]);

const categoryStore = useCategoryStore();
const toast = useToast();

// --- ESTADO LOCAL ---
const categoryDialog = ref(false);
const deleteDialog = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);
const selectedCategoryToDelete = ref<Category | null>(null);
const searchValue = ref('');

// Paginación y Búsqueda del lado del Servidor
const lazyParams = ref({
    first: 0,
    rows: 15,
    page: 0
});

// Formulario
const form = ref({
    id: 0,
    name: '',
    slug: '',
    prefix: '',
    icon: '',
    is_serialized: false,
    has_network_fields: false,
});

// --- CICLO DE VIDA ---
onMounted(() => {
    loadLazyData();
});

const loadLazyData = () => {
    const page = lazyParams.value.page + 1; // Laravel usa páginas base 1, PrimeVue base 0
    categoryStore.fetchCategories(page, lazyParams.value.rows, searchValue.value);
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
    }, 500); // Espera 500ms tras dejar de escribir
};

// --- UTILIDADES ---
const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

const generateSlug = () => {
    if (!isEditMode.value) {
        form.value.slug = form.value.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
};

// --- CRUD ---
const openNew = () => {
    form.value = {
        id: 0, name: '', slug: '', prefix: '', icon: '',
        is_serialized: false, has_network_fields: false,
    };
    submitted.value = false;
    isEditMode.value = false;
    categoryDialog.value = true;
};

const openEdit = (category: Category) => {
    form.value = {
        id: category.id, name: category.name, slug: category.slug, prefix: category.prefix,
        icon: category.icon || '', is_serialized: category.is_serialized,
        has_network_fields: category.has_network_fields,
    };
    submitted.value = false;
    isEditMode.value = true;
    categoryDialog.value = true;
};

const saveCategory = async () => {
    submitted.value = true;
    if (!form.value.name || !form.value.slug || !form.value.prefix) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Por favor completa los campos requeridos.' });
        return;
    }

    try {
        const payload = { ...form.value, icon: form.value.icon || null };
        if (isEditMode.value) {
            await categoryStore.updateCategory(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría actualizada correctamente.' });
        } else {
            await categoryStore.createCategory(payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría creada correctamente.' });
        }
        categoryDialog.value = false;
        loadLazyData(); // Recargamos la tabla
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar.' });
    }
};

const confirmDelete = (category: Category) => {
    selectedCategoryToDelete.value = category;
    deleteDialog.value = true;
};

const deleteCategory = async () => {
    if (selectedCategoryToDelete.value) {
        try {
            await categoryStore.deleteCategory(selectedCategoryToDelete.value.id);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría eliminada.' });
            loadLazyData(); // Recargamos la tabla
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Ocurrió un error al eliminar.';
            toast.add({ severity: 'error', summary: 'Atención', detail: msg });
        } finally {
            deleteDialog.value = false;
            selectedCategoryToDelete.value = null;
        }
    }
}
</script>

<template>
    <div class="w-full max-w-none p-4">

        <Toolbar class="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <template #start>
                <Button label="Nueva Categoría" icon="pi pi-plus" class="bg-blue-500 hover:bg-blue-600 text-white mr-3"
                    @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="categoryStore.categories" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="categoryStore.totalRecords" :loading="categoryStore.isLoading" @page="onPage" dataKey="id"
            class="shadow" :rowsPerPageOptions="[5, 10, 15, 25]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} categorías" stripedRows>

            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0 text-xl font-bold">Gestión de Categorías</h4>
                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search text-gray-500" />
                        </InputIcon>
                        <InputText v-model="searchValue" @input="onSearch" placeholder="Buscar categoría..."
                            class="border border-gray-300 rounded-md p-2 w-64" />
                    </IconField>
                </div>
            </template>

              <Column header="#" style="width: 3rem">
                <template #body="slotProps">
                    <span class="text-gray-500 font-mono font-semibold">
                        {{ lazyParams.page * lazyParams.rows + slotProps.index + 1 }}
                    </span>
                </template>
            </Column>

            <Column field="prefix" header="Prefijo" style="width: 100px">
                <template #body="{ data }">
                    <Tag :value="data.prefix" severity="info" />
                </template>
            </Column>

            <Column field="name" header="Nombre de Categoría">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <i v-if="data.icon" :class="data.icon" class="text-gray-500"></i>
                        <span class="font-medium text-gray-800">{{ data.name }}</span>
                    </div>
                </template>
            </Column>

            <Column field="slug" header="Slug"></Column>

            <Column header="Atributos" style="min-width: 150px">
                <template #body="{ data }">
                    <div class="flex flex-col gap-1 text-sm">
                        <span v-if="data.is_serialized" class="text-green-600">
                            <i class="pi pi-check-circle mr-1"></i> Serializado
                        </span>
                        <span v-if="data.has_network_fields" class="text-blue-600">
                            <i class="pi pi-wifi mr-1"></i> Campos de Red
                        </span>
                        <span v-if="!data.is_serialized && !data.has_network_fields" class="text-gray-400">
                            Básico
                        </span>
                    </div>
                </template>
            </Column>

            <Column header="Acciones" style="width: 120px; text-align: right">
                <template #body="{ data }">
                    <div class="flex justify-end space-x-2">
                        <Button icon="pi pi-pencil" severity="info" class="p-button-rounded p-button-outlined"
                            @click="openEdit(data)" v-tooltip.top="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger" class="p-button-rounded p-button-outlined"
                            @click="confirmDelete(data)" v-tooltip.top="'Eliminar'" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog :header="isEditMode ? 'Editar Categoría' : 'Nueva Categoría'" v-model:visible="categoryDialog" modal
            class="w-full max-w-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label for="name" class="block text-sm font-medium primary mb-1">Nombre <span
                            class="text-red-500">*</span></label>
                    <InputText id="name" v-model="form.name" class="w-full border border-gray-300 rounded-md p-2"
                        @input="generateSlug" :class="{ 'p-invalid': submitted && !form.name }" />
                    <small v-if="submitted && !form.name" class="text-red-500">El nombre es obligatorio.</small>
                </div>
                <div>
                    <label for="slug" class="block text-sm font-medium primary mb-1">Slug <span
                            class="text-red-500">*</span></label>
                    <InputText id="slug" v-model="form.slug" class="w-full border border-gray-300 rounded-md p-2"
                        :class="{ 'p-invalid': submitted && !form.slug }" />
                </div>
                <div>
                    <label for="prefix" class="block text-sm font-medium primary mb-1">Prefijo (Ej. LPT) <span
                            class="text-red-500">*</span></label>
                    <InputText id="prefix" v-model="form.prefix"
                        class="w-full border border-gray-300 rounded-md p-2 uppercase"
                        :class="{ 'p-invalid': submitted && !form.prefix }" />
                </div>
                <div class="col-span-2">
                    <label for="icon" class="block text-sm font-medium primary mb-1">Icono Representativo</label>

                    <Select id="icon" v-model="form.icon" :options="availableIcons" optionLabel="label"
                        optionValue="value" placeholder="Selecciona un icono"
                        class="w-full border border-gray-300 rounded-md" display="chip">

                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-3">
                                <i :class="slotProps.value" class="text-gray-700 text-lg w-5 text-center"></i>
                                <span>{{availableIcons.find(i => i.value === slotProps.value)?.label}}</span>
                            </div>
                            <span v-else class="text-gray-500">
                                {{ slotProps.placeholder }}
                            </span>
                        </template>

                        <template #option="slotProps">
                            <div class="flex items-center gap-3">
                                <i :class="slotProps.option.value" class="text-gray-700 text-lg w-5 text-center"></i>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>

                    </Select>
                </div>
                <div class="col-span-2 flex flex-col gap-3 mt-2">
                    <div class="flex items-center">
                        <Checkbox v-model="form.is_serialized" inputId="is_serialized" :binary="true" />
                        <label for="is_serialized" class="ml-2 font-medium">Requiere Número de Serie</label>
                    </div>
                    <div class="flex items-center">
                        <Checkbox v-model="form.has_network_fields" inputId="has_network_fields" :binary="true" />
                        <label for="has_network_fields" class="ml-2 font-medium">Contiene Campos de Red</label>
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" text @click="categoryDialog = false"
                        class="text-gray-500" />
                    <Button label="Guardar" icon="pi pi-check" @click="saveCategory" :loading="categoryStore.isLoading"
                        class="bg-blue-500 text-white hover:bg-blue-600" />
                </div>
            </template>
        </Dialog>

        <Dialog header="Confirmar" v-model:visible="deleteDialog" modal class="w-96">
            <div class="flex items-center space-x-3">
                <i class="pi pi-exclamation-triangle text-3xl text-orange-400"></i>
                <span>¿Eliminar la categoría <b>{{ selectedCategoryToDelete?.name }}</b>?</span>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-2 mt-4">
                    <Button label="No" icon="pi pi-times" text @click="deleteDialog = false" />
                    <Button label="Sí, eliminar" severity="danger" icon="pi pi-check" @click="deleteCategory"
                        :loading="categoryStore.isLoading" />
                </div>
            </template>
        </Dialog>

    </div>
</template>