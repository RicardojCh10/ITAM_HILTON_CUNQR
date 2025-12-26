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
    
    // Getter blindado para roles (Case Insensitive)
    const isAdmin = computed(() => {
        const currentRole = user.value?.role;
        if (!currentRole) return false;
        return String(currentRole).trim().toUpperCase() === 'ADMIN';
    });

    // Actions

    // 1. LOGIN
    async function login(payload: LoginPayload) {
        isLoading.value = true;
        error.value = null;

        try {
            // Limpieza preventiva
            localStorage.removeItem('access_token');
            token.value = null;
            user.value = null;

            // Petición al API
            const responseData = await authService.login(payload);

            if (!responseData.access_token) {
                throw new Error("El servidor no retornó un token de acceso válido.");
            }

            // Guardado de Token
            token.value = responseData.access_token;
            localStorage.setItem('access_token', responseData.access_token);

            // Si el login ya devuelve el usuario, lo guardamos aquí.
            if (responseData.user) {
                user.value = responseData.user;
                console.log("✅ Usuario cargado desde Login:", user.value);
            }

            // Redirección
            // El Guard se encargará de verificar si falta algo más.
            await router.push({ name: 'Dashboard' });

        } catch (err: any) {
            // Limpiamos si falló
            localStorage.removeItem('access_token'); 
            
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

    // 3. CHECK AUTH (Vital para el Guard)
    async function checkAuth(): Promise<boolean> {
        // Validación física del token
        const storedToken = localStorage.getItem('access_token');
        if (!token.value && !storedToken) return false;

        // Si ya tenemos usuario en memoria, no gastamos ancho de banda
        if (user.value) return true;

        try {
            // Sincronizamos token en memoria si se perdió por F5
            if (!token.value) token.value = storedToken;

            const userData = await authService.getMe();
            user.value = userData;
            return true;
        } catch (e) {
            logout(); // Auto-limpieza
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