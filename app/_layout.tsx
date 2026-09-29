import "../global.css";

import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/store/authStore";
import { ACCESS_TOKEN_KEY } from "@/services/axios.service";
import { authService } from "@/services/auth.service";
import { UserType } from "@/interface/user.interface";
import { ToastProvider } from "@/components/ui/Toast";
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { UpdateWallModal } from "@/components/update/UpdateWallModal";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import {
  queryClient,
  clearQueryCache,
  installQueryListeners,
  pruneQueryCache,
} from "@/lib/queryClient";
import { flushExamOutbox, installExamOutboxSync } from "@/lib/examOutbox";
import { flushAttendanceOutbox, installAttendanceOutboxSync } from "@/lib/attendanceOutbox";
import { ApiError } from "@/lib/errors";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";

SplashScreen.preventAutoHideAsync();

// This dev-only warning's LogBox notification banner overlaps the bottom tab bar
// (blocking taps on "Account"/"Chat") on emulators/devices with reduced motion enabled.
LogBox.ignoreLogs(["Reduced motion setting is enabled"]);

installQueryListeners();
void pruneQueryCache().catch(() => undefined);

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
      } catch (err) {
        // Only a server "no" (401/403 after refresh) ends the session. Offline
        // or a server outage keeps the saved user so the app opens on cached
        // data instead of dumping everyone at sign-in.
        const refused = err instanceof ApiError && err.status < 500;
        const hasSavedUser = !!useAuthStore.getState().user;
        if (refused || !hasSavedUser) logout();
      } finally {
        onReady();
      }
    }
    restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * Mounts the push lifecycle. Must sit inside QueryClientProvider (the hook
 * invalidates the notifications query) and the router context (it deep-links
 * on tap), so it is a component rather than a call in RootLayout's body.
 */
function PushNotificationsGate() {
  usePushNotifications();
  return null;
}

/**
 * Keeps offline data tied to the signed-in person: clears the cached screens
 * on sign-out (a shared phone must not show the last user's data) and sends
 * queued exam work as soon as someone is signed in and online.
 */
function OfflineDataGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const wasAuthenticated = React.useRef(isAuthenticated);

  useEffect(() => {
    installExamOutboxSync();
    installAttendanceOutboxSync();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void flushExamOutbox();
      void flushAttendanceOutbox();
    } else if (wasAuthenticated.current) {
      void clearQueryCache();
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  return null;
}

export default function RootLayout() {
  const [ready, setReady] = React.useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const handleReady = React.useCallback(async () => {
    setReady(true);
    await SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthInitializer onReady={handleReady} />
        <PushNotificationsGate />
        <OfflineDataGate />
        <UpdateWallModal />
        <StatusBar style="light" />
        {ready && fontsLoaded && (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="my-jobs" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="my-enrollments" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="my-enquiries" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="school-enquiries" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="subscription" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="finances" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="attendance" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="admin-attendance" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="library" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="documents" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="results" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="my-assessments" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="assessments" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="assessment/[classroomId]/[assessmentId]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="question-bank" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="my-children" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="my-children-reports" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="my-children-results" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="my-children-documents" options={{ animation: 'slide_from_right' }} />
          </Stack>
        )}
        {ready && <OfflineBanner />}
      </ToastProvider>
    </QueryClientProvider>
  );
}
