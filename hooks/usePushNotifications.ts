import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { pushService } from '@/services/push.service';

/**
 * Expo removed remote-push support from Expo Go in SDK 53, and the push APIs
 * throw there. This module previously called setNotificationHandler at module
 * scope, so that throw happened during evaluation of this file — which meant
 * app/_layout.tsx failed to evaluate, exported no default, and expo-router
 * crashed with "Cannot read property 'ErrorBoundary' of undefined". One
 * unavailable API took down the entire app in Expo Go.
 *
 * Push simply stays disabled in Expo Go; a development or production build has
 * the native module and works normally.
 */
const isExpoGo = Constants.executionEnvironment === 'storeClient';

/**
 * expo-notifications is loaded lazily and ONLY outside Expo Go.
 *
 * Importing it runs DevicePushTokenAutoRegistration.fx at module scope, which
 * calls addPushTokenListener - and that throws in Expo Go, where Expo removed
 * remote push in SDK 53. A plain `import` therefore threw while this file was
 * being evaluated, so app/_layout.tsx never finished evaluating, exported no
 * default, and expo-router died with "Cannot read property 'ErrorBoundary' of
 * undefined". Guarding the call sites is not enough: the import itself is the
 * problem, so the module must never be required in Expo Go.
 */
type NotificationsModule = typeof import('expo-notifications');

const Notifications: NotificationsModule | null = (() => {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
})();

/**
 * Foreground behaviour: still show the banner. Without this, a push arriving
 * while the app is open is delivered silently and the user sees nothing.
 */
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // Never let notification setup break app startup.
  }
}

/** The token this session registered, so logout can deregister exactly it. */
let registeredToken: string | null = null;

export function getRegisteredPushToken(): string | null {
  return registeredToken;
}

async function registerForPush(): Promise<string | null> {
  // No push in Expo Go (SDK 53+), and tokens are only issued to real hardware.
  if (!Notifications || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    // Android 8+ ignores notifications with no channel.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return null;

  // projectId is required in standalone builds — without it the call throws
  // at runtime rather than returning a token.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  const { data } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return data ?? null;
}

/**
 * Registers this device for push while logged in, deregisters on logout, and
 * routes taps to the screen the notification points at.
 */
export function usePushNotifications() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const lastUserState = useRef<boolean>(false);

  /* Register / deregister as auth state changes */
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (isAuthenticated) {
        try {
          const token = await registerForPush();
          if (!token || cancelled) return;
          registeredToken = token;
          await pushService.registerDevice({
            token,
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            deviceName: Device.deviceName ?? undefined,
          });
        } catch {
          // Never block the app on push setup — it is an enhancement, not a
          // requirement, and a denied permission is a normal outcome.
        }
      } else if (lastUserState.current && registeredToken) {
        // Only on an actual logout transition, not on first mount.
        try {
          await pushService.unregisterDevice(registeredToken);
        } catch {
          /* best effort */
        }
        registeredToken = null;
      }
      lastUserState.current = isAuthenticated;
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* Refresh the in-app list when a push arrives in the foreground */
  useEffect(() => {
    // No module in Expo Go - nothing to subscribe to.
    if (!Notifications) return;

    const received = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    /* Deep-link on tap */
    const responded = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { actionUrl?: string }
          | undefined;
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // actionUrl is authored server-side for the web app, so only in-app
        // relative paths are followed; anything else falls back to the list.
        const target =
          data?.actionUrl && data.actionUrl.startsWith('/')
            ? data.actionUrl
            : '/notifications';
        try {
          router.push(target as never);
        } catch {
          router.push('/notifications');
        }
      },
    );

    return () => {
      received.remove();
      responded.remove();
    };
  }, [queryClient, router]);
}
