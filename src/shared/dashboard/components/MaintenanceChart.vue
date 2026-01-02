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
        label: 'Mantenimientos Programados',
        data: [32, 28, 35, 42, 38, 40, 45, 48, 44, 50, 46, 45],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: 'Mantenimientos Completados',
        data: [30, 27, 33, 40, 36, 38, 43, 46, 42, 48, 44, 43],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: 'Mantenimientos Urgentes',
        data: [5, 4, 6, 8, 7, 5, 6, 7, 8, 9, 6, 5],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        borderRadius: 6
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
        callbacks: {
          label: (context: any) => {
            return ` ${context.dataset.label}: ${context.parsed.y} activos`;
          }
        }
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
        beginAtZero: true,
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
        <h3 class="text-lg font-bold text-surface-900">Gestión de Mantenimiento</h3>
        <p class="text-sm text-surface-500 mt-1">Historial mensual del año</p>
      </div>
      <div class="p-2 bg-orange-50 rounded-lg">
        <i class="pi pi-wrench text-orange-600 text-xl"></i>
      </div>
    </div>
    
    <div class="h-64">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>

    <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-surface-100">
      <div class="text-center">
        <div class="text-2xl font-bold text-primary">520</div>
        <div class="text-xs text-surface-500 mt-1">Programados</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">498</div>
        <div class="text-xs text-surface-500 mt-1">Completados</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-red-500">76</div>
        <div class="text-xs text-surface-500 mt-1">Urgentes</div>
      </div>
    </div>
  </div>
</template>