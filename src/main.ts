import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

const app = createApp(App)
const pinia = createPinia();

app.use(pinia)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        option: {
            dark: false,
        }
    }
});

app.use(router)

import { useAuthStore } from './modules/auth/store/auth.store';
const authStore = useAuthStore();

if (authStore.token) {
    authStore.checkAuth();
}

app.mount('#app')
