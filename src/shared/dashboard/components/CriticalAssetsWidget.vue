<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import Badge from 'primevue/badge';

interface CriticalAsset {
  id: string;
  name: string;
  type: string;
  usage: number;
  status: 'critical' | 'warning' | 'normal';
  location: string;
  lastMaintenance: string;
  icon: string;
}

const assets = ref<CriticalAsset[]>([
  { 
    id: 'SRV-001',
    name: 'Servidor Principal',
    type: 'Hardware',
    usage: 92,
    status: 'critical',
    location: 'Data Center - Rack A3',
    lastMaintenance: '2024-12-15',
    icon: 'pi-server'
  },
  { 
    id: 'NET-045',
    name: 'Switch Core',
    type: 'Red',
    usage: 78,
    status: 'warning',
    location: 'Data Center - Rack B2',
    lastMaintenance: '2024-12-20',
    icon: 'pi-share-alt'
  },
  { 
    id: 'NET-012',
    name: 'Router Internet Principal',
    type: 'Red',
    usage: 85,
    status: 'critical',
    location: 'Data Center - Rack A1',
    lastMaintenance: '2024-12-10',
    icon: 'pi-sitemap'
  },
  { 
    id: 'SRV-008',
    name: 'Servidor Backup',
    type: 'Hardware',
    usage: 65,
    status: 'warning',
    location: 'Data Center - Rack A4',
    lastMaintenance: '2024-12-22',
    icon: 'pi-database'
  },
  { 
    id: 'NET-089',
    name: 'Firewall Principal',
    type: 'Seguridad',
    usage: 71,
    status: 'warning',
    location: 'Data Center - Rack A2',
    lastMaintenance: '2024-12-18',
    icon: 'pi-shield'
  }
]);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'critical': return 'bg-red-500';
    case 'warning': return 'bg-orange-500';
    case 'normal': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getUsageColor = (usage: number) => {
  if (usage >= 85) return 'from-red-500 to-red-600';
  if (usage >= 70) return 'from-orange-500 to-orange-600';
  return 'from-green-500 to-green-600';
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'critical': return 'CRÍTICO';
    case 'warning': return 'ALERTA';
    case 'normal': return 'NORMAL';
    default: return status;
  }
};

const getStatusSeverity = (status: string): 'danger' | 'warning' | 'success' => {
  switch (status) {
    case 'critical': return 'danger';
    case 'warning': return 'warning';
    case 'normal': return 'success';
    default: return 'warning';
  }
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
    
    <!-- Table Header -->
    <div class="bg-surface-50 px-6 py-4 border-b border-surface-200">
      <div class="grid grid-cols-12 gap-4 items-center text-sm font-semibold text-surface-700 uppercase tracking-wide">
        <div class="col-span-1 text-center">Estado</div>
        <div class="col-span-3">Activo</div>
        <div class="col-span-2">Ubicación</div>
        <div class="col-span-2">Uso</div>
        <div class="col-span-2">Último Mtto.</div>
        <div class="col-span-2 text-center">Acciones</div>
      </div>
    </div>

    <!-- Table Body -->
    <div class="divide-y divide-surface-100">
      <div 
        v-for="asset in assets" 
        :key="asset.id"
        class="px-6 py-4 hover:bg-surface-50 transition-colors duration-200 group"
      >
        <div class="grid grid-cols-12 gap-4 items-center">
          
          <!-- Status Indicator -->
          <div class="col-span-1 flex justify-center">
            <Badge 
              :value="getStatusLabel(asset.status)" 
              :severity="getStatusSeverity(asset.status)"
              class="text-xs font-semibold"
            />
          </div>

          <!-- Asset Info -->
          <div class="col-span-3">
            <div class="flex items-center gap-3">
              <div :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                asset.status === 'critical' ? 'bg-red-100' : asset.status === 'warning' ? 'bg-orange-100' : 'bg-green-100'
              ]">
                <i :class="[
                  'pi text-lg',
                  asset.icon,
                  asset.status === 'critical' ? 'text-red-600' : asset.status === 'warning' ? 'text-orange-600' : 'text-green-600'
                ]"></i>
              </div>
              <div>
                <div class="font-semibold text-surface-900 group-hover:text-primary transition-colors">
                  {{ asset.name }}
                </div>
                <div class="text-xs text-surface-500 mt-0.5 flex items-center gap-1.5">
                  <span class="font-mono bg-surface-100 px-2 py-0.5 rounded">{{ asset.id }}</span>
                  <span>•</span>
                  <span>{{ asset.type }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Location -->
          <div class="col-span-2">
            <div class="flex items-center gap-2 text-sm text-surface-600">
              <i class="pi pi-map-marker text-xs text-surface-400"></i>
              <span>{{ asset.location }}</span>
            </div>
          </div>

          <!-- Usage -->
          <div class="col-span-2">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-surface-700">{{ asset.usage }}%</span>
                <span :class="[
                  'text-xs font-semibold',
                  asset.usage >= 85 ? 'text-red-600' : asset.usage >= 70 ? 'text-orange-600' : 'text-green-600'
                ]">
                  {{ asset.usage >= 85 ? 'ALTO' : asset.usage >= 70 ? 'MEDIO' : 'NORMAL' }}
                </span>
              </div>
              <div class="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 bg-gradient-to-r"
                  :class="getUsageColor(asset.usage)"
                  :style="{ width: asset.usage + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Last Maintenance -->
          <div class="col-span-2">
            <div class="flex items-center gap-2 text-sm text-surface-600">
              <i class="pi pi-calendar text-xs text-surface-400"></i>
              <span>{{ asset.lastMaintenance }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="col-span-2 flex items-center justify-center gap-2">
            <Button 
              icon="pi pi-eye" 
              text 
              rounded
              severity="secondary"
              size="small"
              v-tooltip.top="'Ver Detalles'"
              class="!w-8 !h-8"
            />
            <Button 
              icon="pi pi-chart-line" 
              text 
              rounded
              severity="secondary"
              size="small"
              v-tooltip.top="'Ver Métricas'"
              class="!w-8 !h-8"
            />
            <Button 
              icon="pi pi-cog" 
              text 
              rounded
              severity="secondary"
              size="small"
              v-tooltip.top="'Configurar'"
              class="!w-8 !h-8"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-surface-50 px-6 py-3 border-t border-surface-200 flex items-center justify-between">
      <div class="text-sm text-surface-600">
        Mostrando <span class="font-semibold">{{ assets.length }}</span> activos críticos
      </div>
      <div class="flex items-center gap-2">
        <Button 
          label="Exportar" 
          icon="pi pi-download" 
          size="small" 
          text
          severity="secondary"
        />
        <Button 
          label="Actualizar" 
          icon="pi pi-refresh" 
          size="small" 
          text
          severity="secondary"
        />
      </div>
    </div>
  </div>
</template>