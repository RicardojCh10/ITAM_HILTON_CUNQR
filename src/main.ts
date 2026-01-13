import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, ToastService } from 'primevue'
import '@fortawesome/fontawesome-free/css/all.css';

// PrimeVue components
import Menu from 'primevue/menu';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Toolbar from 'primevue/toolbar';
import MultiSelect from 'primevue/multiselect';
import Chart from 'primevue/chart';


import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';


const app = createApp(App)
const pinia = createPinia();

app.use(pinia)
app.use(PrimeVue, {
    
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: 'false',
            cssLayer: false
        },
    }
});

app.use(ToastService);
app.use(router)
app.use(ConfirmationService)

import { useAuthStore } from './modules/auth/store/auth.store';
const authStore = useAuthStore();

if (authStore.token) {
    authStore.checkAuth();
}

// Registro global de componentes PrimeVue
app.component('Menu', Menu);
app.component('Button', Button);
app.component('Column', Column);
app.component('DataTable', DataTable);
app.component('InputText', InputText);
app.component('Password', Password);
app.component('Dialog', Dialog);
app.component('Select', Select);
app.component('IconField', IconField);
app.component('InputIcon', InputIcon);
app.component('Toolbar', Toolbar);
app.component('MultiSelect', MultiSelect);
app.component('Chart', Chart);
app.component('Tag', Tag);
app.component('ProgressSpinner', ProgressSpinner);
app.component('Card', Card);
app.component('Textarea', Textarea);
app.component('Dropdown', Dropdown);
app.component('Calendar', Calendar);

// Directiva Tooltip


app.mount('#app')
