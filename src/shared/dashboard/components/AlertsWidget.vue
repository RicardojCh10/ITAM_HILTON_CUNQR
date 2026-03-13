<script setup lang="ts">
import type { ExpiringWarrantyAlert, PendingOffboardingAlert } from '@/modules/dashboard/types/dashboard.types';

defineProps<{
    expiringWarranties: ExpiringWarrantyAlert[];
    pendingOffboardings: PendingOffboardingAlert[];
}>();

// Helper para formatear fechas al estilo latinoamericano
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // Se añade 'T12:00:00' para evitar que por zonas horarias reste un día
    const date = new Date(dateString + 'T12:00:00'); 
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
};
</script>

<template>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div class="bg-white p-5 rounded-xl shadow-sm border border-orange-200 flex flex-col">
            <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h3 class="font-bold text-gray-800 flex items-center gap-2">
                    <i class="pi pi-shield text-orange-500 text-lg"></i>
                    Garantías por Vencer (30 días)
                </h3>
                <span v-if="expiringWarranties.length > 0" class="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {{ expiringWarranties.length }}
                </span>
            </div>

            <div v-if="expiringWarranties.length === 0" class="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <i class="pi pi-check-circle text-green-500 text-3xl mb-2 block"></i>
                <span class="text-sm text-gray-600 font-medium">Todo en orden</span>
                <span class="text-xs text-gray-400 mt-1">No hay garantías próximas a vencer.</span>
            </div>

            <ul v-else class="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                <li v-for="asset in expiringWarranties" :key="asset.id"
                    class="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                    <div class="flex flex-col overflow-hidden">
                        <span class="text-sm font-bold text-gray-800 truncate">{{ asset.brand || 'Equipo' }} {{ asset.model }}</span>
                        <span class="text-xs text-gray-500 font-mono mt-0.5">S/N: {{ asset.serial_number || 'N/A' }}</span>
                    </div>
                    <div class="text-right shrink-0 ml-4">
                        <span class="block text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-0.5">Vence:</span>
                        <span class="text-sm font-medium text-gray-700">{{ formatDate(asset.warranty_expiry) }}</span>
                    </div>
                </li>
            </ul>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-red-200 flex flex-col">
            <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h3 class="font-bold text-gray-800 flex items-center gap-2">
                    <i class="pi pi-user-minus text-red-500 text-lg"></i>
                    Bajas Pendientes de Procesar
                </h3>
                <span v-if="pendingOffboardings.length > 0" class="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {{ pendingOffboardings.length }}
                </span>
            </div>

            <div v-if="pendingOffboardings.length === 0" class="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <i class="pi pi-check-circle text-green-500 text-3xl mb-2 block"></i>
                <span class="text-sm text-gray-600 font-medium">Al día</span>
                <span class="text-xs text-gray-400 mt-1">No hay recolecciones de equipo pendientes.</span>
            </div>

            <ul v-else class="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                <li v-for="member in pendingOffboardings" :key="member.id"
                    class="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="w-9 h-9 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {{ member.name.charAt(0) }}{{ member.last_name?.charAt(0) || '' }}
                        </div>
                        <div class="flex flex-col truncate">
                            <span class="text-sm font-bold text-gray-800 truncate">{{ member.name }} {{ member.last_name }}</span>
                            <span class="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">Requiere revisión IT</span>
                        </div>
                    </div>
                    <div class="text-right shrink-0 ml-4">
                        <span class="block text-[10px] text-red-600 font-bold uppercase tracking-wider mb-0.5">Fin Contrato:</span>
                        <span class="text-sm font-medium text-gray-700">{{ formatDate(member.hire_end_date) }}</span>
                    </div>
                </li>
            </ul>
        </div>

    </div>
</template>