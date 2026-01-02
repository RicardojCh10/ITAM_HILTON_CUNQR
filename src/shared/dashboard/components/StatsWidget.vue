<script setup lang="ts">
defineProps<{
  totalAssets: number
  maintenanceAssets: number
  assignedAssets: number
  openIncidents: number
}>()

const getPercentage = (value: number, total: number) => {
  return ((value / total) * 100).toFixed(1);
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

    <!-- Total de Activos -->
    <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div class="flex justify-between items-start mb-4">
        <div class="p-3 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
          <i class="pi pi-box text-2xl"></i>
        </div>
        <span class="text-xs font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-full">
          TOTAL
        </span>
      </div>
      
      <div class="space-y-2">
        <span class="block text-sm font-medium opacity-90">Total de Activos</span>
        <div class="text-4xl font-bold tracking-tight">
          {{ totalAssets.toLocaleString() }}
        </div>
        <div class="flex items-center gap-2 text-sm">
          <i class="pi pi-arrow-up text-xs"></i>
          <span class="font-semibold">+12%</span>
          <span class="opacity-75">vs último año</span>
        </div>
      </div>
    </div>

    <!-- En Mantenimiento -->
    <div class="bg-white p-6 rounded-xl shadow-sm border-2 border-orange-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16"></div>
      
      <div class="relative z-10">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-orange-50 rounded-lg">
            <i class="pi pi-wrench text-2xl text-orange-600"></i>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold text-surface-500">PORCENTAJE</div>
            <div class="text-lg font-bold text-orange-600">
              {{ getPercentage(maintenanceAssets, totalAssets) }}%
            </div>
          </div>
        </div>
        
        <div class="space-y-2">
          <span class="block text-sm font-medium text-surface-600">En Mantenimiento</span>
          <div class="text-4xl font-bold text-surface-900">
            {{ maintenanceAssets }}
          </div>
          <div class="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
              :style="{ width: getPercentage(maintenanceAssets, totalAssets) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activos Asignados -->
    <div class="bg-white p-6 rounded-xl shadow-sm border-2 border-green-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16"></div>
      
      <div class="relative z-10">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-green-50 rounded-lg">
            <i class="pi pi-check-circle text-2xl text-green-600"></i>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold text-surface-500">PORCENTAJE</div>
            <div class="text-lg font-bold text-green-600">
              {{ getPercentage(assignedAssets, totalAssets) }}%
            </div>
          </div>
        </div>
        
        <div class="space-y-2">
          <span class="block text-sm font-medium text-surface-600">Activos Asignados</span>
          <div class="text-4xl font-bold text-surface-900">
            {{ assignedAssets.toLocaleString() }}
          </div>
          <div class="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
              :style="{ width: getPercentage(assignedAssets, totalAssets) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Incidencias Abiertas -->
    <div class="bg-white p-6 rounded-xl shadow-sm border-2 border-red-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16"></div>
      
      <div class="relative z-10">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-red-50 rounded-lg">
            <i class="pi pi-exclamation-circle text-2xl text-red-600"></i>
          </div>
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        
        <div class="space-y-2">
          <span class="block text-sm font-medium text-surface-600">Incidencias Abiertas</span>
          <div class="text-4xl font-bold text-red-600">
            {{ openIncidents }}
          </div>
          <div class="flex items-center gap-2 text-sm text-surface-600">
            <i class="pi pi-clock text-xs text-red-500"></i>
            <span>Requieren atención inmediata</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Smooth animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>