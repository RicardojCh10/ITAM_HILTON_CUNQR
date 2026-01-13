<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from "primevue/useconfirm";
import { assetService } from '../services/asset.service';
import { useAssetStore } from '../store/asset.store';
import type { Asset, CreateAssetPayload } from '../types/asset.types';

// Servicios para el Formulario
import { listProperties, type Property } from '@/modules/properties/services/property.service';
import { memberService } from '@/modules/members/services/member.service';

// Componentes PrimeVue
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import Divider from 'primevue/divider';
import Panel from 'primevue/panel';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Calendar from 'primevue/calendar';
import AutoComplete from 'primevue/autocomplete';
import ConfirmDialog from 'primevue/confirmdialog';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const assetStore = useAssetStore();

// --- ESTADO ---
const asset = ref<Asset | null>(null);
const loading = ref(true);
const generatingPdf = ref(false); // Estado para el botón de PDF

// --- ESTADO EDICIÓN ---
const editDialog = ref(false);
const submitted = ref(false);
const properties = ref<Property[]>([]);
const filteredMembers = ref<any[]>([]);
const selectedMemberObject = ref<any>(null);

const statusOptions = ref([
    { label: 'ACTIVO', value: 'active' },
    { label: 'REPARACIÓN', value: 'repair' },
    { label: 'PERDIDO', value: 'lost' },
    { label: 'BAJA', value: 'retired' },
    { label: 'ALMACÉN', value: 'stored' }
]);
const categoryOptions = ref(['Laptop', 'Desktop', 'Monitor', 'Printer', 'Server', 'Tablet', 'Access Point', 'Switch', 'Phone', 'Celular', 'Other']);

// --- FORMULARIO ---
const form = ref({
    property_id: 0,
    member_id: null as number | null,
    category: '',
    status: 'active',
    brand: '',
    model: '',
    serial_number: '',
    hilton_name: '',
    mac_address: '',
    ip_address: '',
    
    // Fechas (Date objects)
    purchase_date: null as Date | null,
    warranty_expiry: null as Date | null,
    
    specs: {
        // Computo
        ram: '',
        storage: '',
        processor: '',
        provider: '',
        
        // CORRECCIÓN: Agregar campos móviles al estado inicial
        imei: '',
        sim: '',
        plan: '',
        carrier: '',
        phone_number: ''
    }
});

// Computed para saber si mostrar campos de celular en el formulario
const isMobile = computed(() => {
    const cat = form.value.category?.toLowerCase() || '';
    return cat.includes('phone') || cat.includes('celular') || cat.includes('tablet') || cat.includes('ipad') || cat.includes('mobile');
});

// --- DEFINICIÓN DE SPECS (Mapeo Visual) ---
const specDefinitions: Record<string, { label: string, icon: string, color: string, bg: string }> = {
    'processor': { label: 'Procesador', icon: 'fa-solid fa-microchip', color: 'text-purple-600', bg: 'bg-purple-50' },
    'ram': { label: 'Memoria RAM', icon: 'fa-solid fa-memory', color: 'text-blue-600', bg: 'bg-blue-50' },
    'storage': { label: 'Almacenamiento', icon: 'fa-solid fa-hard-drive', color: 'text-green-600', bg: 'bg-green-50' },
    'provider': { label: 'Proveedor', icon: 'fa-solid fa-truck-fast', color: 'text-orange-600', bg: 'bg-orange-50' },
    'screen_size': { label: 'Pantalla', icon: 'fa-solid fa-expand', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    'os': { label: 'Sistema Op.', icon: 'fa-brands fa-windows', color: 'text-gray-600', bg: 'bg-gray-50' },
    
    // Iconos para Móviles
    'imei': { label: 'IMEI', icon: 'fa-solid fa-barcode', color: 'text-slate-600', bg: 'bg-slate-50' },
    'sim': { label: 'SIM Card', icon: 'fa-solid fa-sim-card', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    'carrier': { label: 'Compañía', icon: 'fa-solid fa-tower-cell', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    'phone_number': { label: 'Número', icon: 'fa-solid fa-phone', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'plan': { label: 'Plan', icon: 'fa-solid fa-file-contract', color: 'text-pink-600', bg: 'bg-pink-50' },
};

const formattedSpecs = computed(() => {
    if (!asset.value?.specs) return [];
    
    return Object.entries(asset.value.specs)
        .filter(([_, value]) => value) 
        .map(([key, value]) => {
            const def = specDefinitions[key] || { 
                label: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '), 
                icon: 'pi pi-cog', color: 'text-gray-500', bg: 'bg-gray-50' 
            };
            
            return { key, value, ...def };
        });
});

// --- CICLO DE VIDA ---
onMounted(async () => {
    const id = Number(route.params.id);
    if (!id) { router.push({ name: 'AssetList' }); return; }
    await loadAsset(id);
});

const loadAsset = async (id: number) => {
    loading.value = true;
    try {
        asset.value = await assetService.getById(id);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el activo', life: 3000 });
        router.push({ name: 'AssetList' });
    } finally {
        loading.value = false;
    }
};

// --- ACCIONES ---

// 1. ABRIR EDICIÓN (Mapeo API -> Form)
const openEdit = async () => {
    if (!asset.value) return;
    
    if (properties.value.length === 0) properties.value = await listProperties();

    selectedMemberObject.value = asset.value.assigned_to ? {
        id: asset.value.assigned_to.member_id,
        name: asset.value.assigned_to.name,
        department: asset.value.assigned_to.department
    } : null;

    form.value = {
        property_id: asset.value.location.property_id,
        member_id: asset.value.assigned_to?.member_id || null,
        category: asset.value.info.category,
        status: asset.value.status,
        brand: asset.value.info.brand || '',
        model: asset.value.info.model || '',
        serial_number: asset.value.info.serial_number || '',
        hilton_name: asset.value.info.hilton_name || '',
        mac_address: asset.value.network.mac_address || '',
        ip_address: asset.value.network.ip_address || '',
        
        purchase_date: asset.value.dates.purchase ? new Date(asset.value.dates.purchase) : null,
        warranty_expiry: asset.value.dates.warranty ? new Date(asset.value.dates.warranty) : null,
        
        specs: {
            ram: asset.value.specs?.ram || '',
            storage: asset.value.specs?.storage || '',
            processor: asset.value.specs?.processor || '',
            provider: asset.value.specs?.provider || '',
            
            // CORRECCIÓN: Cargar datos móviles si existen
            imei: asset.value.specs?.imei || '',
            sim: asset.value.specs?.sim || '',
            plan: asset.value.specs?.plan || '',
            carrier: asset.value.specs?.carrier || '',
            phone_number: asset.value.specs?.phone_number || '',
        }
    };
    editDialog.value = true;
};

// 2. GUARDAR (Mapeo Form -> API)
const saveAsset = async () => {
    submitted.value = true;
    if (!form.value.category || !form.value.property_id || !form.value.status) return;

    const payload: CreateAssetPayload = {
        property_id: form.value.property_id,
        member_id: selectedMemberObject.value ? selectedMemberObject.value.id : null,
        category: form.value.category,
        status: form.value.status,
        
        brand: form.value.brand?.trim() || null,
        model: form.value.model?.trim() || null,
        serial_number: form.value.serial_number?.trim() || null,
        hilton_name: form.value.hilton_name?.trim() || null,
        mac_address: form.value.mac_address?.trim() || null,
        ip_address: form.value.ip_address?.trim() || null,
        
        purchase_date: form.value.purchase_date ? form.value.purchase_date.toISOString().split('T')[0] : null,
        warranty_expiry: form.value.warranty_expiry ? form.value.warranty_expiry.toISOString().split('T')[0] : null,
            
        specs: {
            ram: form.value.specs.ram,
            storage: form.value.specs.storage,
            processor: form.value.specs.processor,
            provider: form.value.specs.provider,
            
            // CORRECCIÓN: Enviar datos móviles al backend
            imei: form.value.specs.imei,
            sim: form.value.specs.sim,
            plan: form.value.specs.plan,
            carrier: form.value.specs.carrier,
            phone_number: form.value.specs.phone_number
        }
    };

    try {
        if (asset.value) {
            await assetStore.updateAsset(asset.value.id, payload);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Información guardada', life: 3000 });
            editDialog.value = false;
            await loadAsset(asset.value.id);
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar', life: 3000 });
    }
};

// 3. GENERAR PDF
const generatePdf = async () => {
    if (!asset.value) return;
    generatingPdf.value = true;
    try {
        toast.add({ severity: 'info', summary: 'Generando...', detail: 'Creando acta de entrega...', life: 2000 });
        await assetService.downloadAssignmentPdf(asset.value.id);
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Descarga iniciada', life: 3000 });
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF', life: 3000 });
    } finally {
        generatingPdf.value = false;
    }
};

const reportFailure = () => {
    confirm.require({
        message: '¿Confirmas que el equipo presenta fallas? El estado cambiará a REPARACIÓN.',
        header: 'Reportar Falla',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-warning',
        acceptLabel: 'Sí, Reportar',
        rejectLabel: 'Cancelar',
        accept: async () => {
            if (asset.value) {
                try {
                    await openEdit(); 
                    form.value.status = 'repair';
                    await saveAsset();
                } catch(e) { console.error(e) }
            }
        }
    });
};

// --- HELPERS ---
const searchMember = async (event: any) => {
    const response = await memberService.getAll(1, 10, event.query);
    filteredMembers.value = response.data.map(m => ({
        id: m.id, name: m.name, department: m.corporate_info?.department
    }));
};

const formatStatus = (status: string) => {
    const map: Record<string, string> = {
        'active': 'ACTIVO', 'repair': 'REPARACIÓN', 'lost': 'PERDIDO', 'retired': 'BAJA', 'stored': 'ALMACÉN'
    };
    return map[status] || status?.toUpperCase();
};

const getSeverity = (status: string) => {
    switch (status) {
        case 'active': return 'success';
        case 'repair': return 'warn';
        case 'lost': return 'danger';
        case 'retired': return 'secondary';
        default: return 'info';
    }
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
};

const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('laptop')) return 'fa-solid fa-laptop';
    if (cat.includes('desktop') || cat.includes('pc')) return 'fa-solid fa-desktop';
    if (cat.includes('monitor') || cat.includes('screen')) return 'fa-solid fa-display';
    if (cat.includes('tablet') || cat.includes('ipad')) return 'fa-solid fa-tablet-screen-button';
    if (cat.includes('phone') || cat.includes('mobile')) return 'fa-solid fa-mobile-screen';
    if (cat.includes('server')) return 'fa-solid fa-server';
    if (cat.includes('switch')) return 'fa-solid fa-network-wired';
    if (cat.includes('printer')) return 'fa-solid fa-print';
    return 'fa-solid fa-box-open';
};

const copyToClipboard = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.add({ severity: 'secondary', summary: 'Copiado', detail: text, life: 1000 });
};
</script>

<template>
    <div class="max-w-7xl mx-auto p-4">
        
        <div class="mb-6 flex items-center justify-between">
            <Button label="Volver al Inventario" icon="pi pi-arrow-left" text 
                @click="router.push({ name: 'AssetList' })" class="text-gray-600 hover:text-blue-600" />
            
            <div v-if="asset" class="flex gap-2">
                <Button 
                    v-if="asset.assigned_to"
                    label="Acta Entrega" 
                    icon="pi pi-file-pdf" 
                    severity="danger" 
                    outlined 
                    @click="generatePdf"
                    :loading="generatingPdf"
                />

                <Button label="Editar" icon="pi pi-pencil" severity="info" outlined @click="openEdit" />
                <Button label="Reportar Falla" icon="pi pi-exclamation-triangle" severity="warning" outlined @click="reportFailure" />
            </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton height="200px" class="md:col-span-2 rounded-xl" />
            <Skeleton height="200px" class="rounded-xl" />
        </div>

        <div v-else-if="asset" class="animate-fade-in space-y-6">

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
                <div class="flex items-center gap-5">
                    <div class="w-24 h-24 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center shadow-inner">
                        <i :class="getCategoryIcon(asset.info.category)" class="text-4xl drop-shadow-sm"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <h1 class="text-2xl font-bold text-gray-800">{{ asset.info.category }}</h1>
                            <Tag :value="formatStatus(asset.status)" :severity="getSeverity(asset.status)" class="px-3 py-1 font-bold" />
                        </div>
                        <p class="text-gray-500 text-lg">{{ asset.info.brand }} {{ asset.info.model }}</p>
                        <div class="flex gap-4 mt-3 text-sm font-mono text-gray-600">
                            <span class="bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200" @click="copyToClipboard(asset.info.serial_number)">
                                SN: {{ asset.info.serial_number || 'N/A' }} <i class="pi pi-copy text-xs ml-1"></i>
                            </span>
                            <span class="bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200" @click="copyToClipboard(asset.info.hilton_name)">
                                HN: {{ asset.info.hilton_name || 'N/A' }} <i class="pi pi-copy text-xs ml-1"></i>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="text-right hidden md:block">
                    <span class="block text-xs text-gray-400 uppercase tracking-wider">Asset ID</span>
                    <span class="text-4xl font-black text-gray-200">#{{ asset.id }}</span>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-1 space-y-6">
                    <Card class="shadow-sm border border-gray-100">
                        <template #title><div class="flex items-center gap-2 text-lg text-gray-800"><i class="pi pi-user text-blue-600"></i> Asignación</div></template>
                        <template #content>
                            <div v-if="asset.assigned_to" class="text-center p-2">
                                <div class="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold mx-auto mb-3">
                                    {{ asset.assigned_to.name?.charAt(0) }}
                                </div>
                                <h3 class="font-bold text-gray-800 text-lg">{{ asset.assigned_to.name }}</h3>
                                <span class="text-sm text-gray-500 block mb-3">{{ asset.assigned_to.department }}</span>
                                <Button label="Ver Perfil" text size="small" @click="router.push({name: 'MemberDetail', params: {id: asset.assigned_to.member_id}})" />
                            </div>
                            <div v-else class="text-center py-6">
                                <div class="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2"><i class="pi pi-box text-xl"></i></div>
                                <h3 class="font-bold text-gray-700">En Stock</h3>
                                <p class="text-xs text-gray-500 mt-1">Disponible para asignación</p>
                            </div>
                        </template>
                    </Card>

                    <Card class="shadow-sm border border-gray-100">
                         <template #title><div class="flex items-center gap-2 text-lg text-gray-800"><i class="pi pi-building text-blue-600"></i> Ubicación</div></template>
                        <template #content>
                            <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                                <i class="pi pi-map-marker text-red-500 text-xl"></i>
                                <div>
                                    <span class="block text-xs text-gray-500 font-semibold uppercase">Propiedad Actual</span>
                                    <span class="font-semibold text-sm text-gray-800">{{ asset.location.property_name }}</span>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <div class="lg:col-span-2 space-y-6">
                    
                    <Panel header="Red y Conectividad" toggleable>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-3 border rounded-lg bg-gray-50 flex justify-between items-center group">
                                <div><span class="text-xs font-semibold text-gray-500 block uppercase">IP Address</span><span class="font-mono font-medium text-gray-800">{{ asset.network.ip_address || 'Sin Configurar' }}</span></div>
                                <Button icon="pi pi-copy" text rounded size="small" class="opacity-0 group-hover:opacity-100" @click="copyToClipboard(asset.network.ip_address)" />
                            </div>
                            <div class="p-3 border rounded-lg bg-gray-50 flex justify-between items-center group">
                                <div><span class="text-xs font-semibold text-gray-500 block uppercase">MAC Address</span><span class="font-mono font-medium text-gray-800">{{ asset.network.mac_address || 'Sin Configurar' }}</span></div>
                                <Button icon="pi pi-copy" text rounded size="small" class="opacity-0 group-hover:opacity-100" @click="copyToClipboard(asset.network.mac_address)" />
                            </div>
                        </div>
                    </Panel>

                    <Panel header="Especificaciones Técnicas" toggleable>
                        <div v-if="formattedSpecs.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div v-for="spec in formattedSpecs" :key="spec.key" 
                                class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow bg-white">
                                <div :class="`w-10 h-10 rounded-full flex items-center justify-center  ${spec.bg} ${spec.color}`">
                                    <i :class="spec.icon"></i>
                                </div>
                                <div class="overflow-hidden">
                                    <span class="block text-xs text-gray-500 font-semibold uppercase tracking-wide truncate">{{ spec.label }}</span>
                                    <span class="block text-sm text-gray-800 font-medium truncate" :title="String(spec.value)">{{ spec.value || '-' }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center text-gray-400 italic py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <i class="pi pi-info-circle mr-2"></i> No hay especificaciones registradas.
                        </div>
                    </Panel>

                    <Panel header="Ciclo de Vida" toggleable>
                        <div class="flex flex-col md:flex-row gap-4 justify-between">
                            <div class="flex-1 p-3 bg-green-50 rounded-lg border border-green-100">
                                <span class="block text-xs text-green-700 font-semibold uppercase mb-1">Fecha de Compra</span>
                                <span class="text-sm text-gray-800 font-medium">{{ formatDate(asset.dates.purchase) }}</span>
                            </div>
                            <div class="flex-1 p-3 bg-red-50 rounded-lg border border-red-100">
                                <span class="block text-xs text-red-700 font-semibold uppercase mb-1">Fin de Garantía</span>
                                <span class="text-sm text-gray-800 font-medium">{{ formatDate(asset.dates.warranty) }}</span>
                            </div>
                            <div class="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <span class="block text-xs text-gray-500 font-semibold uppercase mb-1">Registro</span>
                                <span class="text-sm text-gray-600 font-medium">{{ formatDate(asset.created_at) }}</span>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>

        <Dialog v-model:visible="editDialog" header="Editar Activo" modal class="w-full max-w-4xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                <div class="col-span-1 md:col-span-2 font-bold text-gray-600 border-b pb-1">General</div>
                <div><label class="text-sm block mb-1">Propiedad</label><Select v-model="form.property_id" :options="properties" optionLabel="name" optionValue="id" class="w-full" /></div>
                <div><label class="text-sm block mb-1">Estado</label><Select v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
                <div><label class="text-sm block mb-1">Categoría</label><Select v-model="form.category" :options="categoryOptions" editable class="w-full" /></div>
                <div>
                    <label class="text-sm block mb-1">Asignado a</label>
                    <AutoComplete v-model="selectedMemberObject" :suggestions="filteredMembers" optionLabel="name" placeholder="Buscar..." class="w-full" @complete="searchMember" showClear dropdown>
                        <template #option="slotProps">
                            <div class="flex flex-col"><span class="font-bold">{{ slotProps.option.name }}</span><span class="text-xs">{{ slotProps.option.department }}</span></div>
                        </template>
                    </AutoComplete>
                </div>

                <div class="col-span-1 md:col-span-2 font-bold text-gray-600 border-b pb-1 mt-4">Detalles</div>
                <div><label class="text-sm block">Marca</label><InputText v-model="form.brand" class="w-full"/></div>
                <div><label class="text-sm block">Modelo</label><InputText v-model="form.model" class="w-full"/></div>
                <div><label class="text-sm block">Serial</label><InputText v-model="form.serial_number" class="w-full"/></div>
                <div><label class="text-sm block">Hilton Name</label><InputText v-model="form.hilton_name" class="w-full"/></div>

                <div class="col-span-1 md:col-span-2 font-bold text-gray-600 border-b pb-1 mt-4">Especificaciones</div>
                <div class="grid grid-cols-2 gap-4 col-span-2">
                    <div><label class="text-sm block">Procesador</label><InputText v-model="form.specs.processor" class="w-full"/></div>
                    <div><label class="text-sm block">RAM</label><InputText v-model="form.specs.ram" class="w-full"/></div>
                    <div><label class="text-sm block">Almacenamiento</label><InputText v-model="form.specs.storage" class="w-full"/></div>
                    <div><label class="text-sm block">Proveedor</label><InputText v-model="form.specs.provider" class="w-full" placeholder="Ej. Dell Corp"/></div>
                </div>

                <div v-if="isMobile" class="col-span-1 md:col-span-2 mt-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div class="font-bold text-blue-700 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-mobile-screen"></i> Datos de Línea y Equipo Móvil
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-sm block mb-1 font-medium">IMEI / Serie</label><InputText v-model="form.specs.imei" class="w-full" placeholder="Ej. 35640..." /></div>
                        <div><label class="text-sm block mb-1 font-medium">Número Celular</label><InputText v-model="form.specs.phone_number" class="w-full" placeholder="Ej. 55 1234..." /></div>
                        <div><label class="text-sm block mb-1 font-medium">Compañía</label><Select v-model="form.specs.carrier" :options="['TELCEL', 'AT&T', 'MOVISTAR']" class="w-full" editable placeholder="Selecciona" /></div>
                        <div><label class="text-sm block mb-1 font-medium">Plan</label><InputText v-model="form.specs.plan" class="w-full" placeholder="Ej. EMPRESARIAL 3000" /></div>
                        <div><label class="text-sm block mb-1 font-medium">SIM Card</label><InputText v-model="form.specs.sim" class="w-full" placeholder="Ej. 8952..." /></div>
                    </div>
                </div>

                <div class="col-span-1 md:col-span-2 font-bold text-gray-600 border-b pb-1 mt-4">Red y Fechas</div>
                <div><label class="text-sm block">IP</label><InputText v-model="form.ip_address" class="w-full"/></div>
                <div><label class="text-sm block">MAC</label><InputText v-model="form.mac_address" class="w-full"/></div>
                <div><label class="text-sm block">Fecha de Compra</label><Calendar v-model="form.purchase_date" showIcon class="w-full"/></div>
                <div><label class="text-sm block">Fecha de Garantía</label><Calendar v-model="form.warranty_expiry" showIcon class="w-full"/></div>
            </div>

            <template #footer>
                <Button label="Cancelar" text icon="pi pi-times" @click="editDialog = false" />
                <Button label="Guardar" icon="pi pi-check" @click="saveAsset" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>