import { httpClient } from '@/core/api/httpClient';
import type { LoginPayload, AuthResponse, User } from '../types/auth';

class AuthService {
  private readonly BASE_URL = '/auth'; 

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>(`${this.BASE_URL}/login`, payload);
    
    return response.data; 
  }

  async getMe(): Promise<User> {
    const response = await httpClient.get<User>(`${this.BASE_URL}/me`);
    return response.data;
  }

  async logout(): Promise<any> {
    const response = await httpClient.post(`${this.BASE_URL}/logout`);
    return response.data;
  }
}

export const authService = new AuthService();