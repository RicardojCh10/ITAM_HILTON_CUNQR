import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth.service';
import type { LoginPayload, User } from '../types/auth';

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter();

    // State
    const user = ref<User | null>(null);
    const token = ref<string | null>(localStorage.getItem('access_token'));
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Getters
    const isAuthenticated = computed(() => !!token.value);
    
    const isAdmin = computed(() => {
        const currentRole = user.value?.role;
        if (!currentRole) return false;
        return String(currentRole).trim().toUpperCase() === 'ADMIN';
    });

    // Actions

    // 1. LOGIN (CORREGIDO)
    async function login(payload: LoginPayload) {
        isLoading.value = true;
        error.value = null;

        try {
            localStorage.removeItem('access_token');
            token.value = null;
            user.value = null;

            const responseData = await authService.login(payload);

            if (!responseData.access_token) {
                throw new Error("El servidor no retornó un token de acceso válido.");
            }

            // Guardado de Token
            token.value = responseData.access_token;
            localStorage.setItem('access_token', responseData.access_token);

            
            if (responseData.user) {
                user.value = responseData.user;
                console.log("✅ Usuario cargado desde Login Response");
            } 
            else {
                console.log("🔄 Token recibido, obteniendo perfil de usuario...");
                const userData = await authService.getMe();
                user.value = userData;
                console.log("✅ Usuario cargado desde getMe()");
            }

            // Redirección
            await router.push({ name: 'Dashboard' });

        } catch (err: any) {
            localStorage.removeItem('access_token'); 
            token.value = null; 
            
            if (err.response?.status === 401) {
                error.value = 'Credenciales incorrectas.';
            } else {
                error.value = err.message || 'Error de conexión con el servidor.';
            }
        } finally {
            isLoading.value = false;
        }
    }

    // 2. LOGOUT
    function logout() {
        user.value = null;
        token.value = null;
        localStorage.removeItem('access_token');
        router.push({ name: 'Login' });
    }

    // 3. CHECK AUTH
    async function checkAuth(): Promise<boolean> {
        const storedToken = localStorage.getItem('access_token');
        if (!token.value && !storedToken) return false;

        if (user.value) return true;

        try {
            if (!token.value) token.value = storedToken;

            const userData = await authService.getMe();
            user.value = userData;
            return true;
        } catch (e) {
            logout();
            return false;
        }
    }

    return {
        user,
        token,
        isLoading,
        error,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        checkAuth
    };
});