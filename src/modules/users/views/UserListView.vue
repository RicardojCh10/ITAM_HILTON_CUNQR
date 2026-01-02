<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../store/user.store';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import type { User } from '../types/user.types';
import { listProperties, type Property } from '@/modules/properties/services/property.service'; 

// Componentes y Tipos PrimeVue
import type { DataTablePageEvent } from 'primevue/datatable';
import Toolbar from 'primevue/toolbar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const userStore = useUserStore();
const authStore = useAuthStore();
const toast = useToast();

// --- ESTADO LOCAL ---
const userDialog = ref(false);
const deleteUserDialog = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);
const selectedUsers = ref<User[]>([]);
const selectedUserToDelete = ref<User | null>(null);
const properties = ref<Property[]>([]); // Lista para el Dropdown

// Filtros Locales
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const roles = ref([
    { name: 'Administrador', id: 'admin' },
    { name: 'Usuario', id: 'user' },
    { name: 'Auditor', id: 'auditor' }
]);

const userForm = ref({
  id: 0,
  name: '',
  email: '',
  password: '',
  roleId: '',
  propertyId: null as number | null
});

// Configuración de Paginación Local (Estado Inicial)
const lazyParams = ref({
    first: 0,    // Primer índice visual
    rows: 15,    // Filas por página
    page: 0      // Página actual (Base 0)
});

// --- CICLO DE VIDA ---
onMounted(async () => {
    // 1. Cargar Datos de la Tabla
    loadLazyData();
    // 2. Cargar Lista de Propiedades para el Select
    await loadProperties();
});

// Cargar Propiedades (Dropdown)
const loadProperties = async () => {
    try {
        properties.value = await listProperties();
    } catch (e) {
        console.error("Error cargando propiedades", e);
    }
}

// --- LÓGICA DE PAGINACIÓN (CORE) ---
const loadLazyData = () => {
    const laravelPage = lazyParams.value.page + 1;
    userStore.fetchUsers(laravelPage, lazyParams.value.rows);
};

const onPage = (event: DataTablePageEvent) => {
    lazyParams.value = event; 
    loadLazyData();          
};

// --- VALIDACIONES ---
function blockSpecialChars(event: KeyboardEvent, type: 'name' | 'email') {
  let allowedChars;
  if (type === 'name') allowedChars = /^[a-zA-ZÀ-ÿ\u00f1\u00d10-9\s]$/;
  else allowedChars = /^[a-zA-Z0-9@._\-]$/;
  if (!allowedChars.test(event.key)) event.preventDefault();
}

function validPassword(pwd: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return regex.test(pwd);
}

const isPasswordInvalid = computed(() => {
  if (submitted.value && !isEditMode.value && !userForm.value.password) return true;
  if (submitted.value && userForm.value.password && !validPassword(userForm.value.password)) return true;
  return false;
});

// --- ACCIONES CRUD ---
function openNew() {
  userForm.value = { id: 0, name: '', email: '', password: '', roleId: '', propertyId: null };
  isEditMode.value = false;
  submitted.value = false;
  userDialog.value = true;
}

function editUser(user: User) {
  userForm.value = { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    roleId: user.role, 
    // Mapeo Inteligente: Si el objeto property existe, tomamos su ID, si no, null
    propertyId: user.property?.id || null, 
    password: '' 
  };
  isEditMode.value = true;
  submitted.value = false;
  userDialog.value = true;
}

async function saveUser() {
  submitted.value = true;
  
  // 1. Validaciones de campos obligatorios
  if (!userForm.value.name?.trim() || !userForm.value.email?.trim() || !userForm.value.roleId) {
    return;
  }

  // 2. Validación de Contraseña (Solo para Crear o si se intenta cambiar)
  if (!isEditMode.value) {
    // Si estamos creando, la contraseña es obligatoria y debe ser válida
    if (!userForm.value.password || !validPassword(userForm.value.password)) {
        return;
    }
  } else {
    // Si estamos editando y escribieron algo, debe ser válido
    if (userForm.value.password && !validPassword(userForm.value.password)) {
        return;
    }
  }

  try {
    if (isEditMode.value && userForm.value.id) {
      // --- MODO EDICIÓN ---
      // Aquí password puede ser undefined, así que TS no se queja
      await userStore.updateUser(userForm.value.id, {
        name: userForm.value.name,
        email: userForm.value.email,
        role: userForm.value.roleId,
        password: userForm.value.password || undefined, // Envía undefined si está vacío
        property_id: userForm.value.propertyId
      });
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado', life: 3000 });
      
    } else {
      // --- MODO CREACIÓN (SOLUCIÓN ERROR 2) ---
      // TypeScript sabe que si pasamos la validación de arriba, password NO es vacío.
      // Pero para estar 100% seguros, forzamos el tipo 'as string' o aseguramos que no sea undefined.
      
      await userStore.createUser({
        name: userForm.value.name,
        email: userForm.value.email,
        role: userForm.value.roleId,
        password: userForm.value.password as string, // <--- GARANTIZAMOS QUE ES STRING
        property_id: userForm.value.propertyId
      });
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado', life: 3000 });
    }
    
    userDialog.value = false;
    loadLazyData(); // Recargamos la tabla
  } catch (e) {
    // El error lo maneja el store o interceptor
    console.error(e);
  }
}

function confirmDeleteUser(user: User) {
  selectedUserToDelete.value = user;
  deleteUserDialog.value = true;
}

async function deleteUser() {
  if (selectedUserToDelete.value) {
    await userStore.deleteUser(selectedUserToDelete.value.id);
    deleteUserDialog.value = false;
    selectedUserToDelete.value = null;
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado', life: 3000 });
    loadLazyData(); 
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-4">
    
    <Toolbar class="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
      <template #start>
        <Button label="Nuevo" icon="pi pi-plus"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-3"
                @click="openNew" />
        <Button label="Eliminar" icon="pi pi-trash"
                severity="danger"
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                :disabled="!selectedUsers.length" 
                @click="selectedUsers[0] && confirmDeleteUser(selectedUsers[0])"
                /> 
      </template>
    </Toolbar>

    <DataTable
     :value="userStore.users"
     :lazy="true"  
     :paginator="true"
     :rows="lazyParams.rows"
     :totalRecords="userStore.totalRecords"
     :loading="userStore.isLoading"
     @page="onPage"
     :rowsPerPageOptions="[5, 10, 15, 25, 50]"
     paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
     currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
     dataKey="id"
     class="shadow"
    >
      <template #header>
        <div class="flex flex-wrap gap-2 items-center justify-between">
          <h4 class="m-0 text-lg font-bold">Gestión de Usuarios</h4>
          <IconField iconPosition="left">
            <InputIcon>
              <i class="pi pi-search text-gray-500" />
            </InputIcon>
            <InputText v-model="filters.global.value" placeholder="Buscar usuarios" class="border border-gray-300 rounded-md p-2" />
          </IconField>
        </div>
      </template>

      <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
      <Column field="id" header="ID" sortable class="py-2 px-4" />
      <Column field="name" header="Nombre" sortable class="py-2 px-4" />
      <Column field="email" header="Email" sortable class="py-2 px-4" />
      
      <Column header="Propiedad" class="py-2 px-4">
        <template #body="slotProps">
            <div v-if="slotProps.data.property" class="flex items-center gap-2">
                <i class="pi pi-building text-gray-400"></i>
                <span class="font-medium">{{ slotProps.data.property.name }}</span>
            </div>
            <div v-else class="text-gray-400 italic text-sm">
                Global / Sin Asignar
            </div>
        </template>
      </Column>

      <Column field="role" header="Rol" sortable class="py-2 px-4">
         <template #body="slotProps">
            <span class="capitalize px-2 py-1 rounded bg-gray-100 text-sm">{{ slotProps.data.role }}</span>
         </template>
      </Column>
      
      <Column header="Acciones" class="py-2 px-4">
        <template #body="slotProps">
          <div class="flex space-x-2">
            <Button icon="pi pi-pencil"
                    class="p-button-rounded p-button-outlined bg-green-500 hover:bg-green-600 text-white"
                    @click="editUser(slotProps.data)" />
            <Button v-if="slotProps.data.id !== authStore.user?.id"
                    icon="pi pi-trash"
                    severity="danger"
                    class="p-button-rounded p-button-outlined bg-red-500 hover:bg-red-600 text-white"
                    @click="confirmDeleteUser(slotProps.data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog header="Detalles de Usuario" v-model:visible="userDialog" modal class="w-96">
      <div class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium primary">Nombre <span class="text-red-500">*</span></label>
          <InputText id="name" v-model="userForm.name" class="mt-1 block w-full border border-gray-300 rounded-md p-2" @keypress="(e) => blockSpecialChars(e, 'name')" />
          <small v-if="submitted && !userForm.name?.trim()" class="text-red-500">El nombre es obligatorio.</small>
        </div>
        
        <div>
          <label for="email" class="block text-sm font-medium primary">Email <span class="text-red-500">*</span></label>
          <InputText id="email" v-model="userForm.email" class="mt-1 block w-full border border-gray-300 rounded-md p-2" @keypress="(e) => blockSpecialChars(e, 'email')" />
          <small v-if="submitted && !userForm.email?.trim()" class="text-red-500">El email es obligatorio.</small>
        </div>

        <div>
          <label for="roleId" class="block text-sm font-medium primary">Rol <span class="text-red-500">*</span></label>
          <Select id="roleId" v-model="userForm.roleId" :options="roles" optionLabel="name" optionValue="id" placeholder="Selecciona un rol" class="mt-1 w-full border border-gray-300 rounded-md" />
          <small v-if="submitted && !userForm.roleId" class="text-red-500">El rol es obligatorio.</small>
        </div>

        <div>
          <label for="propertyId" class="block text-sm font-medium primary">Propiedad Asignada</label>
          <Select 
            id="propertyId" 
            v-model="userForm.propertyId" 
            :options="properties" 
            optionLabel="name" 
            optionValue="id" 
            placeholder="Sin Propiedad (Global)" 
            showClear
            filter
            class="mt-1 w-full border border-gray-300 rounded-md" 
           />
           <small class="text-gray-500 text-xs">Opcional. Deja vacío para acceso global.</small>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium primary">Contraseña <span v-if="!isEditMode" class="text-red-500">*</span></label>
          <Password id="password" v-model="userForm.password" toggleMask :feedback="false" class="mt-1 block w-full border border-gray-300 rounded-md p-2" :invalid="isPasswordInvalid" />
          <small v-if="submitted && !isEditMode && !userForm.password" class="text-red-500 block">La contraseña es obligatoria.</small>
          <small v-if="submitted && userForm.password && !validPassword(userForm.password)" class="text-red-500 block">Mínimo 8 caracteres, mayúscula, minúscula, número y especial.</small>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2 mt-4">
          <Button label="Cancelar" icon="pi pi-times" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded" text @click="userDialog = false" />
          <Button :label="isEditMode ? 'Editar' : 'Crear'" icon="pi pi-check" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" :loading="userStore.isLoading" @click="saveUser" />
        </div>
      </template>
    </Dialog>

    <Dialog header="Confirmar" v-model:visible="deleteUserDialog" modal class="w-120">
      <div class="flex items-center space-x-3">
        <i class="pi pi-exclamation-triangle !text-3xl text-orange-400"></i>
        <span class="text-gray-700">¿Seguro que deseas eliminar a <b>{{ selectedUserToDelete?.name }}</b>?</span>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-2 mt-4">
          <Button label="Cancelar" icon="pi pi-times" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded" text @click="deleteUserDialog = false" />
          <Button label="Eliminar" severity="danger" icon="pi pi-check" text @click="deleteUser" :loading="userStore.isLoading"/>
        </div>
      </template>
    </Dialog>
  </div>
</template>