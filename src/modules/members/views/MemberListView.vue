<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useMemberStore } from '../store/member.store';
import { memberService } from '../services/member.service';
import type { Member, CreateMemberPayload } from '../types/member.types';

import { listProperties, type Property } from '@/modules/properties/services/property.service';
import { useDepartmentStore } from '@/modules/department/store/department.store';
import { departmentService, listDepartments, type Department } from '@/modules/department/services/department.service';
import { positionService } from '@/modules/position/services/position.service';
import type { Position } from '@/modules/position/types/position.types';

// // PDF Y EXCEL export
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Componentes PrimeVue
import Tag from 'primevue/tag';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import Toolbar from 'primevue/toolbar';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import InputIcon from 'primevue/inputicon';
import IconField from 'primevue/iconfield';
import SelectButton from 'primevue/selectbutton';
import type { DataTablePageEvent } from 'primevue/datatable';
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete';
import AutoComplete from 'primevue/autocomplete';



const router = useRouter();
const memberStore = useMemberStore();
const departmentStore = useDepartmentStore();
const toast = useToast();

// --- ESTADOS PARA AUTOCOMPLETE ---

const selectedMemberObject = ref<Member | null>(null);
const filteredMembers = ref<Member[]>([]);

const selectedDepartmentObject = ref<any | null>(null);
const filteredDepartments = ref<any[]>([]);

// --- ESTADOS DE UI ---
const memberDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const isEditMode = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// --- VISTAS ---
const viewModeOptions = ref(['Pendientes IT', 'Activos', 'Bajas', 'Terminados']);
const viewMode = ref('Activos');

// --- DATOS ---
const properties = ref<Property[]>([]);
const availablePositions = ref<Position[]>([]); // Puestos dinámicos desde API
// Nuevos estados del ciclo de vida
const statusOptions = ref(['PENDIENTE_IT', 'ACTIVO', 'BAJA', 'TERMINADO']);
const selectedMemberToDelete = ref<Member | null>(null);

// --- FILTROS ---
const searchValue = ref('');
const filterProperty = ref<number | null>(null);
const filterDepartment = ref('');
const filterStatus = ref<string | null>(null);


// --- FORMULARIO DE MIEMBRO ---
const form = ref({
    id: 0,
    property_id: null as number | null,

    // IDs
    tm_id: '',
    hilton_id: '',

    // Nombres
    name: '',
    last_name: '',
    email: '',

    // Datos Corporativos 
    department_id: null as number | null, // Solo para UI, filtrar puestos
    position_id: null as number | null,   // Lo que se guarda realmente

    onq_id: '',
    // status: 'PENDING_IT', // Default inicial
    status: 'ACTIVO', // Default inicial
    // Detalles
    phone: '',
    notes: '',

    hire_date: null as Date | null,       // RH Inicio
    termination_date: null as Date | null,// RH Fin
    admission_date: null as Date | null,  // IT Inicio (Nuevo)
    hire_end_date: null as Date | null    // IT Fin (Nuevo)
});

// Paginación Server-Side
const lazyParams = ref({
    first: 0,
    rows: 15,
    page: 0
});

// --- LÓGICA DE PUESTOS DEPENDIENTES ---
watch(() => form.value.department_id, async (newDeptId) => {
    if (newDeptId) {
        try {
            availablePositions.value = await positionService.getListForSelect(newDeptId);
        } catch (error) {
            console.error("Error cargando puestos", error);
            availablePositions.value = [];
        }
    } else {
        availablePositions.value = [];
    }
});

// Resetear puesto si cambian depto manualmente
const onDepartmentChange = () => {
    form.value.position_id = null;
};

// --- CICLO DE VIDA ---
onMounted(async () => {
    try {
        await Promise.all([
            properties.value = await listProperties(),
            departmentStore.fetchDepartments(1, 100), // Cargar Deptos para el select
            memberStore.fetchStats(),
        ]);
        filterStatus.value = 'ACTIVO';
        loadLazyData();
    } catch (e) {
        console.error(e);
    }
});

// --- LÓGICA DE CARGA DE DATOS ---
const loadLazyData = () => {
    const page = lazyParams.value.page + 1;

    memberStore.fetchMembers(
        page,
        lazyParams.value.rows,
        searchValue.value,
        filterProperty.value || undefined,
        filterDepartment.value || undefined,
        filterStatus.value || undefined
    );
};

const onPage = (event: DataTablePageEvent) => {
    lazyParams.value = event;
    loadLazyData();
};

// --- CAMBIO DE MODO
const toggleViewMode = () => {
    lazyParams.value.first = 0;
    lazyParams.value.page = 0;

    searchValue.value = '';
    filterDepartment.value = '';

    switch (viewMode.value) {
        case 'Pendientes IT':
            filterStatus.value = 'PENDIENTE_IT';
            break;
        case 'Activos':
            filterStatus.value = 'ACTIVO';
            break;
        case 'Bajas':
            filterStatus.value = 'BAJA';
            break;
        case 'Terminados':
            filterStatus.value = 'TERMINADO';
            break;
        default:
            filterStatus.value = 'ACTIVO';
    }

    loadLazyData();
};

// Búsqueda de miembros (Server Side)
const searchMember = async (event: AutoCompleteCompleteEvent) => {
    const query = event.query ? event.query.trim() : '';
    try {
        const response = await memberService.getAll(
            1,
            20,
            query || '',
            filterProperty.value || undefined,
            filterDepartment.value || undefined,
            filterStatus.value || undefined
        );
        filteredMembers.value = response.data;
    } catch (error) {
        console.error('Error buscando miembros:', error);
        filteredMembers.value = [];
    }
};

// Búsqueda de Departamentos (Server Side)

const searchDepartment = async (event: AutoCompleteCompleteEvent) => {
    const query = event.query.trim();
    if (!query) return;
    try {
        const response = await departmentService.getAll(1, 20, query);
        filteredDepartments.value = response.data;
    } catch (e) {
        console.error("Error buscando departamento", e);
    }
};


// --- REACTIVIDAD PARA EL BUSCADOR DE MIEMBROS ---
watch(selectedMemberObject, (newValue) => {
    if (newValue) {
        if (typeof newValue === 'object' && newValue !== null) {
            const validEmail = newValue.email && newValue.email !== '-' ? newValue.email : null;
            searchValue.value = validEmail || newValue.name;
        }
        else if (typeof newValue === 'string') {
            searchValue.value = newValue;
        }
    } else {
        searchValue.value = '';
    }
    onFilterChange();
});

watch(selectedDepartmentObject, (newValue) => {
    if (newValue) {
        filterDepartment.value = newValue.name;
    } else {
        filterDepartment.value = '';
    }
    onFilterChange();
});

let searchTimeout: ReturnType<typeof setTimeout>;
const onFilterChange = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        lazyParams.value.first = 0;
        lazyParams.value.page = 0;
        loadLazyData();
    }, 500);
};


// --- IMPORTACIÓN MASIVA EXCEL ---
const handleFileUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    toast.add({ severity: 'info', summary: 'Procesando...', detail: 'Validando archivo...', life: 2000 });

    const formData = new FormData();
    formData.append('file', file);

    try {
        await memberStore.importMembers(file);
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Importación completada sin errores', life: 3000 });
        loadLazyData();
    } catch (e: any) {
        console.error("Error importación:", e);

        const errors = e.response?.data?.errors;

        if (Array.isArray(errors) && errors.length > 0) {
            const flatErrors = errors.flat().slice(0, 3);

            flatErrors.forEach((errMsg: string) => {
                toast.add({
                    severity: 'error',
                    summary: 'Error en Excel',
                    detail: errMsg,
                    life: 8000
                });
            });

            if (errors.flat().length > 3) {
                toast.add({ severity: 'warn', summary: 'Y más errores...', detail: 'Revisa el formato del archivo completo.', life: 5000 });
            }

        } else if (e.response?.data?.message) {
            // Caso: Error general (ej. archivo corrupto)
            toast.add({ severity: 'error', summary: 'Error', detail: e.response.data.message, life: 5000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al importar. Verifica el archivo.', life: 5000 });
        }
    } finally {
        if (fileInput.value) fileInput.value.value = '';
    }
};

const triggerFileInput = () => {
    fileInput.value?.click();
};

// --- NAVEGACIÓN AL DETALLE ---
const goToDetail = (id: number) => {
    router.push({ name: 'MemberDetail', params: { id } });
};

// --- EXPORTACIONES ---

const fetchAllForExport = async () => {
    const response = await memberService.getAll(1, 1000, searchValue.value, filterProperty.value || undefined, filterDepartment.value || undefined, filterStatus.value || undefined);
    return response.data;
};

const exportCSV = async () => {
    const data = await fetchAllForExport();
    const exportData = data.map((m: Member) => ({
        'TM ID': m.tm_id,
        'Hilton ID': m.hilton_id,
        'Nombre': m.full_name,
        'Email': m.email,
        'Propiedad': m.property?.name || 'Sin Asignar',
        'Departamento': m.corporate_info.department || '-',
        'Puesto': m.corporate_info.position || '-',
        'Estado': m.status,
        'OnQ ID': m.corporate_info.onq_id || '-',
        'Teléfono': m.details?.phone || '-',
        'Fecha Alta RH': m.hire_date || '-',
        'Fecha Admisión IT': m.admission_date || '-', // Nuevo dato relevante
        'Fecha Baja RH': m.termination_date || '-',
        'Fecha Baja IT': m.hire_end_date || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Miembros");
    XLSX.writeFile(workbook, "Directorio_Miembros.xlsx");
};

const exportPDF = async () => {
    const data = await fetchAllForExport();
    const doc = new jsPDF();

    const columns = [
        { header: 'TM ID', dataKey: 'tm_id' },
        { header: 'Hilton ID', dataKey: 'hilton_id' },
        { header: 'Nombre Completo', dataKey: 'full_name' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Propiedad', dataKey: 'property' },
        { header: 'Departamento', dataKey: 'department' },
        { header: 'Puesto', dataKey: 'position' },
        { header: 'Estado', dataKey: 'status' },
        { header: 'Fecha Alta RH', dataKey: 'hire_date' },
        { header: 'Fecha Admisión IT', dataKey: 'admission_date' }, // Nuevo
        { header: 'Fecha Baja RH', dataKey: 'termination_date' },
        { header: 'Fecha Baja IT', dataKey: 'hire_end_date' }
    ];

    const rows = data.map((m: Member) => ({

        tm_id: m.tm_id || '-',
        hilton_id: m.hilton_id || '-',
        full_name: m.full_name,
        email: m.email || '-',
        property: m.property?.name || 'Sin Asignar',
        department: m.corporate_info.department || '-',
        position: m.corporate_info.position || '-',
        status: m.status,
        hire_date: m.hire_date ? new Date(m.hire_date + 'T12:00:00').toLocaleDateString('es-MX') : '-',
        admission_date: m.admission_date ? new Date(m.admission_date + 'T12:00:00').toLocaleDateString('es-MX') : '-',
        termination_date: m.termination_date ? new Date(m.termination_date + 'T12:00:00').toLocaleDateString('es-MX') : '-',
        hire_end_date: m.hire_end_date ? new Date(m.hire_end_date + 'T12:00:00').toLocaleDateString('es-MX') : '-'

    }));

    autoTable(doc, {
        columns: columns,
        body: rows,
        margin: { top: 20 },
        styles: { fontSize: 7 },
        headStyles: { fillColor: [41, 128, 185] },
        didDrawPage: (data: any) => {
            doc.text('Reporte de Miembros', 14, 15);
        }
    });
    doc.save('Directorio_Miembros.pdf');
};

// --- ACCIONES CRUD ---

// 1. ABRIR CREAR
const openNew = () => {
    form.value = {
        id: 0,
        property_id: null,
        tm_id: '', hilton_id: '',
        name: '', last_name: '',
        email: '',

        department_id: null,
        position_id: null,
        onq_id: '',
        status: '',

        phone: '', notes: '',
        hire_date: null, termination_date: null,
        admission_date: null, hire_end_date: null
    };
    submitted.value = false;
    isEditMode.value = false;
    memberDialog.value = true;
};

// 2. ABRIR EDITAR 
const editMember = async (member: Member) => {

    // Detectamos el departamento desde la relación position_details del backend
    const deptId = member.position_details?.department_id || null;

    // Precargamos los puestos de ese departamento
    if (deptId) {
        availablePositions.value = await positionService.getListForSelect(deptId);
    }

    form.value = {
        id: member.id,
        property_id: member.property_id,

        tm_id: member.tm_id || '',
        hilton_id: member.hilton_id || '',

        name: member.name,
        last_name: member.last_name,
        email: member.email || '',

        department_id: deptId,
        position_id: member.position_id, // ID numérico

        onq_id: member.corporate_info.onq_id || '',
        status: member.status,

        // Detalles
        phone: member.details?.phone || '',
        notes: member.details?.notes || '',

        hire_date: member.hire_date ? new Date(member.hire_date + 'T12:00:00') : null,
        termination_date: member.termination_date ? new Date(member.termination_date + 'T12:00:00') : null,
        admission_date: member.admission_date ? new Date(member.admission_date + 'T12:00:00') : null,
        hire_end_date: member.hire_end_date ? new Date(member.hire_end_date + 'T12:00:00') : null
    };

    submitted.value = false;
    isEditMode.value = true;
    memberDialog.value = true;
};

// 3. GUARDAR 
const saveMember = async () => {
    submitted.value = true;
    if (!form.value.name.trim() || !form.value.last_name.trim() || !form.value.property_id) return;

    const payload: CreateMemberPayload = {
        property_id: form.value.property_id,
        position_id: form.value.position_id, // Enviamos el ID del puesto

        tm_id: form.value.tm_id,
        hilton_id: form.value.hilton_id,
        name: form.value.name,
        last_name: form.value.last_name,
        email: form.value.email,
        onq_id: form.value.onq_id,
        // status: form.value.status,

        // Date Object -> YYYY-MM-DD
        hire_date: form.value.hire_date ? form.value.hire_date.toISOString().split('T')[0] : null,
        termination_date: form.value.termination_date ? form.value.termination_date.toISOString().split('T')[0] : null,
        admission_date: form.value.admission_date ? form.value.admission_date.toISOString().split('T')[0] : null,
        hire_end_date: form.value.hire_end_date ? form.value.hire_end_date.toISOString().split('T')[0] : null,

        details: {
            phone: form.value.phone,
            notes: form.value.notes,
        }
    };

    try {
        if (isEditMode.value && form.value.id) {
            await memberStore.updateMember(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Miembro actualizado', life: 3000 });
        } else {
            await memberStore.createMember(payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Miembro creado', life: 3000 });
        }
        memberDialog.value = false;
        loadLazyData();
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el miembro', life: 5000 });
    }
};

// 4. CONFIRMAR ELIMINAR
const confirmDelete = (member: Member) => {
    selectedMemberToDelete.value = member;
    deleteDialog.value = true;
};

// 5. EJECUTAR ELIMINACIÓN
const deleteMember = async () => {
    if (selectedMemberToDelete.value) {
        await memberStore.deleteMember(selectedMemberToDelete.value.id);
        deleteDialog.value = false;
        selectedMemberToDelete.value = null;
        loadLazyData();
        toast.add({ severity: 'success', summary: 'Éxito, Baja Procesada', detail: 'Eliminado correctamente', life: 3000 });
    }
};

// 6. ACCIÓN ADICIONAL: ADMITIR EN IT
const admitMember = async (member: Member) => {
    await memberStore.admitMemberIT(member.id);
    toast.add({ severity: 'success', summary: 'Admitido', detail: 'Usuario activo en ITAM', life: 3000 });
    loadLazyData();
};

// --- HELPERS VISUALES ---
const getSeverity = (status: string) => {
    switch (status) {
        case 'ACTIVO': return 'success';
        case 'BAJA': return 'danger';
        case 'PENDIENTE_IT': return 'warn';
        case 'TERMINADO': return 'secondary'; // Gris para terminados
        default: return 'info';
    }
};

const getHeaderTitle = (mode: string) => {
    const titles: Record<string, string> = {
        'Pendientes IT': 'Pendientes de Ingreso a Sistemas',
        'Activos': 'Directorio de Personal Activo',
        'Bajas': 'Personal en Proceso de Baja',
        'Terminados': 'Histórico de Personal Inactivo'
    };
    return titles[mode] || 'Directorio';
};

const getHeaderIcon = (mode: string) => {
    const icons: Record<string, string> = {
        'Pendientes IT': 'pi pi-clock text-orange-500',
        'Activos': 'pi pi-users text-blue-500',
        'Bajas': 'pi pi-user-minus text-red-500',
        'Terminados': 'pi pi-folder-open text-gray-500'
    };
    return icons[mode] || 'pi pi-users text-blue-500';
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString + 'T12:00:00').toLocaleDateString('es-MX');
};

</script>

<template>
    <div class="w-full max-w-none p-4">

        <div class="flex justify-center mb-6">
            <SelectButton v-model="viewMode" :options="viewModeOptions" @change="toggleViewMode" />
        </div>

        <div class="bg-white p-4 rounded-xl shadow-sm  mb-6 flex flex-col gap-4">
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                <Button label="Nuevo Miembro" icon="pi pi-plus"
                    class="bg-blue-600 hover:bg-blue-700 text-white border-none w-full sm:w-auto px-5" @click="openNew"
                    :disabled="viewMode === 'Bajas' || viewMode === 'Terminados'" />

                <div class="flex items-center justify-center gap-1 p-1.5 rounded-lg  w-full sm:w-auto">
                    
                    <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileUpload" style="display: none;" />
                    
                    <Button icon="pi pi-upload" severity="secondary" text 
                        v-tooltip.top="'Importar Excel'" class="hover:bg-purple-50 text-purple-600 w-10 h-10 p-0" 
                        @click="triggerFileInput" />

                    <div class="w-px h-5 bg-gray-300 mx-1"></div>

                    <Button icon="pi pi-file-excel" severity="success" text 
                        v-tooltip.top="'Descargar Excel'" class="w-10 h-10 p-0" @click="exportCSV" />
                    
                    <Button icon="pi pi-file-pdf" severity="danger" text 
                        v-tooltip.top="'Descargar PDF'" class="w-10 h-10 p-0" @click="exportPDF" />
                    
                    <div class="w-px h-5 bg-gray-300 mx-1"></div>

                    <Button icon="pi pi-refresh" severity="secondary" text 
                        v-tooltip.top="'Recargar Datos'" class="w-10 h-10 p-0 text-gray-600" @click="loadLazyData" />
                </div>
            </div>

            <hr class="border-gray-100 m-0" />

            <div class="flex flex-col lg:flex-row items-center gap-3 w-full">
                
                <div class="w-full lg:flex-1">
                    <AutoComplete v-model="selectedMemberObject" :suggestions="filteredMembers" optionLabel="full_name"
                        placeholder="Buscar colaborador por nombre..." class="w-full" inputClass="w-full pl-10" 
                        @complete="searchMember" showClear>
                        
                        <i class="pi pi-search absolute left-3 top-2/4 -translate-y-1/2 text-gray-400 z-10"></i>

                        <template #option="slotProps">
                            <div class="flex items-center gap-3 p-1">
                                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {{ slotProps.option.name?.charAt(0) || '' }}{{ slotProps.option.last_name?.charAt(0) || '' }}
                                </div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-gray-800 text-sm">{{ slotProps.option.full_name }}</span>
                                    <span class="text-[10px] text-gray-500 uppercase">{{ slotProps.option.corporate_info?.position || 'Sin puesto' }}</span>
                                </div>
                            </div>
                        </template>
                    </AutoComplete>
                </div>

                <div class="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                    
                    <Select v-model="filterProperty" :options="properties" optionLabel="name" optionValue="id"
                        placeholder="Todos los Hoteles" class="w-full sm:w-56" showClear filter
                        @change="onFilterChange" />

                    <AutoComplete v-model="selectedDepartmentObject" :suggestions="filteredDepartments"
                        optionLabel="name" placeholder="Departamento..." class="w-full sm:w-64"
                        @complete="searchDepartment" showClear dropdown>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-sitemap text-gray-400"></i>
                                <span class="font-medium text-gray-700">{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                    </AutoComplete>
                </div>

            </div>
        </div>
        <!-- <Toolbar class="mb-4 shadow-sm border-gray-200">
            <template #start>

                <div class="flex flex-wrap items-center gap-3">
                    <Button label="Nuevo Miembro" icon="pi pi-plus"
                        class="bg-blue-600 hover:bg-blue-700 text-white border-none" @click="openNew"
                        :disabled="viewMode === 'Bajas' || viewMode === 'Terminados'" />
                    <span class="text-gray-300">|</span>

                    <Select v-model="filterProperty" :options="properties" optionLabel="name" optionValue="id"
                        placeholder="Filtrar por Propiedad" class="w-48 sm:w-60" showClear filter
                        @change="onFilterChange" />

                    <AutoComplete v-model="selectedMemberObject" :suggestions="filteredMembers" optionLabel="full_name"
                        placeholder="Buscar colaborador específico..." class="w-full sm:w-80" @complete="searchMember"
                        showClear dropdown>

                        <template #option="slotProps">
                            <div class="flex items-center gap-3 p-1">
                                <div class="flex flex-col">
                                    <span class="font-bold text-gray-800 text-sm">{{ slotProps.option.full_name
                                        }}</span>
                                    <span class="text-[10px] text-gray-500 uppercase">{{
                                        slotProps.option.corporate_info?.position || 'Sin puesto' }}</span>
                                </div>
                            </div>
                        </template>
                    </AutoComplete>

                    <AutoComplete v-model="selectedDepartmentObject" :suggestions="filteredDepartments"
                        optionLabel="name" placeholder="Buscar Departamento..." class="w-full sm:w-64"
                        @complete="searchDepartment" showClear dropdown>
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-sitemap text-gray-400"></i>
                                <span class="font-medium text-gray-700">{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                    </AutoComplete>
                </div>
            </template>

            <template #end>

                <div class="flex items-center gap-2">
                    <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileUpload"
                        style="display: none;" />

                    <Button icon="pi pi-upload" severity="help" text rounded v-tooltip.top="'Importar Excel'"
                        class="hover:bg-purple-50 text-purple-600" @click="triggerFileInput" />

                    <span class="text-gray-300 mx-1">|</span>

                    <Button icon="pi pi-file-excel" severity="success" text rounded @click="exportCSV" />
                    <Button icon="pi pi-file-pdf" severity="danger" text rounded @click="exportPDF" />
                    <Button icon="pi pi-refresh" text rounded @click="loadLazyData" />
                </div>

            </template>
        </Toolbar> -->

        <DataTable :value="memberStore.members" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="memberStore.totalRecords" :loading="memberStore.isLoading" @page="onPage"
            class="shadow-md rounded-lg overflow-hidden" :rowsPerPageOptions="[5, 10, 15, 25, 50]" dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} miembros" stripedRows removableSort>

            <template #header>
                <div class="flex flex-wrap justify-between items-center gap-3 p-2">

                    <h4 class="text-xl font-bold text-gray-800 m-0 flex items-center gap-2">
                        <i :class="getHeaderIcon(viewMode)"></i>
                        {{ getHeaderTitle(viewMode) }}
                    </h4>

                </div>
            </template>

            <Column header="#" style="width: 3rem">
                <template #body="slotProps">
                    <span class="text-gray-500 font-mono font-semibold">
                        {{ lazyParams.page * lazyParams.rows + slotProps.index + 1 }}
                    </span>
                </template>
            </Column>

            <Column header="IDs" style="min-width: 120px">
                <template #body="slotProps">
                    <div class="flex flex-col gap-1">
                        <div v-if="slotProps.data.tm_id">
                            <span class="text-xs font-bold text-gray-400 w-6 inline-block">TM:</span>
                            <span class="font-mono text-sm text-gray-700">{{ slotProps.data.tm_id }}</span>
                        </div>
                        <div v-if="slotProps.data.hilton_id">
                            <span class="text-xs font-bold text-blue-400 w-6 inline-block">RH:</span>
                            <span class="font-mono text-sm text-blue-700">{{ slotProps.data.hilton_id }}</span>
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="full_name" header="Nombre Completo" sortable frozen style="min-width: 220px">
                <template #body="slotProps">
                    <a href="#" @click.prevent="goToDetail(slotProps.data.id)"
                        class="text-blue-700 text-sm font-bold hover:text-blue-600 hover:underline flex items-center gap-2">
                        {{ slotProps.data.full_name }}
                        <i class="pi pi-external-link text-[10px] opacity-50"></i>
                    </a>
                    <div class="text-xs text-gray-500">{{ slotProps.data.email }}</div>
                </template>
            </Column>

            <Column header="Propiedad" style="min-width: 200px">
                <template #body="slotProps">
                    <div v-if="slotProps.data.property" class="flex items-center gap-2 text-gray-700">
                        <i class="pi pi-building text-gray-400"></i>
                        <span class="font-medium text-sm">{{ slotProps.data.property.name }}</span>
                    </div>
                    <span v-else class="text-red-400 italic text-xs">Sin Asignar</span>
                </template>
            </Column>

            <Column header="Departamento" style="min-width: 150px">
                <template #body="slotProps">
                    <span class="text-sm">
                        {{ slotProps.data.corporate_info.department || '-' }}
                    </span>
                </template>
            </Column>

            <Column header="Puesto" style="min-width: 200px">
                <template #body="slotProps">
                    <span class="text-sm">
                        {{ slotProps.data.corporate_info.position || '-' }}
                    </span>
                </template>
            </Column>

            <Column field="status" header="Estado">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)"
                        class=" font-bold px-2 uppercase" />
                </template>
            </Column>

            <Column header="Contratación (RH)" style="min-width: 140px">
                <template #body="slotProps">
                    <span class="text-blue-700 font-medium text-sm">
                        <i class="pi pi-calendar-plus text-xs mr-1"></i>
                        {{ formatDate(slotProps.data.hire_date) }}
                    </span>
                </template>
            </Column>

            <Column v-if="viewMode !== 'Pendientes IT'" header="Ingreso Sistemas (IT)" style="min-width: 140px">
                <template #body="slotProps">
                    <span
                        :class="slotProps.data.admission_date ? 'text-emerald-700 font-medium text-sm' : 'text-gray-400 italic text-xs'">
                        <i v-if="slotProps.data.admission_date" class="pi pi-calendar-plus text-xs mr-1"></i>
                        {{ slotProps.data.admission_date ? formatDate(slotProps.data.admission_date) : 'Sin registro IT'
                        }}
                    </span>
                </template>
            </Column>

            <Column v-if="viewMode === 'Bajas' || viewMode === 'Terminados'" header="Baja Técnica (IT)"
                style="min-width: 140px">
                <template #body="slotProps">
                    <span
                        :class="slotProps.data.termination_date ? 'text-red-600 font-medium text-sm' : 'text-gray-400 italic text-xs'">
                        <i v-if="slotProps.data.termination_date" class="pi pi-calendar-times text-xs mr-1"></i>
                        {{ slotProps.data.termination_date ? formatDate(slotProps.data.termination_date) : 'Pendiente'
                        }}
                    </span>
                </template>
            </Column>

            <Column v-if="viewMode === 'Bajas' || viewMode === 'Terminados'" header="Fin Contrato (RH)"
                style="min-width: 140px">
                <template #body="slotProps">
                    <span
                        :class="slotProps.data.hire_end_date ? 'text-orange-600 font-medium text-sm' : 'text-gray-400 italic text-xs'">
                        <i v-if="slotProps.data.hire_end_date" class="pi pi-calendar-times text-xs mr-1"></i>
                        {{ slotProps.data.hire_end_date ? formatDate(slotProps.data.hire_end_date) : 'Pendiente' }}
                    </span>
                </template>
            </Column>


            <Column header="Acciones" style="min-width: 140px" alignFrozen="right" frozen>
                <template #body="slotProps">
                    <div class="flex gap-2">

                        <Button v-if="slotProps.data.status === 'PENDING_IT'" icon="pi pi-check-circle"
                            severity="success" class="p-button-rounded p-button-outlined"
                            @click="admitMember(slotProps.data)" v-tooltip.top="'Admitir en Sistemas'" />

                        <Button icon="pi pi-user-edit" severity="info" class="p-button-rounded p-button-outlined"
                            @click="editMember(slotProps.data)" v-tooltip.top="'Ver Expediente / Editar'" />

                        <Button
                            v-if="slotProps.data.status === 'ACTIVO' || (slotProps.data.status === 'BAJA' && !slotProps.data.termination_date)"
                            icon="pi pi-user-minus" severity="danger" class="p-button-rounded p-button-outlined"
                            @click="confirmDelete(slotProps.data)" v-tooltip.top="'Registrar Baja Técnica (IT)'" />
                    </div>
                </template>
            </Column>

        </DataTable>

        <Dialog v-model:visible="memberDialog" :header="isEditMode ? 'Editar Miembro' : 'Nuevo Miembro'" modal
            class="w-full max-w-4xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2">
                    <span class="text-gray-600 font-bold text-lg"><i class="pi pi-id-card mr-2"></i>Datos
                        Generales</span>
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Propiedad <span
                            class="text-red-500">*</span></label>
                    <Select v-model="form.property_id" :options="properties" optionLabel="name" optionValue="id"
                        placeholder="Seleccionar Hotel" class="w-full" filter />
                    <small v-if="submitted && !form.property_id" class="text-red-500">Requerido.</small>
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Estado</label>
                    <Select v-model="form.status" :options="statusOptions" class="w-full" />
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Nombre(s) <span
                            class="text-red-500">*</span></label>
                    <InputText v-model="form.name" class="w-full" />
                    <small v-if="submitted && !form.name" class="text-red-500">Requerido.</small>
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Apellido(s) <span
                            class="text-red-500">*</span></label>
                    <InputText v-model="form.last_name" class="w-full" />
                    <small v-if="submitted && !form.last_name" class="text-red-500">Requerido.</small>
                </div>

                <div class="col-span-1 md:col-span-2">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Email</label>
                    <InputText v-model="form.email" class="w-full" />
                </div>

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4">
                    <span class="text-gray-600 font-bold text-lg"><i class="pi pi-briefcase mr-2"></i>Datos
                        Corporativos</span>
                </div>

                <div><label class="text-sm block mb-1 font-medium">Número de Team Member</label>
                    <InputText v-model="form.tm_id" class="w-full" />
                </div>
                <div><label class="text-sm block mb-1 font-medium ">Hilton ID</label>
                    <InputText v-model="form.hilton_id" class="w-full" />
                </div>

                <div><label class="text-sm block mb-1 font-medium">User OnQ</label>
                    <InputText v-model="form.onq_id" class="w-full" />
                </div>

                <div>
                    <label class="text-sm block mb-1 font-medium text-gray-700">Departamento</label>
                    <Select v-model="form.department_id" :options="departmentStore.departments" optionLabel="name"
                        optionValue="id" placeholder="Selecciona un departamento" class="w-full" filter showClear
                        @change="onDepartmentChange" />
                </div>

                <div>
                    <label class="text-sm block mb-1 font-medium text-gray-700">Puesto</label>
                    <Select v-model="form.position_id" :options="availablePositions" optionLabel="name" optionValue="id"
                        :disabled="!form.department_id" placeholder="Selecciona un puesto" class="w-full" filter
                        showClear
                        :emptyMessage="form.department_id ? 'No hay puestos registrados' : 'Selecciona depto primero'" />
                </div>

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4">
                    <span class="text-gray-600 font-bold text-lg"><i class="pi pi-list mr-2"></i>Detalles
                        Adicionales</span>
                </div>


                <div class="col-span-1 p-3 bg-blue-50 rounded border border-blue-100">
                    <label class="text-xs font-bold text-blue-700 block mb-1 uppercase">RH: Inicio Contrato</label>
                    <Calendar v-model="form.hire_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>
                <div class="col-span-1 p-3 bg-red-50 rounded border border-red-100">
                    <label class="text-xs font-bold text-red-700 block mb-1 uppercase">RH: Fin Contrato</label>
                    <Calendar v-model="form.termination_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>

                <div class="col-span-1 p-3 bg-green-50 rounded border border-green-100">
                    <label class="text-xs font-bold text-green-700 block mb-1 uppercase">IT: Ingreso al Sistema</label>
                    <Calendar v-model="form.admission_date" showIcon dateFormat="yy-mm-dd" class="w-full"
                        placeholder="Automático al admitir" />
                </div>
                <div class="col-span-1 p-3 bg-orange-50 rounded border border-orange-100">
                    <label class="text-xs font-bold text-orange-700 block mb-1 uppercase">IT: Baja Técnica</label>
                    <Calendar v-model="form.hire_end_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>


                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4">
                    <span class="text-gray-600 font-bold text-lg"><i class="pi pi-list mr-2"></i>Detalles
                        Adicionales</span>
                </div>

                <div>
                    <label class="text-sm block mb-1 font-medium">Teléfono</label>
                    <InputText v-model="form.phone" class="w-full" placeholder="+52..." />
                </div>

                <div class="col-span-1 md:col-span-2">
                    <label class="text-sm block mb-1 font-medium">Comentarios</label>
                    <Textarea v-model="form.notes" rows="2" class="w-full" autoResize />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" text @click="memberDialog = false"
                        class="text-gray-500" />
                    <Button label="Guardar" icon="pi pi-check" @click="saveMember" :loading="memberStore.isLoading"
                        class="bg-blue-600 text-white border-none hover:bg-blue-700" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" header="Confirmar Baja Técnica" modal class="w-96">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
                <div class="text-gray-700 leading-relaxed">
                    <p>¿Procesar la baja del sistema IT de <b>{{ selectedMemberToDelete?.full_name }}</b>?</p>
                    <p class="text-xs text-gray-500 mt-1">
                        Se registrará la fecha de cierre técnico hoy. El estado cambiará a BAJA o TERMINADO según
                        corresponda.
                    </p>
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" text @click="deleteDialog = false" />
                <Button label="Confirmar Baja" severity="warning" icon="pi pi-check" @click="deleteMember"
                    :loading="memberStore.isLoading" />
            </template>
        </Dialog>

    </div>
</template>