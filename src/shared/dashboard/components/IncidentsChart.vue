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
        label: 'Incidencias Críticas',
        data: [8, 6, 9, 12, 10, 8, 7, 9, 11, 10, 8, 5],
        fill: true,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Incidencias Moderadas',
        data: [15, 18, 16, 20, 22, 19, 17, 18, 21, 19, 17, 15],
        fill: true,
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.2)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(251, 146, 60)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Incidencias Leves',
        data: [25, 28, 24, 30, 32, 28, 26, 29, 31, 30, 27, 22],
        fill: true,
        borderColor: 'rgb(250, 204, 21)',
        backgroundColor: 'rgba(250, 204, 21, 0.2)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(250, 204, 21)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
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
            return ` ${context.dataset.label}: ${context.parsed.y} incidencias`;
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
        stacked: false,
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
        <h3 class="text-lg font-bold text-surface-900">Tendencia de Incidencias</h3>
        <p class="text-sm text-surface-500 mt-1">Seguimiento por nivel de prioridad</p>
      </div>
      <div class="p-2 bg-red-50 rounded-lg">
        <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
      </div>
    </div>
    
    <div class="h-64">
      <Chart type="line" :data="chartData" :options="chartOptions" />
    </div>

    <div class="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-surface-100">
      <div class="text-center">
        <div class="text-2xl font-bold text-red-500">103</div>
        <div class="text-xs text-surface-500 mt-1">Críticas</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-orange-500">217</div>
        <div class="text-xs text-surface-500 mt-1">Moderadas</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-yellow-500">332</div>
        <div class="text-xs text-surface-500 mt-1">Leves</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">-15%</div>
        <div class="text-xs text-surface-500 mt-1">vs mes ant.</div>
      </div>
    </div>
  </div>
</template>