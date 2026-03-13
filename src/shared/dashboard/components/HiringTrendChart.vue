<script setup lang="ts">
import { computed } from 'vue';
import Chart from 'primevue/chart';
import type { HiringTrend } from '@/modules/dashboard/types/dashboard.types';

const props = defineProps<{ data: HiringTrend[] }>();

const chartData = computed(() => {
    // La BD suele traer de más nuevo a más viejo. Revertimos para que la gráfica vaya de Izq a Der en el tiempo.
    const safeData = [...(props.data || [])].reverse(); 
    
    return {
        labels: safeData.map(item => item.month),
        datasets: [{
            label: 'Nuevos Ingresos',
            data: safeData.map(item => item.count),
            fill: true,
            borderColor: '#8B5CF6', // Purple
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            tension: 0.3
        }]
    };
});

const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
};
</script>

<template>
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[350px] flex flex-col">
        <h3 class="font-bold text-gray-800 mb-4">Tendencia de Contrataciones (Últimos meses)</h3>
        <div class="flex-1 relative">
            <Chart type="line" :data="chartData" :options="chartOptions" class="h-full w-full" />
        </div>
    </div>
</template>