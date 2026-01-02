<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import Button from 'primevue/button';
import CriticalAssetsWidget from '@/shared/dashboard/components/CriticalAssetsWidget.vue';
import RecentAssetsWidget from '@/shared/dashboard/components/RecentAssetsWidget.vue';
import StatsWidget from '@/shared/dashboard/components/StatsWidget.vue';
import AssetTrendsChart from '@/shared/dashboard/components/AssetTrendsChart.vue';
import AssetDistributionChart from '@/shared/dashboard/components/AssetDistributionChart.vue';
import MaintenanceChart from '@/shared/dashboard/components/MaintenanceChart.vue';
import IncidentsChart from '@/shared/dashboard/components/IncidentsChart.vue';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

// Usamos el getter blindado del store que creamos antes
const isAdmin = computed(() => authStore.isAdmin);
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h2 class="text-3xl font-bold text-surface-900 mb-1">Panel de Control</h2>
        <p class="text-surface-600">
          Resumen operativo de la propiedad <span class="text-primary font-semibold">Hilton Cancún</span>
        </p>
      </div>
      
      <div v-if="isAdmin" class="flex gap-3">
        <Button label="Nuevo Activo" icon="pi pi-plus" size="small" class="shadow-sm hover:shadow-md transition-shadow" />
        <Button label="Generar Reporte" icon="pi pi-file-excel" severity="secondary" size="small" class="shadow-sm hover:shadow-md transition-shadow" />
      </div>
    </div>

    <template v-if="isAdmin">
        <section>
          <StatsWidget 
            :totalAssets="1500"
            :maintenanceAssets="45"
            :assignedAssets="1200"
            :openIncidents="12"
          />
        </section>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-surface-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <span class="text-surface-500 text-sm font-medium">Estado del Sistema</span>
                <div class="flex items-center gap-2 mt-3">
                  <span class="relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <h3 class="text-2xl font-bold text-surface-900">Online</h3>
                </div>
                <p class="text-xs text-surface-500 mt-2">Última actualización: hace 2 min</p>
              </div>
              <div class="p-3 bg-green-50 rounded-xl group-hover:scale-110 transition-transform">
                <i class="pi pi-server text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-surface-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <span class="text-surface-500 text-sm font-medium">Tu Rol Actual</span>
                <h3 class="text-2xl font-bold text-surface-900 mt-3 capitalize">
                  {{ user?.role }}
                </h3>
                <p class="text-xs text-surface-500 mt-2">Acceso completo al sistema</p>
              </div>
              <div class="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                <i class="pi pi-shield text-primary text-2xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-surface-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <span class="text-surface-500 text-sm font-medium">Garantías por Vencer</span>
                <h3 class="text-2xl font-bold text-surface-900 mt-3">3</h3>
                <p class="text-xs text-orange-600 mt-2 font-medium">Próximos 30 días</p>
              </div>
              <div class="p-3 bg-orange-50 rounded-xl group-hover:scale-110 transition-transform">
                <i class="pi pi-clock text-orange-500 text-2xl"></i>
              </div>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetTrendsChart />
          <AssetDistributionChart />
          <MaintenanceChart />
          <IncidentsChart />
        </section>

        <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-7 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-surface-900">Activos Críticos</h3>
              <Button label="Ver Todos" icon="pi pi-arrow-right" text size="small" iconPos="right" />
            </div>
            <CriticalAssetsWidget />
          </div>

          <div class="lg:col-span-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-surface-900">Activos Recientes</h3>
              <Button label="Ver Todos" icon="pi pi-arrow-right" text size="small" iconPos="right" />
            </div>
            <RecentAssetsWidget />
          </div>
        </section>
    </template>

    <div v-else class="bg-white border-l-4 border-l-red-500 p-8 rounded-xl shadow-md flex items-center gap-6">
      <div class="bg-red-50 p-5 rounded-full">
        <i class="pi pi-lock text-4xl text-red-500"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-surface-900">Acceso Limitado</h3>
        <p class="text-surface-600 mt-2">
          Tu cuenta de usuario ({{ user?.role }}) no tiene los privilegios necesarios para ver el panel administrativo.
        </p>
        <p class="text-sm text-surface-500 mt-2">
          Contacta al administrador del sistema para solicitar permisos adicionales.
        </p>
      </div>
    </div>

  </div>
</template>