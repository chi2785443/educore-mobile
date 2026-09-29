import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance.service';
import { useAuthStore } from '@/store/authStore';
import { isRetryableError } from '@/lib/errors';
import { queryClient } from '@/lib/queryClient';
import { ClockPayload } from '@/interface/attendance.interface';

/**
 * Clock-ins captured without signal. Each keeps the time and place of the
 * tap and is sent when the phone reconnects; the server records it as
 * "captured offline" and always holds it for admin review, so this never
 * lets anyone skip verification. The server rejects entries older than 24h.
 */

const STORAGE_KEY = 'cakale-attendance-outbox';

export interface PendingClock {
  userId: string;
  schoolId: string;
  clientEventId: string;
  /** Device time of the tap (ISO). */
  capturedAt: string;
  payload: ClockPayload;
}

interface State {
  pending: PendingClock[];
  /** Server refusals to show once (e.g. older than 24 hours). */
  rejected: { schoolId: string; message: string }[];
}

let state: State = { pending: [], rejected: [] };
let loaded: Promise<void> | null = null;
let flushing: Promise<void> | null = null;
let rerun = false;
const listeners = new Set<() => void>();

function load(): Promise<void> {
  loaded ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      if (raw) state = { pending: [], rejected: [], ...(JSON.parse(raw) as Partial<State>) };
    })
    .catch(() => undefined)
    .finally(() => listeners.forEach((l) => l()));
  return loaded;
}

function commit(next: State): Promise<void> {
  state = next;
  listeners.forEach((l) => l());
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Idempotency key for one tap. Sent on the live request too, so a request
 * that timed out after the server saved it cannot be recorded twice when the
 * offline copy is replayed. RFC 4122 v4 shape (the API validates it).
 */
export function newClientEventId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Keep a clock-in/out on the device and try to send it. */
export async function queueClock(
  schoolId: string,
  payload: ClockPayload,
  clientEventId: string,
  capturedAt: string,
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  await load();
  await commit({
    ...state,
    pending: [...state.pending, { userId, schoolId, clientEventId, capturedAt, payload }],
  });
  void flushAttendanceOutbox();
}

/** Send queued entries for the signed-in user, oldest first. */
export function flushAttendanceOutbox(): Promise<void> {
  // A request that arrives mid-pass may be the one that matters (e.g. the
  // "back online" event while a pass is deciding it is offline), so it
  // earns one more pass instead of sharing the stale result.
  if (flushing) {
    rerun = true;
    return flushing;
  }
  flushing = (async () => {
    do {
      rerun = false;
      await run();
    } while (rerun);
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

async function run(): Promise<void> {
  await load();
  for (;;) {
    const userId = useAuthStore.getState().user?.id;
    if (!userId || !onlineManager.isOnline()) return;
    const next = state.pending.find((p) => p.userId === userId);
    if (!next) return;
    try {
      await attendanceService.clockAttendance(next.schoolId, {
        ...next.payload,
        capturedOffline: true,
        capturedAt: next.capturedAt,
        clientEventId: next.clientEventId,
      });
    } catch (err) {
      if (isRetryableError(err)) return;
      const message = err instanceof Error ? err.message : 'Attendance could not be recorded.';
      await commit({ ...state, rejected: [...state.rejected, { schoolId: next.schoolId, message }] });
    }
    await commit({ ...state, pending: state.pending.filter((p) => p !== next) });
    queryClient.invalidateQueries({ queryKey: ['attendance-today', next.schoolId] });
    queryClient.invalidateQueries({ queryKey: ['attendance-my', next.schoolId] });
    queryClient.invalidateQueries({ queryKey: ['attendance-daily', next.schoolId] });
  }
}

/** Take (and clear) refusals for a school so the user is told once. */
export async function takeAttendanceRejections(schoolId: string): Promise<string[]> {
  await load();
  const mine = state.rejected.filter((r) => r.schoolId === schoolId);
  if (mine.length) await commit({ ...state, rejected: state.rejected.filter((r) => !mine.includes(r)) });
  return mine.map((r) => r.message);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  void load();
  return () => listeners.delete(listener);
}

const EMPTY: PendingClock[] = [];
let cacheKey = '';
let cacheValue: PendingClock[] = EMPTY;

/** The signed-in user's unsent entries for a school, oldest first. */
export function usePendingClocks(schoolId: string): PendingClock[] {
  const userId = useAuthStore((s) => s.user?.id);
  return useSyncExternalStore(subscribe, () => {
    const list = state.pending.filter((p) => p.schoolId === schoolId && p.userId === userId);
    // Stable reference when unchanged, as useSyncExternalStore requires.
    const key = list.map((p) => p.clientEventId).join(',');
    if (key !== cacheKey) {
      cacheKey = key;
      cacheValue = list.length ? list : EMPTY;
    }
    return cacheValue;
  });
}

let triggersInstalled = false;

/** Retry whenever the device comes back online. Call once at startup. */
export function installAttendanceOutboxSync(): void {
  if (triggersInstalled) return;
  triggersInstalled = true;
  onlineManager.subscribe((online) => {
    if (online) void flushAttendanceOutbox();
  });
  void flushAttendanceOutbox();
}
