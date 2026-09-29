import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Application from 'expo-application';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { experimental_createQueryPersister } from '@tanstack/react-query-persist-client';

/** Storage key prefix for persisted queries. One AsyncStorage row per query. */
const QUERY_CACHE_PREFIX = 'cakale-q';

/** How long a screen's last-seen data stays usable offline. */
const OFFLINE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Live "right now" data that is misleading when replayed from disk, e.g.
 * yesterday's "You are clocked in" shown as today's status.
 */
const NEVER_PERSIST = new Set(['attendance-today', 'attendance-admin-today', 'app-release']);

/**
 * Per-query persistence rather than one serialized blob: Android's
 * AsyncStorage rows fail above ~2MB, which a whole-cache snapshot of a busy
 * school account would exceed, silently dropping everything.
 */
const queryPersister = experimental_createQueryPersister({
  storage: {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
    // Needed by persisterGc to find expired rows; AsyncStorage has no iterator.
    entries: async () => {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
        k.startsWith(QUERY_CACHE_PREFIX),
      );
      const rows = await AsyncStorage.multiGet(keys);
      return rows.filter((row): row is [string, string] => row[1] !== null);
    },
  },
  prefix: QUERY_CACHE_PREFIX,
  maxAge: OFFLINE_CACHE_MAX_AGE,
  // A new app version may change response shapes; never feed it old ones.
  buster: Application.nativeApplicationVersion ?? '0',
  filters: {
    predicate: (query) => !NEVER_PERSIST.has(String(query.queryKey[0])),
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      // Must be >= the persister's maxAge or restored data is garbage-collected early.
      gcTime: OFFLINE_CACHE_MAX_AGE,
      // 'offlineFirst' runs the queryFn once even offline, which is what lets
      // the persister restore the saved copy. 'online' would pause first and
      // never read the disk.
      networkMode: 'offlineFirst',
      persister: queryPersister.persisterFn,
    },
    mutations: {
      retry: 0,
      // Fail fast with a clear message instead of pausing silently: a form
      // spinner that waits forever for a connection looks like a hang.
      networkMode: 'always',
    },
  },
});

/** Wipes in-memory and on-disk query data. Called on sign-out so the next account never sees it. */
export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  const keys = await AsyncStorage.getAllKeys();
  const cached = keys.filter((k) => k.startsWith(QUERY_CACHE_PREFIX));
  if (cached.length) await AsyncStorage.multiRemove(cached);
}

/** Drops expired or outdated persisted queries. Safe to call on every launch. */
export function pruneQueryCache(): Promise<void> {
  return queryPersister.persisterGc();
}

let listenersInstalled = false;

/**
 * Connects React Query to the device's network and app-foreground state.
 * Without this React Query assumes it is always online (RN has no
 * `navigator.onLine`) and never refetches when the app returns to the front.
 */
export function installQueryListeners(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;

  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      // isInternetReachable is null while unknown; only treat an explicit
      // false as offline so a slow probe does not flash the banner.
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    }),
  );

  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });
  }
}
