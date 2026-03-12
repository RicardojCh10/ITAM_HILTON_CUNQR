import { httpClient } from '@/core/api/httpClient';
import type { Member, MemberListResponse, CreateMemberPayload, SimpleStatsResponse } from '../types/member.types';

class MemberService {
  private readonly BASE_URL = '/members';

  async getAll(
    page: number = 1,
    perPage: number = 15,
    search: string = '',
    propertyId?: number,
    department?: string, // Filtro por nombre de depto (backend usa whereHas)
    status?: string,
    positionId?: number
  ): Promise<MemberListResponse> {

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());

    if (search) params.append('search', search);
    if (propertyId) params.append('property_id', propertyId.toString());
    if (department) params.append('department', department);
    if (status) params.append('status', status);
    if (positionId) params.append('position_id', positionId.toString());

    const response = await httpClient.get<MemberListResponse>(`${this.BASE_URL}?${params.toString()}`);
    return response.data;
  }

  async getById(id: number): Promise<Member> {
    const response = await httpClient.get<{ data: Member }>(`${this.BASE_URL}/${id}`);
    return response.data.data || response.data;
  }

  async create(payload: CreateMemberPayload): Promise<Member> {
    const response = await httpClient.post<{ data: Member }>(this.BASE_URL, payload);
    return response.data.data || response.data;
  }

  async update(id: number, payload: CreateMemberPayload): Promise<Member> {
    const response = await httpClient.put<{ data: Member }>(`${this.BASE_URL}/${id}`, payload);
    return response.data.data || response.data;
  }

  // --- NUEVOS MÉTODOS DEL FLUJO IT ---

  /**
   * IT admite al usuario (Asigna Admission Date)
   * Pasa de PENDING_IT -> ACTIVO
   */
  async admitMember(id: number): Promise<Member> {
    const response = await httpClient.put<{ data: Member }>(`${this.BASE_URL}/${id}/admit`, {});
    return response.data.data || response.data;
  }

  /**
   * IT da de baja técnica (Asigna Hire End Date IT)
   * Pasa de ACTIVO -> BAJA o TERMINADO
   */
  async retireMember(id: number): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/${id}`); // Usamos el DELETE mapeado en el backend
  }

  /**
   * Genera y descarga el PDF de Accesos (ITAM)
   */
  async downloadAccessPdf(id: number, memberName: string): Promise<void> {
    try {
      const response = await httpClient.get(`${this.BASE_URL}/${id}/access-pdf`, {
        responseType: 'blob', // IMPORTANTÍSIMO PARA PDF
      });

      const blob = new Blob([response.data as any], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Limpiar nombre para el archivo
      const safeName = memberName.replace(/[^a-z0-9]/gi, '_').toUpperCase();
      link.setAttribute('download', `CONTROL_ACCESOS_${safeName}.pdf`);

      document.body.appendChild(link);
      link.click();

      // Limpieza de memoria
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar PDF de Accesos", error);
      throw error;
    }
  }

  async import(formData: FormData): Promise<void> {
    await httpClient.post(`${this.BASE_URL}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async getStats(): Promise<SimpleStatsResponse> {
    const response = await httpClient.get<SimpleStatsResponse>(`${this.BASE_URL}/stats`);
    return response.data;
  }
}

export const memberService = new MemberService();