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
import { providerService } from '@/modules/providers/services/provider.service';
import type { Member } from '@/modules/members/types/member.types';

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
const selectedMemberObject = ref<Member | null>(null);
const filteredProviders = ref<any[]>([]);
const selectedProviderObject = ref<any>(null);
const categoryOptions = ref(['Laptop', 'Desktop', 'Monitor', 'Printer', 'Server', 'Tablet', 'Access Point', 'Switch', 'Phone', 'Celular', 'Other']);

const statusOptions = ref([
    { label: 'ACTIVO', value: 'active' },
    { label: 'REPARACIÓN', value: 'repair' },
    { label: 'PERDIDO', value: 'lost' },
    { label: 'BAJA', value: 'retired' },
    { label: 'ALMACÉN', value: 'stored' }
]);



// --- FORMULARIO ---
const form = ref({
    id: 0,
    property_id: null as number | null,
    member_id: null as number | null,
    provider_id: null as number | null,
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
        // provider: '',
        imei: '',
        sim: '',
        plan: '',
        carrier: '',
        phone_number: '',
        description: ''
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
    // 'provider': { label: 'Proveedor', icon: 'fa-solid fa-truck-fast', color: 'text-orange-600', bg: 'bg-orange-50' },
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

    loading.value = true;
    try {
        // Carga paralela de Asset, Propiedades y Miembros
        const [assetRes, propsRes] = await Promise.all([
            assetService.getById(id),
            listProperties(),
        ]);

        asset.value = assetRes;
        properties.value = propsRes;

    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información', life: 3000 });
        router.push({ name: 'AssetList' });
    } finally {
        loading.value = false;
    }
});

const loadAsset = async (id: number) => {
    try {
        asset.value = await assetService.getById(id);
    } catch (e) { console.error(e) }
}

const searchMember = async (event: any) => {
    const query = event.query.trim();
    if (!query) return;

    try {
        const response = await memberService.getAll(1, 20, query);
        filteredMembers.value = response.data;
    } catch (e) {
        console.error("Error buscando miembro", e);
    }
};

const searchProvider = async (event: any) => {
    const query = event.query.trim();
    if (!query) return;

    try {
        const response = await providerService.getAll(1, 20, query);
        filteredProviders.value = response.data;
    } catch (e) {
        console.error("Error buscando proveedor", e);
    }
};


// --- ACCIONES ---

// 1. ABRIR EDICIÓN 
const openEdit = async () => {

    if (!asset.value) return;
    const a = asset.value;

    if (a.assigned_to) {
        selectedMemberObject.value = {
            id: a.assigned_to.member_id,
            name: a.assigned_to.name,
            last_name: a.assigned_to.last_name,
            full_name: a.assigned_to.full_name,
            tm_id: a.assigned_to.tm_id,
            corporate_info: {
                department: a.assigned_to.department,
                position: a.assigned_to.position,
                onq_id: ''
            },
        } as unknown as Member;
    } else {
        selectedMemberObject.value = null;
    }

    if (a.provider) {
        selectedProviderObject.value = {
            id: a.provider.provider_id,
            name: a.provider.name,
            tax_id: a.provider.tax_id,
            email: a.provider.email,
            phone: a.provider.phone,
            contact_name: a.provider.contact_name
        } as any;
    } else {
        selectedProviderObject.value = null;
    }

    form.value = {
        id: a.id,
        property_id: a.location.property_id,
        member_id: a.assigned_to?.member_id || null,
        provider_id: a.provider?.provider_id || null,
        category: a.info.category,
        status: a.status,
        brand: a.info.brand || '',
        model: a.info.model || '',
        serial_number: a.info.serial_number || '',
        hilton_name: a.info.hilton_name || '',
        mac_address: a.network.mac_address || '',
        ip_address: asset.value.network.ip_address || '',

        purchase_date: a.dates.purchase ? new Date(a.dates.purchase) : null,
        warranty_expiry: a.dates.warranty ? new Date(a.dates.warranty) : null,

        specs: {
            ram: a.specs?.ram || '',
            storage: a.specs?.storage || '',
            processor: a.specs?.processor || '',
            // provider: a.specs?.provider || '',
            imei: asset.value.specs?.imei || '',
            sim: a.specs?.sim || '',
            plan: a.specs?.plan || '',
            carrier: a.specs?.carrier || '',
            phone_number: a.specs?.phone_number || '',
            description: a.specs?.description || ''
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
        provider_id: selectedProviderObject.value ? selectedProviderObject.value.id : null,
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
            // provider: form.value.specs.provider,

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
                } catch (e) { console.error(e) }
            }
        }
    });
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
                <Button v-if="asset.assigned_to" label="Acta Entrega" icon="pi pi-file-pdf" severity="danger" outlined
                    @click="generatePdf" :loading="generatingPdf" />

                <Button label="Editar" icon="pi pi-pencil" severity="info" outlined @click="openEdit" />
                <Button label="Reportar Falla" icon="pi pi-exclamation-triangle" severity="warning" outlined
                    @click="reportFailure" />
            </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton height="200px" class="md:col-span-2 rounded-xl" />
            <Skeleton height="200px" class="rounded-xl" />
        </div>

        <div v-else-if="asset" class="animate-fade-in space-y-6">

            <div
                class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
                <div class="flex items-center gap-5">
                    <div
                        class="w-24 h-24 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center shadow-inner">
                        <i :class="getCategoryIcon(asset.info.category)" class="text-4xl drop-shadow-sm"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <h1 class="text-2xl font-bold text-gray-800">{{ asset.info.category }}</h1>
                            <Tag :value="formatStatus(asset.status)" :severity="getSeverity(asset.status)"
                                class="px-3 py-1 font-bold" />
                        </div>
                        <p class="text-gray-500 text-lg">{{ asset.info.brand }} {{ asset.info.model }}</p>
                        <div class="flex gap-4 mt-3 text-sm font-mono text-gray-600">
                            <span class="bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                                @click="copyToClipboard(asset.info.serial_number)">
                                SN: {{ asset.info.serial_number || 'N/A' }} <i class="pi pi-copy text-xs ml-1"></i>
                            </span>
                            <span class="bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                                @click="copyToClipboard(asset.info.hilton_name)">
                                HN: {{ asset.info.hilton_name || 'N/A' }} <i class="pi pi-copy text-xs ml-1"></i>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="text-gray-500  text-normal md:text-right">
                    Registrado el {{ formatDate(asset.created_at) }}
                </div>

            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-1 space-y-6">
                    <Card class="shadow-sm border border-gray-100">
                        <template #title>
                            <div class="flex items-center gap-2 text-lg text-gray-800"><i
                                    class="pi pi-user text-blue-600"></i> Asignación</div>
                        </template>
                        <template #content>
                            <div v-if="asset.assigned_to" class="text-center p-4  rounded-lg ">

                                <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                                    <div
                                        class="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                        <span class="text-indigo-600 font-bold text-lg tracking-tight">
                                            {{ asset.assigned_to.name?.charAt(0) }}{{
                                                asset.assigned_to.last_name?.charAt(0) }}
                                        </span>
                                    </div>

                                    <div class="overflow-hidden">
                                        <h3 class="font-bold text-gray-800 text-lg leading-tight truncate"
                                            :title="asset.assigned_to.full_name">
                                            {{ asset.assigned_to.full_name }}
                                        </h3>
                                        <p class="text-xs text-gray-500 font-medium truncate"
                                            :title="asset.assigned_to.position">
                                            {{ asset.assigned_to.position || 'Puesto no especificado' }}
                                        </p>
                                    </div>
                                </div>

                                <div class="flex-1 space-y-3 mb-4">

                                    <div class="flex items-start gap-3 bg-gray-50 p-2 rounded-md">
                                        <i class="pi pi-id-card text-indigo-500 mt-1"></i>
                                        <div>
                                            <span
                                                class="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Team
                                                Member ID</span>
                                            <span class="text-sm text-gray-800 font-mono font-medium">
                                                {{ asset.assigned_to.tm_id || 'N/A' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="p-3">
                                    <Button label="Ver Expediente" severity="info" icon="pi pi-external-link"
                                        size="small" outlined
                                        @click="router.push({ name: 'MemberDetail', params: { id: asset.assigned_to.member_id } })" />
                                </div>
                            </div>

                            <div v-else class="text-center p-6 border-dashed border-2 border-gray-200 rounded-lg">
                                <i class="pi pi-box text-3xl text-gray-300 mb-2"></i>
                                <p class="text-gray-500 font-medium">Activo en Almacén</p>
                                <p class="text-xs text-gray-400">Disponible para asignación</p>
                            </div>
                        </template>
                    </Card>

                    <Card class="shadow-sm border border-gray-100">
                        <template #title>
                            <div class="flex items-center gap-2 text-lg text-gray-800"><i
                                    class="pi pi-truck text-orange-600"></i> Proveedor</div>
                        </template>
                        <template #content>
                            <div v-if="asset.provider" class="flex flex-col h-full">

                                <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                                    <div
                                        class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <i class="pi pi-building text-blue-600 text-xl"></i>
                                    </div>
                                    <div class="overflow-hidden">
                                        <h3 class="font-bold text-gray-800 text-lg truncate"
                                            :title="asset.provider.name">
                                            {{ asset.provider.name }}
                                        </h3>
                                        <p class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                                            {{ asset.provider.tax_id || 'N/A' }}
                                        </p>
                                    </div>
                                </div>

                                <div class="flex-1 space-y-3 mb-4">

                                    <div class="flex items-start gap-3">
                                        <i class="pi pi-user text-gray-400 mt-1"></i>
                                        <div>
                                            <span class="block text-xs text-gray-400">Contacto Directo</span>
                                            <span class="text-sm text-gray-700 font-medium">
                                                {{ asset.provider.contact_name || 'No especificado' }}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-3">
                                        <i class="pi pi-envelope text-gray-400 mt-1"></i>
                                        <div class="overflow-hidden">
                                            <span class="text-sm text-gray-600 ">
                                                <a v-if="asset.provider.email" :href="`mailto:${asset.provider.email}`"
                                                    class="hover:text-blue-600 hover:underline">
                                                    {{ asset.provider.email }}
                                                </a>
                                                <span v-else class="text-gray-400 italic">Sin correo</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-3">
                                        <i class="pi pi-phone text-gray-400 mt-1"></i>
                                        <div>
                                            <span class="text-sm text-gray-600">
                                                {{ asset.provider.phone || 'Sin teléfono' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="mt-auto pt-2">
                                    <Button label="Ver Detalles" icon="pi pi-external-link" size="small" outlined
                                        class="w-full text-xs"
                                        @click="router.push({ name: 'ProviderList', query: { search: asset.provider.name } })" />
                                </div>
                            </div>

                            <div v-else
                                class="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                    <i class="pi pi-box text-xl text-gray-400"></i>
                                </div>
                                <p class="text-gray-600 font-medium text-sm">Sin Proveedor</p>
                                <p class="text-xs text-gray-400 text-center mt-1">
                                    Edita este activo para asignar un origen de compra.
                                </p>
                            </div>
                        </template>
                    </Card>

                </div>

                <div class="lg:col-span-2 space-y-6">

                    <Panel header="Ubicación Física" toggleable>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">


                            <div class="p-3 shadow rounded-lg bg-white flex justify-between items-center group">

                                <div class="overflow-hidden">
                                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5"">
                                        <i class="pi pi-building text-lg mr-2 text-blue-600"></i> Propiedad
                                    </span>
                                    <div class="font-semibold text-gray-800 text-base truncate"
                                        :title="asset.location.property_name">
                                        {{ asset.location.property_name || 'Sin Configurar' }}
                                    </div>
                                    <p v-if="asset.location.property_name" class="text-xs text-gray-400 mt-1">
                                        Ubicación Principal
                                    </p>
                                </div>
                            </div>

                            <div class="p-3 shadow rounded-lg bg-white flex justify-between items-center group">
                                <div class="overflow-hidden">
                                   
                                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5"">
                                        <i class="pi pi-sitemap text-lg mr-2 text-blue-600"></i> Departamento
                                    </span>

                                    <div class="font-semibold text-base truncate"
                                        :class="asset.assigned_to?.department ? 'text-gray-800' : 'text-gray-400 italic'">
                                        {{ asset.assigned_to?.department || 'En Almacén / IT' }}
                                    </div>

                                    <p class="text-xs text-gray-400 mt-1">
                                        {{ asset.assigned_to?.department ? 'Según asignación actual' : 'Pendiente de asignación' }}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </Panel>

                    <Panel header="Red y Conectividad" toggleable>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-3 border rounded-lg bg-gray-50 flex justify-between items-center group">
                                <div><span class="text-xs font-semibold text-gray-500 block uppercase">IP
                                        Address</span><span class="font-mono font-medium text-gray-800">{{
                                            asset.network.ip_address || 'Sin Configurar'
                                        }}</span></div>
                                <Button icon="pi pi-copy" text rounded size="small"
                                    class="opacity-0 group-hover:opacity-100"
                                    @click="copyToClipboard(asset.network.ip_address)" />
                            </div>
                            <div class="p-3 border rounded-lg bg-gray-50 flex justify-between items-center group">
                                <div><span class="text-xs font-semibold text-gray-500 block uppercase">MAC
                                        Address</span><span class="font-mono font-medium text-gray-800">{{
                                            asset.network.mac_address || 'Sin Configurar'
                                        }}</span></div>
                                <Button icon="pi pi-copy" text rounded size="small"
                                    class="opacity-0 group-hover:opacity-100"
                                    @click="copyToClipboard(asset.network.mac_address)" />
                            </div>
                        </div>
                    </Panel>

                    <Panel header="Especificaciones Técnicas" toggleable>
                        <div v-if="formattedSpecs.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div v-for="spec in formattedSpecs" :key="spec.key"
                                class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow bg-white">
                                <div
                                    :class="`w-10 h-10 rounded-full flex items-center justify-center  ${spec.bg} ${spec.color}`">
                                    <i :class="spec.icon"></i>
                                </div>
                                <div class="overflow-hidden">
                                    <span
                                        class="block text-xs text-gray-500 font-semibold uppercase tracking-wide truncate">{{
                                            spec.label }}</span>
                                    <span class="block text-sm text-gray-800 font-medium truncate"
                                        :title="String(spec.value)">{{
                                            spec.value || '-' }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else
                            class="text-center text-gray-400 italic py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <i class="pi pi-info-circle mr-2"></i> No hay especificaciones registradas.
                        </div>
                    </Panel>

                    <Panel header="Ciclo de Vida" toggleable>
                        <div class="flex flex-col md:flex-row gap-4 justify-between">
                            <div class="flex-1 p-3 bg-green-50 rounded-lg border border-green-100">
                                <span class="block text-xs text-green-700 font-semibold uppercase mb-1">Fecha de
                                    Compra</span>
                                <span class="text-sm text-gray-800 font-medium">{{ formatDate(asset.dates.purchase)
                                }}</span>
                            </div>
                            <div class="flex-1 p-3 bg-red-50 rounded-lg border border-red-100">
                                <span class="block text-xs text-red-700 font-semibold uppercase mb-1">Fin de
                                    Garantía</span>
                                <span class="text-sm text-gray-800 font-medium">{{ formatDate(asset.dates.warranty)
                                }}</span>
                            </div>
                            <div class="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <span class="block text-xs text-gray-500 font-semibold uppercase mb-1">Registro</span>
                                <span class="text-sm text-gray-600 font-medium">{{ formatDate(asset.created_at)
                                }}</span>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>

        <Dialog v-model:visible="editDialog" header="Editar Activo" modal class="w-full max-w-5xl">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">

                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 font-bold text-gray-600">Información General
                </div>

                <div><label class="text-sm block mb-1">Propiedad *</label>
                    <Select v-model="form.property_id" :options="properties" optionLabel="name" optionValue="id"
                        class="w-full" filter />
                </div>
                <div><label class="text-sm block mb-1">Categoría *</label>
                    <Select v-model="form.category" :options="categoryOptions" editable class="w-full"
                        placeholder="Selecciona o escribe" />
                </div>
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

                    <AutoComplete v-model="selectedMemberObject" :suggestions="filteredMembers" optionLabel="name"
                        placeholder="Buscar por Nombre o TM ID..." class="w-full" @complete="searchMember"
                        :dropdown="true" showClear forceSelection>
                        <template #option="slotProps">
                            <div class="flex flex-col">
                                <span class="font-bold text-gray-800">{{ slotProps.option.full_name }}</span>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <span v-if="slotProps.option.tm_id" class="bg-gray-100 px-1 rounded text-gray-600">
                                        {{ slotProps.option.tm_id }}
                                    </span>
                                    <span>{{ slotProps.option.corporate_info?.department || 'Sin Depto' }}</span>
                                </div>
                            </div>
                        </template>

                        <template #empty>
                            <div class="p-2 text-gray-500 text-sm">No se encontraron miembros.</div>
                        </template>
                    </AutoComplete>

                    <small class="text-gray-400 text-xs mt-1 block">
                        Dejar vacío para enviar a Stock/Almacén.
                    </small>
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
                        <InputText v-model="form.specs.ram" class="w-full" />
                    </div>
                    <div><label class="text-sm block mb-1">Almacenamiento</label>
                        <InputText v-model="form.specs.storage" class="w-full" />
                    </div>
                    <div><label class="text-sm block mb-1">Procesador</label>
                        <InputText v-model="form.specs.processor" class="w-full" />
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 col-span-2">
                    <!-- <div><label class="text-sm block mb-1">Proveedor</label>
                        <InputText v-model="form.specs.provider" class="w-full" />
                    </div> -->
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
                        <InputText v-model="form.specs.imei" class="w-full font-mono" placeholder="Solo Móviles" />
                    </div>
                    <div>
                        <label class="text-sm block mb-1">Número Tel.</label>
                        <InputText v-model="form.specs.phone_number" class="w-full" placeholder="+52..." />
                    </div>
                    <div>
                        <label class="text-sm block mb-1">SIM Card ID</label>
                        <InputText v-model="form.specs.sim" class="w-full" />
                    </div>
                    <div>
                        <label class="text-sm block mb-1">Carrier (Telcel/AT&T)</label>
                        <InputText v-model="form.specs.carrier" class="w-full" />
                    </div>
                    <div>
                        <label class="text-sm block mb-1">Plan</label>
                        <InputText v-model="form.specs.plan" class="w-full" placeholder="Plan Empresarial..." />
                    </div>
                </div>

                <div class="col-span-1 md:col-span-2 mt-2">
                    <label class="text-sm block mb-1">Descripción / Notas</label>
                    <Textarea v-model="form.specs.description" rows="3" class="w-full"
                        placeholder="Detalles adicionales del activo..." />
                </div>
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
.animate-fade-in {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>