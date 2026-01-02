import { httpClient } from '@/core/api/httpClient';

export interface Property {
  id: number;
  name: string;
}

export const listProperties = async (): Promise<Property[]> => {
  const response = await httpClient.get<{ data: Property[] }>('/properties?per_page=100'); 
  return response.data.data || response.data; // Manejo robusto array vs paginado
};