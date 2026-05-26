import "../global.css";

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/store/authStore";
import { ACCESS_TOKEN_KEY } from "@/services/axios.service";
import { authService } from "@/services/auth.service";
import { UserType } from "@/interface/user.interface";
import { ToastProvider } from "@/components/ui/Toast";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
    mutations: { retry: 0 },
  },
});

function AuthInitializer({ onReady }: { onReady: () => void }) {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    async function restore() {
      try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (token) {
          const profile = await authService.getProfile();
          login(profile as unknown as UserType);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        onReady();
      }
    }
    restore();
  }, []);

  return null;
}

export default function RootLayout() {
  const [ready, setReady] = React.useState(false);

  const handleReady = React.useCallback(async () => {
    setReady(true);
    await SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthInitializer onReady={handleReady} />
        <StatusBar style="dark" />
        {ready && (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
          </Stack>
        )}
      </ToastProvider>
    </QueryClientProvider>
  );
}
