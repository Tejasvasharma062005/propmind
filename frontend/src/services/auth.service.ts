import { api } from '@/lib/api';
import type {
  LoginRequest,
  RegisterRequest,
  OTPRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  User,
  AuthResponse,
} from '@/types/auth.types';
import type { ApiResponse } from '@/types/common.types';

export const authService = {
  async register(data: RegisterRequest): Promise<ApiResponse<{ user_id: string; user?: User; dev_otp?: string; smtp_configured?: boolean; message: string }>> {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  async resendOtp(data: { user_id?: string; email?: string; purpose?: 'REGISTRATION' | 'LOGIN' | 'RESET_PASSWORD' }): Promise<ApiResponse<{ user_id: string; dev_otp?: string; smtp_configured?: boolean; message: string }>> {
    const response = await api.post('/auth/resend-otp/', data);
    return response.data;
  },

  async verifyOtp(data: OTPRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post('/auth/verify-otp/', data);
    if (response.data?.data?.tokens) {
      localStorage.setItem('propvault_access_token', response.data.data.tokens.access);
      localStorage.setItem('propvault_refresh_token', response.data.data.tokens.refresh);
    }
    return response.data;
  },

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post('/auth/login/', data);
    const tokens = response.data?.data?.tokens || response.data?.tokens;
    if (tokens) {
      localStorage.setItem('propvault_access_token', tokens.access);
      localStorage.setItem('propvault_refresh_token', tokens.refresh);
    }
    return response.data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('propvault_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch {
      // Continue cleanup on error
    } finally {
      localStorage.removeItem('propvault_access_token');
      localStorage.removeItem('propvault_refresh_token');
    }
  },

  async requestPasswordReset(data: PasswordResetRequest): Promise<ApiResponse<{ user_id: string; dev_otp?: string; message: string }>> {
    const response = await api.post('/auth/request-password-reset/', data);
    return response.data;
  },

  async resetPassword(data: PasswordResetConfirmRequest): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post('/auth/reset-password/', data);
    return response.data;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await api.get('/users/me/');
    return response.data;
  },
};
