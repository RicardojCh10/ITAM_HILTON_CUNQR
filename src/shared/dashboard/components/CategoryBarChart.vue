<script setup lang="ts">
import { computed } from 'vue';
import Chart from 'primevue/chart';
import type { CategoryCount } from '@/modules/dashboard/types/dashboard.types';

const props = defineProps<{ data: CategoryCount[] }>();

const chartData = computed(() => {
    const safeData = props.data || [];
    return {
        labels: safeData.map(item => item.category),
        datasets: [{
            label: 'Cantidad de Equipos',
            data: safeData.map(item => item.count),
            backgroundColor: '#7AAACE', 
            borderRadius: 4
        }]
    };
});

const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } }, 
    scales: {
        y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
        x: { grid: { display: false } }
    }
};
</script>

<template>
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[350px] flex flex-col">
        <h3 class="font-bold text-gray-800 mb-4">Top Categorías de Activos</h3>
        <div class="flex-1 relative">
            <Chart type="bar" :data="chartData" :options="chartOptions" class="h-full w-full" />
        </div>
    </div>
</template>