import { apiClient } from './axios.service';

export type DevicePlatform = 'android' | 'ios';

export interface RegisterDevicePayload {
  token: string;
  platform: DevicePlatform;
  deviceName?: string;
}

export const pushService = {
  registerDevice: async (payload: RegisterDevicePayload): Promise<void> => {
    await apiClient.post('/push/register-device', payload);
  },

  unregisterDevice: async (token: string): Promise<void> => {
    await apiClient.post('/push/unregister-device', { token });
  },
};
