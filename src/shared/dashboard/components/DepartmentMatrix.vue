<script setup lang="ts">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const props = defineProps<{ matrix: any[] }>();

const dynamicColumns = computed(() => {
    const safeMatrix = props.matrix || [];
    const keys = new Set<string>();
    
    safeMatrix.forEach(row => {
        Object.keys(row).forEach(key => {
            if (key !== 'department') keys.add(key);
        });
    });
    
    return Array.from(keys);
});
</script>

<template>
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 class="font-bold text-gray-800 mb-4"><i class="pi pi-table mr-2 text-blue-600"></i> Matriz: Depto vs Categoría</h3>
        
        <DataTable :value="matrix || []" class="p-datatable-sm" stripedRows showGridlines scrollable scrollHeight="400px">
            
            <Column field="department" header="Departamento" frozen style="min-width: 200px; font-weight: bold;" class="bg-gray-50" />
            
            <Column v-for="col in dynamicColumns" :key="col" :field="col" :header="col">
                <template #body="slotProps">
                    <span :class="slotProps.data[col] ? 'text-gray-900 font-bold' : 'text-gray-300'">
                        {{ slotProps.data[col] || 0 }}
                    </span>
                </template>
            </Column>
            
            <template #empty>
                <div class="text-center p-4 text-gray-500">No hay datos suficientes para generar la matriz.</div>
            </template>
        </DataTable>
    </div>
</template>