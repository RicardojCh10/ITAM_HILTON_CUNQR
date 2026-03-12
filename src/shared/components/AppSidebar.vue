<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import Button from 'primevue/button';
import Badge from 'primevue/badge';

const route = useRoute();

// Definimos la interfaz para tipado estricto
interface MenuItem {
    label: string;
    icon: string;
    route: string;
    badge?: number;
}

const items = ref<MenuItem[]>([
    { label: 'Panel', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Propiedades', icon: 'pi pi-building', route: '/dashboard/properties' },
    { label: 'Usuarios', icon: 'pi pi-users', route: '/dashboard/users' },
    { label: 'Departamentos', icon: 'pi pi-sitemap', route: '/dashboard/departments' },
    { label: 'Puestos', icon: 'pi pi-briefcase', route: '/dashboard/positions' },
    { label: 'Plataformas', icon: 'pi pi-globe', route: '/dashboard/platforms' },
    { label: 'Miembros', icon: 'pi pi-id-card', route: '/dashboard/members' },
    { label: 'Proveedores', icon: 'pi pi-truck', route: '/dashboard/providers' },
    { label: 'Categorías', icon: 'pi pi-tags', route: '/dashboard/categories' },
    { label: 'Inventario', icon: 'pi pi-box', route: '/dashboard/assets' },
    { label: 'Mantenimiento', icon: 'pi pi-cog', route: '/dashboard/maintenance' }
]);

// Helper para saber si la ruta está activa (incluyendo hijos)S
const isActive = (path: string) => {
    if (path === '/dashboard') return route.path === path;
    return route.path.startsWith(path);
};
</script>

<template>
    <div class="flex flex-col h-full bg-white border-r border-surface-200">
        <div class="flex items-center gap-3 px-6 h-16 border-b border-surface-100 shrink-0">
            <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <i class="pi pi-building text-lg"></i>
            </div>
            <div>
                <h1 class="text-base font-bold text-surface-900 leading-none">ITAM Hilton</h1>
                <span class="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Management</span>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
            <template v-for="item in items" :key="item.route">
                <router-link 
                    :to="item.route" 
                    custom 
                    v-slot="{ href, navigate }"
                >
                    <a 
                        :href="href" 
                        @click="navigate"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
                        :class="isActive(item.route) 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'"
                    >
                        <i :class="[item.icon, 'text-base transition-colors', isActive(item.route) ? 'text-blue-600' : 'text-surface-400 group-hover:text-surface-600']"></i>
                        <span class="flex-1">{{ item.label }}</span>
                        <Badge v-if="item.badge" :value="item.badge" severity="info" class="text-xs" />
                    </a>
                </router-link>
            </template>
        </div>

        <div class="p-4 border-t border-surface-100 text-center">
            <p class="text-xs text-surface-400">v2.5.0 Enterprise</p>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 4px;
}
</style>