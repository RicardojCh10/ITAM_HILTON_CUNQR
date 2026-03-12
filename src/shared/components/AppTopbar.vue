<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';

// Emitimos evento para el Layout
const emit = defineEmits(['toggle-sidebar']);

// 1. Obtenemos datos
const route = useRoute();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

// 2. Título Dinámico
const pageTitle = computed(() => {
    return (route.meta?.title as string) || 'Vista General';
});

// 3. Menú de Usuario
const menu = ref();
const userMenuItems = [
    { label: 'Cerrar Sesión', icon: 'pi pi-sign-out', command: () => authStore.logout() }
];

const toggleUserMenu = (event: any) => {
    menu.value.toggle(event);
};
</script>

<template>
    <header class="h-16 bg-white border-b border-surface-200 flex justify-between items-center px-4 lg:px-8 sticky top-0 z-40 transition-all duration-300">
        
        <div class="flex items-center gap-4">
            <Button 
                icon="pi pi-bars" 
                text 
                rounded 
                class="text-surface-600 hover:bg-surface-100 focus:ring-0" 
                @click="emit('toggle-sidebar')"
            />
            
            <h1 class="text-lg font-medium text-surface-500 hidden sm:block">
                <span class="text-surface-900 font-semibold">{{ pageTitle }}</span>
            </h1>
        </div>

        <div class="flex items-center gap-3">
            
            <div class="h-6 w-px bg-surface-200 mx-2 hidden sm:block"></div>

            <div 
                class="flex items-center gap-3 cursor-pointer hover:bg-surface-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-surface-200"
                @click="toggleUserMenu"
                aria-haspopup="true" 
                aria-controls="overlay_menu"
            >
                <div class="text-right hidden md:block">
                    <p class="text-sm font-semibold text-surface-900 leading-tight">{{ user?.name }}</p>
                    <p class="text-xs text-surface-500 leading-tight">{{ user?.role || 'Usuario' }}</p>
                </div>
                
                <Avatar 
                    :label="user?.name?.charAt(0).toUpperCase()" 
                    class="bg-indigo-50 text-indigo-600 border border-indigo-100" 
                    shape="circle" 
                />
                
                <i class="pi pi-angle-down text-xs text-surface-400 hidden md:block"></i>
            </div>
            
            <Menu ref="menu" id="overlay_menu" :model="userMenuItems" :popup="true" />
        </div>

    </header>
</template>