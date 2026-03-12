<script setup lang="ts">
import { ref, onMounted, computed, provide } from 'vue';
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
import { departmentService, listDepartments, type Department } from '@/modules/department/services/department.service';
import { categoryService, listCategories } from '@/modules/assets_category/services/category.service'; // NUEVO: Importamos categorías
import type { Category } from '@/modules/assets_category/types/category.types';

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
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
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
const categories = ref<Category[]>([]);
const departments = ref<Department[]>([]);

// --- ESTADO PARA ELIMINAR ---
const selectedAssetToDelete = ref<Asset | null>(null);

// --- FILTROS ---
const searchValue = ref('');
const filterProperty = ref<number | null>(null);
const filterCategory = ref<number | null>(null);
const filteredCategories = ref<Category[]>([]);
const selectedCategoryObject = ref<Category | null>(null);
const filterStatus = ref<string | null>(null);
const filterMember = ref<number | null>(null);
const filteredMembers = ref<any[]>([]);
const selectedMemberObject = ref<any>(null);
const filteredProviders = ref<any[]>([]);
const selectedProviderObject = ref<any>(null);
const filterDepartment = ref<number | null>(null);
const selectedDepartmentObject = ref<any>(null);
const filteredDepartments = ref<any[]>([]);

// --- FORMULARIO ---
const form = ref({
    id: 0,
    property_id: null as number | null,
    category_id: null as number | null,
    quantity: 1, // 
    price: null as number | null,
    accessories: [] as Array<{ id?: number, type: string, brand: string, serial_number: string }>,

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

const addAccessory = () => {
    form.value.accessories.push({ type: '', brand: '', serial_number: '' });
};

const removeAccessory = (index: number) => {
    form.value.accessories.splice(index, 1);
};

// Búsqueda de miembros (Server Side)

const searchMember = async (event: AutoCompleteCompleteEvent) => {
    const query = event.query.trim();
    if (!query) return;

    try {
        const response = await memberService.getAll(1, 20, query );
        filteredMembers.value = response.data;
    } catch (e) {
        console.error("Error buscando miembro", e);
    }
};

const searchCategory = async (event: AutoCompleteCompleteEvent) => {
    const query = event.query.trim();
    if (!query) return;

    try {
        const response = await categoryService.getAll(1, 20, query);
        filteredCategories.value = response.data;
    } catch (e) {
        console.error("Error buscando categoría", e);
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


watch(selectedMemberObject, (newValue) => {
    if (!assetDialog.value) {
        filterMember.value = newValue ? newValue.id : null;
        onFilterChange();
    }
});

watch(selectedCategoryObject, (newValue) => {
    if (!assetDialog.value) {
        filterCategory.value = newValue ? newValue.id : null;
        onFilterChange();
    }
});

watch(selectedProviderObject, (newValue) => {
    if (!assetDialog.value) {
        filterProperty.value = newValue ? newValue.id : null;
        onFilterChange();
    }
});

watch(selectedDepartmentObject, (newValue) => {
    if (!assetDialog.value) {
        filterDepartment.value = newValue ? newValue.id : null;
        onFilterChange();
    }
});


// Paginación
const lazyParams = ref({ first: 0, rows: 15, page: 0 });

// --- CICLO DE VIDA ---
onMounted(async () => {
    properties.value = await listProperties();
    categories.value = await listCategories();
    departments.value = await listDepartments();

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
        filterMember.value || undefined,
        undefined,
        filterDepartment.value || undefined
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
        filterMember.value || undefined,
        undefined,
        filterDepartment.value || undefined
    );
    return response.data;
};

const exportCSV = async () => {
    const data = await fetchAllForExport();
    const exportData = data.map((a: Asset, index: number) => ({
        '#': index + 1,
        'Propiedad': a.location.property_name,
        'Categoría': a.category.name,
        'Marca': a.info.brand || '-',
        'Modelo': a.info.model || '-',
        'Serial': a.info.serial_number || '-',
        'Nombre Hilton': a.info.hilton_name || '-',
        'Proveedor': a.provider?.name || '-',
        'Precio': a.price ? `$${a.price.toFixed(2)}` : '-',
        'TM': a.assigned_to?.tm_id || '-',
        'Asignado A': a.assigned_to?.full_name || 'Stock',
        'Departamento': a.assigned_to?.department || 'Sin Departamento',
        'Puesto': a.assigned_to?.position || 'Sin Puesto',
        'Estado': formatStatus(a.status),
        'IP': a.network.ip_address || '-',
        'MAC': a.network.mac_address || '-',
        'Fecha de Compra': a.dates.purchase ? new Date(a.dates.purchase).toLocaleDateString('es-MX') : '-',
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
        { header: 'Precio', dataKey: 'price' },
        { header: 'Asignado', dataKey: 'assigned' },
        { header: 'Departamento', dataKey: 'department' },
        { header: 'Estado', dataKey: 'status' },
        { header: 'MAC', dataKey: 'mac' }
    ];

    const rows = data.map((a: Asset, index: number) => ({
        row_num: index + 1,
        property: a.location.property_name,
        category: a.category.name,
        brand: a.info.brand || '',
        model: `${a.info.brand || ''} ${a.info.model || ''}`,
        serial: a.info.serial_number || '-',
        hilton_name: a.info.hilton_name || '-',
        price: a.price ? `$${a.price.toFixed(2)}` : '-',
        assigned: a.assigned_to?.full_name || 'Stock',
        department: a.assigned_to?.department || 'Sin Departamento',
        status: formatStatus(a.status),
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
        id: 0, property_id: null, category_id: null, quantity: 1, price: null, accessories: [],
        brand: '', model: '', serial_number: '', hilton_name: '', mac_address: '', ip_address: '', status: 'active',
        purchase_date: null, warranty_expiry: null,

        ram: '', storage: '', processor: '', // provider: '',
        imei: '', sim: '', plan: '', carrier: '', phone_number: '', description: ''
    };

    selectedCategoryObject.value = null;
    selectedMemberObject.value = null;
    selectedProviderObject.value = null;
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

    if (asset.category) {
        selectedCategoryObject.value = {
            id: asset.category.id,
            name: asset.category.name,
            prefix: asset.category.prefix,
            icon: asset.category.icon
        } as any;
    } else {
        selectedCategoryObject.value = null;
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
        category_id: asset.category.id,
        quantity: 1,
        accessories: asset.accessories ? asset.accessories.map(a => ({
            id: a.id,
            type: a.type,
            brand: a.brand || '',
            serial_number: a.serial_number || ''
        })) : [],
        price: asset.price,
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

    if (!selectedCategoryObject.value || !form.value.property_id || !form.value.status) {
        toast.add({ severity: 'warn', summary: 'Datos Faltantes', detail: 'Propiedad, Categoría y Estado son obligatorios', life: 3000 });
        return;
    }

    const payload: CreateAssetPayload = {
        property_id: form.value.property_id!,
        category_id: selectedCategoryObject.value.id,
        quantity: isEditMode.value ? 1 : form.value.quantity,
        accessories_base: form.value.accessories.map(acc => ({
            type: acc.type,
            brand: acc.brand,
            serial_number: isEditMode.value ? acc.serial_number : undefined
        })),
        price: form.value.price,

        member_id: selectedMemberObject.value ? selectedMemberObject.value.id : null,
        provider_id: selectedProviderObject.value ? selectedProviderObject.value.id : null,

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


const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '$0.00';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
};

// --- LÓGICA DINÁMICA DE CATEGORÍAS (Senior UI/UX) ---
const hasNetworkFields = computed(() => selectedCategoryObject.value?.has_network_fields || false);

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

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-md ">

                <Select v-model="filterProperty" :options="properties" optionLabel="name" optionValue="id"
                    placeholder="Todas las Propiedades" class="w-full" showClear filter @change="onFilterChange">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-building text-gray-400"></i>
                            <span>{{ slotProps.option.name }}</span>
                        </div>
                    </template>
                </Select>

                <Select v-model="filterCategory" :options="categories" optionLabel="name" optionValue="id"
                    placeholder="Todas las Categorías" class="w-full" showClear filter @change="onFilterChange">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <i :class="slotProps.option.icon" class="text-gray-400"></i>
                            <span>{{ slotProps.option.name }}</span>
                        </div>
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

                <AutoComplete v-model="selectedDepartmentObject" :suggestions="filteredDepartments" optionLabel="name"
                    placeholder="Buscar por Departamento..." class="w-full" @complete="searchDepartment" showClear
                    dropdown>

                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-sitemap text-gray-400"></i>
                            <span class="font-medium text-gray-700">{{ slotProps.option.name }}</span>
                        </div>
                    </template>
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
                        <span class="font-bold text-sm text-gray-800 flex items-center gap-2">
                            <i v-if="slotProps.data.category?.icon" :class="slotProps.data.category.icon"
                                class="text-gray-500"></i>
                            {{ slotProps.data.category?.name || 'Sin Categoría' }}
                        </span>
                        <span class=" text-gray-500 text-xs mt-1">
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

                    <Tag v-else value="EN STOCK" severity="info" class="text-xs px-2" />
                </template>
            </Column>

            <Column header="Departamento" style="min-width: 200px">
                <template #body="slotProps">
                    <span v-if="slotProps.data.assigned_to" class="text-sm">
                        {{ slotProps.data.assigned_to?.department }}
                    </span>
                    <Tag v-else value="SIN ASIGNACIÓN" severity="danger" class="text-xs" />
                </template>
            </Column>

            <Column header="Propiedad" style="min-width: 200px">
                <template #body="slotProps">
                    <span class="text-sm">{{ slotProps.data.location.property_name }}</span>
                </template>
            </Column>

            <Column field="price" header="Precio Unitario" style="min-width: 100px">

                <template #body="{ data }">
                    <div class="flex justify-end items-center w-full">
                        <span class="text-sm font-medium text-gray-700 tabular-nums">
                            {{ formatCurrency(data.price) }}
                        </span>
                        <span class="text-[10px] text-gray-400 ml-1 font-semibold">MX</span>
                    </div>
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
            class="w-full max-w-6xl" :draggable="false" :breakpoints="{ '1199px': '75vw', '575px': '95vw' }">

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 p-2">

                <div class="col-span-1 lg:col-span-7 flex flex-col gap-6">

                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div class="border-b pb-2 mb-4 font-bold text-gray-700 flex items-center gap-2">
                            <i class="pi pi-box text-blue-600"></i> Identificación del Equipo
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="sm:col-span-2">
                                <label class="text-sm font-medium text-gray-700 block mb-1">Propiedad <span
                                        class="text-red-500">*</span></label>
                                <Select v-model="form.property_id" :options="properties" optionLabel="name"
                                    optionValue="id" class="w-full" filter placeholder="Seleccione la propiedad..." />
                            </div>

                            <div class="sm:col-span-2">
                                <label class="text-sm font-medium text-gray-700 block mb-1">Categoría <span
                                        class="text-red-500">*</span></label>
                                <AutoComplete v-model="selectedCategoryObject" :suggestions="filteredCategories"
                                    optionLabel="name" placeholder="Buscar categoría..." class="w-full"
                                    @complete="searchCategory" :dropdown="true" showClear forceSelection>
                                    <template #option="slotProps">
                                        <div class="flex items-center gap-3">
                                            <i :class="slotProps.option.icon" class="text-gray-500"></i>
                                            <span class="font-bold text-gray-800">{{ slotProps.option.name }}</span>
                                        </div>
                                    </template>
                                </AutoComplete>
                            </div>

                            <div>
                                <label class="text-sm font-medium text-gray-700 block mb-1">Marca</label>
                                <InputText v-model.trim="form.brand" class="w-full" placeholder="Ej. Dell, HP..."
                                    maxlength="50" />
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700 block mb-1">Modelo</label>
                                <InputText v-model.trim="form.model" class="w-full" placeholder="Ej. Latitude 5420"
                                    maxlength="100" />
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700 block mb-1">Número de Serie</label>
                                <InputText v-model.trim="form.serial_number" class="w-full font-mono uppercase"
                                    placeholder="S/N" maxlength="100" />
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700 block mb-1">Hilton Name</label>
                                <InputText v-model.trim="form.hilton_name" class="w-full font-mono uppercase"
                                    placeholder="Ej. CUNQR-LT-01" maxlength="100" />
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div class="border-b pb-2 mb-4 font-bold text-gray-700 flex items-center gap-2">
                            <i class="pi pi-shopping-cart text-green-600"></i> Compras y Logística
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="sm:col-span-2">
                                <label class="text-sm font-medium text-gray-700 block mb-1">Proveedor Autorizado</label>
                                <AutoComplete v-model="selectedProviderObject" :suggestions="filteredProviders"
                                    optionLabel="name" placeholder="Buscar por Proveedor..." class="w-full"
                                    @complete="searchProvider" :dropdown="true" showClear forceSelection>
                                    <template #option="slotProps">
                                        <div class="flex flex-col">
                                            <span class="font-bold text-gray-800">{{ slotProps.option.name }}</span>
                                            <span v-if="slotProps.option.tax_id"
                                                class="text-xs text-gray-500 mt-1 bg-gray-200 px-2 py-0.5 rounded w-fit">
                                                {{ slotProps.option.tax_id }}
                                            </span>
                                        </div>
                                    </template>
                                    <template #empty>
                                        <div class="p-2 text-sm text-gray-500">No se encontraron resultados.</div>
                                    </template>
                                </AutoComplete>
                            </div>

                            <div v-if="!isEditMode">
                                <label class="text-sm font-medium text-gray-700 block mb-1">Cantidad a Ingresar</label>
                                <InputNumber v-model="form.quantity" class="w-full" :min="1" :max="100" showButtons />
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700 block mb-1">Precio Unitario ($)</label>
                                <InputNumber v-model="form.price" class="w-full" mode="currency" currency="USD"
                                    locale="en-US" :min="0" :max="999999" />
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700 block mb-1">Fecha Compra</label>
                                <Calendar v-model="form.purchase_date" showIcon class="w-full" dateFormat="dd/mm/yy"
                                    :maxDate="new Date()" />
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700 block mb-1">Vencimiento Garantía</label>
                                <Calendar v-model="form.warranty_expiry" showIcon class="w-full"
                                    dateFormat="dd/mm/yy" />
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div class="border-b pb-2 mb-4 font-bold text-gray-700 flex items-center gap-2">
                            <i class="pi pi-users text-pink-500"></i> Asignación y Estatus
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium text-gray-700 block mb-1">Estado Operativo <span
                                        class="text-red-500">*</span></label>
                                <Select v-model="form.status" :options="statusOptions" optionLabel="label"
                                    optionValue="value" class="w-full" />
                            </div>

                            <div class="sm:col-span-2">
                                <label class="text-sm font-medium text-gray-700 block mb-1">Asignado a
                                    (Colaborador)</label>
                                <AutoComplete v-model="selectedMemberObject" :suggestions="filteredMembers"
                                    optionLabel="full_name" placeholder="Dejar vacío para mantener en Stock..."
                                    class="w-full" @complete="searchMember" :dropdown="true" showClear forceSelection>
                                    <template #option="slotProps">
                                        <div class="flex flex-col">
                                            <span class="font-bold text-gray-800">{{ slotProps.option.full_name
                                                }}</span>
                                            <span class="text-xs text-gray-500"><i
                                                    class="pi pi-id-card text-[10px]"></i> {{ slotProps.option.tm_id ||
                                                'Sin ID' }} | {{ slotProps.option.corporate_info?.department }}</span>
                                        </div>
                                    </template>
                                </AutoComplete>
                            </div>

                            <div class="sm:col-span-2">
                                <label class="text-sm font-medium text-gray-700 block mb-1">Descripción
                                    Adicional</label>
                                <Textarea v-model.trim="form.description" rows="2" class="w-full resize-none"
                                    placeholder="Observaciones del equipo..." maxlength="500" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1 lg:col-span-5 flex flex-col gap-4">

                    <div v-if="!selectedCategoryObject"
                        class="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-center">
                        <i class="pi pi-server text-5xl mb-4 text-gray-300"></i>
                        <h3 class="text-lg font-bold text-gray-600">Configuración Dinámica</h3>
                        <p class="text-sm mt-2">Selecciona una categoría a la izquierda para habilitar las opciones de
                            red,
                            especificaciones y accesorios.</p>
                    </div>

                    <template v-else>

                        <div v-if="hasNetworkFields"
                            class="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <div
                                class="border-b border-indigo-100 pb-2 mb-3 font-bold text-indigo-800 flex items-center gap-2">
                                <i class="pi pi-wifi"></i> Conectividad de Red
                            </div>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-xs font-bold text-indigo-600 block mb-1">MAC Address</label>
                                    <InputText v-model.trim="form.mac_address"
                                        class="w-full font-mono uppercase text-sm" placeholder="00:1B:44:11:3A:B7"
                                        maxlength="17" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-indigo-600 block mb-1">IP Address</label>
                                    <InputText v-model.trim="form.ip_address" class="w-full font-mono text-sm"
                                        placeholder="192.168.x.x" maxlength="15" />
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div
                                class="border-b border-gray-100 pb-2 mb-3 font-bold text-gray-700 flex items-center gap-2">
                                <i class="pi pi-microchip text-purple-500"></i> Hardware y Especificaciones
                            </div>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div class="col-span-2">
                                    <label class="text-xs font-bold text-gray-600 block mb-1">Procesador</label>
                                    <InputText v-model.trim="form.processor" class="w-full p-2" maxlength="50" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-gray-600 block mb-1">RAM</label>
                                    <InputText v-model.trim="form.ram" class="w-full p-2" maxlength="30" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-gray-600 block mb-1">Disco / Storage</label>
                                    <InputText v-model.trim="form.storage" class="w-full p-2" maxlength="50" />
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div
                                class="border-b border-gray-100 pb-2 mb-3 font-bold text-gray-700 flex items-center gap-2">
                                <i class="pi pi-mobile text-teal-500"></i> Datos Celulares (Si Aplica)
                            </div>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div class="col-span-2">
                                    <label class="text-xs font-bold text-gray-600 block mb-1">IMEI</label>
                                    <InputText v-model.trim="form.imei" class="w-full p-2 font-mono uppercase"
                                        maxlength="20" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-gray-600 block mb-1">Número Tel.</label>
                                    <InputText v-model.trim="form.phone_number" class="w-full p-2 font-mono"
                                        maxlength="20" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-gray-600 block mb-1">SIM ID</label>
                                    <InputText v-model.trim="form.sim" class="w-full p-2" maxlength="30" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-gray-600 block mb-1">Carrier</label>
                                    <InputText v-model.trim="form.carrier" class="w-full p-2" maxlength="30" />
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-gray-600 block mb-1">Plan Tarifario</label>
                                    <InputText v-model.trim="form.plan" class="w-full p-2" maxlength="100" />
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1">
                            <div
                                class="border-b border-gray-100 pb-2 mb-3 font-bold text-gray-700 flex justify-between items-center">
                                <div class="flex items-center gap-2"><i class="pi pi-plug text-orange-500"></i>
                                    Accesorios</div>
                                <Button label="Añadir" icon="pi pi-plus" size="small" outlined severity="secondary"
                                    @click="addAccessory" class="py-1 px-2 text-xs" />
                            </div>

                            <div v-if="form.accessories.length === 0"
                                class="text-sm text-gray-400 italic text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                Sin accesorios vinculados a este equipo.
                            </div>

                            <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
                                <div v-for="(acc, index) in form.accessories" :key="index"
                                    class="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div class="col-span-12 sm:col-span-4">
                                        <label
                                            class="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Tipo
                                            *</label>
                                        <InputText v-model.trim="acc.type" class="w-full text-sm p-1.5"
                                            placeholder="Mouse..." maxlength="50" />
                                    </div>
                                    <div class="col-span-12 sm:col-span-3">
                                        <label
                                            class="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Marca</label>
                                        <InputText v-model.trim="acc.brand" class="w-full text-sm p-1.5"
                                            maxlength="50" />
                                    </div>
                                    <div class="col-span-10 sm:col-span-4">
                                        <label
                                            class="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">S/N</label>
                                        <InputText v-model.trim="acc.serial_number"
                                            class="w-full text-sm p-1.5 font-mono uppercase"
                                            :disabled="!isEditMode && form.quantity > 1" maxlength="100" />
                                    </div>
                                    <div class="col-span-2 sm:col-span-1 flex justify-center pb-1">
                                        <Button icon="pi pi-trash" severity="danger" text rounded
                                            @click="removeAccessory(index)" class="w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </template>
                </div>
            </div>

            <template #footer>
                <div
                    class="flex justify-end gap-3 pt-4 -mx-4 -mb-4 px-6 pb-4 rounded-b-lg">
                    <Button label="Cancelar" icon="pi pi-times" severity="secondary" text
                        @click="assetDialog = false" />
                    <Button :label="isEditMode ? 'Guardar Cambios' : 'Crear Activo(s)'" icon="pi pi-check"
                        @click="saveAsset" :loading="assetStore.isLoading" class="px-6" />
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