import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const ACCESS_TOKEN_KEY = 'cakale_edu_access_token';
export const REFRESH_TOKEN_KEY = 'cakale_edu_refresh_token';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL ?? 'http://localhost:8000/api/v1/';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

function extractErrorMessage(error: AxiosError): string {
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (!data) return error.message || 'An unexpected error occurred';
  return (
    (data.msg as string) ||
    (data.message as string) ||
    (data.detail as string) ||
    (data.error as string) ||
    error.message ||
    'An unexpected error occurred'
  );
}

// Endpoints that don't need a Bearer token (pre-auth or email-based flows).
const NO_TOKEN_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
  '/auth/send-otp',
  '/auth/verify-otp',
];

// Endpoints where a 401 means bad credentials — never trigger refresh loop.
const NO_REFRESH_PATHS = [...NO_TOKEN_PATHS];

function needsNoToken(url?: string): boolean {
  if (!url) return false;
  return NO_TOKEN_PATHS.some(p => url.includes(p));
}

function needsNoRefresh(url?: string): boolean {
  if (!url) return false;
  return NO_REFRESH_PATHS.some(p => url.includes(p));
}

/* ── Request interceptor — attach Bearer token (skip for pre-auth endpoints) ── */
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!needsNoToken(config.url)) {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
}

/* ── Response interceptor — handle 401 with token refresh ── */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Never attempt token refresh for auth endpoints.
    // A 401 from login/register means wrong credentials — surface the real error.
    if (error.response?.status === 401 && !originalRequest._retry && !needsNoRefresh(originalRequest.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newToken = data.access_token as string;
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        return Promise.reject(new Error('Session expired. Please sign in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors (including 401 from auth endpoints), surface the real message.
    return Promise.reject(new Error(extractErrorMessage(error)));
  },
);
