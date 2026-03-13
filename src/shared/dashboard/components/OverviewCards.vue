<script setup lang="ts">
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard.types';

defineProps<{
    overview: DashboardOverview
}>();
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
            <div class="flex justify-between items-start relative z-10">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Activos</p>
                    <h3 class="text-3xl font-black text-gray-800">{{ overview.total_assets.toLocaleString() }}</h3>
                </div>
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <i class="pi pi-box text-xl"></i>
                </div>
            </div>
            <i class="pi pi-box absolute -bottom-4 -right-2 text-6xl text-blue-900 opacity-[0.02] group-hover:scale-110 transition-transform"></i>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
            <div class="flex justify-between items-start relative z-10">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">En Uso</p>
                    <h3 class="text-3xl font-black text-gray-800">{{ overview.assets_assigned.toLocaleString() }}</h3>
                </div>
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <i class="pi pi-check-circle text-xl"></i>
                </div>
            </div>
            <i class="pi pi-check-circle absolute -bottom-4 -right-2 text-6xl text-emerald-900 opacity-[0.02] group-hover:scale-110 transition-transform"></i>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
            <div class="flex justify-between items-start relative z-10">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">En Stock</p>
                    <h3 class="text-3xl font-black text-gray-800">{{ overview.assets_unassigned.toLocaleString() }}</h3>
                </div>
                <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-600 group-hover:text-white transition-colors">
                    <i class="pi pi-inbox text-xl"></i>
                </div>
            </div>
            <i class="pi pi-inbox absolute -bottom-4 -right-2 text-6xl text-slate-900 opacity-[0.02] group-hover:scale-110 transition-transform"></i>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
            <div class="flex justify-between items-start relative z-10">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Personal</p>
                    <h3 class="text-3xl font-black text-gray-800">{{ overview.total_members.toLocaleString() }}</h3>
                </div>
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <i class="pi pi-users text-xl"></i>
                </div>
            </div>
            <i class="pi pi-users absolute -bottom-4 -right-2 text-6xl text-indigo-900 opacity-[0.02] group-hover:scale-110 transition-transform"></i>
        </div>

        <div class="bg-gradient-to-br from-red-50 to-white p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
            <div class="flex justify-between items-start relative z-10">
                <div>
                    <p class="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Fila Onboarding</p>
                    <h3 class="text-3xl font-black text-red-700">{{ overview.pending_it_members }}</h3>
                </div>
                <div class="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center relative">
                    <i class="pi pi-exclamation-circle text-xl"></i>
                    <span v-if="overview.pending_it_members > 0" class="absolute -top-1 -right-1 flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                    </span>
                </div>
            </div>
            <i class="pi pi-exclamation-triangle absolute -bottom-4 -right-2 text-6xl text-red-600 opacity-[0.03] group-hover:scale-110 transition-transform"></i>
        </div>

        <div class="bg-gradient-to-br from-orange-50 to-white p-5 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
            <div class="flex justify-between items-start relative z-10">
                <div>
                    <p class="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Bajas a Procesar</p>
                    <h3 class="text-3xl font-black text-orange-700">{{ overview.offboarding_members }}</h3>
                </div>
                <div class="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <i class="pi pi-user-minus text-xl"></i>
                </div>
            </div>
            <i class="pi pi-id-card absolute -bottom-4 -right-2 text-6xl text-orange-600 opacity-[0.03] group-hover:scale-110 transition-transform"></i>
        </div>

    </div>
</template>