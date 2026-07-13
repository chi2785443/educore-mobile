import axios from 'axios';
import { apiClient } from './axios.service';
import { AppPlatform, AppRelease } from '@/interface/app-release.interface';

export const getLatestAppRelease = async (
  platform: AppPlatform = 'android',
): Promise<AppRelease | null> => {
  try {
    const res = await apiClient.get('/app-releases/latest', { params: { platform } });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
};
