import { httpClient } from '@/core/api/httpClient';
import type { Member, MemberListResponse, CreateMemberPayload, StatsResponse } from '../types/member.types';



class MemberService {
  private readonly BASE_URL = '/members';

  async getAll(
    page: number = 1,
    perPage: number = 15,
    search: string = '',
    propertyId?: number,
    department?: string,
    status?: string
  ): Promise<MemberListResponse> {

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());

    // Filtros opcionales
    if (search) params.append('search', search);
    if (propertyId) params.append('property_id', propertyId.toString());
    if (department) params.append('department', department);
    if (status) params.append('status', status);


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

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/${id}`);
  }

  async import(formData: FormData): Promise<void> {
    await httpClient.post(`${this.BASE_URL}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async getStats(): Promise<StatsResponse> {
    const response = await httpClient.get<StatsResponse>(`${this.BASE_URL}/stats`);
    return response.data;
  }
}

export const memberService = new MemberService();