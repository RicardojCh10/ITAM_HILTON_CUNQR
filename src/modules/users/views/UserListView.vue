<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../store/user.store';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { useToast } from 'primevue/usetoast';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user.types';
import { listProperties, type Property } from '@/modules/properties/services/property.service';

// Componentes PrimeVue
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
import Tag from 'primevue/tag';

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
const properties = ref<Property[]>([]);
const searchValue = ref('');

// Filtro por propiedad
const filterProperty = ref<number | null>(null);


const onFilterChange = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    lazyParams.value.first = 0;
    lazyParams.value.page = 0;
    loadLazyData();
  }, 500);
};

// Determina si es borrado masivo o individual
const isBulkDelete = ref(false);

const roles = ref([
  { name: 'Administrador', id: 'admin' },
  { name: 'Usuario', id: 'user' },
  { name: 'Auditor', id: 'auditor' }
]);

// --- FORM STATE (DTO PLANO) ---
const userForm = ref({
  id: 0,
  name: '',
  last_name: '', // Nuevo campo
  email: '',
  password: '',
  roleId: '',
  propertyId: null as number | null
});

// Configuración de Paginación Local
const lazyParams = ref({
  first: 0,
  rows: 15,
  page: 0
});

// --- CICLO DE VIDA ---
onMounted(async () => {
  try {
    const [props] = await Promise.all([listProperties()]);
    properties.value = props;
    loadLazyData();
  } catch (e) {
    console.error("Error inicializando", e);
  }
});

// --- LÓGICA DE DATOS ---
const loadLazyData = () => {
  const laravelPage = lazyParams.value.page + 1;
  userStore.fetchUsers(laravelPage, lazyParams.value.rows, searchValue.value, filterProperty.value || undefined);
};

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value = event;
  loadLazyData();
};

// Debounce Search
let searchTimeout: ReturnType<typeof setTimeout>;
const onSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    lazyParams.value.first = 0;
    lazyParams.value.page = 0;
    loadLazyData();
  }, 500);
};

// --- VALIDACIONES ---
function blockSpecialChars(event: KeyboardEvent, type: 'text' | 'email') {
  let allowedChars;
  if (type === 'text') allowedChars = /^[a-zA-ZÀ-ÿ\u00f1\u00d10-9\s]$/;
  else allowedChars = /^[a-zA-Z0-9@._\-]$/;

  if (!allowedChars.test(event.key)) event.preventDefault();
}

function validPassword(pwd: string): boolean {
  // Mínimo 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial
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
  userForm.value = {
    id: 0,
    name: '',
    last_name: '',
    email: '',
    password: '',
    roleId: '',
    propertyId: null
  };
  isEditMode.value = false;
  submitted.value = false;
  userDialog.value = true;
}

// MAPPER: Read Model (User) -> Write Model (Form)
function editUser(user: User) {
  userForm.value = {
    id: user.id,
    name: user.name,
    last_name: user.last_name || '', // Manejo de opcional
    email: user.email,
    roleId: user.role,
    // Acceso seguro a la propiedad anidada
    propertyId: user.property?.id || null,
    password: ''
  };
  isEditMode.value = true;
  submitted.value = false;
  userDialog.value = true;
}

async function saveUser() {
  submitted.value = true;
  // Validación de campos obligatorios
  if (!userForm.value.name?.trim() || !userForm.value.email?.trim() || !userForm.value.roleId) return;

  // Validación de contraseña solo al crear o si se escribió algo al editar
  if (!isEditMode.value && (!userForm.value.password || !validPassword(userForm.value.password))) return;
  if (isEditMode.value && userForm.value.password && !validPassword(userForm.value.password)) return;

  // Construcción del Payload Estricto
  const payload: CreateUserPayload | UpdateUserPayload = {
    name: userForm.value.name,
    last_name: userForm.value.last_name,
    email: userForm.value.email,
    role: userForm.value.roleId,
    password: userForm.value.password || undefined, // undefined para que Laravel ignore si está vacío en update
    property_id: userForm.value.propertyId
  };

  try {
    if (isEditMode.value && userForm.value.id) {
      await userStore.updateUser(userForm.value.id, payload);
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado', life: 3000 });
    } else {
      // Assert type para CreateUserPayload ya que password es obligatorio aquí
      await userStore.createUser(payload as CreateUserPayload);
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado', life: 3000 });
    }

    userDialog.value = false;
    loadLazyData();
  } catch (e) {
    console.error(e);
    // Error manejado en store
  }
}

// --- BORRADO ---
function confirmDeleteSelected() {
  isBulkDelete.value = true;
  deleteUserDialog.value = true;
}

function confirmDeleteUser(user: User) {
  isBulkDelete.value = false;
  selectedUserToDelete.value = user;
  deleteUserDialog.value = true;
}

async function deleteUser() {
  deleteUserDialog.value = false;

  if (isBulkDelete.value) {
    for (const user of selectedUsers.value) {
      await userStore.deleteUser(user.id);
    }
    selectedUsers.value = [];
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuarios eliminados', life: 3000 });
  } else if (selectedUserToDelete.value) {
    await userStore.deleteUser(selectedUserToDelete.value.id);
    selectedUserToDelete.value = null;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado', life: 3000 });
  }

  loadLazyData();
}

const getRoleSeverity = (role: string) => {
  switch (role) {
    case 'admin': return 'danger';
    case 'auditor': return 'warn';
    default: return 'info';
  }
}
</script>

<template>
  <div class="w-full max-w-none p-4">

    <Toolbar class="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 shadow-sm border-gray-200">
      <template #start>
        <div class="flex gap-2">
          <Button label="Nuevo Usuario" icon="pi pi-plus" class=" text-white border-none" @click="openNew" />

          <Select v-model="filterProperty" :options="properties" optionLabel="name" optionValue="id"
            placeholder="Filtrar por Propiedad" class="w-48 sm:w-60" showClear filter @change="onFilterChange"
            @clear="onFilterChange" />

          <Button label="Eliminar Selección" icon="pi pi-trash" severity="danger" outlined
            :disabled="!selectedUsers || !selectedUsers.length" @click="confirmDeleteSelected" />
        </div>
      </template>
    </Toolbar>

    <DataTable :value="userStore.users" :lazy="true" :paginator="true" :rows="lazyParams.rows"
      :totalRecords="userStore.totalRecords" :loading="userStore.isLoading" @page="onPage"
      v-model:selection="selectedUsers" :rowsPerPageOptions="[5, 10, 15, 25, 50]"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {totalRecords} usuarios" dataKey="id"
      class="shadow-md rounded-lg overflow-hidden" stripedRows>
      <template #header>
        <div class="flex flex-wrap gap-2 items-center justify-between p-2">
          <h4 class="m-0 text-lg font-bold text-gray-700">Gestión de Usuarios</h4>
          <IconField iconPosition="left">
            <InputIcon>
              <i class="pi pi-search text-gray-500" />
            </InputIcon>
            <InputText v-model="searchValue" @input="onSearch" placeholder="Buscar por nombre o email..."
              class="w-64 border-gray-300" />
          </IconField>
        </div>
      </template>

      <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

      <Column field="full_name" header="Nombre Completo" sortable>
        <template #body="slotProps">
          <span class="font-medium text-gray-800">{{ slotProps.data.full_name }}</span>
        </template>
      </Column>

      <Column field="email" header="Email">
        <template #body="slotProps">
          <span class="text-gray-600">{{ slotProps.data.email }}</span>
        </template>
      </Column>

      <Column header="Propiedad Asignada">
        <template #body="slotProps">
          <div v-if="slotProps.data.property" class="flex items-center gap-2">
            <i class="pi pi-building text-gray-500"></i>
            <span class="font-medium text-sm text-gray-700">{{ slotProps.data.property.name }}</span>
          </div>
          <div v-else class="flex items-center gap-2">
            <i class="pi pi-globe text-green-500"></i>
            <span class="text-gray-500 text-sm italic">Acceso Global</span>
          </div>
        </template>
      </Column>

      <Column field="role" header="Rol">
        <template #body="slotProps">
          <Tag :value="slotProps.data.role" :severity="getRoleSeverity(slotProps.data.role)" class="capitalize" />
        </template>
      </Column>

      <Column header="Acciones" alignFrozen="right" frozen>
        <template #body="slotProps">
          <div class="flex space-x-2">
            <Button icon="pi pi-pencil" severity="info" rounded text @click="editUser(slotProps.data)" />

            <Button v-if="slotProps.data.id !== authStore.user?.id" icon="pi pi-trash" severity="danger" rounded text
              @click="confirmDeleteUser(slotProps.data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog :header="isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'" v-model:visible="userDialog" modal
      class="w-full max-w-2xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div class="col-span-1 md:col-span-2 border-b pb-1 mb-2">
          <span class="text-gray-600 font-bold text-lg"><i class="pi pi-id-card mr-2"></i>Datos
            Generales</span>
        </div>

        <div>
          <label for="name" class="block text-sm font-medium mb-1 text-gray-700">Nombres <span
              class="text-red-500">*</span></label>
          <InputText id="name" v-model="userForm.name" class="w-full" @keypress="(e) => blockSpecialChars(e, 'text')" />
          <small v-if="submitted && !userForm.name?.trim()" class="text-red-500">Requerido.</small>
        </div>

        <div>
          <label for="last_name" class="block text-sm font-medium mb-1 text-gray-700">Apellidos</label>
          <InputText id="last_name" v-model="userForm.last_name" class="w-full"
            @keypress="(e) => blockSpecialChars(e, 'text')" />
        </div>

        <div class="md:col-span-2">
          <label for="email" class="block text-sm font-medium mb-1 text-gray-700">Email <span
              class="text-red-500">*</span></label>
          <InputText id="email" v-model="userForm.email" class="w-full"
            @keypress="(e) => blockSpecialChars(e, 'email')" />
          <small v-if="submitted && !userForm.email?.trim()" class="text-red-500">Requerido.</small>
        </div>

        <div>
          <label for="roleId" class="block text-sm font-medium mb-1 text-gray-700">Rol <span
              class="text-red-500">*</span></label>
          <Select id="roleId" v-model="userForm.roleId" :options="roles" optionLabel="name" optionValue="id"
            placeholder="Selecciona..." class="w-full" />
          <small v-if="submitted && !userForm.roleId" class="text-red-500">Requerido.</small>
        </div>

        <div>
          <label for="propertyId" class="block text-sm font-medium mb-1 text-gray-700">Propiedad</label>
          <Select id="propertyId" v-model="userForm.propertyId" :options="properties" optionLabel="name"
            optionValue="id" placeholder="Global (Todas)" showClear filter class="w-full" />
        </div>

        <div class="md:col-span-2">
          <label for="password" class="block text-sm font-medium mb-1 text-gray-700">Contraseña <span v-if="!isEditMode"
              class="text-red-500">*</span></label>
          <Password id="password" v-model="userForm.password" toggleMask :feedback="false" class="w-full"
            :invalid="isPasswordInvalid" inputClass="w-full" />
          <small v-if="submitted && !isEditMode && !userForm.password" class="text-red-500 block">Requerido.</small>
          <small v-if="submitted && userForm.password && !validPassword(userForm.password)"
            class="text-red-500 block">Debe
            tener 8+ caracteres, mayúscula, minúscula y número.</small>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2 mt-4">
          <Button label="Cancelar" icon="pi pi-times" text @click="userDialog = false" class="text-gray-500" />
          <Button :label="isEditMode ? 'Guardar Cambios' : 'Crear Usuario'" icon="pi pi-check"
            class="bg-blue-600 border-none" :loading="userStore.isLoading" @click="saveUser" />
        </div>
      </template>
    </Dialog>

    <Dialog header="Confirmar Eliminación" v-model:visible="deleteUserDialog" modal class="w-96">
      <div class="flex items-center space-x-3">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
        <span class="text-gray-700">
          <span v-if="isBulkDelete">
            ¿Eliminar a los <b>{{ selectedUsers.length }}</b> usuarios seleccionados?
          </span>
          <span v-else>
            ¿Eliminar a <b>{{ selectedUserToDelete?.full_name }}</b>?
          </span>
        </span>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-2 mt-4">
          <Button label="No" icon="pi pi-times" text @click="deleteUserDialog = false" />
          <Button label="Sí, eliminar" severity="danger" icon="pi pi-check" @click="deleteUser"
            :loading="userStore.isLoading" />
        </div>
      </template>
    </Dialog>
  </div>
</template>