<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

const assets = ref([])


</script>

<template>
  <div class="card">
    <h3 class="font-semibold text-xl mb-4">Activos Recientes</h3>

    <DataTable :value="assets" :rows="5">
      <Column field="code" header="Código" />
      <Column field="type" header="Tipo" />
      <Column field="assignedTo" header="Área" />
      <Column field="status" header="Estado" />
      <Column header="Ver">
        <template #body>
          <Button icon="pi pi-search" text />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
