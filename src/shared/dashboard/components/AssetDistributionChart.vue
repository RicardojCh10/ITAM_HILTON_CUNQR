<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Chart from 'primevue/chart';

const chartData = ref();
const chartOptions = ref();

onMounted(() => {
  chartData.value = {
    labels: ['Hardware', 'Software', 'Mobiliario', 'Equipos de Red', 'Otros'],
    datasets: [
      {
        data: [450, 280, 320, 250, 200],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(168, 85, 247)',
          'rgb(107, 114, 128)'
        ],
        borderWidth: 2
      }
    ]
  };

  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500'
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
              
              return data.labels.map((label: string, i: number) => {
                const value = dataset.data[i];
                const percentage = ((value / total) * 100).toFixed(1);
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${label}: ${value} activos (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };
});
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-surface-200 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-bold text-surface-900">Distribución de Activos</h3>
        <p class="text-sm text-surface-500 mt-1">Por categoría de inventario</p>
      </div>
      <div class="p-2 bg-green-50 rounded-lg">
        <i class="pi pi-chart-pie text-green-600 text-xl"></i>
      </div>
    </div>
    
    <div class="h-64">
      <Chart type="doughnut" :data="chartData" :options="chartOptions" />
    </div>

    <div class="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
      <div class="text-sm">
        <span class="font-semibold text-surface-900">1,500</span>
        <span class="text-surface-500 ml-1">activos totales</span>
      </div>
      <span class="text-xs text-surface-500">5 categorías</span>
    </div>
  </div>
</template>