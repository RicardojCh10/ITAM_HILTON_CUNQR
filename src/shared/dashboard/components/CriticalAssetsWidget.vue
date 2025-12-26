<script setup lang="ts">
const assets = [
  { name: 'Servidor Principal', usage: 90 },
  { name: 'Switch Core', usage: 75 },
  { name: 'Router Internet', usage: 65 }
]
</script>

<template>
  <div class="card">
    <h3 class="font-semibold text-xl mb-6">Activos Críticos</h3>

    <ul class="space-y-4">
      <li v-for="asset in assets" :key="asset.name" class="flex justify-between items-center">
        <span class="font-medium">{{ asset.name }}</span>

        <div class="flex items-center gap-3">
          <div class="w-32 h-2 bg-surface-200 rounded overflow-hidden">
            <div
              class="h-full"
              :style="{
                width: asset.usage + '%',
                backgroundColor: 'var(--p-primary-color)'
              }"
            ></div>
          </div>
          <span class="text-sm font-bold">{{ asset.usage }}%</span>
        </div>
      </li>
    </ul>
  </div>
</template>
