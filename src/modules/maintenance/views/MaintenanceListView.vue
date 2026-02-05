<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMaintenanceStore } from '../store/maintenance.store';
import { maintenanceService } from '../services/maintenance.service'; // Para exportación
import { useAssetStore } from '@/modules/assets/store/asset.store';
import type { MaintenanceLog, CreateMaintenancePayload } from '../types/maintenance.types';

// Librerías de Exportación
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// PrimeVue
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Toolbar from 'primevue/toolbar';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useToast } from 'primevue/usetoast';

const maintenanceStore = useMaintenanceStore();
const assetStore = useAssetStore();
const toast = useToast();

// Estados
const logDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const isEditMode = ref(false);
const logToDelete = ref<MaintenanceLog | null>(null);

// Filtros y Paginación
const lazyParams = ref({ page: 0, rows: 10 });
const filterAsset = ref<number | null>(null);
const filterEvent = ref<string | null>(null);

// Formulario
const form = ref({
    id: 0,
    asset_id: null as number | null,
    event_type: 'repair',
    title: '',
    description: '',
    cost: 0,
    event_date: null as Date | null,
});

const eventTypes = [
    { label: 'REPARACIÓN GENERAL', value: 'repair' },
    { label: 'GARANTÍA', value: 'warranty' },
    { label: 'DAÑO FÍSICO (COBRO)', value: 'damage' },
    { label: 'MANTENIMIENTO PREVENTIVO', value: 'inspection' },
    { label: 'LICENCIA / SOFTWARE', value: 'license' },
];

onMounted(() => {
    assetStore.fetchAssets(1, 100, '');
    loadLazyData();
});

const loadLazyData = () => {
    const page = lazyParams.value.page + 1;
    const rows = lazyParams.value.rows;
    maintenanceStore.fetchLogs(page, rows, filterAsset.value || undefined, filterEvent.value || undefined);
};

const onPage = (event: DataTablePageEvent) => {
    lazyParams.value = event;
    loadLazyData();
};

const onFilterChange = () => {
    lazyParams.value.page = 0;
    loadLazyData();
};

// --- CRUD: CREAR / EDITAR / ELIMINAR ---

const openNew = () => {
    form.value = { id: 0, asset_id: null, event_type: 'repair', title: '', description: '', cost: 0, event_date: new Date() };
    submitted.value = false;
    isEditMode.value = false;
    logDialog.value = true;
};

const editLog = (log: MaintenanceLog) => {
    // Rellenar formulario para edición
    form.value = {
        id: log.id,
        asset_id: log.asset.id,
        event_type: log.event_type,
        title: log.details.title,
        description: log.details.description,
        cost: log.details.cost,
        // Convertimos el string ISO a objeto Date para el componente Calendar
        event_date: new Date(log.dates.event_date + 'T00:00:00')
    };
    submitted.value = false;
    isEditMode.value = true;
    logDialog.value = true;
};

const saveLog = async () => {
    submitted.value = true;

    if (!form.value.title || !form.value.asset_id || !form.value.event_date) {
        toast.add({ severity: 'warn', summary: 'Datos Faltantes', detail: 'Verifica los campos obligatorios', life: 3000 });
        return;
    }

    // Preparación de datos (Blindada)

    const payload: CreateMaintenancePayload = {
        asset_id: Number(form.value.asset_id),
        event_type: form.value.event_type || 'repair',
        title: form.value.title.trim(),
        description: form.value.description?.trim() || '',
        cost: Number(form.value.cost || 0),
        event_date: form.value.event_date ? form.value.event_date.toISOString().split('T')[0] : null,
    };

    try {
        if (isEditMode.value && form.value.id) {
            await maintenanceStore.updateLog(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Registro actualizado correctamente', life: 3000 });
        } else {
            await maintenanceStore.createLog(payload);
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Registro creado correctamente', life: 3000 });
        }
        
        logDialog.value = false;
        loadLazyData();
    } catch (e: any) {
        const msg = e.response?.data?.message || 'Error al guardar';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
    }
};

const confirmDelete = (log: MaintenanceLog) => {
    logToDelete.value = log;
    deleteDialog.value = true;
};

const deleteLog = async () => {
    if (!logToDelete.value) return;
    try {
        await maintenanceStore.deleteLog(logToDelete.value.id);
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Registro eliminado', life: 3000 });
        deleteDialog.value = false;
        logToDelete.value = null;
        loadLazyData();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
    }
};

// --- EXPORTACIÓN PDF Y EXCEL ---
const fetchAllForExport = async () => {
    try {
        const response = await maintenanceService.getAll(1, 10000, filterAsset.value || undefined, filterEvent.value || undefined);
        return response.data;
    } catch (e) { return []; }
};

const exportCSV = async () => {
    const data = await fetchAllForExport();
    if (!data.length) return;

    const exportData = data.map((log: MaintenanceLog, index: number) => ({
        '#': index + 1,
        'Fecha': log.dates.event_date,
        'Tipo': getEventLabel(log.event_type),
        'Activo': log.asset.hilton_name,
        'Asignado A': log.current_holder?.full_name || 'Stock',
        'Título': log.details.title,
        'Costo': log.details.cost,
        'Reportó': log.reporter?.full_name || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mantenimientos");
    XLSX.writeFile(workbook, `Mantenimientos_${new Date().toISOString().slice(0,10)}.xlsx`);
};

const exportPDF = async () => {
    const data = await fetchAllForExport();
    if (!data.length) return;
    
    const doc = new jsPDF('l', 'mm', 'a4');
    const columns = [
        { header: 'Fecha', dataKey: 'date' },
        { header: 'Tipo', dataKey: 'type' },
        { header: 'Activo', dataKey: 'asset' },
        { header: 'Asignado', dataKey: 'holder' },
        { header: 'Título', dataKey: 'title' },
        { header: 'Costo', dataKey: 'cost' }
    ];
    const rows = data.map(log => ({
        date: log.dates.event_date,
        type: getEventLabel(log.event_type),
        asset: log.asset.hilton_name,
        holder: log.current_holder?.full_name || 'Stock',
        title: log.details.title,
        cost: formatCurrency(log.details.cost)
    }));

    autoTable(doc, {
        columns, body: rows,
        headStyles: { fillColor: [220, 38, 38] },
        margin: { top: 20 },
        didDrawPage: () => { doc.text('Reporte de Mantenimiento', 14, 15); }
    });
    doc.save(`Mantenimientos_${new Date().toISOString().slice(0,10)}.pdf`);
};

// --- HELPERS VISUALES ---
const getEventLabel = (type: string) => eventTypes.find(e => e.value === type)?.label || type.toUpperCase();

const getEventSeverity = (type: string) => {
    switch (type) {
        case 'warranty': return 'success';
        case 'damage': return 'danger';
        case 'license': return 'info';
        case 'repair': return 'warn';
        default: return 'secondary';
    }
};
const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

</script>

<template>
    <div class="max-w-7xl mx-auto p-4">

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                <span class="text-xs font-bold text-gray-500 uppercase">Total Tickets</span>
                <div class="text-2xl font-bold text-gray-800">{{ maintenanceStore.totalRecords }}</div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                <span class="text-xs font-bold text-gray-500 uppercase">Costo Visible</span>
                <div class="text-2xl font-bold text-red-600">{{ formatCurrency(maintenanceStore.totalCostVisible()) }}</div>
            </div>
        </div>

        <Toolbar class="mb-4 shadow-sm border-gray-200">
            <template #start>
                <Button label="Nuevo Reporte" icon="pi pi-plus" class="bg-blue-600 border-none mr-2" @click="openNew" />
                
                <Select v-model="filterEvent" :options="eventTypes" optionLabel="label" optionValue="value" 
                        placeholder="Filtrar Evento" class="w-48 mr-2" showClear @change="onFilterChange" />
                        
                <Select v-model="filterAsset" :options="assetStore.assets" optionLabel="info.hilton_name" optionValue="id"
                        placeholder="Filtrar Activo" class="w-48" showClear filter @change="onFilterChange" />
            </template>

            <template #end>
                <div class="flex gap-2">
                    <Button icon="pi pi-file-excel" severity="success" text rounded @click="exportCSV" v-tooltip.top="'Excel'" />
                    <Button icon="pi pi-file-pdf" severity="danger" text rounded @click="exportPDF" v-tooltip.top="'PDF'" />
                    <Button icon="pi pi-refresh" text rounded @click="loadLazyData" />
                </div>
            </template>
        </Toolbar>

        <DataTable :value="maintenanceStore.logs" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="maintenanceStore.totalRecords" :loading="maintenanceStore.isLoading" @page="onPage"
             class="shadow-md rounded-lg overflow-hidden" :rowsPerPageOptions="[5, 10, 15, 25, 50]" dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} miembros" stripedRows removableSort>

            <Column header="#">
                <template #body="slotProps">
                    <span class="text-gray-500 font-mono font-semibold">
                        {{ lazyParams.page * lazyParams.rows + slotProps.index + 1 }}
                    </span>
                </template>
            </Column>

            <Column header="Reportó" style="width: 120px">
                <template #body="slotProps">
                    <div class="text-sm text-gray-400"> {{ slotProps.data.reporter?.full_name }}</div>
                </template>
            </Column>

            <Column header="Activo">
                <template #body="slotProps">
                    <div class="font-bold text-gray-800">{{ slotProps.data.asset.hilton_name }}</div>
                    <div class="text-xs text-gray-500 mb-1">{{ slotProps.data.asset.category }} - {{ slotProps.data.asset.serial_number }}</div>
                </template>
            </Column>

            <Column header="Asignación y Ubicación">
                <template #body="slotProps">
                    <div class="flex items-center gap-1 bg-gray-50 p-1 rounded w-fit">
                        <i class="pi pi-user text-xs text-gray-400"></i>
                        <span class="text-xs font-medium text-gray-700">
                            {{ slotProps.data.current_holder?.full_name || 'Stock / Almacén' }}
                        </span>
                    </div>
                    <div v-if="slotProps.data.current_holder" class="text-[10px] text-gray-400 mt-1 ml-4">
                        {{ slotProps.data.current_holder.position }}
                    </div>
                </template>
            </Column>

            <Column header="Evento">
                <template #body="slotProps">
                    <div class="mt-1 font-semibold text-sm">{{ slotProps.data.details.title }}</div>
                    <div class="text-xs text-gray-500 truncate max-w-xs" :title="slotProps.data.details.description">
                        {{ slotProps.data.details.description }}
                    </div>
                </template>
            </Column>

            <Column header="Estado">
                <template #body="slotProps">
                    <Tag :value="getEventLabel(slotProps.data.event_type)"
                        :severity="getEventSeverity(slotProps.data.event_type)" />
                </template>
            </Column>

            <Column header="Costo">
                <template #body="slotProps">
                    <span class="font-mono font-bold text-gray-800">
                        {{ formatCurrency(slotProps.data.details.cost) }}
                    </span>
                </template>
            </Column>

            <Column header="Fecha" style="width: 120px">
                <template #body="slotProps">
                    <div class="font-mono text-sm text-gray-600">{{ slotProps.data.dates.event_date }}</div>
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editLog(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="logDialog" :header="isEditMode ? 'Editar Mantenimiento' : 'Registrar Mantenimiento'" modal class="w-full max-w-2xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Activo Afectado</label>
                    <Select v-model="form.asset_id" :options="assetStore.assets" optionLabel="info.hilton_name"
                        optionValue="id" filter placeholder="Buscar por Hilton Name..." class="w-full" :disabled="isEditMode" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Tipo de Evento</label>
                    <Select v-model="form.event_type" :options="eventTypes" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Fecha del Suceso</label>
                    <Calendar v-model="form.event_date" showIcon class="w-full" dateFormat="yy-mm-dd" />
                </div>
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Título Corto</label>
                    <InputText v-model="form.title" class="w-full" placeholder="Ej: Pantalla rota..." />
                </div>
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">Descripción Detallada</label>
                    <Textarea v-model="form.description" rows="3" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 text-red-600">Costo (MXN)</label>
                    <InputNumber v-model="form.cost" mode="currency" currency="MXN" locale="es-MX" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" text @click="logDialog = false" />
                <Button label="Guardar Reporte" icon="pi pi-save" @click="saveLog" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" header="Confirmar" modal class="w-96">
            <p>¿Eliminar este registro permanentemente?</p>
            <template #footer>
                <Button label="No" text @click="deleteDialog = false" />
                <Button label="Sí, Eliminar" severity="danger" icon="pi pi-check" @click="deleteLog" />
            </template>
        </Dialog>
    </div>
</template>