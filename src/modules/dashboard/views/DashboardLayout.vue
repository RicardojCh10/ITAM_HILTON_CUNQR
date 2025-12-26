<script setup lang="ts">
import { computed, watch } from 'vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import Button from 'primevue/button';

const authStore = useAuthStore();

/**
 * Usuario reactivo ligado al store
 */
const user = computed(() => authStore.user);

/**
 * Determina si el usuario es ADMIN
 */
const isAdmin = computed(() => {
  const role = user.value?.role;
  return !!role && String(role).trim().toUpperCase() === 'ADMIN';
});

/**
 * Debug reactivo (eliminar en producción)
 */
watch(user, (newVal) => {
  console.log('Usuario actualizado:', newVal);
});
</script>

<template>
  <div class="min-h-screen bg-surface-50 p-8">

    <!-- Header -->
    <header
      v-if="user"
      class="flex justify-between items-center mb-8 bg-surface-0 p-4 rounded-xl shadow-sm border border-surface-200"
    >
      <div>
        <h1 class="text-xl font-bold text-surface-900">
          Panel de Control ITAM – Hilton
        </h1>
        <p class="text-sm text-surface-500">
          Bienvenido,
          <span class="font-bold text-primary">
            {{ user.name }}
          </span>
        </p>
      </div>

      <Button
        label="Cerrar Sesión"
        icon="pi pi-sign-out"
        severity="secondary"
        @click="authStore.logout()"
      />
    </header>

    <!-- Skeleton -->
    <div v-else class="mb-8 p-4 bg-surface-0 rounded-xl animate-pulse">
      <div class="h-10 bg-surface-200 rounded w-1/3 mb-2"></div>
      <div class="h-4 bg-surface-200 rounded w-1/4"></div>
    </div>

    <!-- Main -->
    <main v-if="user">

      <!-- Admin Dashboard -->
      <div
        v-if="isAdmin"
        class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in"
      >

        <!-- Estado del sistema -->
        <div
          class="bg-surface-0 p-6 rounded-xl shadow-sm border-l-4"
          style="border-color: var(--p-primary-color);"
        >
          <div class="flex justify-between items-start">
            <div>
              <span class="text-surface-500 text-sm">
                Estado del Sistema
              </span>
              <h3 class="text-2xl font-bold text-surface-900 mt-1">
                Online
              </h3>
            </div>
            <i class="pi pi-server text-primary text-xl"></i>
          </div>
        </div>

        <!-- Usuario actual -->
        <div
          class="bg-surface-0 p-6 rounded-xl shadow-sm border-l-4"
          style="border-color: var(--p-highlight-text-color);"
        >
          <div class="flex justify-between items-start">
            <div>
              <span class="text-surface-500 text-sm">
                Usuario Actual
              </span>
              <h3 class="text-lg font-bold text-surface-900 mt-1">
                {{ user.email }}
              </h3>
            </div>
            <i
              class="pi pi-user text-xl"
              style="color: var(--p-highlight-text-color);"
            ></i>
          </div>
        </div>

      </div>

      <!-- Acceso limitado -->
      <div
        v-else
        class="p-6 bg-surface-100 text-surface-900 rounded-xl border border-surface-200 flex items-center gap-4"
      >
        <i
          class="pi pi-lock text-2xl"
          style="color: var(--p-primary-color);"
        ></i>
        <div>
          <h3 class="font-bold">
            Acceso limitado
          </h3>
          <p class="text-sm text-surface-600">
            Tu rol actual ({{ user.role }}) no tiene permisos para ver el tablero.
          </p>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
