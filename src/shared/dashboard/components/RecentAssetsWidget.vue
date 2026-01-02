<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

interface RecentAsset {
  id: string;
  code: string;
  name: string;
  type: string;
  assignedTo: string;
  status: 'active' | 'maintenance' | 'pending';
  addedDate: string;
  value: string;
  icon: string;
}

const assets = ref<RecentAsset[]>([
  {
    id: '1',
    code: 'LAP-2024-156',
    name: 'MacBook Pro 16"',
    type: 'Laptop',
    assignedTo: 'Sistemas',
    status: 'active',
    addedDate: '2024-12-30',
    value: '$2,500',
    icon: 'pi-desktop'
  },
  {
    id: '2',
    code: 'MON-2024-089',
    name: 'Dell UltraSharp 27"',
    type: 'Monitor',
    assignedTo: 'Marketing',
    status: 'active',
    addedDate: '2024-12-29',
    value: '$450',
    icon: 'pi-monitor'
  },
  {
    id: '3',
    code: 'SRV-2024-012',
    name: 'HP ProLiant DL380',
    type: 'Servidor',
    assignedTo: 'Data Center',
    status: 'maintenance',
    addedDate: '2024-12-28',
    value: '$8,500',
    icon: 'pi-server'
  },
  {
    id: '4',
    code: 'NET-2024-078',
    name: 'Cisco Catalyst 2960',
    type: 'Switch',
    assignedTo: 'Infraestructura',
    status: 'active',
    addedDate: '2024-12-27',
    value: '$1,200',
    icon: 'pi-share-alt'
  },
  {
    id: '5',
    code: 'PRI-2024-045',
    name: 'HP LaserJet Pro',
    type: 'Impresora',
    assignedTo: 'Administración',
    status: 'pending',
    addedDate: '2024-12-26',
    value: '$380',
    icon: 'pi-print'
  },
  {
    id: '6',
    code: 'TAB-2024-203',
    name: 'iPad Pro 12.9"',
    type: 'Tablet',
    assignedTo: 'Dirección',
    status: 'active',
    addedDate: '2024-12-25',
    value: '$1,100',
    icon: 'pi-tablet'
  }
]);

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return { label: 'Activo', severity: 'success' as const };
    case 'maintenance':
      return { label: 'Mantenimiento', severity: 'warning' as const };
    case 'pending':
      return { label: 'Pendiente', severity: 'info' as const };
    default:
      return { label: status, severity: 'secondary' as const };
  }
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'Laptop': 'bg-blue-100 text-blue-700',
    'Monitor': 'bg-purple-100 text-purple-700',
    'Servidor': 'bg-red-100 text-red-700',
    'Switch': 'bg-green-100 text-green-700',
    'Impresora': 'bg-orange-100 text-orange-700',
    'Tablet': 'bg-indigo-100 text-indigo-700'
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
};

const formatDate = (date: string) => {
  const d = new Date(date);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays <= 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
    
    <!-- Header -->
    <div class="bg-surface-50 px-5 py-4 border-b border-surface-200">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-semibold text-surface-900">Últimos Registros</h4>
          <p class="text-xs text-surface-500 mt-0.5">Activos agregados recientemente</p>
        </div>
        <Button 
          icon="pi pi-filter" 
          text 
          rounded 
          size="small"
          severity="secondary"
          v-tooltip.left="'Filtrar'"
          class="!w-8 !h-8"
        />
      </div>
    </div>

    <!-- Assets List -->
    <div class="divide-y divide-surface-100 max-h-[600px] overflow-y-auto">
      <div 
        v-for="asset in assets" 
        :key="asset.id"
        class="p-4 hover:bg-surface-50 transition-colors duration-200 group cursor-pointer"
      >
        <div class="flex items-start gap-3">
          
          <!-- Icon -->
          <div class="flex-shrink-0">
            <div :class="[
              'w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
              getTypeColor(asset.type)
            ]">
              <i :class="['pi text-lg', asset.icon]"></i>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="flex-1 min-w-0">
                <h5 class="font-semibold text-sm text-surface-900 truncate group-hover:text-primary transition-colors">
                  {{ asset.name }}
                </h5>
                <p class="text-xs text-surface-500 mt-0.5 font-mono">
                  {{ asset.code }}
                </p>
              </div>
              <Tag 
                :value="getStatusConfig(asset.status).label" 
                :severity="getStatusConfig(asset.status).severity"
                class="text-xs"
              />
            </div>

            <div class="flex items-center gap-3 mt-2 text-xs text-surface-600">
              <div class="flex items-center gap-1.5">
                <i class="pi pi-tag text-[10px] text-surface-400"></i>
                <span>{{ asset.type }}</span>
              </div>
              <span class="text-surface-300">•</span>
              <div class="flex items-center gap-1.5">
                <i class="pi pi-building text-[10px] text-surface-400"></i>
                <span>{{ asset.assignedTo }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between mt-2 pt-2 border-t border-surface-100">
              <div class="flex items-center gap-1.5 text-xs text-surface-500">
                <i class="pi pi-clock text-[10px]"></i>
                <span>{{ formatDate(asset.addedDate) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-primary">{{ asset.value }}</span>
                <Button 
                  icon="pi pi-arrow-right" 
                  text 
                  rounded 
                  size="small"
                  severity="secondary"
                  class="!w-6 !h-6 !p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-surface-50 px-5 py-3 border-t border-surface-200">
      <Button 
        label="Ver Todos los Activos" 
        icon="pi pi-arrow-right" 
        iconPos="right"
        size="small" 
        text
        class="w-full justify-center text-sm font-semibold"
      />
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>