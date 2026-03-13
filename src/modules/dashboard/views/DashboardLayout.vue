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
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
        isDesktopSidebarOpen.value = !isDesktopSidebarOpen.value;
    } else {
        isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
    }
};

watch(() => route.fullPath, () => {
    isMobileSidebarOpen.value = false;
});

onMounted(() => {
    window.addEventListener('resize', () => {
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
        if (!isDesktop) {
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
