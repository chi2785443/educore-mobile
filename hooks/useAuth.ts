import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/services/axios.service';
import { Login, Register, ForgotPassword, ResetPassword } from '@/interface/auth.interface';
import { UserType } from '@/interface/user.interface';

export function useLogin() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Login) => authService.login(data),
    onSuccess: async (response) => {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.access_token);
      login(response.user as unknown as UserType);
      queryClient.clear();
      if (response.user.isAdmin) {
        router.replace('/(admin)/dashboard' as never);
      } else {
        router.replace('/(tabs)/' as never);
      }
    },
  });
}

export function useRegister() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: (data: Register) => authService.register(data),
    onSuccess: async (response) => {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.access_token);
      login(response.user as unknown as UserType);
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: () => authService.sendOtp(),
    onSuccess: (data) => {
      if (__DEV__ && data.otp) {
        console.log('[DEV] OTP:', data.otp);
      }
    },
  });
}

export function useVerifyOtp(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (otp: string) => authService.verifyOtp(otp),
    onSuccess: () => {
      onSuccess?.();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPassword) => authService.forgotPassword(data),
    onSuccess: (data) => {
      if (__DEV__ && data.token) {
        console.log('[DEV] Reset token:', data.token);
      }
    },
  });
}

export function useResetPassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: ResetPassword) => authService.resetPassword(data),
    onSuccess: () => {
      onSuccess?.();
      router.replace('/(auth)/sign-in' as never);
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    logout();
    queryClient.clear();
    router.replace('/(auth)/sign-in' as never);
  };
}

export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
