<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from "primevue/useconfirm";
import { assetService } from '../services/asset.service';
import { useAssetStore } from '../store/asset.store';
import type { Asset, CreateAssetPayload } from '../types/asset.types';

// Servicios para el Formulario
import { listProperties, type Property } from '@/modules/properties/services/property.service';
import { memberService } from '@/modules/members/services/member.service';
import type { Member } from '@/modules/members/types/member.types';
import { providerService } from '@/modules/providers/services/provider.service';
import { departmentService, listDepartments, type Department } from '@/modules/department/services/department.service';
import { categoryService, listCategories } from '@/modules/assets_category/services/category.service'; // NUEVO: Importamos categorías
import type { Category } from '@/modules/assets_category/types/category.types';

// Componentes PrimeVue
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import Panel from 'primevue/panel';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Calendar from 'primevue/calendar';
import ConfirmDialog from 'primevue/confirmdialog';
import AutoComplete from 'primevue/autocomplete';
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete';


const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const assetStore = useAssetStore();

// --- ESTADO ---
const asset = ref<Asset | null>(null);
const loading = ref(true);
const editDialog = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);

const properties = ref<Property[]>([]);
const categories = ref<Category[]>([]);
const departments = ref<Department[]>([]);

const filteredMembers = ref<any[]>([]);
const selectedMemberObject = ref<Member | null>(null);
const filteredProviders = ref<any[]>([]);
const selectedProviderObject = ref<any>(null);
const filterCategory = ref<number | null>(null);
const filteredCategories = ref<Category[]>([]);
const selectedCategoryObject = ref<Category | null>(null);

const statusOptions = ref([
    { label: 'ACTIVO', value: 'active' },
    { label: 'REPARACIÓN', value: 'repair' },
    { label: 'PERDIDO', value: 'lost' },
    { label: 'BAJA', value: 'retired' },
    { label: 'ALMACÉN', value: 'stored' }
]);

const hasNetworkFields = computed(() => selectedCategoryObject.value?.has_network_fields || false);

const addAccessory = () => {
    form.value.accessories.push({ type: '', brand: '', serial_number: '' });
};

const removeAccessory = (index: number) => {
    form.value.accessories.splice(index, 1);
};

// --- FORMULARIO ---
const form = ref({
    id: 0,
    property_id: null as number | null,
    member_id: null as number | null,
    provider_id: null as number | null,
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

    // Fechas (Date objects)
    purchase_date: null as Date | null,
    warranty_expiry: null as Date | null,

    ram: '',
    storage: '',
    processor: '',
    imei: '',
    sim: '',
    plan: '',
    carrier: '',
    phone_number: '',
    description: ''
});

// Computed para saber si mostrar campos de celular en el formulario
const isMobile = computed(() => {
    const cat = selectedCategoryObject.value?.name?.toLowerCase() || '';
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
        const [assetRes, propsRes, categoriesRes] = await Promise.all([
            assetService.getById(id),
            listProperties(),
            listCategories(),
        ]);

        asset.value = assetRes;
        properties.value = propsRes;
        categories.value = categoriesRes;

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


// --- ACCIONES ---

// 1. ABRIR EDICIÓN 
const openEdit = async () => {

    if (!asset.value) return;

    if (asset.value.assigned_to) {
        selectedMemberObject.value = {
            id: asset.value.assigned_to.member_id,
            name: asset.value.assigned_to.name,
            last_name: asset.value.assigned_to.last_name,
            full_name: asset.value.assigned_to.full_name,
            tm_id: asset.value.assigned_to.tm_id,
            corporate_info: {
                department: asset.value.assigned_to.department,
                position: asset.value.assigned_to.position,
                onq_id: ''
            },
        } as any;
    } else {
        selectedMemberObject.value = null;
    }

    if (asset.value.category) {
        selectedCategoryObject.value = {
            id: asset.value.category.id,
            name: asset.value.category.name,
            prefix: asset.value.category.prefix,
            icon: asset.value.category.icon
        } as any;
    } else {
        selectedCategoryObject.value = null;
    }

    if (asset.value.provider) {
        selectedProviderObject.value = {
            id: asset.value.provider.provider_id,
            name: asset.value.provider.name,
            tax_id: asset.value.provider.tax_id,
            email: asset.value.provider.email,
            phone: asset.value.provider.phone,
            contact_name: asset.value.provider.contact_name
        } as any;
    } else {
        selectedProviderObject.value = null;
    }

    form.value = {
        id: asset.value.id,
        property_id: asset.value.location.property_id,
        member_id: asset.value.assigned_to?.member_id || null,
        provider_id: asset.value.provider?.provider_id || null,
        category_id: asset.value.category.id,
        quantity: 1,
        accessories: asset.value.accessories ? JSON.parse(JSON.stringify(asset.value.accessories)) : [],
        price: asset.value.price ? Number(asset.value.price) : null,
        brand: asset.value.info.brand || '',
        model: asset.value.info.model || '',
        serial_number: asset.value.info.serial_number || '',
        hilton_name: asset.value.info.hilton_name || '',
        mac_address: asset.value.network.mac_address || '',
        ip_address: asset.value.network.ip_address || '',
        status: asset.value.status,

        purchase_date: asset.value.dates.purchase ? new Date(asset.value.dates.purchase) : null,
        warranty_expiry: asset.value.dates.warranty ? new Date(asset.value.dates.warranty) : null,

        ram: asset.value.specs?.ram || '',
        storage: asset.value.specs?.storage || '',
        processor: asset.value.specs?.processor || '',
        imei: asset.value.specs?.imei || '',
        sim: asset.value.specs?.sim || '',
        plan: asset.value.specs?.plan || '',
        carrier: asset.value.specs?.carrier || '',
        phone_number: asset.value.specs?.phone_number || '',
        description: asset.value.specs?.description || ''
    };
    editDialog.value = true;
    submitted.value = false;
    isEditMode.value = true;
};

// 2. GUARDAR (Mapeo Form -> API)
const saveAsset = async () => {
    submitted.value = true;
    if (!selectedCategoryObject.value || !form.value.property_id || !form.value.status) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Faltan campos requeridos', life: 3000 });
        return;
    }

    const payload: CreateAssetPayload = {
        property_id: form.value.property_id,
        category_id: selectedCategoryObject.value.id,
        quantity: isEditMode.value ? 1 : form.value.quantity,

        accessories_base: form.value.accessories.map(acc => ({
            id: acc.id,
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

        purchase_date: form.value.purchase_date ? form.value.purchase_date.toISOString().split('T')[0] : null,
        warranty_expiry: form.value.warranty_expiry ? form.value.warranty_expiry.toISOString().split('T')[0] : null,

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
        if (asset.value && isEditMode.value) {
            await assetStore.updateAsset(asset.value.id, payload);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Información guardada', life: 3000 });
            editDialog.value = false;
            await loadAsset(asset.value.id);
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar', life: 3000 });
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
}

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

                <Button label="Editar" icon="pi pi-pencil" severity="info" outlined @click="openEdit" />
                <Button label="Reportar Falla" icon="pi pi-exclamation-triangle" severity="warning" outlined
                    @click="reportFailure" />
            </div>
        </div>

        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <Skeleton v-for="i in 6" :key="i" height="300px" class="rounded-xl" />
        </div>

        <div v-else-if="asset" class="animate-fade-in space-y-6">

            <div
                class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">

                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div
                        class="w-20 h-20 rounded-2xl  from-blue-200 to-indigo-300 border border-blue-200 text-blue-800 flex items-center justify-center shrink-0">
                        <i :class="(asset.category?.icon || 'pi pi-desktop')" class="text-4xl"></i>
                    </div>

                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <h1 class="text-2xl font-bold text-gray-900">{{ asset.category?.name || 'Equipo' }}</h1>
                            <Tag :value="formatStatus(asset.status)" :severity="getSeverity(asset.status)"
                                class="px-2 py-0.5 text-xs font-bold uppercase tracking-wider" />
                        </div>

                        <p class="text-gray-600 font-medium text-lg flex items-center gap-2">
                            {{ asset.info.brand || 'Genérico' }}
                            <span class="text-gray-300">|</span>
                            {{ asset.info.model || 'Sin Modelo' }}
                        </p>

                        <div class="flex flex-wrap gap-2 mt-3">
                            <span
                                class="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2.5 py-1 rounded-md text-sm font-mono text-gray-700 cursor-pointer transition-colors"
                                @click="copyToClipboard(asset.info.serial_number)" v-tooltip.bottom="'Copiar Serial'">
                                <span class="text-gray-400 select-none">SN:</span> {{ asset.info.serial_number || 'N/A'
                                }}
                                <i class="pi pi-copy text-[10px] text-gray-400"></i>
                            </span>

                            <span v-if="asset.info.hilton_name"
                                class="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1 rounded-md text-sm font-mono text-indigo-700 cursor-pointer transition-colors"
                                @click="copyToClipboard(asset.info.hilton_name)"
                                v-tooltip.bottom="'Copiar Hilton Name'">
                                <span class="text-indigo-300 select-none">HN:</span> {{ asset.info.hilton_name }}
                                <i class="pi pi-copy text-[10px] text-indigo-400"></i>
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-4 w-full lg:w-auto">

                    <div class="flex flex-col items-end text-base gap-1">
                        <span class="text-gray-500">
                            Registrado: <span class="font-medium text-gray-700">{{ formatDate(asset.created_at)
                                }}</span>
                        </span>
                        <span
                            class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded mt-1 border border-emerald-100">
                            Precio: {{ asset.price ? `$${asset.price.toLocaleString('en-US', {
                                minimumFractionDigits: 2
                            })}` : 'Sin costo reg.' }}
                        </span>
                    </div>
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

                                    <div class="flex items-start gap-3  p-2 rounded-md">
                                        <i class="pi pi-id-card text-indigo-500 mt-1"></i>
                                        <div>
                                            <span
                                                class="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Team
                                                Member ID</span>
                                            <span class="text-base text-gray-600 font-medium">
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
                                            <span class="block text-xs text-gray-400">Correo Electrónico</span>
                                            <span class="text-sm font-medium text-gray-600 ">
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
                                            <span class="block text-xs text-gray-400">Teléfono</span>
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

                    <Card class="shadow-sm border border-gray-100">
                        <template #title>
                            <div class="flex items-center gap-2 text-lg text-gray-800"><i
                                    class="pi pi-truck text-orange-600"></i> Ciclo de Vida</div>
                        </template>
                        <template #content>
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
                        </template>
                    </Card>


                </div>

                <div class="lg:col-span-2 space-y-6">

                    <Panel header="Ubicación Física" toggleable>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">


                            <div class="p-3 shadow rounded-lg bg-white flex justify-between items-center group">

                                <div class="overflow-hidden">
                                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5"">
                                        <i class=" pi pi-building text-lg mr-2 text-blue-600"></i> Propiedad
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
                                        <i class=" pi pi-sitemap text-lg mr-2 text-blue-600"></i> Departamento
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

                    <Panel header="Accesorios Relacionados" toggleable>
                        <div class="p-4 border border-gray-200 rounded-lg bg-gray-50/50">

                            <div v-if="asset.accessories && asset.accessories.length > 0"
                                class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <div v-for="(acc, index) in asset.accessories" :key="index"
                                    class="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">

                                    <div
                                        class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                        <i class="pi pi-box text-slate-500 text-xl"></i>
                                    </div>

                                    <div class="flex flex-col w-full overflow-hidden">
                                        <span class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{{
                                            acc.type
                                            }}</span>

                                        <div class="flex items-center justify-between gap-2 mb-1">
                                            <span class="text-sm font-semibold text-gray-800 truncate"
                                                :title="acc.brand || undefined">
                                                {{ acc.brand || 'Marca Genérica' }}
                                            </span>
                                        </div>

                                        <div
                                            class="flex items-center gap-2 text-xs text-gray-500 font-mono bg-gray-50 p-1.5 rounded w-fit">
                                            <i class="pi pi-hashtag text-[10px]"></i>
                                            <span class="truncate" :title="acc.serial_number || undefined">{{
                                                acc.serial_number || 'Sin S/N' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="text-center py-8">
                                <div
                                    class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                                    <i class="pi pi-inbox text-2xl text-gray-400"></i>
                                </div>
                                <h3 class="text-gray-600 font-medium text-base">Sin accesorios adicionales</h3>
                                <p class="text-gray-400 text-sm mt-1">Este equipo no cuenta con periféricos registrados.
                                </p>
                            </div>
                        </div>
                    </Panel>


                    <Panel header="Especificaciones Hardware" toggleable>
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


                </div>
            </div>
        </div>


        <Dialog v-model:visible="editDialog" header="Editar Especificaciones del Activo" modal class="w-full max-w-6xl"
            :draggable="false" :breakpoints="{ '1199px': '75vw', '575px': '95vw' }">

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
                                </AutoComplete>
                            </div>

                            <div class="sm:col-span-2 flex flex-col">
                                <label class="text-sm font-medium text-gray-700 block mb-1">Precio Unitario ($)</label>

                                <InputNumber v-model="form.price" class="w-full" input-class="w-full p-2"
                                    mode="currency" currency="USD" locale="en-US" :min="0" :max="999999" />
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
                                            <span class="text-xs text-gray-500">
                                                <i class="pi pi-id-card text-[10px]"></i> {{ slotProps.option.tm_id ||
                                                    'Sin ID' }} | {{ slotProps.option.corporate_info?.department }}
                                            </span>
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
                            red y
                            hardware.</p>
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
                                            class="w-full text-sm p-1.5 font-mono uppercase" maxlength="100" />
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
                <div class="flex justify-end gap-3 pt-4 -mx-4 -mb-4 px-6 pb-4 rounded-b-lg">
                    <Button label="Cancelar" icon="pi pi-times" severity="secondary" text @click="editDialog = false" />
                    <Button label="Guardar Cambios" icon="pi pi-check" @click="saveAsset"
                        :loading="assetStore.isLoading" class="px-6" />
                </div>
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