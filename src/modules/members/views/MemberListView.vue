<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useMemberStore } from '../store/member.store';
import { memberService } from '../services/member.service';
import type { Member, CreateMemberPayload } from '../types/member.types';
import { ORGANIZATION_CHART, DEPARTMENTS_LIST } from '@/data/organization.data';
import { listProperties, type Property } from '@/modules/properties/services/property.service';

// PDF Y EXCEL export
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

const router = useRouter();
const memberStore = useMemberStore();
const toast = useToast();

// --- ESTADOS DE UI ---
const memberDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const isEditMode = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// --- VISTA: DIRECTORIO vs BAJAS ---
const viewModeOptions = ref(['Directorio', 'Bajas']);
const viewMode = ref('Directorio');

// --- DATOS ---
const properties = ref<Property[]>([]);
const statusOptions = ref(['ACTIVO', 'BAJA', 'TERMINADO']);
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
    position: '',
    department: '',
    onq_id: '',

    status: 'ACTIVO',

    // Detalles
    phone: '',
    notes: '',

    hire_date: null as Date | null,
    termination_date: null as Date | null
});

// Paginación Server-Side
const lazyParams = ref({
    first: 0,
    rows: 15,
    page: 0
});

// --- LÓGICA DE PUESTOS DEPENDIENTES ---

const availablePositions = computed(() => {
    const selectedDept = form.value.department;
    if (!selectedDept || !ORGANIZATION_CHART[selectedDept]) {
        return [];
    }
    return ORGANIZATION_CHART[selectedDept].sort();
});

const onDepartmentChange = () => {
    form.value.position = '';
};

// --- CICLO DE VIDA ---
onMounted(async () => {
    try {
        await Promise.all([
            properties.value = await listProperties(),
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

    let statusToSend = filterStatus.value;

    if (viewMode.value === 'Bajas') {
        statusToSend = 'BAJA';
    } else if (!statusToSend) {
        // Si no hay filtro específico en modo Directorio, excluimos Bajas (o mostramos solo Activos)
        statusToSend = 'ACTIVO';
    }

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

// --- CAMBIO DE MODO (Activos <-> Bajas) ---
const toggleViewMode = () => {
    lazyParams.value.first = 0;
    lazyParams.value.page = 0;

    searchValue.value = '';
    filterDepartment.value = '';

    if (viewMode.value === 'Bajas') {
        filterStatus.value = 'BAJA';
    } else {
        filterStatus.value = 'ACTIVO';
    }
    loadLazyData();
};

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

    // 1. Feedback inicial
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
            // Fallback
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
        'Fecha Alta': m.hire_date || '-',
        'Fecha Baja': m.termination_date || '-'
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
        { header: 'Nombre', dataKey: 'full_name' },
        { header: 'Propiedad', dataKey: 'property' },
        { header: 'Depto', dataKey: 'department' },
        { header: 'Puesto', dataKey: 'position' },
        { header: 'Estado', dataKey: 'status' },
        { header: 'Alta', dataKey: 'hire_date' },
        { header: 'Baja', dataKey: 'termination_date' }
    ];

    const rows = data.map((m: Member) => ({
        tm_id: m.tm_id,
        hilton_id: m.hilton_id,
        full_name: m.full_name,
        property: m.property?.name || 'N/A',
        department: m.corporate_info.department || '-',
        position: m.corporate_info.position || '-',
        status: m.status,
        hire_date: m.hire_date || '-',
        termination_date: m.termination_date || '-'
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
        position: '', department: '', onq_id: '',
        status: 'ACTIVO',
        phone: '', notes: '', hire_date: null,
        termination_date: null
    };
    submitted.value = false;
    isEditMode.value = false;
    memberDialog.value = true;
};

// 2. ABRIR EDITAR 
const editMember = (member: Member) => {
    form.value = {
        id: member.id,
        property_id: member.property_id,

        tm_id: member.tm_id || '',
        hilton_id: member.hilton_id || '',

        name: member.name,
        last_name: member.last_name,

        email: member.email || '',

        position: member.corporate_info.position || '',
        department: member.corporate_info.department || '',
        onq_id: member.corporate_info.onq_id || '',

        status: member.status,

        // Detalles
        phone: member.details?.phone || '',
        notes: member.details?.notes || '',

        hire_date: member.hire_date ? new Date(member.hire_date + 'T12:00:00') : null,
        termination_date: member.termination_date ? new Date(member.termination_date + 'T12:00:00') : null
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

        tm_id: form.value.tm_id,
        hilton_id: form.value.hilton_id,

        name: form.value.name,
        last_name: form.value.last_name,

        email: form.value.email,

        position: form.value.position,
        department: form.value.department,
        onq_id: form.value.onq_id,

        status: form.value.status,

        // Date Object -> YYYY-MM-DD
        hire_date: form.value.hire_date ? form.value.hire_date.toISOString().split('T')[0] : null,
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

// --- HELPERS VISUALES ---
const getSeverity = (status: string) => {
    switch (status) {
        case 'ACTIVO': return 'success';
        case 'BAJA': return 'danger';
        case 'TERMINADO': return 'warn';
        default: return 'info';
    }
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

        <Toolbar class="mb-4 shadow-sm border-gray-200">
            <template #start>

                <div class="flex flex-wrap items-center gap-3">
                    <Button label="Nuevo Miembro" icon="pi pi-plus"
                        class="bg-blue-600 hover:bg-blue-700 text-white border-none" @click="openNew"
                        :disabled="viewMode === 'Bajas'" />
                    <span class="text-gray-300">|</span>

                    <Select v-model="filterProperty" :options="properties" optionLabel="name" optionValue="id"
                        placeholder="Filtrar por Propiedad" class="w-48 sm:w-60" showClear filter
                        @change="onFilterChange" />

                    <Select v-if="viewMode === 'Directorio'" 
                    v-model="filterStatus" :options="statusOptions" placeholder="Estado" class="w-32 sm:w-40" 
                    showClear @change="onFilterChange" />

                    <IconField iconPosition="left">
                        <InputIcon><i class="pi pi-filter text-gray-500" /></InputIcon>
                        <InputText v-model="filterDepartment" placeholder="Filtrar Depto..."
                            class="w-40 border-gray-300" @input="onFilterChange" />
                    </IconField>

                </div>
            </template>

            <template #end>

                <div class="flex items-center gap-2">
                    <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileUpload" style="display: none;" />
                    
                    <Button icon="pi pi-upload" severity="help" text rounded 
                            v-tooltip.top="'Importar Excel'" 
                            class="hover:bg-purple-50 text-purple-600"
                            @click="triggerFileInput" />

                    <span class="text-gray-300 mx-1">|</span>

                    <Button icon="pi pi-file-excel" severity="success" text rounded @click="exportCSV" />
                    <Button icon="pi pi-file-pdf" severity="danger" text rounded @click="exportPDF" />
                    <Button icon="pi pi-refresh" text rounded @click="loadLazyData" />
                </div>

            </template>
        </Toolbar>

        <DataTable :value="memberStore.members" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="memberStore.totalRecords" :loading="memberStore.isLoading" @page="onPage"
            class="shadow-md rounded-lg overflow-hidden" :rowsPerPageOptions="[5, 10, 15, 25, 50]" dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} miembros" stripedRows removableSort>

            <template #header>
                <div class="flex flex-wrap justify-between items-center gap-3 p-2">
                    <h4 class="text-xl font-bold text-gray-700 m-0">
                        {{ viewMode === 'Bajas' ? 'Histórico de Bajas' : 'Directorio Activo' }}
                    </h4>
                    <IconField iconPosition="left">
                        <InputIcon><i class="pi pi-search text-gray-500" /></InputIcon>
                        <InputText v-model="searchValue" @input="onFilterChange" placeholder="Buscar general..."
                            class="w-64 border-gray-300" />
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

            <Column v-if="viewMode === 'Bajas'" header="Fecha Baja" style="min-width: 120px">
                <template #body="slotProps">
                    <span class="text-red-700 font-medium text-sm">
                        {{ formatDate(slotProps.data.termination_date) }}
                    </span>
                </template>
            </Column>

            <Column v-else header="Fecha de Contratación" style="min-width: 120px">
                <template #body="slotProps">
                    <span class="text-gray-600 text-sm">
                        {{ formatDate(slotProps.data.hire_date) }}
                    </span>
                </template>
            </Column>

            <Column header="Acciones" style="min-width: 100px" alignFrozen="right" frozen>
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" severity="info"
                            class="p-button-rounded p-button-outlined text-white" @click="editMember(slotProps.data)"
                            v-tooltip.top="'Editar'" />
                        <Button icon="pi pi-times-circle" severity="danger"
                            class="p-button-rounded p-button-outlined text-white" @click="confirmDelete(slotProps.data)"
                            v-tooltip.top="'Eliminar'" />
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
                    <Select v-model="form.department" :options="DEPARTMENTS_LIST"
                        placeholder="Selecciona un departamento" class="w-full" filter showClear
                        @change="onDepartmentChange" />
                </div>

                <div>
                    <label class="text-sm block mb-1 font-medium text-gray-700">Puesto</label>
                    <Select v-model="form.position" :options="availablePositions" :disabled="!form.department"
                        placeholder="Selecciona un puesto" class="w-full" filter showClear
                        :emptyMessage="form.department ? 'No hay puestos registrados' : 'Primero selecciona un departamento'" />
                </div>

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4">
                    <span class="text-gray-600 font-bold text-lg"><i class="pi pi-list mr-2"></i>Detalles
                        Adicionales</span>
                </div>


                <div>
                    <label class="text-sm block mb-1 font-medium">Fecha de Contratación</label>
                    <Calendar v-model="form.hire_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>


                <div>
                    <label class="text-sm block mb-1 font-medium">Fecha de Baja</label>
                    <Calendar v-model="form.termination_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
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

        <Dialog v-model:visible="deleteDialog" header="Confirmar Baja" modal class="w-96">
            <div class="flex items-center gap-3">
                <i class="pi pi-user-minus text-3xl text-orange-500"></i>
                <div class="text-gray-700 leading-relaxed">
                    <p>¿Procesar la baja de <b>{{ selectedMemberToDelete?.full_name }}</b>?</p>
                    <p class="text-xs text-gray-500 mt-1">El expediente pasará a estado "BAJA" y se guardará la fecha de
                        hoy.
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