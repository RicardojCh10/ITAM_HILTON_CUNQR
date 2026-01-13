<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router'; // <--- 1. IMPORTAR ROUTER
import { useAuthStore } from '../store/auth.store';
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Toast from 'primevue/toast';

const router = useRouter(); // <--- 2. INICIALIZAR ROUTER
const authStore = useAuthStore();
const toast = useToast();

const credentials = reactive({
    email: '',
    password: '',
    rememberMe: false
});

// --- SEGURIDAD Y VALIDACIÓN ---
const loginAttempts = ref(0);
const maxAttempts = 5;
const lockoutTime = ref<number | null>(null);
const isLocked = computed(() => lockoutTime.value !== null && Date.now() < lockoutTime.value);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = computed(() => emailRegex.test(credentials.email.trim()));

const isFormValid = computed(() => {
    return credentials.email.trim() !== '' &&
        credentials.password.trim() !== '' &&
        isValidEmail.value &&
        !isLocked.value;
});

// Watcher para bloquear intentos fallidos
watch(() => authStore.error, (newError) => {
    if (newError) {
        loginAttempts.value++;
        if (loginAttempts.value >= maxAttempts) {
            lockoutTime.value = Date.now() + 60000;
            toast.add({
                severity: 'error',
                summary: 'Seguridad',
                detail: 'Cuenta bloqueada temporalmente (1 min) por múltiples fallos.',
                life: 5000
            });
            setTimeout(() => {
                lockoutTime.value = null;
                loginAttempts.value = 0;
            }, 60000);
        }
    }
});

// --- MANEJADOR DEL LOGIN ---
const handleLogin = async () => {
    if (isLocked.value) {
        const remainingTime = Math.ceil((lockoutTime.value! - Date.now()) / 1000);
        toast.add({ severity: 'warn', summary: 'Cuenta Bloqueada', detail: `Espera ${remainingTime}s.`, life: 3000 });
        return;
    }

    if (!isFormValid.value) return;

    try {
        await authStore.login({
            email: credentials.email.trim(),
            password: credentials.password
        });

        // Verificamos si hubo error en el store (doble seguridad)
        if (authStore.error) throw new Error(authStore.error);

        // --- 3. REDIRECCIÓN MANUAL ---
        // Si llegamos aquí, todo salió bien. Redirigimos al usuario.
        // Asegúrate que '/dashboard' (o la ruta que uses) exista en tu router.
        await router.push('/dashboard');

        // Reset de intentos
        loginAttempts.value = 0;

    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error de Acceso',
            detail: 'Credenciales incorrectas o error de servidor.',
            life: 4000
        });
    }
};
</script>

<template>
    <div
        class="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

        <Toast />
        <div
            class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMDA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40">
        </div>

        <div class="relative w-full max-w-md px-6 py-8">
            <!-- <div class="text-center mb-8">
                <div
                    class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-gradient-to-br shadow-lg mb-4">
                    <img src="https://www.pngall.com/wp-content/uploads/15/Hilton-Logo-Background-PNG.png"
                        alt="Hilton Logo" class="w-15 h-15 object-contain" />
                </div>
                <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-2">ITAM</h1>
                <p class="text-slate-600 dark:text-slate-300">Hilton Cancún an All Inclusive Resort</p>
            </div> -->

            <div
                class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

                <div class="h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>
                <div class="p-8 sm:p-10">
                    <div class="text-center mb-8">
                        <div
                            class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-gradient-to-br shadow-lg mb-4">
                            <img src="https://www.pngall.com/wp-content/uploads/15/Hilton-Logo-Background-PNG.png"
                                alt="Hilton Logo" class="w-15 h-15 object-contain" />
                        </div>
                        <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-2">ITAM</h1>
                        <p class="text-slate-600 dark:text-slate-300">Hilton Cancún an All Inclusive Resort</p>
                    </div>

                    <form @submit.prevent="handleLogin" class="space-y-6">
                        <div>
                            <label for="email1"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Correo
                                Electrónico</label>
                            <InputText id="email1" type="email" placeholder="usuario@hilton.com" class="w-full"
                                v-model="credentials.email" autocomplete="username" :disabled="isLocked" />
                            <small v-if="credentials.email && !isValidEmail"
                                class="text-red-500 text-xs mt-1 block">Correo inválido</small>
                        </div>

                        <div>
                            <label for="password1"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Contraseña</label>
                            <Password id="password1" v-model="credentials.password" placeholder="••••••••"
                                :toggleMask="true" class="w-full" inputClass="w-full" :feedback="false"
                                :invalid="!!authStore.error" autocomplete="current-password" :disabled="isLocked" />
                        </div>

                        <transition enter-active-class="transition duration-300 ease-out"
                            enter-from-class="transform -translate-y-2 opacity-0"
                            enter-to-class="transform translate-y-0 opacity-100">
                            <Message v-if="authStore.error" severity="error" class="w-full" :closable="false">
                                {{ authStore.error }}
                            </Message>
                        </transition>

                        <transition enter-active-class="transition duration-300 ease-out"
                            enter-from-class="transform -translate-y-2 opacity-0"
                            enter-to-class="transform translate-y-0 opacity-100">
                            <Message v-if="loginAttempts > 2 && loginAttempts < maxAttempts && !isLocked"
                                severity="warn" class="w-full" :closable="false">
                                Quedan {{ maxAttempts - loginAttempts }} intentos
                            </Message>
                        </transition>

                        <Button type="submit" label="Iniciar Sesión" icon="pi pi-sign-in" severity="info" raised
                            class="w-full py-3 font-semibold cursor-pointer" :loading="authStore.isLoading"
                            :disabled="!isFormValid || authStore.isLoading" />
                    </form>

                    <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                        <p class="text-xs text-slate-500 dark:text-slate-400"><i class="pi pi-lock text-xs mr-1"></i>
                            Conexión segura SSL/TLS</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.p-password) {
    width: 100%;
}

:deep(.p-password-input) {
    width: 100%;
}

:deep(.p-button:hover:not(:disabled)) {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
}

:deep(.p-button:active:not(:disabled)) {
    transform: translateY(0);
}

:deep(.p-inputtext:focus),
:deep(.p-password-input:focus) {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    border-color: rgb(59, 130, 246);
}

:deep(.p-button-loading-icon) {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>