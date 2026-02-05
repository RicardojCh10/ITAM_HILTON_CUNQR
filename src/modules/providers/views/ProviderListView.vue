<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useProviderStore } from '../store/provider.store';
import { providerService } from '../services/provider.service';
import type { Provider, ProviderPayload } from '../types/provider.types';

// PDF Y EXCEL export
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Componentes PrimeVue
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Toolbar from 'primevue/toolbar';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import InputIcon from 'primevue/inputicon';
import IconField from 'primevue/iconfield';

const providerStore = useProviderStore();
const toast = useToast();

// --- ESTADOS DE UI ---
const providerDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const isEditMode = ref(false);
const providerToDelete = ref<Provider | null>(null);

// --- FILTROS Y PAGINACIÓN ---
const searchValue = ref('');
const lazyParams = ref({
    first: 0,
    rows: 15,
    page: 0
});

// --- FORMULARIO (PLANO) ---
// Mantenemos la estructura plana para enviar al backend
const form = ref<ProviderPayload>({
    name: '',
    legal_name: '',
    tax_id: '',
    address: '',
    website: '',
    
    // Contacto Empresa
    phone: '',
    email: '',

    // Representante
    contact_name: '',
    contact_position: '',
    contact_phone: '',
    contact_email: ''
});
const editId = ref<number | null>(null);

// --- CICLO DE VIDA ---
onMounted(() => {
    loadLazyData();
});

// --- LÓGICA DE CARGA DE DATOS ---
const loadLazyData = () => {
    const page = lazyParams.value.page + 1;
    providerStore.fetchProviders(
        page, 
        lazyParams.value.rows, 
        searchValue.value
    );
};

const onPage = (event: DataTablePageEvent) => {
    lazyParams.value = event;
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

// --- EXPORTACIONES ---
const fetchAllForExport = async () => {
    const response = await providerService.getAll(1, 10000, searchValue.value);
    return response.data;
};

const exportCSV = async () => {
    const data = await fetchAllForExport();
    const exportData = data.map((p: Provider) => ({
        'Nombre Comercial': p.name,
        'Razón Social': p.legal_name || '-',
        'RFC / Tax ID': p.tax_id || '-',
        'Teléfono Empresa': p.company_contact.phone || '-',
        'Email Empresa': p.company_contact.email || '-',
        'Contacto': p.representative.name || '-',
        'Puesto Contacto': p.representative.position || '-',
        'Tel. Contacto': p.representative.phone || '-',
        'Email Contacto': p.representative.email || '-',
        'Sitio Web': p.website || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proveedores");
    XLSX.writeFile(workbook, `Proveedores_${new Date().toISOString().slice(0,10)}.xlsx`);
};

const exportPDF = async () => {
    const data = await fetchAllForExport();
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

    const columns = [
        { header: 'Proveedor', dataKey: 'name' },
        { header: 'RFC', dataKey: 'tax_id' },
        { header: 'Teléfono', dataKey: 'phone' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Contacto', dataKey: 'contact' },
        { header: 'Puesto', dataKey: 'position' }
    ];

    const rows = data.map((p: Provider) => ({
        name: p.name,
        tax_id: p.tax_id || '-',
        phone: p.company_contact.phone || '-',
        email: p.company_contact.email || '-',
        contact: p.representative.name || '-',
        position: p.representative.position || '-'
    }));

    autoTable(doc, {
        columns: columns,
        body: rows,
        margin: { top: 20 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        didDrawPage: () => {
            doc.text('Directorio de Proveedores', 14, 15);
        }
    });
    doc.save(`Proveedores_${new Date().toISOString().slice(0,10)}.pdf`);
};

// --- ACCIONES CRUD ---

// 1. ABRIR CREAR
const openNew = () => {
    form.value = {
        name: '', legal_name: '', tax_id: '', address: '', website: '',
        phone: '', email: '',
        contact_name: '', contact_position: '', contact_phone: '', contact_email: ''
    };
    editId.value = null;
    submitted.value = false;
    isEditMode.value = false;
    providerDialog.value = true;
};

// 2. ABRIR EDITAR (Aplanamiento de datos)
const editProvider = (provider: Provider) => {
    editId.value = provider.id;
    
    // Mapeamos del objeto anidado (Resource) al objeto plano (Payload)
    form.value = {
        name: provider.name,
        legal_name: provider.legal_name,
        tax_id: provider.tax_id,
        address: provider.address,
        website: provider.website,
        
        phone: provider.company_contact?.phone,
        email: provider.company_contact?.email,

        contact_name: provider.representative?.name,
        contact_position: provider.representative?.position,
        contact_phone: provider.representative?.phone,
        contact_email: provider.representative?.email,
    };

    submitted.value = false;
    isEditMode.value = true;
    providerDialog.value = true;
};

// 3. GUARDAR
const saveProvider = async () => {
    submitted.value = true;
    
    // Validaciones básicas
    if (!form.value.name?.trim()) return;

    try {
        if (isEditMode.value && editId.value) {
            await providerStore.updateProvider(editId.value, form.value);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor actualizado', life: 3000 });
        } else {
            await providerStore.createProvider(form.value);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor creado', life: 3000 });
        }
        providerDialog.value = false;
        loadLazyData();
    } catch (e: any) {
        // Manejo de errores de validación (ej: RFC duplicado)
        const msg = e.response?.data?.message || 'No se pudo guardar.';
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
    }
};

// 4. CONFIRMAR ELIMINAR
const confirmDelete = (prov: Provider) => {
    providerToDelete.value = prov;
    deleteDialog.value = true;
};

// 5. EJECUTAR ELIMINACIÓN
const deleteProvider = async () => {
    if (providerToDelete.value) {
        try {
            await providerStore.deleteProvider(providerToDelete.value.id);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor eliminado', life: 3000 });
            deleteDialog.value = false;
            providerToDelete.value = null;
            loadLazyData();
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se puede eliminar (posiblemente tiene activos asignados)', life: 5000 });
        }
    }
};
</script>

<template>
    <div class="w-full max-w-none p-4">

        <Toolbar class="mb-4 shadow-sm border-gray-200">
            <template #start>
                <div class="flex flex-wrap items-center gap-3">
                    <Button label="Nuevo Proveedor" icon="pi pi-plus"
                        class="bg-blue-600 hover:bg-blue-700 text-white border-none" @click="openNew" />
                </div>
            </template>

            <template #end>
                <div class="flex items-center gap-2">
                    <Button icon="pi pi-file-excel" severity="success" text rounded @click="exportCSV" v-tooltip.top="'Exportar Excel'" />
                    <Button icon="pi pi-file-pdf" severity="danger" text rounded @click="exportPDF" v-tooltip.top="'Exportar PDF'" />
                    <Button icon="pi pi-refresh" text rounded @click="loadLazyData" v-tooltip.top="'Recargar'" />
                </div>
            </template>
        </Toolbar>

        <DataTable :value="providerStore.providers" :lazy="true" :paginator="true" :rows="lazyParams.rows"
            :totalRecords="providerStore.totalRecords" :loading="providerStore.isLoading" @page="onPage"
            class="shadow-md rounded-lg overflow-hidden" :rowsPerPageOptions="[5, 10, 15, 25, 50]" dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} proveedores" stripedRows removableSort>

            <template #header>
                <div class="flex flex-wrap justify-between items-center gap-3 p-2">
                    <h4 class="text-xl font-bold text-gray-700 m-0">
                        Directorio de Proveedores
                    </h4>
                    <IconField iconPosition="left">
                        <InputIcon><i class="pi pi-search text-gray-500" /></InputIcon>
                        <InputText v-model="searchValue" @input="onFilterChange" placeholder="Buscar proveedor..."
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

            <Column field="name" header="Empresa" style="min-width: 200px">
                <template #body="{ data }">
                    <div class="font-bold text-gray-800">{{ data.name }}</div>
                    <div class="text-xs text-gray-500" v-if="data.legal_name">{{ data.legal_name }}</div>
                </template>
            </Column>

            <Column field="tax_id" header="RFC" style="min-width: 150px">
                <template #body="{ data }">
                    <span class="font-mono text-sm text-gray-600">{{ data.tax_id || '-' }}</span>
                </template>
            </Column>

            <Column header="Contacto Empresa" style="min-width: 200px">
                <template #body="{ data }">
                    <div class="flex flex-col gap-1">
                        <div v-if="data.company_contact.phone" class="text-sm text-gray-600 flex items-center gap-2">
                            <i class="pi pi-phone text-xs"></i> {{ data.company_contact.phone }}
                        </div>
                        <div v-if="data.company_contact.email" class="text-sm text-gray-600 flex items-center gap-2">
                            <i class="pi pi-envelope text-xs"></i> {{ data.company_contact.email }}
                        </div>
                        <div v-if="data.website" class="text-xs text-blue-500 flex items-center gap-2">
                            <i class="pi pi-globe text-[10px]"></i> 
                            <a :href="data.website" target="_blank" class="hover:underline">Sitio Web</a>
                        </div>
                    </div>
                </template>
            </Column>

            <Column header="Representante" style="min-width: 200px">
                <template #body="{ data }">
                    <div v-if="data.representative.name">
                        <div class="font-medium text-gray-800 text-sm">{{ data.representative.name }}</div>
                        <div class="text-xs text-gray-400 mb-1">{{ data.representative.position }}</div>
                        
                        <div v-if="data.representative.phone" class="text-xs text-gray-500">
                           Directo: {{ data.representative.phone }}
                        </div>
                    </div>
                    <span v-else class="text-gray-400 italic text-xs">- Sin asignar -</span>
                </template>
            </Column>

            <Column header="Acciones" style="min-width: 100px" alignFrozen="right" frozen>
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" severity="info"
                            class="p-button-rounded p-button-outlined text-white" @click="editProvider(slotProps.data)"
                            v-tooltip.top="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger"
                            class="p-button-rounded p-button-outlined text-white" @click="confirmDelete(slotProps.data)"
                            v-tooltip.top="'Eliminar'" />
                    </div>
                </template>
            </Column>

        </DataTable>

        <Dialog v-model:visible="providerDialog" :header="isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'" modal
            class="w-full max-w-4xl">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2">
                    <span class="text-gray-600 font-bold text-lg">
                        <i class="pi pi-building mr-2"></i>Datos de la Empresa
                    </span>
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Nombre Comercial <span class="text-red-500">*</span></label>
                    <InputText v-model="form.name" class="w-full" :class="{'p-invalid': submitted && !form.name}" autofocus />
                    <small v-if="submitted && !form.name" class="text-red-500">El nombre es requerido.</small>
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">RFC</label>
                    <InputText v-model="form.tax_id" class="w-full" />
                </div>

                <div class="col-span-1 md:col-span-2">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Razón Social (Nombre Legal)</label>
                    <InputText v-model="form.legal_name" class="w-full" />
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Teléfono General</label>
                    <InputText v-model="form.phone" class="w-full" placeholder="+52..." />
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Email General</label>
                    <InputText v-model="form.email" class="w-full" />
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Sitio Web</label>
                    <InputText v-model="form.website" class="w-full" placeholder="https://..." />
                </div>

                <div class="col-span-1 md:col-span-2">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Dirección Fiscal / Física</label>
                    <Textarea v-model="form.address" rows="2" class="w-full" autoResize />
                </div>

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4">
                    <span class="text-gray-600 font-bold text-lg">
                        <i class="pi pi-user mr-2"></i>Contacto / Representante
                    </span>
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Nombre Contacto</label>
                    <InputText v-model="form.contact_name" class="w-full" />
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Puesto / Cargo</label>
                    <InputText v-model="form.contact_position" class="w-full" />
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Teléfono Directo</label>
                    <InputText v-model="form.contact_phone" class="w-full" />
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-medium mb-1 text-gray-700">Email Directo</label>
                    <InputText v-model="form.contact_email" class="w-full" />
                </div>

            </div>

            <template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" text @click="providerDialog = false" class="text-gray-500" />
                    <Button label="Guardar" icon="pi pi-check" @click="saveProvider" :loading="providerStore.isLoading"
                        class="bg-blue-600 text-white border-none hover:bg-blue-700" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" header="Confirmar Eliminación" modal class="w-96">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500"></i>
                <div class="text-gray-700 leading-relaxed">
                    <p>¿Estás seguro de eliminar a <b>{{ providerToDelete?.name }}</b>?</p>
                    <p class="text-xs text-gray-500 mt-1">
                        Esta acción no se puede deshacer. Si tiene activos asignados, no se podrá eliminar.
                    </p>
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" text @click="deleteDialog = false" />
                <Button label="Sí, Eliminar" severity="danger" icon="pi pi-trash" @click="deleteProvider"
                    :loading="providerStore.isLoading" />
            </template>
        </Dialog>

    </div>
</template>