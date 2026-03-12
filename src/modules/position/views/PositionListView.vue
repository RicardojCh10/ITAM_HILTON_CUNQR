<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { usePositionStore } from '../store/position.store';
import { useDepartmentStore } from '@/modules/department/store/department.store';
import { platformService } from '@/modules/platforms/services/platform.service';
import { useToast } from 'primevue/usetoast';
import type { Position } from '../types/position.types';
import type { Platform } from '@/modules/platforms/types/platform.types';

// Componentes PrimeVue
import type { DataTablePageEvent } from 'primevue/datatable';
import Toolbar from 'primevue/toolbar';
import DataTable from 'primevue/datatable';
import Badge from 'primevue/badge';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import AutoComplete from 'primevue/autocomplete'; // Componente nativo para búsquedas dinámicas
import Splitter from 'primevue/splitter';         // Para evitar que el diseño se rompa
import SplitterPanel from 'primevue/splitterpanel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Checkbox from 'primevue/checkbox';

const positionStore = usePositionStore();
const departmentStore = useDepartmentStore();
const toast = useToast();

// --- ESTADO LOCAL ---
const positionDialog = ref(false);
const deleteDialog = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);
const selectedPositionToDelete = ref<Position | null>(null);
const searchValue = ref('');

// Matriz de Permisos (Split-Pane)
const platformSearch = ref('');
const activePlatformId = ref<number | null>(null);
const platformCatalog = ref<Platform[]>([]);
const isLoadingCatalog = ref(false);

// AutoComplete de Departamentos
const selectedDepartmentObj = ref<any>(null);
const filteredDepartments = ref<any[]>([]);

// Formulario reactivo
const form = ref({
    id: 0,
    name: '',
    default_permissions: [] as number[] // Vue guarda aquí los IDs de los checkboxes marcados
});

const lazyParams = ref({
    first: 0,
    rows: 15,
    page: 0
});

// --- COMPUTED PROPERTIES ---

// Filtra las plataformas en el panel izquierdo
const filteredPlatforms = computed(() => {
    if (!platformSearch.value) return platformCatalog.value;
    const query = platformSearch.value.toLowerCase();
    return platformCatalog.value.filter(p => p.name.toLowerCase().includes(query));
});

// Muestra los permisos de la plataforma activa en el panel derecho
const activePlatform = computed(() => {
    return platformCatalog.value.find(p => p.id === activePlatformId.value) || null;
});

// UX: Cuenta cuántos permisos tiene seleccionados una plataforma para el Badge
const getSelectedCount = (platform: Platform) => {
    if (!platform.permissions) return 0;
    return platform.permissions.filter(p => form.value.default_permissions.includes(p.id)).length;
};

// Helper UX: Calcula el número de plataformas únicas (Protegido contra undefined)
const getUniquePlatformsCount = (permissions?: any[]) => {
    // Si no hay permisos o no es un arreglo válido, devuelve 0
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) return 0;

    // Filtramos solo los permisos que tengan un platform_id válido antes de meterlos al Set
    const validPermissions = permissions.filter(p => p && p.platform_id);

    const uniquePlatforms = new Set(validPermissions.map(p => p.platform_id));
    return uniquePlatforms.size;
};

// --- CICLO DE VIDA ---
onMounted(async () => {
    loadLazyData();
    isLoadingCatalog.value = true;
    try {
        const [, platformRes] = await Promise.all([
            departmentStore.fetchDepartments(1, 100),
            platformService.getAllPlatforms(1, 1000)
        ]);

        platformCatalog.value = platformRes.data || [];

        // UX Senior: Asignamos la primera plataforma de forma segura
        const firstPlatform = platformCatalog.value[0];
        if (firstPlatform?.id) {
            activePlatformId.value = firstPlatform.id;
        }
    } catch (e) {
        console.error('Error inicializando catálogos: ', e);
    } finally {
        isLoadingCatalog.value = false;
    }
});

const loadLazyData = () => {
    const page = lazyParams.value.page + 1;
    positionStore.fetchPositions(page, lazyParams.value.rows, searchValue.value);
};

const onPage = (event: DataTablePageEvent) => {
    lazyParams.value = event;
    loadLazyData();
};

const getDepartmentName = (deptId: number) => {
    const dept = departmentStore.departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Desconocido';
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

// --- BUSCADORES ---
let searchTimeout: ReturnType<typeof setTimeout>;
const onSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        lazyParams.value.first = 0;
        lazyParams.value.page = 0;
        loadLazyData();
    }, 500);
};

const searchDepartment = (event: any) => {
    const query = event.query.toLowerCase();
    filteredDepartments.value = departmentStore.departments.filter(d =>
        d.name.toLowerCase().includes(query)
    );
};

// --- CRUD ---
const openNew = () => {
    form.value = {
        id: 0,
        name: '',
        default_permissions: []
    };
    selectedDepartmentObj.value = null; // Limpiar autocomplete
    submitted.value = false;
    isEditMode.value = false;
    positionDialog.value = true;
};

const editPosition = (pos: Position) => {
    form.value = {
        id: pos.id,
        name: pos.name,
        // Extraemos solo los IDs del array de objetos que manda el backend
        default_permissions: pos.default_permissions?.map(p => p.id) || []
    };

    // Mapear el departamento para el AutoComplete
    selectedDepartmentObj.value = departmentStore.departments.find(d => d.id === pos.department_id) || null;

    submitted.value = false;
    isEditMode.value = true;
    positionDialog.value = true;
};

const savePosition = async () => {
    submitted.value = true;

    // Extraemos el ID del objeto AutoComplete
    const finalDeptId = selectedDepartmentObj.value?.id;

    if (!form.value.name.trim() || !finalDeptId) return;

    const payload = {
        department_id: finalDeptId,
        name: form.value.name.trim(),
        default_permissions: form.value.default_permissions
    };

    try {
        if (isEditMode.value && form.value.id) {
            await positionStore.updatePosition(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Puesto actualizado', life: 3000 });
        } else {
            await positionStore.createPosition(payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Puesto creado', life: 3000 });
        }
        positionDialog.value = false;
        loadLazyData();
    } catch (e: any) {
        const errorMsg = e.response?.data?.message || 'No se pudo guardar el puesto.';
        toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 4000 });
    }
};

const confirmDelete = (pos: Position) => {
    selectedPositionToDelete.value = pos;
    deleteDialog.value = true;
};

const deletePosition = async () => {
    if (selectedPositionToDelete.value) {
        try {
            await positionStore.deletePosition(selectedPositionToDelete.value.id);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Puesto eliminado', life: 3000 });
            loadLazyData();
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se puede eliminar (tiene miembros asignados)', life: 5000 });
        } finally {
            deleteDialog.value = false;
            selectedPositionToDelete.value = null;
        }
    }
};
</script>

<template>
    <div class="w-full max-w-none p-4">

        <Toolbar class="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <template #start>
                <Button label="Nuevo Puesto" icon="pi pi-plus" class="bg-blue-600 hover:bg-blue-700 text-white mr-3"
                    @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="positionStore.positions" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="positionStore.totalRecords" :loading="positionStore.isLoading" @page="onPage" dataKey="id"
            class="shadow-sm border border-gray-200 rounded-lg overflow-hidden" :rowsPerPageOptions="[5, 10, 15, 25]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} puestos" stripedRows>

            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between p-2">
                    <h4 class="m-0 text-xl font-bold text-gray-800">Gestión de Puestos</h4>
                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search text-gray-500" />
                        </InputIcon>
                        <InputText v-model="searchValue" @input="onSearch" placeholder="Buscar puesto..."
                            class="border border-gray-300 rounded-md p-2 w-full md:w-64" />
                    </IconField>
                </div>
            </template>

            <Column header="#" style="width: 3rem">
                <template #body="slotProps"><span class="text-gray-500 font-mono">{{ lazyParams.page * lazyParams.rows +
                        slotProps.index + 1 }}</span></template>
            </Column>
            <Column field="name" header="Nombre del Puesto">
                <template #body="{ data }"><span class="font-bold text-gray-800">{{ data.name }}</span></template>
            </Column>
            <Column header="Departamento Asociado">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-sitemap text-gray-400 text-xs"></i>
                        <span class="text-sm text-gray-600">{{ getDepartmentName(data.department_id) }}</span>
                    </div>
                </template>
            </Column>
            <Column header="Accesos" style="width: 220px">
                <template #body="{ data }">
                    <div v-if="data.default_permissions && data.default_permissions.length > 0"
                        class="flex flex-wrap gap-2">
                        <Tag severity="info" class="px-2 py-1 text-[11px]">
                            <i class="pi pi-server mr-1"></i>
                            {{ getUniquePlatformsCount(data.default_permissions) }} PLATAFROMA(S)
                        </Tag>
                        <Tag severity="secondary"
                            class="px-2 py-1 text-[11px] bg-gray-100 text-gray-700 border border-gray-200">
                            <i class="pi pi-shield mr-1 text-gray-500"></i>
                            {{ data.default_permissions.length }} PERMISO(S)
                        </Tag>
                    </div>

                    <div v-else>
                        <Tag severity="warn" class="px-2 py-1 text-[11px]">
                            <i class="pi pi-exclamation-circle mr-1 text-orange-500"></i>
                            SIN ACCESOS ASIGNADOS
                        </Tag>

                    </div>
                </template>
            </Column>

            <Column field="created_at" header="Fecha Creación" style="width: 180px">
                <template #body="slotProps"><span class="text-sm text-gray-500">{{ formatDate(slotProps.data.created_at)
                        }}</span></template>
            </Column>
            <Column header="Acciones" style="width: 120px; text-align: right">
                <template #body="slotProps">
                    <div class="flex justify-end space-x-2">
                        <Button icon="pi pi-pencil" severity="info" class="p-button-rounded p-button-outlined"
                            @click="editPosition(slotProps.data)" v-tooltip.top="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger" class="p-button-rounded p-button-outlined"
                            @click="confirmDelete(slotProps.data)" v-tooltip.top="'Eliminar'" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog :header="isEditMode ? 'Editar Puesto' : 'Nuevo Puesto'" v-model:visible="positionDialog" modal
            class="w-full max-w-5xl" :draggable="false">


            <div class="flex flex-col md:flex-row gap-4 pb-6">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Departamento <span
                            class="text-red-500">*</span></label>
                    <AutoComplete v-model="selectedDepartmentObj" :suggestions="filteredDepartments"
                        @complete="searchDepartment" optionLabel="name" dropdown placeholder="Busca un departamento..."
                        class="w-full" :class="{ 'p-invalid': submitted && !selectedDepartmentObj }" />
                    <small v-if="submitted && !selectedDepartmentObj" class="text-red-500 block mt-1">Busca y selecciona
                        un
                        departamento.</small>
                </div>

                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Puesto <span
                            class="text-red-500">*</span></label>
                    <InputText v-model.trim="form.name" class="w-full" :class="{ 'p-invalid': submitted && !form.name }"
                        maxlength="100" placeholder="Ej. Gerente de Finanzas" />
                    <small v-if="submitted && !form.name" class="text-red-500 block mt-1">El nombre es
                        obligatorio.</small>
                </div>
            </div>

            <div class="pb-2 mb-2 font-semibold text-lg text-gray-700 flex items-center justify-between">
                <div class="flex items-center gap-2"><i class="pi pi-shield text-blue-600"></i>Permisos por Plataforma</div>
                 <Tag severity="success" class="px-2 py-1 mb-2">
                    <i class="pi pi-key mr-1"></i>
                    {{ form.default_permissions.length }} permisos asignados
                </Tag>
            </div>

            <div class="">
                <Tag severity="info" class="px-2 py-1 text-[11px] mb-2">
                    <i class="pi pi-info-circle mr-1"></i>
                    Asigna permisos por plataforma para este puesto. Esto determinará qué accesos tendrán los miembros
                    que se les asigne este puesto.
                </Tag>
            </div>

            <div class="flex flex-col">

                <div v-if="isLoadingCatalog" class="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <i class="pi pi-spin pi-spinner text-3xl mb-2"></i><span>Cargando catálogo...</span>
                </div>

                <Splitter v-else class="flex-1 border border-gray-200 rounded-lg shadow-inner overflow-hidden">

                    <SplitterPanel :size="40" :minSize="35" class="bg-gray-50 flex flex-col">
                        <div class="p-2 border-b border-gray-200 bg-white">
                            <IconField iconPosition="left">
                                <InputIcon><i class="pi pi-search text-gray-400 text-xs" /></InputIcon>
                                <InputText v-model="platformSearch" placeholder="Filtrar plataformas..."
                                    class="w-full text-xs p-1.5" />
                            </IconField>
                        </div>

                        <div class="flex-1 overflow-y-auto">
                            <div v-for="platform in filteredPlatforms" :key="platform.id"
                                @click="activePlatformId = platform.id"
                                class="p-3 border-b border-gray-100 cursor-pointer flex justify-between items-center transition-colors"
                                :class="activePlatformId === platform.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100'">

                                <span class="text-sm font-medium truncate"
                                    :class="activePlatformId === platform.id ? 'text-blue-800' : 'text-gray-700'">
                                    {{ platform.name }}
                                </span>

                                <Badge v-if="getSelectedCount(platform) > 0" :value="getSelectedCount(platform)"
                                    severity="info" class="text-[10px] shrink-0" />
                            </div>
                            <div v-if="filteredPlatforms.length === 0" class="p-4 text-center text-xs text-gray-400">
                                No se encontraron resultados.
                            </div>
                        </div>
                    </SplitterPanel>

                    <SplitterPanel :size="60" :minSize="45" class="p-5 overflow-y-auto bg-white">
                        <div v-if="activePlatform">
                            <h4
                                class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                                <i class="pi pi-server text-blue-500"></i> {{ activePlatform.name }}
                            </h4>

                            <div v-if="activePlatform.permissions && activePlatform.permissions.length > 0"
                                class="flex flex-col gap-3">
                                <div v-for="perm in activePlatform.permissions" :key="perm.id"
                                    class="flex items-start gap-3 bg-gray-50 p-3 rounded-md border border-gray-100 hover:border-blue-200 transition-colors">
                                    <Checkbox v-model="form.default_permissions" :inputId="'perm-' + perm.id"
                                        :value="perm.id" class="mt-0.5" />
                                    <label :for="'perm-' + perm.id"
                                        class="text-sm text-gray-700 cursor-pointer flex-1 select-none">
                                        <span class="font-bold block">{{ perm.name }}</span>
                                        <span v-if="perm.description" class="text-xs text-gray-500 block mt-1">{{
                                            perm.description }}</span>
                                    </label>
                                </div>
                            </div>

                            <div v-else
                                class="text-center p-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                                <i class="pi pi-shield text-3xl mb-2 text-gray-300"></i>
                                <p class="text-sm">Sin permisos configurables.</p>
                            </div>
                        </div>
                        <div v-else class="h-full flex items-center justify-center text-sm text-gray-400 italic">
                            Selecciona una plataforma en el menú lateral.
                        </div>
                    </SplitterPanel>
                </Splitter>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" text severity="secondary"
                        @click="positionDialog = false" />
                    <Button label="Guardar Puesto" icon="pi pi-check" @click="savePosition"
                        :loading="positionStore.isLoading" class="bg-blue-600 hover:bg-blue-700 text-white px-6" />
                </div>
            </template>
        </Dialog>

        <Dialog header="Confirmar Acción" v-model:visible="deleteDialog" modal class="w-full max-w-sm"
            :draggable="false">
            <div class="flex items-start space-x-4 pt-2">
                <i class="pi pi-exclamation-triangle text-4xl text-red-500"></i>
                <div class="flex flex-col">
                    <span class="text-gray-800 font-medium mb-1">¿Eliminar el puesto <b>{{
                            selectedPositionToDelete?.name
                            }}</b>?</span>
                    <span class="text-xs text-gray-500 mt-1">Asegúrate de que no tenga empleados asignados.</span>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <Button label="Cancelar" text severity="secondary" @click="deleteDialog = false" />
                    <Button label="Sí, Eliminar" severity="danger" icon="pi pi-trash" @click="deletePosition"
                        :loading="positionStore.isLoading" />
                </div>
            </template>
        </Dialog>
    </div>
</template>