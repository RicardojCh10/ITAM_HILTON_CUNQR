<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '@/shared/components/AppSidebar.vue';
import AppTopbar from '@/shared/components/AppTopbar.vue';
import Drawer from 'primevue/drawer';

const route = useRoute();

// --- ESTADOS SEPARADOS ---
const isMobileSidebarOpen = ref(false);
const isDesktopSidebarOpen = ref(true); // Por defecto abierto en PC

// --- LÓGICA INTELIGENTE DE TOGGLE ---
const toggleSidebar = () => {
    // Detectamos si es pantalla "Desktop" (>= 1024px es el estándar de Tailwind 'lg')
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
        // En PC: Alternamos la visibilidad del sidebar estático
        isDesktopSidebarOpen.value = !isDesktopSidebarOpen.value;
    } else {
        // En Móvil: Abrimos/Cerramos el Drawer (overlay)
        isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
    }
};

// UX: Cerrar sidebar móvil al navegar (en PC se mantiene como el usuario lo dejó)
watch(() => route.fullPath, () => {
    isMobileSidebarOpen.value = false;
});

// Listener opcional: Si el usuario redimensiona la ventana, ajustamos para evitar bugs visuales
onMounted(() => {
    window.addEventListener('resize', () => {
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
        if (!isDesktop) {
            // Si pasamos a móvil, aseguramos que el sidebar desktop no estorbe (aunque CSS lo oculta)
            // No necesitamos cambiar isDesktopSidebarOpen, CSS se encarga con 'lg:block'
        }
    });
});
</script>

<template>
    <div class="min-h-screen bg-surface-50 flex relative overflow-hidden">

        <aside 
            class="hidden lg:block w-64 fixed inset-y-0 left-0 z-30 bg-white border-r border-surface-200 h-full transition-transform duration-300 ease-in-out"
            :class="isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        >
            <AppSidebar />
        </aside>

        <Drawer 
            v-model:visible="isMobileSidebarOpen" 
            :show-close-icon="false"
            :pt="{
                root: { class: 'w-64 border-r border-surface-200 lg:hidden' },
                header: { class: 'hidden' },
                content: { class: 'p-0' }
            }"
        >
            <AppSidebar />
        </Drawer>

        <div 
            class="flex-1 flex flex-col min-w-0 transition-all duration-300 w-full"
            :class="{ 'lg:ml-64': isDesktopSidebarOpen }"
        >
            
            <AppTopbar @toggle-sidebar="toggleSidebar" />

            <main class="flex-1 p-4 sm:p-6 lg:p-8">
                <div class="mx-auto w-full" style="max-width: 1600px;">
                    <router-view v-slot="{ Component }">
                        <transition name="fade" mode="out-in">
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </div>
            </main>

            <footer class="px-8 py-4 text-center text-xs text-surface-400 border-t border-surface-200 bg-white">
                © 2026 ITAM Hilton.
            </footer>
        </div>

    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
