<script setup lang="ts">
import { computed } from 'vue';
import Chart from 'primevue/chart';
import type { StatusCount } from '@/modules/dashboard/types/dashboard.types';


const props = defineProps<{ data: StatusCount[] }>();

const statusColors: Record<string, string> = {
    'active': '#6FAF4F',    
    'repair': '#D97A2B',    
    'stored': '#44ACFF',   
    'retired': '#ACBAC4',   
    'lost': '#C44A3A'      
};

const chartData = computed(() => {
    const safeData = props.data || [];
    return {
        labels: safeData.map(item => item.status?.toUpperCase() || 'DESCONOCIDO'),
        datasets: [{
            data: safeData.map(item => item.count),
            backgroundColor: safeData.map(item => statusColors[item.status || ''] || '#3B82F6'),
            borderWidth: 0
        }]
    };
});

const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { usePointStyle: true } } },
    cutout: '60%'
};
</script>

<template>
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[350px] flex flex-col">
        <h3 class="font-bold text-gray-800 mb-4">Estado del Inventario Físico</h3>
        <div class="flex-1 relative">
            <Chart type="doughnut" :data="chartData" :options="chartOptions" class="h-full w-full" />
        </div>
    </div>
</template>