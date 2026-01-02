<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import Button from 'primevue/button';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 font-sans text-surface-900 transition-colors duration-300">
    
    <header class="bg-white border-b border-surface-200 sticky top-0 z-50 px-6 py-4 shadow-md backdrop-blur-sm bg-opacity-95">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white shadow-lg">
            <i class="pi pi-building text-2xl"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-surface-900 tracking-tight leading-none">ITAM Hilton</h1>
            <p class="text-xs text-surface-500 font-medium uppercase tracking-wider mt-1">Asset Management System</p>
          </div>
        </div>

        <div v-if="user" class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-semibold text-surface-900">{{ user.name }}</p>
            <p class="text-xs text-surface-500">{{ user.email }}</p>
          </div>
          <Button 
            icon="pi pi-sign-out" 
            class="!rounded-full !w-11 !h-11 !p-0 shadow-sm hover:shadow-md transition-all"
            severity="secondary" 
            text 
            v-tooltip.bottom="'Cerrar Sesión'"
            @click="authStore.logout()" 
          />
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto p-6 lg:p-8">
        
        <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>

    </main>

    <footer class="max-w-7xl mx-auto px-6 py-8 mt-12 border-t border-surface-200">
      <div class="text-center text-sm text-surface-500">
        <p>© 2025 ITAM Hilton - Asset Management System</p>
        <p class="mt-1">Versión 2.0.1 | Powered by Vue 3 & PrimeVue</p>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* Animaciones de Transición entre Páginas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>