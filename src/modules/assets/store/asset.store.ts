import { defineStore } from 'pinia';
import { ref } from 'vue';
import { assetService } from '../services/asset.service';
import type { Asset, CreateAssetPayload } from '../types/asset.types';

export const useAssetStore = defineStore('asset', () => {
  const assets = ref<Asset[]>([]);
  const currentAsset = ref<Asset | null>(null);
  const totalRecords = ref(0);
  const isLoading = ref(false);

  async function fetchAssets(
      page: number = 1, 
      perPage: number = 15, 
      search: string = '', 
      propertyId?: number, 
      category?: string, 
      status?: string,
      memberId?: number
  ) {
    isLoading.value = true;
    try {
      const response = await assetService.getAll(page, perPage, search, propertyId, category, status, memberId);
      assets.value = response.data;
      totalRecords.value = response.meta?.total || response.data.length; 
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchAssetById(id: number) {
      isLoading.value = true;
      try {
          currentAsset.value = await assetService.getById(id);
      } finally { isLoading.value = false; }
  }

  async function createAsset(payload: CreateAssetPayload) {
    isLoading.value = true;
    try { await assetService.create(payload); } 
    finally { isLoading.value = false; }
  }

  async function updateAsset(id: number, payload: CreateAssetPayload) {
    isLoading.value = true;
    try { await assetService.update(id, payload); } 
    finally { isLoading.value = false; }
  }

  async function deleteAsset(id: number) {
    isLoading.value = true;
    try { await assetService.delete(id); } 
    finally { isLoading.value = false; }
  }

  return { assets, currentAsset, totalRecords, isLoading, fetchAssets, fetchAssetById, createAsset, updateAsset, deleteAsset };
});