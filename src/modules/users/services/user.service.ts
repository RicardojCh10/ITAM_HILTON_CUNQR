import { httpClient } from '@/core/api/httpClient';
import type { UserListResponse, User, CreateUserPayload, UpdateUserPayload } from '../types/user.types';

class UserService {
  private readonly BASE_URL = '/users';

  async getAll(page: number = 1, perPage: number = 15): Promise<UserListResponse> {
    const response = await httpClient.get<UserListResponse>(`${this.BASE_URL}?page=${page}&per_page=${perPage}`);
    
    return response.data;
  }

  async create(payload: CreateUserPayload): Promise<User> {
    const response = await httpClient.post<{ data: User }>(this.BASE_URL, payload);
    return response.data.data || response.data;
  }

  async update(id: number, payload: UpdateUserPayload): Promise<User> {
    const response = await httpClient.put<{ data: User }>(`${this.BASE_URL}/${id}`, payload);
    return response.data.data || response.data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.BASE_URL}/${id}`);
  }
}

export const userService = new UserService();