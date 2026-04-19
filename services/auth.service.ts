import { apiClient } from './axios.service';
import {
  Register,
  Login,
  ForgotPassword,
  ResetPassword,
  AuthResponse,
  SendOtpResponse,
  VerifyOtpResponse,
} from '@/interface/auth.interface';

export const authService = {
  register: async (data: Register): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: Login): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  sendOtp: async (): Promise<SendOtpResponse> => {
    const response = await apiClient.post<SendOtpResponse>('/auth/send-otp');
    return response.data;
  },

  verifyOtp: async (otp: string): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', { otp });
    return response.data;
  },

  forgotPassword: async (data: ForgotPassword): Promise<{ message: string; token?: string }> => {
    const response = await apiClient.post<{ message: string; token?: string }>(
      '/auth/forgot-password',
      data
    );
    return response.data;
  },

  resetPassword: async (data: ResetPassword): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  getProfile: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<AuthResponse['user']>('/auth/profile');
    return response.data;
  },
};
