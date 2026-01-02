<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import RadioButton from 'primevue/radiobutton';
import Tag from 'primevue/tag';
import Rating from 'primevue/rating';

const toast = useToast();

const dt = ref();
const products = ref<any[]>([]);
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref<any>({});
const selectedProducts = ref<any[]>([]);
const submitted = ref(false);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const statuses = [
  { label: 'INSTOCK', value: 'INSTOCK' },
  { label: 'LOWSTOCK', value: 'LOWSTOCK' },
  { label: 'OUTOFSTOCK', value: 'OUTOFSTOCK' }
];

/* 🔹 MOCK DATA */
onMounted(() => {
  products.value = [
    {
      id: 'A-1001',
      code: 'IT-LAP-01',
      name: 'Laptop Dell Latitude',
      image: 'laptop.png',
      price: 1450,
      category: 'Electronics',
      quantity: 8,
      inventoryStatus: 'INSTOCK',
      rating: 5
    },
    {
      id: 'A-1002',
      code: 'IT-MON-02',
      name: 'Monitor Samsung 27"',
      image: 'monitor.png',
      price: 420,
      category: 'Electronics',
      quantity: 3,
      inventoryStatus: 'LOWSTOCK',
      rating: 4
    },
    {
      id: 'A-1003',
      code: 'IT-KEY-03',
      name: 'Teclado Logitech MX',
      image: 'keyboard.png',
      price: 120,
      category: 'Accessories',
      quantity: 0,
      inventoryStatus: 'OUTOFSTOCK',
      rating: 4
    }
  ];
});

function openNew() {
  product.value = {};
  submitted.value = false;
  productDialog.value = true;
}

function hideDialog() {
  productDialog.value = false;
  submitted.value = false;
}

function saveProduct() {
  submitted.value = true;

  if (!product.value.name) return;

  if (product.value.id) {
    products.value[findIndexById(product.value.id)] = product.value;
    toast.add({ severity: 'success', summary: 'Updated', detail: 'Asset updated', life: 3000 });
  } else {
    product.value.id = crypto.randomUUID();
    product.value.code = 'IT-' + Math.floor(Math.random() * 9999);
    product.value.image = 'product-placeholder.svg';
    product.value.inventoryStatus = product.value.inventoryStatus?.value ?? 'INSTOCK';
    products.value.push(product.value);
    toast.add({ severity: 'success', summary: 'Created', detail: 'Asset created', life: 3000 });
  }

  productDialog.value = false;
  product.value = {};
}

function editProduct(p: any) {
  product.value = { ...p };
  productDialog.value = true;
}

function confirmDeleteProduct(p: any) {
  product.value = p;
  deleteProductDialog.value = true;
}

function deleteProduct() {
  products.value = products.value.filter(p => p.id !== product.value.id);
  deleteProductDialog.value = false;
  toast.add({ severity: 'success', summary: 'Deleted', detail: 'Asset deleted', life: 3000 });
}

function confirmDeleteSelected() {
  deleteProductsDialog.value = true;
}

function deleteSelectedProducts() {
  products.value = products.value.filter(p => !selectedProducts.value.includes(p));
  deleteProductsDialog.value = false;
  selectedProducts.value = [];
  toast.add({ severity: 'success', summary: 'Deleted', detail: 'Assets deleted', life: 3000 });
}

function exportCSV() {
  dt.value.exportCSV();
}

function findIndexById(id: string) {
  return products.value.findIndex(p => p.id === id);
}

function getStatusLabel(
  status: string
): 'success' | 'warn' | 'danger' | undefined {
  switch (status) {
    case 'INSTOCK':
      return 'success';
    case 'LOWSTOCK':
      return 'warn';
    case 'OUTOFSTOCK':
      return 'danger';
    default:
      return undefined;
  }
}


function formatCurrency(value?: number) {
  if (typeof value !== 'number') return '';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

</script>



<template>
  <div class="p-4">
    <div class="card">
      <!-- Toolbar -->
      <Toolbar class="mb-4">
        <template #start>
          <Button
            label="New"
            icon="pi pi-plus"
            severity="secondary"
            class="mr-2"
            @click="openNew"
          />
          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="secondary"
            :disabled="!selectedProducts.length"
            @click="confirmDeleteSelected"
          />
        </template>

        <template #end>
          <Button
            label="Export"
            icon="pi pi-upload"
            severity="secondary"
            @click="exportCSV"
          />
        </template>
      </Toolbar>

      <!-- DataTable -->
      <DataTable
        ref="dt"
        v-model:selection="selectedProducts"
        :value="products"
        dataKey="id"
        paginator
        :rows="10"
        :filters="filters"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} assets"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      >
        <!-- Header -->
        <template #header>
          <div class="flex justify-between items-center">
            <h4 class="m-0">IT Assets Management</h4>
            <InputText
              v-model="filters.global.value"
              placeholder="Search..."
              class="w-64"
            />
          </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem" />

        <Column field="code" header="Code" sortable />
        <Column field="name" header="Name" sortable />

        <Column header="Image">
          <template #body="{ data }">
            <img
              :src="`https://primefaces.org/cdn/primevue/images/product/${data.image}`"
              :alt="data.name"
              class="rounded"
              width="48"
            />
          </template>
        </Column>

        <Column field="price" header="Price" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.price) }}
          </template>
        </Column>

        <Column field="category" header="Category" sortable />

        <Column field="rating" header="Rating">
          <template #body="{ data }">
            <Rating :modelValue="data.rating" readonly />
          </template>
        </Column>

        <Column field="inventoryStatus" header="Status">
          <template #body="{ data }">
            <Tag
              :value="data.inventoryStatus"
              :severity="getStatusLabel(data.inventoryStatus)"
            />
          </template>
        </Column>

        <Column :exportable="false">
          <template #body="{ data }">
            <Button
              icon="pi pi-pencil"
              outlined
              rounded
              class="mr-2"
              @click="editProduct(data)"
            />
            <Button
              icon="pi pi-trash"
              outlined
              rounded
              severity="danger"
              @click="confirmDeleteProduct(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create / Edit Dialog -->
    <Dialog
      v-model:visible="productDialog"
      header="Asset Details"
      modal
      style="width: 450px"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="font-bold">Name</label>
          <InputText
            v-model.trim="product.name"
            class="w-full"
            :invalid="submitted && !product.name"
          />
        </div>

        <div>
          <label class="font-bold">Description</label>
          <Textarea v-model="product.description" rows="3" class="w-full" />
        </div>

        <div>
          <label class="font-bold">Inventory Status</label>
          <Dropdown
            v-model="product.inventoryStatus"
            :options="statuses"
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
            class="w-full"
          />
        </div>

        <div>
          <label class="font-bold">Category</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <RadioButton value="Electronics" v-model="product.category" />
              <label class="ml-2">Electronics</label>
            </div>
            <div>
              <RadioButton value="Accessories" v-model="product.category" />
              <label class="ml-2">Accessories</label>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="font-bold">Price</label>
            <InputNumber
              v-model="product.price"
              mode="currency"
              currency="USD"
              class="w-full"
            />
          </div>
          <div>
            <label class="font-bold">Quantity</label>
            <InputNumber v-model="product.quantity" class="w-full" />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" @click="saveProduct" />
      </template>
    </Dialog>

    <!-- Delete dialogs -->
    <Dialog v-model:visible="deleteProductDialog" header="Confirm" modal>
      <p>Are you sure you want to delete <b>{{ product.name }}</b>?</p>
      <template #footer>
        <Button label="No" text @click="deleteProductDialog = false" />
        <Button label="Yes" severity="danger" @click="deleteProduct" />
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteProductsDialog" header="Confirm" modal>
      <p>Delete selected assets?</p>
      <template #footer>
        <Button label="No" text @click="deleteProductsDialog = false" />
        <Button label="Yes" severity="danger" @click="deleteSelectedProducts" />
      </template>
    </Dialog>
  </div>
</template>
