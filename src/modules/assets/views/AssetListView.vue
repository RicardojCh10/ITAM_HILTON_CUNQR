<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAssetStore } from '../store/asset.store';
import { assetService } from '../services/asset.service';
import type { Asset, CreateAssetPayload } from '../types/asset.types';

// Servicios auxiliares para dropdowns
import { listProperties, type Property } from '@/modules/properties/services/property.service';
import { memberService } from '@/modules/members/services/member.service';
import { providerService } from '@/modules/providers/services/provider.service';

// Exportación
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
import AutoComplete from 'primevue/autocomplete';
import type { DataTablePageEvent } from 'primevue/datatable';
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete';

const router = useRouter();
const assetStore = useAssetStore();
const toast = useToast();

// --- ESTADOS ---
const assetDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const isEditMode = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// --- LISTAS PARA DROPDOWNS ---
const properties = ref<Property[]>([]);
const categoryOptions = ref(['Laptop', 'Desktop', 'Monitor', 'Printer', 'Server', 'Tablet', 'Access Point', 'Switch', 'Phone', 'Other']);

// --- ESTADO PARA ELIMINAR ---
const selectedAssetToDelete = ref<Asset | null>(null);

// --- FILTROS ---
const searchValue = ref('');
const filterProperty = ref<number | null>(null);
const filterCategory = ref<string | null>(null);
const filterStatus = ref<string | null>(null);
const filterMember = ref<number | null>(null);
const filteredMembers = ref<any[]>([]);
const selectedMemberObject = ref<any>(null);
const filteredProviders = ref<any[]>([]);
const selectedProviderObject = ref<any>(null);

// --- FORMULARIO ---
const form = ref({
    id: 0,
    property_id: null as number | null,
    // member_id: null as number | null,
    category: '',
    status: 'active',
    brand: '',
    model: '',
    serial_number: '',
    hilton_name: '',
    mac_address: '',
    ip_address: '',
    // Fechas
    purchase_date: null as Date | null,
    warranty_expiry: null as Date | null,
    // Specs JSON
    ram: '',
    storage: '',
    processor: '',
    // provider: '',
    imei: '',
    sim: '',
    plan: '',
    carrier: '',
    phone_number: '',
    description: ''
});

// Búsqueda de miembros (Server Side)

const searchMember = async (event: AutoCompleteCompleteEvent) => {
    const query = event.query.trim();
    if (!query) return;

    try {
        const response = await memberService.getAll(1, 20, query);
        filteredMembers.value = response.data;
    } catch (e) {
        console.error("Error buscando miembro", e);
    }
};

const searchProvider = async (event: AutoCompleteCompleteEvent) => {
    const query = event.query.trim();
    if (!query) return;

    try {
        const response = await providerService.getAll(1, 20, query);
        filteredProviders.value = response.data;
    } catch (e) {
        console.error("Error buscando proveedor", e);
    }
};


watch(selectedMemberObject, (newValue) => {
    if (!assetDialog.value) {
        filterMember.value = newValue ? newValue.id : null;
        onFilterChange();
    }
});

watch(selectedProviderObject, (newValue) => {
    if (!assetDialog.value) {
        // filterProvider.value = newValue ? newValue.id : null;
        onFilterChange();
    }
});

// Paginación
const lazyParams = ref({ first: 0, rows: 15, page: 0 });

// --- CICLO DE VIDA ---
onMounted(async () => {
    properties.value = await listProperties();

    loadLazyData();
});

// --- CARGA DE DATOS ---
const loadLazyData = () => {
    const page = lazyParams.value.page + 1;
    assetStore.fetchAssets(
        page,
        lazyParams.value.rows,
        searchValue.value,
        filterProperty.value || undefined,
        filterCategory.value || undefined,
        filterStatus.value || undefined,
        filterMember.value || undefined
    );
};

const onPage = (event: DataTablePageEvent) => {
    lazyParams.value = event;
    loadLazyData();
};

// --- IMPORTACIÓN DE ARCHIVO ---
const handleFileUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    toast.add({ severity: 'info', summary: 'Subiendo...', detail: 'Procesando inventario...', life: 2000 });

    try {
        await assetStore.importAssets(file);

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Activos importados correctamente', life: 3000 });

        onFilterChange();
    } catch (e: any) {
        console.error("Error importación:", e);

        const errors = e.response?.data?.errors;
        if (Array.isArray(errors) && errors.length > 0) {
            const flatErrors = errors.flat().slice(0, 3);
            flatErrors.forEach((errMsg: string) => {
                toast.add({ severity: 'error', summary: 'Error Excel', detail: errMsg, life: 8000 });
            });
            if (errors.flat().length > 3) toast.add({ severity: 'warn', summary: 'Más errores...', detail: 'Revisar archivo completo', life: 5000 });
        } else if (e.response?.data?.message) {
            toast.add({ severity: 'error', summary: 'Error', detail: e.response.data.message, life: 5000 });
        } else {
            toast.add({ severity: 'error', summary: 'Fallo', detail: 'Error desconocido al importar', life: 5000 });
        }
    } finally {
        if (fileInput.value) fileInput.value.value = '';
    }
};

const triggerFileInput = () => {
    fileInput.value?.click();
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

// --- NAVEGACIÓN ---
const goToDetail = (id: number) => {
    router.push({ name: 'AssetDetail', params: { id } });
};

// --- EXPORTACIÓN PDF y CSV ---
const fetchAllForExport = async () => {
    const response = await assetService.getAll(
        1, 10000,
        searchValue.value,
        filterProperty.value || undefined,
        filterCategory.value || undefined,
        filterStatus.value || undefined,
        filterMember.value || undefined
    );
    return response.data;
};

const exportCSV = async () => {
    const data = await fetchAllForExport();
    const exportData = data.map((a: Asset, index: number) => ({
        '#': index + 1,
        'Propiedad': a.location.property_name,
        'Categoría': a.info.category,
        'Marca': a.info.brand || '-',
        'Modelo': a.info.model || '-',
        'Serial': a.info.serial_number || '-',
        'Nombre Hilton': a.info.hilton_name || '-',
        'Asignado A': a.assigned_to?.name || 'Stock',
        'Estado': formatStatus(a.status),
        'IP': a.network.ip_address || '-',
        'MAC': a.network.mac_address || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Activos");
    XLSX.writeFile(workbook, "Inventario_Activos.xlsx");
};

const exportPDF = async () => {
    const data = await fetchAllForExport();
    const doc = new jsPDF('l', 'mm', 'a4');
    const columns = [
        { header: '#', dataKey: 'row_num' },
        { header: 'Propiedad', dataKey: 'property' },
        { header: 'Categoría', dataKey: 'category' },
        { header: 'Marca', dataKey: 'brand' },
        { header: 'Modelo', dataKey: 'model' },
        { header: 'Serial', dataKey: 'serial' },
        { header: 'Nombre Hilton', dataKey: 'hilton_name' },
        { header: 'Asignado', dataKey: 'assigned' },
        { header: 'Estado', dataKey: 'status' },
        { header: 'IP', dataKey: 'ip' },
        { header: 'MAC', dataKey: 'mac' }
    ];

    const rows = data.map((a: Asset, index: number) => ({
        row_num: index + 1,
        property: a.location.property_name,
        category: a.info.category,
        brand: a.info.brand || '',
        model: `${a.info.brand || ''} ${a.info.model || ''}`,
        serial: a.info.serial_number || '-',
        hilton_name: a.info.hilton_name || '-',
        assigned: a.assigned_to?.name || 'Stock',
        status: formatStatus(a.status),
        ip: a.network.ip_address || '-',
        mac: a.network.mac_address || '-'
    }));

    autoTable(doc, {
        columns: columns,
        body: rows,
        margin: { top: 20 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        didDrawPage: () => { doc.text('Reporte de Activos IT', 14, 15); }
    });
    doc.save('Inventario_Activos.pdf');
};

// --- CRUD ---
const openNew = () => {
    form.value = {
        id: 0, property_id: null, category: '', brand: '', model: '',
        serial_number: '', hilton_name: '', mac_address: '', ip_address: '', status: 'active',
        purchase_date: null, warranty_expiry: null,

        ram: '', storage: '', processor: '', // provider: '',
        imei: '', sim: '', plan: '', carrier: '', phone_number: '', description: ''
    };
    submitted.value = false;
    isEditMode.value = false;
    assetDialog.value = true;
};

const editAsset = (asset: Asset) => {
    if (asset.assigned_to) {
        selectedMemberObject.value = {
            id: asset.assigned_to.member_id,
            name: asset.assigned_to.name,
            last_name: asset.assigned_to.last_name,
            full_name: asset.assigned_to.full_name,
            corporate_info: {
                department: asset.assigned_to.department
            }
        } as any;
    } else {
        selectedMemberObject.value = null;
    }

    if (asset.provider) {
        selectedProviderObject.value = {
            id: asset.provider.provider_id,
            name: asset.provider.name,
            tax_id: asset.provider.tax_id,
            email: asset.provider.email,
            phone: asset.provider.phone,
            contact_name: asset.provider.contact_name
        } as any;
    } else {
        selectedProviderObject.value = null;
    }

    form.value = {
        id: asset.id,
        property_id: asset.location.property_id,
        category: asset.info.category,
        brand: asset.info.brand || '',
        model: asset.info.model || '',
        serial_number: asset.info.serial_number || '',
        hilton_name: asset.info.hilton_name || '',
        mac_address: asset.network.mac_address || '',
        ip_address: asset.network.ip_address || '',
        status: asset.status,
        purchase_date: asset.dates.purchase ? new Date(asset.dates.purchase) : null,
        warranty_expiry: asset.dates.warranty ? new Date(asset.dates.warranty) : null,
        // Specs flattening
        ram: asset.specs?.ram || '',
        storage: asset.specs?.storage || '',
        processor: asset.specs?.processor || '',
        // provider: asset.specs?.provider || '',
        imei: asset.specs?.imei || '',
        sim: asset.specs?.sim || '',
        plan: asset.specs?.plan || '',
        carrier: asset.specs?.carrier || '',
        phone_number: asset.specs?.phone_number || '',
        description: asset.specs?.description || ''
    };
    submitted.value = false;
    isEditMode.value = true;
    assetDialog.value = true;
};


const saveAsset = async () => {
    submitted.value = true;

    if (!form.value.category || !form.value.property_id || !form.value.status) {
        toast.add({ severity: 'warn', summary: 'Datos Faltantes', detail: 'Propiedad, Categoría y Estado son obligatorios', life: 3000 });
        return;
    }

    const payload: CreateAssetPayload = {
        property_id: form.value.property_id!,
        member_id: selectedMemberObject.value ? selectedMemberObject.value.id : null,
        provider_id: selectedProviderObject.value ? selectedProviderObject.value.id : null,

        category: form.value.category.trim(),
        brand: form.value.brand?.trim() || null,
        model: form.value.model?.trim() || null,
        serial_number: form.value.serial_number?.trim() || null,
        hilton_name: form.value.hilton_name?.trim() || null,

        mac_address: form.value.mac_address?.trim() || null,
        ip_address: form.value.ip_address?.trim() || null,

        status: form.value.status,

        purchase_date: form.value.purchase_date
            ? new Date(form.value.purchase_date).toISOString().split('T')[0]
            : null,
        warranty_expiry: form.value.warranty_expiry
            ? new Date(form.value.warranty_expiry).toISOString().split('T')[0]
            : null,

        specs: {
            ram: form.value.ram,
            storage: form.value.storage,
            processor: form.value.processor,
            // provider: form.value.provider,
            imei: form.value.imei,
            sim: form.value.sim,
            plan: form.value.plan,
            carrier: form.value.carrier,
            phone_number: form.value.phone_number,
            description: form.value.description
        }
    };

    try {
        if (isEditMode.value && form.value.id) {
            await assetStore.updateAsset(form.value.id, payload);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Activo actualizado', life: 3000 });
        } else {
            await assetStore.createAsset(payload);
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Activo creado', life: 3000 });
        }

        assetDialog.value = false;
        loadLazyData();

    } catch (e: any) {
        console.error("Error al guardar:", e);

        const errorMsg = e.response?.data?.message || 'Verifica los datos ingresados';

        const errorErrors = e.response?.data?.errors as Record<string, string[]> | undefined;

        let detail = errorMsg;

        if (errorErrors) {
            const errorValues = Object.values(errorErrors);

            const firstFieldErrors = errorValues[0];

            if (firstFieldErrors && firstFieldErrors.length > 0) {
                detail = firstFieldErrors[0];
            }
        }

        toast.add({ severity: 'error', summary: 'Error al Guardar', detail: detail, life: 5000 });
    }
};

const confirmDelete = (asset: Asset) => {
    selectedAssetToDelete.value = asset;
    deleteDialog.value = true;
};

const deleteAsset = async () => {
    if (selectedAssetToDelete.value) {
        await assetStore.deleteAsset(selectedAssetToDelete.value.id);
        deleteDialog.value = false;
        selectedAssetToDelete.value = null;
        loadLazyData();
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Activo eliminado', life: 3000 });
    }
};

const statusOptions = ref([
    { label: 'ACTIVO', value: 'active' },
    { label: 'REPARACIÓN', value: 'repair' },
    { label: 'PERDIDO', value: 'lost' },
    { label: 'BAJA', value: 'retired' },
    { label: 'ALMACÉN', value: 'stored' }
]);

const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
        'active': 'ACTIVO',
        'repair': 'REPARACIÓN',
        'lost': 'PERDIDO',
        'retired': 'BAJA',
        'stored': 'ALMACÉN'
    };
    return statusMap[status] || status?.toUpperCase();
};

const getSeverity = (status: string) => {
    switch (status) {
        case 'active': return 'success';
        case 'repair': return 'warn';
        case 'lost': return 'danger';
        case 'retired': return 'secondary';
        case 'stored': return 'info';
        default: return 'info';
    }
};
</script>

<template>
    <div class="w-full max-w-none p-4">


        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">

            <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">

                <div>
                    <Button label="Nuevo Activo" icon="pi pi-plus"
                        class="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm" @click="openNew" />
                </div>

                <div class="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <IconField iconPosition="left" class="w-full md:w-64">
                        <InputIcon><i class="pi pi-search text-gray-400" /></InputIcon>
                        <InputText v-model="searchValue" @input="onFilterChange"
                            placeholder="Buscar Serial, Marca, Modelo..." class="w-full border-gray-300" />
                    </IconField>

                    <div class="flex items-center gap-2">
                        <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls"
                            @change="handleFileUpload" style="display: none;" />

                        <Button icon="pi pi-upload" severity="help" text rounded
                            v-tooltip.top="'Carga Masiva de Activos'" class="hover:bg-purple-50 text-purple-600"
                            @click="triggerFileInput" />
                        <span class="text-gray-300 mx-1">|</span>
                    </div>


                    <div class="flex gap-2">
                        <Button icon="pi pi-file-excel" severity="success" text rounded @click="exportCSV"
                            v-tooltip.top="'Exportar Excel'" class="hover:bg-green-50 text-green-600" />

                        <Button icon="pi pi-file-pdf" severity="danger" text rounded @click="exportPDF"
                            v-tooltip.top="'Exportar PDF'" class="hover:bg-red-50 text-red-600" />

                        <Button icon="pi pi-refresh" text rounded @click="loadLazyData" v-tooltip.top="'Recargar Datos'"
                            class="text-gray-500" />
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-md ">

                <Select v-model="filterProperty" :options="properties" optionLabel="name" optionValue="id"
                    placeholder="Todas las Propiedades" class="w-full" showClear filter @change="onFilterChange">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-building text-gray-400"></i>
                            <span>{{ slotProps.option.name }}</span>
                        </div>
                    </template>
                </Select>

                <Select v-model="filterCategory" :options="categoryOptions" placeholder="Todas las Categorías"
                    class="w-full" showClear @change="onFilterChange">
                    <template #value="slotProps">
                        <div v-if="slotProps.value" class="flex items-center gap-2">
                            <i class="pi pi-tag text-gray-400"></i>
                            <span>{{ slotProps.value }}</span>
                        </div>
                        <span v-else>{{ slotProps.placeholder }}</span>
                    </template>
                </Select>

                <Select v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value"
                    placeholder="Cualquier Estado" class="w-full" showClear @change="onFilterChange">
                    <template #option="slotProps">
                        <Tag :value="slotProps.option.label" :severity="getSeverity(slotProps.option.value)" />
                    </template>
                </Select>

                <AutoComplete v-model="selectedMemberObject" :suggestions="filteredMembers" optionLabel="full_name"
                    placeholder="Buscar Asignado..." class="w-full" @complete="searchMember" showClear dropdown>
                </AutoComplete>

            </div>
        </div>

        <DataTable :value="assetStore.assets" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="assetStore.totalRecords" :loading="assetStore.isLoading" @page="onPage"
            class="shadow-md rounded-lg overflow-hidden text-sm" :rowsPerPageOptions="[5, 10, 15, 25, 50]" dataKey="id"
            currentPageReportTemplate="{first} - {last} de {totalRecords}" stripedRows removableSort>

            <Column header="#">
                <template #body="slotProps">
                    <span class="text-gray-500 font-mono font-semibold">
                        {{ lazyParams.page * lazyParams.rows + slotProps.index + 1 }}
                    </span>
                </template>
            </Column>

            <Column header="Equipo" style="min-width: 200px">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="font-bold text-sm text-gray-800">
                            {{ slotProps.data.info.category }}</span>
                        <span class=" text-gray-500 text-xs">
                            <b>Marca:</b> {{ slotProps.data.info.brand || 'Genérico' }}
                        </span>
                        <span class="text-xs text-gray-500">
                            <b>Modelo: </b>{{ slotProps.data.info.model || 'Sin modelo' }}
                        </span>
                    </div>
                </template>
            </Column>

            <Column header="Serial / Hilton Name" style="min-width: 150px">
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="text-sm">{{ slotProps.data.info.serial_number || '-' }}</span>
                        <span class="text-sm text-blue-500">
                            <a href="#" @click.prevent="goToDetail(slotProps.data.id)"
                                class="text-blue-600 font-semibold hover:underline">
                                #{{ slotProps.data.info.hilton_name }}
                            </a>
                        </span>
                    </div>
                </template>
            </Column>


            <Column header="Asignado A" sortable style="min-width: 200px" sortField="assigned_to.full_name">
                <template #body="slotProps">
                    <div v-if="slotProps.data.assigned_to" class="flex items-center gap-2">
                        <div
                            class="w-6 h-6 p-2 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {{ slotProps.data.assigned_to.name.charAt(0) }}{{
                                slotProps.data.assigned_to.last_name?.charAt(0) }}
                        </div>

                        <div class="flex flex-col">
                            <span class="text-sm font-normal text-gray-700">
                                {{ slotProps.data.assigned_to.full_name }}
                            </span>
                        </div>
                    </div>

                    <Tag v-else value="En Stock" severity="info" class="text-xs px-2" />
                </template>
            </Column>

            <Column header="Departamento" style="min-width: 200px">
                <template #body="slotProps">
                    <span v-if="slotProps.data.assigned_to" class="text-sm">
                        {{ slotProps.data.assigned_to?.department }}
                    </span>
                    <Tag v-else value="Sin Asignación" severity="danger" class="text-xs" />
                </template>
            </Column>

            <Column header="Propiedad" style="min-width: 200px">
                <template #body="slotProps">
                    <span class="text-sm">{{ slotProps.data.location.property_name }}</span>
                </template>
            </Column>


            <Column field="status" header="Estado">
                <template #body="slotProps">
                    <Tag :value="formatStatus(slotProps.data.status)" :severity="getSeverity(slotProps.data.status)"
                        class="font-bold px-2 text-[10px]" />
                </template>
            </Column>

            <Column header="Acciones" alignFrozen="right" frozen>
                <template #body="slotProps">
                    <div class="flex gap-2">

                        <Button icon="pi pi-pencil" severity="info"
                            class="p-button-rounded p-button-outlined text-white" @click="editAsset(slotProps.data)"
                            v-tooltip.top="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger"
                            class="p-button-rounded p-button-outlined text-white" @click="confirmDelete(slotProps.data)"
                            v-tooltip.top="'Eliminar'" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="assetDialog" :header="isEditMode ? 'Editar Activo' : 'Nuevo Activo'" modal
            class="w-full max-w-5xl">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 font-bold text-gray-600">Información General
                </div>

                <div><label class="text-sm block mb-1">Propiedad *</label><Select v-model="form.property_id"
                        :options="properties" optionLabel="name" optionValue="id" class="w-full" filter /></div>
                <div><label class="text-sm block mb-1">Categoría *</label><Select v-model="form.category"
                        :options="categoryOptions" editable class="w-full" placeholder="Selecciona o escribe" /></div>
                <div><label class="text-sm block mb-1">Marca</label>
                    <InputText v-model="form.brand" class="w-full" />
                </div>
                <div><label class="text-sm block mb-1">Modelo</label>
                    <InputText v-model="form.model" class="w-full" />
                </div>
                <div><label class="text-sm block mb-1">Serial Number</label>
                    <InputText v-model="form.serial_number" class="w-full font-mono" />
                </div>
                <div><label class="text-sm block mb-1">Hilton Name</label>
                    <InputText v-model="form.hilton_name" class="w-full" />
                </div>
                <div>
                    <label class="text-sm block mb-1 font-bold">Proveedor</label>
                    <AutoComplete v-model="selectedProviderObject" :suggestions="filteredProviders" optionLabel="name"
                        placeholder="Buscar por Proveedor" class="w-full" @complete="searchProvider" :dropdown="true"
                        showClear forceSelection>
                        <template #option="slotProps">
                            <div class="flex flex-col">
                                <span class="font-bold text-gray-800">{{ slotProps.option.name }}</span>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <span v-if="slotProps.option.tax_id" class="bg-gray-100 px-1 rounded">{{
                                        slotProps.option.tax_id }}</span>
                                </div>
                            </div>
                        </template>
                        <template #empty>
                            <div class="p-2 text-sm text-gray-500">No se encontraron resultados.</div>
                        </template>
                    </AutoComplete>
                    <small class="text-gray-400 text-xs">Sin proveedor asignado.</small>
                </div>

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4 font-bold text-gray-600">Estado y
                    Asignación</div>

                <div>
                    <label class="text-sm block mb-1">Estado *</label>
                    <Select v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value"
                        class="w-full" />
                </div>

                <div>
                    <label class="text-sm block mb-1 font-bold">Asignado a (Miembro)</label>
                    <AutoComplete v-model="selectedMemberObject" :suggestions="filteredMembers" optionLabel="full_name"
                        placeholder="Buscar por Nombre o TM ID..." class="w-full" @complete="searchMember"
                        :dropdown="true" showClear forceSelection>
                        <template #option="slotProps">
                            <div class="flex flex-col">
                                <span class="font-bold text-gray-800">{{ slotProps.option.full_name }}</span>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <span v-if="slotProps.option.tm_id" class="bg-gray-100 px-1 rounded">{{
                                        slotProps.option.tm_id }}</span>
                                    <span>{{ slotProps.option.corporate_info?.department }}</span>
                                </div>
                            </div>
                        </template>
                        <template #empty>
                            <div class="p-2 text-sm text-gray-500">No se encontraron resultados.</div>
                        </template>
                    </AutoComplete>
                    <small class="text-gray-400 text-xs">Dejar vacío para Stock.</small>
                </div>



                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4 font-bold text-gray-600">Red</div>

                <div><label class="text-sm block mb-1">MAC Address</label>
                    <InputText v-model="form.mac_address" class="w-full font-mono" placeholder="AA:BB:CC..." />
                </div>
                <div><label class="text-sm block mb-1">IP Address</label>
                    <InputText v-model="form.ip_address" class="w-full font-mono" placeholder="192.168..." />
                </div>

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4 font-bold text-gray-600">Especificaciones y
                    Fechas
                </div>

                <div class="grid grid-cols-3 gap-2 col-span-2">
                    <div><label class="text-sm block mb-1">RAM</label>
                        <InputText v-model="form.ram" class="w-full" />
                    </div>
                    <div><label class="text-sm block mb-1">Almacenamiento</label>
                        <InputText v-model="form.storage" class="w-full" />
                    </div>
                    <div><label class="text-sm block mb-1">Procesador</label>
                        <InputText v-model="form.processor" class="w-full" />
                    </div>

                </div>

                <div class="grid grid-cols-3 gap-2 col-span-2">

                    <div><label class="text-sm block mb-1">Fecha Compra</label>
                        <Calendar v-model="form.purchase_date" showIcon class="w-full" />
                    </div>
                    <div><label class="text-sm block mb-1">Fin Garantía</label>
                        <Calendar v-model="form.warranty_expiry" showIcon class="w-full" />
                    </div>
                </div>

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4 font-bold text-gray-600">
                    Móvil / Detalles Adicionales
                </div>

                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 col-span-2">
                    <div>
                        <label class="text-sm block mb-1">IMEI</label>
                        <InputText v-model="form.imei" class="w-full font-mono" placeholder="Solo Móviles" />
                    </div>
                    <div>
                        <label class="text-sm block mb-1">Número Tel.</label>
                        <InputText v-model="form.phone_number" class="w-full" placeholder="+52..." />
                    </div>
                    <div>
                        <label class="text-sm block mb-1">SIM Card ID</label>
                        <InputText v-model="form.sim" class="w-full" />
                    </div>
                    <div>
                        <label class="text-sm block mb-1">Carrier (Telcel/AT&T)</label>
                        <InputText v-model="form.carrier" class="w-full" />
                    </div>
                    <div>
                        <label class="text-sm block mb-1">Plan</label>
                        <InputText v-model="form.plan" class="w-full" placeholder="Plan Empresarial..." />
                    </div>
                </div>

                <div class="col-span-1 md:col-span-2 mt-2">
                    <label class="text-sm block mb-1">Descripción / Notas</label>
                    <Textarea v-model="form.description" rows="3" class="w-full"
                        placeholder="Detalles adicionales del activo..." />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" text @click="assetDialog = false"
                        class="text-gray-500" />
                    <Button label="Guardar Activo" icon="pi pi-check" @click="saveAsset"
                        :loading="assetStore.isLoading" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" header="Confirmar" modal class="w-96">
            <p>¿Eliminar este activo: <b>{{ selectedAssetToDelete?.info.hilton_name }}</b> permanentemente?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteDialog = false" />
                <Button label="Sí, Eliminar" severity="danger" icon="pi pi-check" @click="deleteAsset"
                    :loading="assetStore.isLoading" />
            </template>
        </Dialog>
    </div>
</template>