<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router'; // Importar router
import { useAuthStore } from '@/modules/auth/store/auth.store';

// Componentes PrimeVue
import Button from 'primevue/button';
import { Menubar } from 'primevue';

const authStore = useAuthStore();
const router = useRouter();
const user = computed(() => authStore.user);

// Configuracion del menu propicional 
const items = ref([
    {
        label: 'Panel',
        icon: 'pi pi-home',
        route: '/dashboard' 
    },
    {
        label: 'Propiedades',
        icon: 'pi pi-building',
        route: '/dashboard/properties' 
    },
     {
        label: 'Usuarios',
        icon: 'pi pi-users',
        route: '/dashboard/users' 
    },
    {
        label: 'Miembros',
        icon: 'pi pi-id-card',
        route: '/dashboard/members' 
    },
    // {
    //     label: 'Proveedores',
    //     icon: 'pi pi-briefcase',
    //     route: '/dashboard/providers' 
    // },
    {
        label: 'Inventario',
        icon: 'pi pi-box',
        route: '/dashboard/assets' 
    },
    {
        label: 'Mantenimiento',
        icon: 'pi pi-verified',
        route: '/dashboard/maintenance' 
    }
]);

</script>
<template>
  <div class="min-h-screen bg-surface-50 font-sans text-surface-900 flex flex-col">
    
    <header class="bg-white border-b border-surface-200 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
            
            <div class="flex items-center gap-3 cursor-pointer shrink-0" @click="router.push('/dashboard')">
                <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <i class="pi pi-building"></i>
                </div>
                <div class="hidden md:block leading-tight">
                    <h1 class="text-lg font-bold text-gray-900">ITAM Hilton</h1>
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Management</span>
                </div>
            </div>

            <div class="hidden md:flex flex-1 justify-center px-8">
                <Menubar :model="items" class=" justify-center p-0">
                    <template #item="{ item, props }">
                        <router-link 
                            v-if="item.route" 
                            v-slot="{ href, navigate, isActive, isExactActive }" 
                            :to="item.route" 
                            custom
                        >
                            <a 
                                :href="href" 
                                v-bind="props.action" 
                                @click="navigate"
                                class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 mx-1"
                                :class="[ 
                                    // Usamos isExactActive para el Dashboard Home para que no se quede prendido siempre
                                    (item.route === '/dashboard' ? isExactActive : isActive) 
                                        ? 'bg-blue-50 text-blue-700' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' 
                                ]"
                            >
                                <span :class="item.icon"></span>
                                <span>{{ item.label }}</span>
                            </a>
                        </router-link>
                    </template>
                </Menubar>
            </div>

            <div class="flex items-center gap-3 shrink-0">
                <div class="text-right hidden lg:block">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-user"></i>
                    <p class="text-sm font-semibold text-gray-800">{{ user?.name }}</p>
                  </div>
                    <p class="text-xs text-gray-500">{{ user?.role }}</p>
                </div>
                <Button 
                    icon="pi pi-sign-out" 
                    severity="secondary" 
                    text 
                    rounded 
                    aria-label="Cerrar Sesión"
                    v-tooltip.bottom="'Salir'"
                    @click="authStore.logout()"
                />
            </div>

        </div>
      </div>
    </header>

    <main
  class="
    flex-1
    w-full
    mx-auto
    px-4 sm:px-6 lg:px-8
    py-8
    max-w-full
    2xl:max-w-[1600px]
    3xl:max-w-[1920px]
  "
>

    <!-- <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"> -->
        <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>
    </main>

    <footer class="bg-white border-t border-surface-200 mt-auto">
        <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <p class="text-center text-xs text-gray-400">
                © 2026 ITAM Hilton. Todos los derechos reservados.
            </p>
        </div>
    </footer>

  </div>
</template>

<style scoped>
/* Ajustes para el Menubar de PrimeVue */
:deep(.p-menubar) {
    padding: 0;
}
:deep(.p-menuitem-content) {
    background: transparent !important;
}

/* Transición suave entre páginas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>