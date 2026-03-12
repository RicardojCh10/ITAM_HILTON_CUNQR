<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { httpClient } from '@/core/api/httpClient';
import { platformService } from '@/modules/platforms/services/platform.service';
import type { Platform } from '@/modules/platforms/types/platform.types';

// PrimeVue
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';

// --- PROPS Y EMITS ---
const props = defineProps<{
    visible: boolean;
    memberId: number;
    positionName: string;
    defaultPermissions: number[]; // Blueprint (Recomendado por RH)
    currentPermissions: number[]; // Realidad actual (Base de datos)
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'saved'): void; // Para que el padre recargue la info
}>();

const toast = useToast();

// --- ESTADOS LOCALES ---
const isSavingAccess = ref(false);
const platformCatalog = ref<Platform[]>([]);
const isLoadingCatalog = ref(false);
const platformSearch = ref('');
const activePlatformId = ref<number | null>(null);

const selectedPermissions = ref<number[]>([]); 

// --- COMPUTED PROPERTIES ---
const filteredPlatforms = computed(() => {
    if (!platformSearch.value) return platformCatalog.value;
    const query = platformSearch.value.toLowerCase();
    return platformCatalog.value.filter(p => p.name.toLowerCase().includes(query));
});

const activePlatform = computed(() => {
    return platformCatalog.value.find(p => p.id === activePlatformId.value) || null;
});

const getSelectedCount = (platform?: Platform) => {
    if (!platform?.permissions) return 0;
    return platform.permissions.filter(p => p && selectedPermissions.value.includes(p.id)).length;
};

// Determina si el permiso es extra al puesto original
const isOverride = (permId: number) => {
    return !props.defaultPermissions.includes(permId);
};

// --- CICLO DE VIDA ---
watch(() => props.visible, async (isVisible) => {
    if (isVisible) {
        // Inicializamos con lo que ya tiene en BD
        if (props.currentPermissions.length > 0) {
            selectedPermissions.value = [...props.currentPermissions];
        } else {
            // Si está vacío, sugerimos el Blueprint
            selectedPermissions.value = [...props.defaultPermissions]; 
        }

        // Cargamos catálogo si no existe
        if (platformCatalog.value.length === 0) {
            isLoadingCatalog.value = true;
            try {
                const res = await platformService.getAllPlatforms(1, 1000);
                platformCatalog.value = res.data || [];
                
                const firstPlatform = platformCatalog.value[0];
                if (firstPlatform?.id) {
                    activePlatformId.value = firstPlatform.id;
                }
            } catch (e) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al cargar catálogo de plataformas.' });
            } finally {
                isLoadingCatalog.value = false;
            }
        }
    } else {
        platformSearch.value = '';
    }
});

// --- ACCIONES ---
const closeDialog = () => {
    emit('update:visible', false);
};

const saveAccessConfig = async () => {
    isSavingAccess.value = true;
    try {
        await httpClient.put(`/members/${props.memberId}/permissions`, {
            permissions: selectedPermissions.value
        });

        toast.add({ severity: 'success', summary: 'Accesos Guardados', detail: 'Matriz actualizada correctamente.', life: 3000 });
        emit('saved'); 
        closeDialog();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Problema al guardar la configuración.', life: 3000 });
    } finally {
        isSavingAccess.value = false;
    }
};
</script>

<template>
    <Dialog :visible="props.visible" @update:visible="emit('update:visible', $event)" header="Gestor de Excepciones ITAM" modal class="w-full max-w-5xl" :draggable="false">
        <div class="flex flex-col mt-2">
            
            <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex items-start gap-3">
                <i class="pi pi-info-circle text-blue-500 mt-0.5 text-xl"></i>
                <div>
                    <p class="text-sm text-blue-900 font-medium">Asignación para: <b>{{ props.positionName }}</b></p>
                    <p class="text-xs text-blue-700 mt-1">Los permisos dictados por el Puesto (Blueprint) están marcados normales. Las adiciones manuales se marcan en naranja como <span class="bg-orange-100 text-orange-800 px-1 rounded font-bold">Excepción (Override)</span>.</p>
                </div>
            </div>

            <div v-if="isLoadingCatalog" class="flex-1 flex flex-col items-center justify-center text-gray-400">
                <i class="pi pi-spin pi-spinner text-3xl mb-2"></i><span>Cargando catálogo...</span>
            </div>

            <Splitter v-else class="flex-1 border border-gray-200 rounded-lg shadow-inner overflow-hidden">
                <SplitterPanel :size="35" :minSize="25" class="bg-gray-50 flex flex-col">
                    <div class="p-2 border-b border-gray-200 bg-white">
                        <IconField iconPosition="left">
                            <InputIcon><i class="pi pi-search text-gray-400 text-xs" /></InputIcon>
                            <InputText v-model="platformSearch" placeholder="Filtrar plataformas..." class="w-full text-xs p-1.5" />
                        </IconField>
                    </div>
                    <div class="flex-1 overflow-y-auto">
                        <div v-for="platform in filteredPlatforms" :key="platform.id" 
                            @click="activePlatformId = platform.id"
                            class="p-3 border-b border-gray-100 cursor-pointer flex justify-between items-center transition-colors"
                            :class="activePlatformId === platform.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100'">
                            
                            <span class="text-sm font-medium truncate pr-2" :class="activePlatformId === platform.id ? 'text-blue-800' : 'text-gray-700'">
                                {{ platform.name }}
                            </span>
                            <Badge v-if="getSelectedCount(platform) > 0" :value="getSelectedCount(platform)" severity="info" class="text-[10px] shrink-0" />
                        </div>
                    </div>
                </SplitterPanel>

                <SplitterPanel :size="65" :minSize="40" class="p-5 overflow-y-auto bg-white">
                    <div v-if="activePlatform">
                        <h4 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <i class="pi pi-server text-blue-500"></i> {{ activePlatform.name }}
                        </h4>

                        <div v-if="activePlatform.permissions && activePlatform.permissions.length > 0" class="flex flex-col gap-3">
                            <div v-for="perm in activePlatform.permissions" :key="perm.id" 
                                class="flex items-start gap-3 p-3 rounded-md border transition-colors"
                                :class="selectedPermissions.includes(perm.id) && isOverride(perm.id) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100 hover:border-blue-200'">
                                
                                <Checkbox v-model="selectedPermissions" :inputId="'perm-' + perm.id" :value="perm.id" class="mt-0.5" />
                                
                                <label :for="'perm-' + perm.id" class="text-sm cursor-pointer flex-1 select-none">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold block" :class="selectedPermissions.includes(perm.id) && isOverride(perm.id) ? 'text-orange-900' : 'text-gray-700'">{{ perm.name }}</span>
                                        <Tag v-if="selectedPermissions.includes(perm.id) && isOverride(perm.id)" value="Excepción" severity="warning" rounded class="text-[9px] px-1.5 py-0" />
                                    </div>
                                    <span v-if="perm.description" class="text-xs text-gray-500 block mt-1">{{ perm.description }}</span>
                                </label>
                            </div>
                        </div>
                        <div v-else class="text-center p-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                            <i class="pi pi-shield text-3xl mb-2 text-gray-300"></i><p class="text-sm mt-2">Sin permisos configurables.</p>
                        </div>
                    </div>
                </SplitterPanel>
            </Splitter>
        </div>

        <template #footer>
            <div class="flex items-center justify-between mt-4 border-t pt-4">
                <span class="text-sm text-gray-500"><b>{{ selectedPermissions.length }}</b> permisos en total seleccionados.</span>
                <div class="flex gap-2">
                    <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="closeDialog" />
                    <Button label="Guardar Accesos" icon="pi pi-save" @click="saveAccessConfig" :loading="isSavingAccess" class="bg-blue-600 hover:bg-blue-700 text-white" />
                </div>
            </div>
        </template>
    </Dialog>
</template>