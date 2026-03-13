<script setup lang="ts">
import { onMounted } from 'vue';
import { useDashboardStore } from '@/modules/dashboard/store/dashboard.store';

import OverviewCards from '@/shared/dashboard/components/OverviewCards.vue';
import AlertsWidget from '@/shared/dashboard/components/AlertsWidget.vue';
import AssetStatusPieChart from '@/shared/dashboard/components/AssetStatusPieChart.vue';
import CategoryBarChart from '@/shared/dashboard/components/CategoryBarChart.vue';
import DepartmentMatrix from '@/shared/dashboard/components/DepartmentMatrix.vue';
import MemberStatusChart from '@/shared/dashboard/components/MemberStatusChart.vue';
import HiringTrendChart from '@/shared/dashboard/components/HiringTrendChart.vue';

const dashboardStore = useDashboardStore();

onMounted(() => {
    dashboardStore.fetchDashboardData();
});
</script>

<template>
  <div class="space-y-6" v-if="dashboardStore.data && !dashboardStore.isLoading">
      
      <OverviewCards :overview="dashboardStore.data.overview" />

      <AlertsWidget 
        :expiringWarranties="dashboardStore.data.alerts.expiring_warranties"
        :pendingOffboardings="dashboardStore.data.alerts.pending_offboardings"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <AssetStatusPieChart :data="dashboardStore.data.assets.by_status" />
         <CategoryBarChart :data="dashboardStore.data.assets.by_category" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <MemberStatusChart :data="dashboardStore.data.members.by_status" />
         <HiringTrendChart :data="dashboardStore.data.members.hiring_trend" />
      </div>

      <DepartmentMatrix :matrix="dashboardStore.data.matrix" />

  </div>
</template>