<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Chart from 'primevue/chart';

const chartData = ref();
const chartOptions = ref();

onMounted(() => {
  chartData.value = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Activos Totales',
        data: [1200, 1250, 1280, 1320, 1350, 1380, 1420, 1450, 1470, 1485, 1495, 1500],
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 2
      },
      {
        label: 'Activos Asignados',
        data: [980, 1020, 1050, 1080, 1100, 1120, 1140, 1160, 1170, 1185, 1195, 1200],
        fill: true,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        borderWidth: 2
      }
    ]
  };

  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500'
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
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          }
        }
      },
      y: {
        beginAtZero: false,
        min: 900,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };
});
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-surface-200 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-bold text-surface-900">Tendencia de Activos</h3>
        <p class="text-sm text-surface-500 mt-1">Evolución anual del inventario</p>
      </div>
      <div class="p-2 bg-blue-50 rounded-lg">
        <i class="pi pi-chart-line text-primary text-xl"></i>
      </div>
    </div>
    
    <div class="h-64">
      <Chart type="line" :data="chartData" :options="chartOptions" />
    </div>

    <div class="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
      <div class="flex items-center gap-2">
        <i class="pi pi-arrow-up text-green-500 text-sm"></i>
        <span class="text-sm font-semibold text-green-600">+25% vs año anterior</span>
      </div>
      <span class="text-xs text-surface-500">Actualizado hoy</span>
    </div>
  </div>
</template>