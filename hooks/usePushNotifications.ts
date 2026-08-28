import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { pushService } from '@/services/push.service';

/**
 * Foreground behaviour: still show the banner. Without this, a push arriving
 * while the app is open is delivered silently and the user sees nothing.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** The token this session registered, so logout can deregister exactly it. */
let registeredToken: string | null = null;

export function getRegisteredPushToken(): string | null {
  return registeredToken;
}

async function registerForPush(): Promise<string | null> {
  // Push tokens are only issued to real hardware; simulators always fail.
  if (!Device.isDevice) return null;

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
