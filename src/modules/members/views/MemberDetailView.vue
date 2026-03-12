<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMemberStore } from '../store/member.store';
import { useToast } from 'primevue/usetoast';
import { listProperties, type Property } from '@/modules/properties/services/property.service';
import { useDepartmentStore } from '@/modules/department/store/department.store';
import { positionService } from '@/modules/position/services/position.service';
import { assetService } from '../../assets/services/asset.service';
import type { Position } from '@/modules/position/types/position.types';
import type { CreateMemberPayload } from '../types/member.types';
import type { Asset } from '../../assets/types/asset.types';


import MemberAccessDialog from './MemberAccessDialog.vue';

// Componentes PrimeVue
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import Divider from 'primevue/divider';
import Badge from 'primevue/badge';

const route = useRoute();
const router = useRouter();
const store = useMemberStore();
const departmentStore = useDepartmentStore();
const toast = useToast();

const memberId = Number(route.params.id);

// --- ESTADOS ---
const asset = ref<Asset | null>(null);
const generatingPdf = ref(false);
const generatingAssetPdf = ref(false); // Estado de carga para este botón específico

const submitted = ref(false);
const isEditDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const isDownloadingPdf = ref(false);
const isAccessDialogVisible = ref(false);
const properties = ref<Property[]>([]);
const availablePositions = ref<Position[]>([]);
const statusOptions = ref(['PENDING_IT', 'ACTIVO', 'BAJA', 'TERMINADO']);

// Formulario de Edición 
const form = ref({
    id: 0,
    property_id: null as number | null,

    tm_id: '',
    hilton_id: '',

    name: '',
    last_name: '',
    email: '',

    // Datos Corporativos 
    department_id: null as number | null,
    position_id: null as number | null,

    onq_id: '',
    status: '',

    hire_date: null as Date | null,
    termination_date: null as Date | null,
    admission_date: null as Date | null,
    hire_end_date: null as Date | null,

    // Detalles
    phone: '',
    notes: '',
});

// --- CICLO DE VIDA ---
onMounted(async () => {
    try {
        await Promise.all([
            store.fetchMemberById(memberId),
            properties.value = await listProperties(),
            departmentStore.fetchDepartments(1, 100) // Para el select de edición
        ]);
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información', life: 3000 });
    }
});

const goBack = () => router.push({ name: 'MemberList' });

// --- LÓGICA DINÁMICA: Depto -> Puestos ---
watch(() => form.value.department_id, async (newDeptId) => {
    if (newDeptId) {
        try {
            availablePositions.value = await positionService.getListForSelect(newDeptId);
        } catch (e) { availablePositions.value = []; }
    } else {
        availablePositions.value = [];
    }
});

const onDepartmentChange = () => {
    form.value.position_id = null;
};

// --- UTILIDADES ---
const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No registrado';
    const dateToParse = dateString.includes('T') ? dateString : `${dateString}T12:00:00`;
    return new Date(dateToParse).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

const getSeverity = (status: string) => {
    switch (status) {
        case 'ACTIVO': return 'success';
        case 'BAJA': return 'danger';
        case 'PENDING_IT': return 'warn';
        case 'TERMINADO': return 'secondary';
        default: return 'info';
    }
};


const getPlatformCount = () => {
    const perms = store.currentMember?.platform_permissions || [];
    if (perms.length === 0) return 0;
    const unique = new Set(perms.map((p: any) => p.platform_id));
    return unique.size;
};

const isOverride = (permId: number) => {
    const blueprintIds = defaultPositionPermissionsArray.value;
    return !blueprintIds.includes(permId);
};

// Computed para extraer arreglos limpios para el componente hijo
const defaultPositionPermissionsArray = computed(() => {
    const blueprint = store.currentMember?.position_details?.default_permissions || [];
    return blueprint.map((p: any) => p.id);
});

const currentMemberPermissionsArray = computed(() => {
    const perms = store.currentMember?.platform_permissions || [];
    return perms.map((p: any) => p.id);
});

const onAccessSaved = async () => {
    await store.fetchMemberById(memberId);
};

// --- Descargar PDF de control de accesos ---
const generateAccessPdf = async () => {
    if (!store.currentMember) return;

    isDownloadingPdf.value = true;
    try {
        await store.downloadAccessPdf(store.currentMember.id, store.currentMember.full_name);
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'El PDF de Control de Accesos se ha descargado correctamente.', life: 4000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el documento PDF.', life: 4000 });
    } finally {
        isDownloadingPdf.value = false;
    }
};

const copyToClipboard = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.add({ severity: 'secondary', summary: 'Copiado', detail: text, life: 1000 });
};

const getAssetsCount = () => {
    return store.currentMember?.assets?.length || 0;
};

// --- Descargar PDF de Responsiva de ACTIVOS FÍSICOS (Hardware) ---
const generateAssetPdf = async () => {
    if (!store.currentMember) return;

    generatingAssetPdf.value = true;
    try {
        toast.add({ severity: 'info', summary: 'Generando...', detail: 'Creando acta de entrega de hardware...', life: 2000 });

        // En MemberDetail, el ID del miembro ya lo tenemos directo
        await assetService.downloadAssignmentPdf(store.currentMember.id);

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'El PDF de Activos se ha descargado.', life: 4000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el documento de activos.', life: 4000 });
    } finally {
        generatingAssetPdf.value = false;
    }
};

// --- LÓGICA DE EDICIÓN (ADAPTADOR) ---
const openEdit = async () => {
    if (!store.currentMember) return;
    const m = store.currentMember;

    // Detectar depto actual
    const deptId = m.position_details?.department_id || null;

    // Cargar puestos
    if (deptId) {
        availablePositions.value = await positionService.getListForSelect(deptId);
    }

    form.value = {
        id: m.id,
        property_id: m.property_id,

        tm_id: m.tm_id || '',
        hilton_id: m.hilton_id || '',

        name: m.name,
        last_name: m.last_name,
        email: m.email || '',

        department_id: deptId,
        position_id: m.position_id,
        onq_id: m.corporate_info.onq_id || '',

        status: m.status,

        hire_date: m.hire_date ? new Date(m.hire_date + 'T12:00:00') : null,
        termination_date: m.termination_date ? new Date(m.termination_date + 'T12:00:00') : null,
        admission_date: m.admission_date ? new Date(m.admission_date + 'T12:00:00') : null,
        hire_end_date: m.hire_end_date ? new Date(m.hire_end_date + 'T12:00:00') : null,

        phone: m.details?.phone || '',
        notes: m.details?.notes || '',
    };
    isEditDialogVisible.value = true;
};

const saveMember = async () => {
    // Validación
    if (!form.value.name || !form.value.last_name || !form.value.property_id) {
        toast.add({ severity: 'warn', summary: 'Cuidado', detail: 'Nombre, Apellido y Propiedad son obligatorios', life: 3000 });
        return;
    }

    const payload: CreateMemberPayload = {
        property_id: form.value.property_id,
        position_id: form.value.position_id,

        tm_id: form.value.tm_id,
        hilton_id: form.value.hilton_id,

        name: form.value.name,
        last_name: form.value.last_name,
        email: form.value.email,
        onq_id: form.value.onq_id,
        status: form.value.status,

        // Formato YYYY-MM-DD
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
        await store.updateMember(memberId, payload);
        await store.fetchMemberById(memberId);
        isEditDialogVisible.value = false;
        toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Expediente actualizado correctamente', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar', life: 3000 });
    }
};

// --- LÓGICA DE ELIMINACIÓN ---
const deleteMember = async () => {
    try {
        await store.deleteMember(memberId); 
        await store.fetchMemberById(memberId); 
        isDeleteDialogVisible.value = false;
        toast.add({ severity: 'info', summary: 'Procesado', detail: 'Baja técnica registrada', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar', life: 3000 });
    }
};
</script>

<template>
    <div class="max-w-7xl mx-auto p-6" v-if="store.currentMember">

       <div class="mb-4 flex items-center">
            <Button label="Volver al Directorio" icon="pi pi-arrow-left" text 
                @click="goBack" class="text-gray-500 hover:text-blue-600 px-0 font-medium" />
        </div>

        <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            <div class="flex items-center gap-4 md:gap-5 w-full md:w-auto">
                
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-2xl shrink-0 shadow-inner">
                    {{ store.currentMember.name.charAt(0).toUpperCase() }}{{ store.currentMember.last_name.charAt(0).toUpperCase() }}
                </div>

                <div class="flex flex-col gap-1.5">
                    <div class="flex flex-wrap items-center gap-3">
                        <h1 class="text-2xl font-bold text-gray-900 leading-none tracking-tight">
                            {{ store.currentMember.full_name }}
                        </h1>
                        <Tag :value="store.currentMember.status" :severity="getSeverity(store.currentMember.status)"
                            class="text-[10px] md:text-xs px-2 py-0.5 rounded-md uppercase tracking-wider font-bold" />
                    </div>
                    
                    <div class="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                        <i class="pi pi-calendar-clock text-gray-400"></i>
                        <span>Miembro desde: <span class="font-medium text-gray-700">{{ formatDate(store.currentMember.created_at) }}</span></span>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-start md:justify-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                
                <Button label="Excepciones IT" icon="pi pi-sliders-h" severity="secondary" outlined
                    class="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 w-full sm:w-auto transition-colors"
                    @click="isAccessDialogVisible = true" />

                <Button label="Editar Perfil" icon="pi pi-pencil" severity="info"
                    class="bg-blue-50 hover:bg-blue-100 text-blue-700 border-none w-full sm:w-auto transition-colors"
                    @click="openEdit" />

                <Button label="Baja Técnica" icon="pi pi-user-minus" severity="danger" outlined
                    class="w-full sm:w-auto transition-colors"
                    @click="isDeleteDialogVisible = true" />
            </div>
            
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

            <Card class="shadow-sm border-t-4 border-t-indigo-500 lg:col-span-2">
                <template #title>
                    <div class="flex items-center gap-2 text-lg">
                        <i class="pi pi-id-card text-indigo-500"></i> Identidad y Contacto
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col gap-5 mt-2">

                        <div class="flex flex-col sm:flex-row gap-4">
                            <div
                                class="flex-1 flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div
                                    class="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm shrink-0">
                                    <i class="pi pi-envelope text-gray-500 text-sm"></i>
                                </div>
                                <div class="overflow-hidden">
                                    <span
                                        class="text-[10px] font-bold text-gray-400 uppercase block leading-tight">Email</span>
                                    <a v-if="store.currentMember.email" :href="'mailto:' + store.currentMember.email"
                                        class="text-sm font-medium text-blue-600 hover:underline truncate block">
                                        {{ store.currentMember.email }}
                                    </a>
                                    <span v-else class="text-sm text-gray-400 italic block">Sin correo</span>
                                </div>
                            </div>

                            <div
                                class="flex-1 flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div
                                    class="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm shrink-0">
                                    <i class="pi pi-phone text-gray-500 text-sm"></i>
                                </div>
                                <div class="overflow-hidden">
                                    <span
                                        class="text-[10px] font-bold text-gray-400 uppercase block leading-tight">Teléfono</span>
                                    <span class="text-sm font-medium text-gray-800 block truncate"
                                        :class="{ 'text-gray-400 italic': !store.currentMember.details?.phone }">
                                        {{ store.currentMember.details?.phone || 'Sin teléfono' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-3">
                            <div class="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 flex flex-col items-center justify-center transition-colors hover:bg-indigo-100"
                                @click="copyToClipboard(store.currentMember.tm_id)">
                                <span class="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">TM ID</span>
                                <span class="text-indigo-800 font-bold text-sm">{{ store.currentMember.tm_id || '-'
                                }}</span>
                            </div>
                            <div class="bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex flex-col items-center justify-center transition-colors hover:bg-blue-100"
                                @click="copyToClipboard(store.currentMember.hilton_id)">
                                <span class="text-[10px] font-bold text-blue-400 uppercase mb-0.5">Hilton ID</span>
                                <span class="text-blue-800 font-bold text-sm">{{ store.currentMember.hilton_id || '-'
                                }}</span>
                            </div>
                            <div class="bg-gray-100 p-2.5 rounded-lg border border-gray-200 flex flex-col items-center justify-center transition-colors hover:bg-gray-200"
                                @click="copyToClipboard(store.currentMember.corporate_info.onq_id)">

                                <span class="text-[10px] font-bold text-gray-500 uppercase mb-0.5">OnQ ID</span>
                                <span class="text-gray-800 font-bold text-sm">{{
                                    store.currentMember.corporate_info.onq_id || '-' }}</span>
                            </div>
                        </div>

                    </div>
                </template>
            </Card>

            <Card class="shadow-sm border-t-4 border-t-blue-500 lg:col-span-2">
                <template #title>
                    <div class="flex items-center gap-2 text-lg">
                        <i class="pi pi-briefcase text-blue-500"></i> Asignación Laboral
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col gap-4 mt-2">

                        <div class="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <i class="pi pi-building text-lg"></i>
                            </div>
                            <div>
                                <span class="text-[10px] font-bold text-blue-500 uppercase block mb-0.5">Propiedad
                                    FíSICA</span>
                                <span class="text-base font-bold text-blue-900 block">{{
                                    store.currentMember.property?.name || 'Sin Propiedad Asignada' }}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-center">
                                <span class="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-1">
                                    <i class="pi pi-sitemap text-gray-400"></i> Departamento
                                </span>
                                <span class="text-sm font-bold text-gray-800">{{
                                    store.currentMember.corporate_info.department || 'No asignado' }}</span>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-center">
                                <span class="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-1">
                                    <i class="pi pi-star text-gray-400"></i> Posición
                                </span>
                                <span class="text-sm font-bold text-gray-800">{{
                                    store.currentMember.corporate_info.position || 'No asignado' }}</span>
                            </div>
                        </div>

                    </div>
                </template>
            </Card>

            <Card class="shadow-sm border-t-4 border-t-blue-500 lg:col-span-2">
                <template #title>
                    <div class="flex items-center justify-between text-lg">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-shield text-blue-500"></i> Accesos a Plataformas
                        </div>
                        <Badge :value="getPlatformCount() + ' Plataformas'" severity="info" class="text-xs"></Badge>
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col h-full mt-2">

                        <div v-if="getPlatformCount() > 0"
                            class="flex-1 flex flex-col justify-center bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-center gap-3">
                                <i class="pi pi-check-circle text-4xl text-blue-500"></i>
                                <div>
                                    <p class="text-blue-800 font-bold text-sm">Matriz Generada Automáticamente</p>
                                    <p class="text-xs text-blue-600 mt-0.5">Basado en el perfil: {{
                                        store.currentMember.corporate_info.position }}</p>
                                </div>
                            </div>

                            <div v-if="currentMemberPermissionsArray.some(p => isOverride(p))"
                                class="mt-3 pt-3 border-t border-blue-200 text-center">
                                <span class="bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded font-bold">
                                    <i class="pi pi-exclamation-triangle text-[9px] mr-1"></i> Contiene permisos
                                    excepcionales (Overrides)
                                </span>
                            </div>
                        </div>

                        <div v-else
                            class="flex-1 flex flex-col justify-center bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-center gap-3">
                                <i class="pi pi-shield text-4xl text-gray-400"></i>
                                <div>
                                    <p class="text-gray-600 font-bold text-sm">Puesto sin configuración</p>
                                    <p class="text-xs text-gray-500 mt-0.5">Este puesto no tiene un Blueprint asignado.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button label="Descargar Control de Accesos (PDF)" icon="pi pi-file-pdf" severity="info"
                            outlined class="w-full mt-auto" :loading="isDownloadingPdf" @click="generateAccessPdf"
                            :disabled="getPlatformCount() === 0" />
                    </div>
                </template>
            </Card>

            <Card class="shadow-sm border-t-4 border-t-emerald-500 lg:col-span-2">
                <template #title>
                    <div class="flex items-center justify-between text-lg">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-desktop text-emerald-500"></i> Equipos y Hardware
                        </div>
                        <Badge :value="getAssetsCount() + ' Activos'" severity="success" class="text-xs"></Badge>
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col h-full mt-2">

                        <div v-if="getAssetsCount() > 0"
                            class="flex-1 flex flex-col justify-center bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-center gap-3">
                                <i class="pi pi-check-circle text-4xl text-emerald-500"></i>
                                <div>
                                    <p class="text-emerald-800 font-bold text-sm">Equipos Asignados</p>
                                    <p class="text-xs text-emerald-600 mt-0.5">Este miembro tiene {{ getAssetsCount() }}
                                        equipo(s) bajo su resguardo.</p>
                                </div>
                            </div>

                            <div
                                class="mt-3 pt-3 border-t border-emerald-200 text-center flex flex-wrap justify-center gap-2">
                                <Tag v-for="asset in store.currentMember.assets?.slice(0, 3)" :key="asset.id"
                                    severity="success" class="text-[10px]">
                                    {{ asset.category_name }}: {{ asset.brand }}
                                </Tag>
                                <span v-if="getAssetsCount() > 3" class="text-xs text-gray-500 mt-1">+{{
                                    getAssetsCount() - 3 }} más</span>
                            </div>
                        </div>

                        <div v-else
                            class="flex-1 flex flex-col justify-center items-center bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 mb-4 text-center">
                            <i class="pi pi-shield text-4xl text-gray-400 mb-2"></i>
                            <div>
                                <p class="text-gray-600 font-bold text-sm mb-1">Sin activos asignados</p>
                                <p class="text-xs text-gray-500">Este colaborador no tiene Laptops, Celulares ni otro
                                    hardware a su nombre.</p>
                            </div>
                        </div>

                        <Button label="Descargar Responsiva Hardware (PDF)" icon="pi pi-file-pdf" severity="success"
                            outlined class="w-full mt-auto" @click="generateAssetPdf" :loading="generatingAssetPdf"
                            :disabled="getAssetsCount() === 0" />
                    </div>
                </template>
            </Card>

            <Card class="shadow-sm border-t-4 border-t-cyan-500 lg:col-span-2">
                <template #title>
                    <div class="flex items-center gap-2 text-lg">
                        <i class="pi pi-history text-cyan-500"></i> Ciclo de Vida Laboral
                    </div>
                </template>
                <template #content>
                    <div class="space-y-3 mt-2">
                        <div class="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100">
                            <span class="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><i
                                    class="pi pi-file-edit"></i> RH: Alta Contrato</span>
                            <span class="text-sm font-medium text-blue-900">{{ formatDate(store.currentMember.hire_date)
                                }}</span>
                        </div>
                        <div class="flex justify-between items-center p-2 bg-green-50 rounded border border-green-100">
                            <span class="text-xs font-bold text-green-800 uppercase flex items-center gap-2"><i
                                    class="pi pi-power-off"></i> IT: Ingreso Sistemas</span>
                            <span class="text-sm font-medium text-green-900">{{
                                formatDate(store.currentMember.admission_date) }}</span>
                        </div>
                        <div
                            class="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-100">
                            <span class="text-xs font-bold text-orange-800 uppercase flex items-center gap-2"><i
                                    class="pi pi-file-excel"></i> RH: Fin Contrato</span>
                            <span class="text-sm font-medium text-orange-900">{{
                                formatDate(store.currentMember.hire_end_date) }}</span>
                        </div>
                        <div class="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100">
                            <span class="text-xs font-bold text-red-800 uppercase flex items-center gap-2"><i
                                    class="pi pi-ban"></i> IT: Baja Técnica</span>
                            <span class="text-sm font-medium text-red-900">{{
                                formatDate(store.currentMember.termination_date) }}</span>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="shadow-sm border-t-4 border-t-yellow-500 lg:col-span-2">
                <template #title>
                    <div class="flex items-center gap-2 text-lg">
                        <i class="pi pi-address-book text-yellow-500"></i> Contacto y Notas
                    </div>
                </template>
                <template #content>
                    <div class=" gap-4 mt-2">


                        <div class="col-span-1">
                            <span class="text-xs font-bold text-gray-400 uppercase block mb-1">Notas
                                Administrativas</span>
                            <div v-if="store.currentMember.details?.notes"
                                class="bg-yellow-50 text-yellow-800 p-2 rounded text-xs italic h-24 overflow-y-auto">
                                {{ store.currentMember.details.notes }}
                            </div>
                            <div v-else
                                class="text-gray-400 text-xs italic bg-gray-50 p-2 rounded h-24 flex items-center justify-center border border-dashed border-gray-200">
                                Sin anotaciones.
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

        </div>

        <Dialog v-model:visible="isEditDialogVisible" header="Editar Expediente" modal class="w-full max-w-4xl">
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

                <div><label class="text-sm block mb-1 font-medium">Código de Team Member (Hotel)</label>
                    <InputText v-model="form.tm_id" class="w-full" />
                </div>
                <div><label class="text-sm block mb-1 font-medium ">Código de Hilton (RH)</label>
                    <InputText v-model="form.hilton_id" class="w-full" />
                </div>

                <div><label class="text-sm block mb-1 font-medium">Código OnQ</label>
                    <InputText v-model="form.onq_id" class="w-full" />
                </div>

                <div><label class="text-sm block mb-1 font-medium text-gray-700">Departamento</label>
                    <Select v-model="form.department_id" :options="departmentStore.departments" optionLabel="name"
                        placeholder="Selecciona un departamento" optionValue="id" class="w-full" filter
                        @change="onDepartmentChange" />
                </div>

                <div><label class="text-sm block mb-1 font-medium text-gray-700">Puesto</label>
                    <Select v-model="form.position_id" :options="availablePositions" optionLabel="name"
                        placeholder="Selecciona un puesto" optionValue="id" class="w-full" filter
                        :disabled="!form.department_id" />
                </div>



                <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2 mt-4">
                    <span class="text-gray-600 font-bold text-lg"><i class="pi pi-list mr-2"></i>Detalles
                        Adicionales</span>
                </div>

                <div class="col-span-2 border-b mt-2"><span class="font-bold">Ciclo de Vida (Fechas)</span></div>
                <div class="bg-blue-50 p-2"><label class="text-xs font-bold text-blue-700">RH: Inicio Contrato</label>
                    <Calendar v-model="form.hire_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>
                <div class="bg-green-50 p-2"><label class="text-xs font-bold text-green-700">RH: Fin Contrato</label>
                    <Calendar v-model="form.admission_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>
                <div class="bg-red-50 p-2"><label class="text-xs font-bold text-red-700">IT: Ingreso al Sistema</label>
                    <Calendar v-model="form.termination_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>
                <div class="bg-orange-50 p-2"><label class="text-xs font-bold text-orange-700">IT: Baja Técnica</label>
                    <Calendar v-model="form.hire_end_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>

                <div class="col-span-2 border-b mt-2"><span class="font-bold">Detalles</span></div>
                <div><label>Teléfono</label>
                    <InputText v-model="form.phone" class="w-full" />
                </div>
                <div class="col-span-2"><label>Notas</label><Textarea v-model="form.notes" rows="2" class="w-full" />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Cancelar" icon="pi pi-times" text @click="isEditDialogVisible = false"
                        class="text-gray-500" />
                    <Button label="Guardar Cambios" icon="pi pi-check" @click="saveMember"
                        class="bg-blue-600 text-white border-none hover:bg-blue-700" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="isDeleteDialogVisible" header="Confirmar Baja Técnica" modal class="w-96">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
                <div class="text-gray-700">
                    <p>¿Registrar fecha de cierre técnico IT?</p>
                    <p class="text-xs text-gray-500">El estado se recalculará automáticamente.</p>
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" text @click="isDeleteDialogVisible = false" />
                <Button label="Confirmar Baja" severity="danger" @click="deleteMember" />
            </template>
        </Dialog>
        <MemberAccessDialog v-if="store.currentMember" v-model:visible="isAccessDialogVisible"
            :member-id="store.currentMember.id"
            :position-name="store.currentMember.corporate_info.position || 'Puesto Desconocido'"
            :default-permissions="defaultPositionPermissionsArray" :current-permissions="currentMemberPermissionsArray"
            @saved="onAccessSaved" />

    </div>

    <div v-else class="h-[80vh] flex flex-col items-center justify-center">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
        <p class="text-gray-500 font-medium">Cargando expediente del miembro...</p>
    </div>
</template>