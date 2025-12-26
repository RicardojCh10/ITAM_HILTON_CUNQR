<script setup lang="ts">
import { reactive } from 'vue';
import { useAuthStore } from '../store/auth.store';

// PrimeVue Components
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';

// Instancia del Store
const authStore = useAuthStore();

// Estado local del formulario
const credentials = reactive({
  email: '',
  password: '',
  rememberMe: false
});

// Manejador del envío
const handleLogin = async () => {
  // Validación básica UI
  if (!credentials.email.trim() || !credentials.password.trim()) {
    return;
  }

  // Llamada al store
  // El store se encarga de la redirección si es exitoso
  await authStore.login({
    email: credentials.email,
    password: credentials.password
  });
};
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center w-full max-w-md px-4">
            
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)" class="w-full">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-12 px-8 sm:px-12" style="border-radius: 53px">
                    
                    <div class="text-center mb-8">
                         <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to ITAM Hilton</div>
                         <span class="text-muted-color font-medium">Sign in to continue</span>
                    </div>

                    <form @submit.prevent="handleLogin">
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText 
                            id="email1" 
                            type="email" 
                            placeholder="Email address" 
                            class="w-full mb-6" 
                            v-model="credentials.email"
                            :invalid="!!authStore.error"
                            autocomplete="username"
                        />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password 
                            id="password1" 
                            v-model="credentials.password" 
                            placeholder="Password" 
                            :toggleMask="true" 
                            class="w-full mb-4" 
                            inputClass="w-full"
                            :feedback="false"
                            :invalid="!!authStore.error"
                            autocomplete="current-password"
                        />

                        <div class="flex items-center justify-between mt-2 mb-6 gap-4 flex-wrap">
                            <div class="flex items-center">
                                <Checkbox v-model="credentials.rememberMe" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1" class="text-surface-900 dark:text-surface-0">Remember me</label>
                            </div>
                            <span class="font-medium no-underline text-right cursor-pointer text-primary hover:text-primary-600 transition-colors">Forgot password?</span>
                        </div>

                        <transition 
                            enter-active-class="transition duration-300 ease-out" 
                            enter-from-class="transform -translate-y-2 opacity-0" 
                            enter-to-class="transform translate-y-0 opacity-100"
                            leave-active-class="transition duration-200 ease-in" 
                            leave-from-class="opacity-100" 
                            leave-to-class="opacity-0"
                        >
                            <Message 
                                v-if="authStore.error" 
                                severity="error" 
                                class="w-full mb-4"
                                :closable="false"
                            >
                                {{ authStore.error }}
                            </Message>
                        </transition>

                        <Button 
                            type="submit"
                            label="Sign In" 
                            class="w-full py-3 font-bold" 
                            :loading="authStore.isLoading"
                            :disabled="authStore.isLoading || !credentials.email || !credentials.password"
                        />
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Asegura que el input del password ocupe el 100% dentro del componente wrapper de PrimeVue */
:deep(.p-password) {
    width: 100%;
}
:deep(.p-password-input) {
    width: 100%;
}
</style>