import { defineStore } from 'pinia';
import { ref } from 'vue';
import { userService } from '../services/user.service';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user.types';

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([]);
  const totalRecords = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Actions

  async function fetchUsers(page: number = 1, perPage: number = 15, search: string = '') {
    isLoading.value = true;
    try {
      const response = await userService.getAll(page, perPage, search);
      users.value = response.data;
      totalRecords.value = response.meta.total;
    } catch (err: any) {
      // ...
    } finally {
      isLoading.value = false;
    }
  }

  async function createUser(payload: CreateUserPayload) {
    isLoading.value = true;
    try {
      await userService.create(payload);
      await fetchUsers(); // Recargamos la lista
      return true; // Éxito
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear usuario';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateUser(id: number, payload: UpdateUserPayload) {
    isLoading.value = true;
    try {
      await userService.update(id, payload);
      await fetchUsers();
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar usuario';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteUser(id: number) {
    isLoading.value = true;
    try {
      await userService.delete(id);
      await fetchUsers(1, 15);
    } catch (err) {
      error.value = 'Error al eliminar';
    } finally {
      isLoading.value = false;
    }
  }

  return {
    users,
    totalRecords,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
});