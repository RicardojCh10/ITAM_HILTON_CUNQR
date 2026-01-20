<script setup lang="ts">
import { onMounted, ref, computed} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMemberStore } from '../store/member.store';
import { useToast } from 'primevue/usetoast';
import { listProperties, type Property } from '@/modules/properties/services/property.service';
import { ORGANIZATION_CHART, DEPARTMENTS_LIST } from '@/data/organization.data';
import type { Member, CreateMemberPayload } from '../types/member.types'; 

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

const route = useRoute();
const router = useRouter();
const store = useMemberStore();
const toast = useToast();

const memberId = Number(route.params.id);

// --- ESTADOS ---
const submitted = ref(false);
const isEditDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const properties = ref<Property[]>([]);
const statusOptions = ref(['ACTIVO', 'BAJA', 'TERMINADO']);
const selectedMemberToDelete = ref<Member | null>(null);

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
    position: '',
    department: '',
    onq_id: '',

    status: 'ACTIVO',

    hire_date: null as Date | null,
    termination_date: null as Date | null,

    // Detalles
    phone: '',
    notes: '',
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
        await store.fetchMemberById(memberId);
        properties.value = await listProperties();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información', life: 3000 });
    }
});

const goBack = () => router.push({ name: 'MemberList' });

// --- UTILIDADES ---
const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No registrado';
    const dateToParse = dateString.includes('T') ? dateString : `${dateString}T12:00:00`;
    return new Date(dateToParse).toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
};

const getSeverity = (status: string) => {
    switch (status) {
        case 'ACTIVO': return 'success';
        case 'BAJA': return 'danger';
        case 'TERMINADO': return 'warn';
        default: return 'info';
    }
};

// --- LÓGICA DE EDICIÓN (ADAPTADOR) ---
const openEdit = () => {
    if (!store.currentMember) return;
    const m = store.currentMember;

    form.value = {
        id: m.id,
        property_id: m.property_id,

        tm_id: m.tm_id || '',
        hilton_id: m.hilton_id || '',

        name: m.name,
        last_name: m.last_name,

        email: m.email || '',

        position: m.corporate_info.position || '',
        department: m.corporate_info.department || '',
        onq_id: m.corporate_info.onq_id || '',

        status: m.status,

        hire_date: m.hire_date ? new Date(m.hire_date + 'T12:00:00') : null,
        termination_date: m.termination_date ? new Date(m.termination_date + 'T12:00:00') : null,

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

        tm_id: form.value.tm_id,
        hilton_id: form.value.hilton_id,

        name: form.value.name,
        last_name: form.value.last_name,

        email: form.value.email,

        position: form.value.position,
        department: form.value.department,
        onq_id: form.value.onq_id,

        status: form.value.status,

        // Formato YYYY-MM-DD
        hire_date: form.value.hire_date ? form.value.hire_date.toISOString().split('T')[0] : null,
        termination_date: form.value.termination_date ? form.value.termination_date.toISOString().split('T')[0] : null,

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
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Miembro eliminado permanentemente', life: 3000 });
        router.push({ name: 'MemberList' });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
    }
};
</script>

<template>
    <div class="max-w-7xl mx-auto p-6" v-if="store.currentMember">

        <div
            class="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center gap-4">
                <Button icon="pi pi-arrow-left" text rounded @click="goBack" class="text-gray-500 hover:bg-gray-100" />
                <div>
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-bold text-gray-800">{{ store.currentMember.full_name }}</h1>
                        <Tag :value="store.currentMember.status" :severity="getSeverity(store.currentMember.status)"
                            class="text-sm px-3" />
                    </div>
                    <div class="flex items-center gap-2 text-gray-500 mt-1 text-sm">
                        <i class="pi pi-building text-blue-500"></i>
                        <span class="font-medium">{{ store.currentMember.property?.name || 'Sin Propiedad' }}</span>
                        <span class="text-gray-300">|</span>
                        <span>Registrado el: {{ formatDate(store.currentMember.created_at) }}</span>
                    </div>
                </div>
            </div>

            <div class="flex gap-2">
                <Button label="Editar Expediente" icon="pi pi-pencil" severity="info" @click="openEdit"
                    class="border-none" />
                <Button label="Dar de Baja" icon="pi pi-times-circle" severity="danger" outlined
                    @click="isDeleteDialogVisible = true" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card class="shadow-sm h-full border-t-4 border-t-blue-500">
                <template #title>
                    <div class="flex items-center gap-2 text-lg">
                        <i class="pi pi-user text-blue-500"></i> Información Personal
                    </div>
                </template>
                <template #content>
                    <div class="space-y-4 mt-2">
                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase">Email</span>
                            <div class="flex items-center gap-2 mt-1">
                                <i class="pi pi-envelope text-gray-400"></i>
                                <a :href="'mailto:' + store.currentMember.email"
                                    class="text-blue-600 hover:underline font-medium">
                                    {{ store.currentMember.email || 'No registrado' }}
                                </a>
                            </div>
                        </div>
                        <Divider />
                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase">Teléfono</span>
                            <div class="flex items-center gap-2 mt-1">
                                <i class="pi pi-phone text-gray-400"></i>
                                <span class="text-gray-700 font-medium">{{ store.currentMember.details?.phone || 'No registrado' }}</span>
                            </div>
                        </div>
                        <Divider />
                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase">Propiedad Asignada</span>
                            <div class="mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                                <div class="flex items-center gap-2 mb-1">
                                    <i class="pi pi-building text-gray-400"></i>
                                    <span class="block font-bold text-gray-700">{{ store.currentMember.property?.name
                                        }}</span>
                                </div>

                                <span class="text-xs font-semibold text-gray-500">{{ store.currentMember.property?.code }}</span>
                            </div>

                        </div>
                    </div>
                </template>
            </Card>

            <Card class="shadow-sm h-full border-t-4 border-t-indigo-500">
                <template #title>
                    <div class="flex items-center gap-2 text-lg">
                        <i class="pi pi-briefcase text-indigo-500"></i> Perfil Corporativo
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 gap-4 mt-2">

                        <div class="grid grid-cols-3 gap-2">
                            <div class="col-span-1">
                                <span class="text-[10px] font-bold text-gray-400 uppercase block mb-1">TM ID</span>
                                <span
                                    class="bg-indigo-50 text-indigo-700 px-2 py-2 rounded border border-indigo-100 font-bold block text-center text-sm truncate"
                                    title="ID Hotel">
                                    {{ store.currentMember.tm_id || '-' }}
                                </span>
                            </div>
                            <div class="col-span-1">
                                <span class="text-[10px] font-bold text-blue-400 uppercase block mb-1">Hilton ID</span>
                                <span
                                    class="bg-blue-50 text-blue-700 px-2 py-2 rounded border border-blue-100 font-bold block text-center text-sm truncate"
                                    title="ID Recursos Humanos">
                                    {{ store.currentMember.hilton_id || '-' }}
                                </span>
                            </div>
                            <div class="col-span-1">
                                <span class="text-[10px] font-bold text-gray-400 uppercase block mb-1">OnQ ID</span>
                                <span
                                    class="bg-gray-100 text-gray-700 px-2 py-2 rounded border border-gray-200 font-bold block text-center text-sm truncate"
                                    title="">
                                    {{ store.currentMember.corporate_info.onq_id || '-' }}
                                </span>
                            </div>
                        </div>

                        <Divider class="my-1" />

                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase block">Departamento</span>
                            <span class="text-normal font-medium text-gray-800">{{
                                store.currentMember.corporate_info.department || 'No especificado' }}</span>
                        </div>

                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase block">Puesto (Posición)</span>
                            <span class="text-normal font-medium text-gray-800">{{
                                store.currentMember.corporate_info.position || 'No especificado' }}</span>
                        </div>

                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase block mb-1">Fecha de
                                Contratación</span>
                            <div class="flex items-center gap-2 text-gray-700">
                                <i class="pi pi-calendar-plus text-green-500"></i>
                                <span class="font-medium">{{ store.currentMember.hire_date ?
                                    formatDate(store.currentMember.hire_date) : 'Sin fecha' }}</span>
                            </div>
                        </div>
                        <div>
                            <span class="text-xs font-bold text-gray-400 uppercase block mb-1">Fecha de
                                Baja</span>
                            <div class="flex items-center gap-2 text-gray-700">
                                <i class="pi pi-calendar-times text-red-500"></i>
                                <span class="font-medium">{{ store.currentMember.termination_date ?
                                    formatDate(store.currentMember.termination_date) : 'Sin fecha' }}</span>
                            </div>
                        </div>

                    </div>
                </template>
            </Card>

            <Card class="shadow-sm h-full border-t-4 border-t-yellow-500">
                <template #title>
                    <div class="flex items-center gap-2 text-lg">
                        <i class="pi pi-align-left text-yellow-500"></i> Notas y Detalles
                    </div>
                </template>
                <template #content>
                    <div class="mt-2 h-full flex flex-col">
                        <div v-if="store.currentMember.details?.notes"
                            class="bg-yellow-50 border border-yellow-100 p-4 rounded-md text-gray-700 italic relative">
                            <i class="pi pi-comment absolute top-2 right-2 text-yellow-200 text-2xl"></i>
                            {{ store.currentMember.details.notes }}
                        </div>
                        <div v-else
                            class="text-gray-400 italic text-center py-10 bg-gray-50 rounded border border-dashed border-gray-200">
                            Sin notas adicionales registradas.
                        </div>

                        <div class="mt-auto pt-6 text-xs text-gray-400 text-center">
                            <br>
                            Última sincronización: {{ new Date().toLocaleTimeString() }}
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
                    <label class="text-sm block mb-1 font-medium">Teléfono</label>
                    <InputText v-model="form.phone" class="w-full" placeholder="+52..." />
                </div>

                <div>
                    <label class="text-sm block mb-1 font-medium">Fecha de Contratación</label>
                    <Calendar v-model="form.hire_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>

                <div>
                    <label class="text-sm block mb-1 font-medium">Fecha de Baja</label>
                    <Calendar v-model="form.termination_date" showIcon dateFormat="yy-mm-dd" class="w-full" />
                </div>

                <div class="col-span-1 md:col-span-2">
                    <label class="text-sm block mb-1 font-medium">Comentarios</label>
                    <Textarea v-model="form.notes" rows="2" class="w-full" autoResize />
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

        <Dialog v-model:visible="isDeleteDialogVisible" header="Confirmar Baja" modal class="w-96">

             <div class="flex items-center gap-3">
                <i class="pi pi-user-minus text-3xl text-orange-500"></i>
                <div class="text-gray-700 leading-relaxed">
                    <p>¿Procesar la baja de <b>{{ store.currentMember.full_name }}</b>?</p>
                    <p class="text-xs text-gray-500 mt-1">El expediente pasará a estado "BAJA" y se guardará la fecha de
                        hoy.
                    </p>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Cancelar" text @click="isDeleteDialogVisible = false" />
                    <Button label="Confirmar Baja" severity="danger" icon="pi pi-trash"
                        @click="deleteMember" />
                </div>
            </template>
        </Dialog>

    </div>

    <div v-else class="h-[80vh] flex flex-col items-center justify-center">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
        <p class="text-gray-500 font-medium">Cargando expediente del miembro...</p>
    </div>
</template>