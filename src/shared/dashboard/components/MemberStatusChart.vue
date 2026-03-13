<script setup lang="ts">
import { computed } from 'vue';
import Chart from 'primevue/chart';
import type { StatusCount } from '@/modules/dashboard/types/dashboard.types';

const props = defineProps<{ data: StatusCount[] }>();

const memberColors: Record<string, string> = {
    'ACTIVO': '#6FAF4F',      
    'PENDIENTE_IT': '#D97A2B',
    'BAJA': '#C44A3A',       
    'TERMINADO': '#44ACFF'    
};

const chartData = computed(() => {
    const safeData = props.data || [];
    return {
        labels: safeData.map(item => item.status),
        datasets: [{
            data: safeData.map(item => item.count),
            backgroundColor: safeData.map(item => memberColors[item.status] || '#CBD5E1'),
        }]
    };
});

const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
};
</script>

<template>
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[350px] flex flex-col">
        <h3 class="font-bold text-gray-800 mb-4">Estados de Colaboradores</h3>
        <div class="flex-1 relative">
            <Chart type="pie" :data="chartData" :options="chartOptions" class="h-full w-full" />
        </div>
    </div>
</template>