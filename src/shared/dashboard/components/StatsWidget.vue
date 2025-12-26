<script setup lang="ts">
defineProps<{
  totalAssets: number
  maintenanceAssets: number
  assignedAssets: number
  openIncidents: number
}>()
</script>

<template>
  <div class="col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

    <div class="card">
      <span class="block text-muted-color mb-2">Total de Activos</span>
      <div class="text-2xl font-bold text-surface-900">{{ totalAssets }}</div>
    </div>

    <div class="card border-l-4" style="border-color: var(--p-highlight-text-color)">
      <span class="block text-muted-color mb-2">En Mantenimiento</span>
      <div class="text-2xl font-bold">{{ maintenanceAssets }}</div>
    </div>

    <div class="card border-l-4" style="border-color: var(--p-primary-color)">
      <span class="block text-muted-color mb-2">Asignados</span>
      <div class="text-2xl font-bold">{{ assignedAssets }}</div>
    </div>

    <div class="card border-l-4 border-red-400">
      <span class="block text-muted-color mb-2">Incidencias Abiertas</span>
      <div class="text-2xl font-bold text-red-500">{{ openIncidents }}</div>
    </div>

  </div>
</template>
