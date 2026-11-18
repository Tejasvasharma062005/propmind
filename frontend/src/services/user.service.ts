import { api } from '@/lib/api';
import type { User, KYCRecord, UserRole } from '@/types/auth.types';
import type { ApiResponse } from '@/types/common.types';

export const userService = {
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get('/users/me/');
    return response.data;
  },

  async updateProfile(data: Partial<User['profile']> & { name?: string }): Promise<ApiResponse<User>> {
    const response = await api.patch('/users/me/', data);
    return response.data;
  },

  async getKYCStatus(): Promise<ApiResponse<KYCRecord>> {
    const response = await api.get('/users/kyc/status/');
    return response.data;
  },

  async submitKYC(formData: FormData): Promise<ApiResponse<KYCRecord>> {
    const response = await api.post('/users/kyc/submit/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async assignRole(userId: string, role: UserRole): Promise<ApiResponse<{ user_id: string; role: UserRole; is_active: boolean }>> {
    const response = await api.post('/users/roles/assign/', { user_id: userId, role });
    return response.data;
  },
};
