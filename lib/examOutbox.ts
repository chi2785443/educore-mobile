import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { onlineManager } from '@tanstack/react-query';
import { studentAttemptService } from '@/services/student-attempt.service';
import { useAuthStore } from '@/store/authStore';
import { isRetryableError } from '@/lib/errors';

/**
 * Offline-safe delivery for exam work.
 *
 * Every answer is written to the device first, then sent in the background
 * and retried until the server confirms it. A dropped connection mid-exam
 * therefore never loses an answer; it just arrives late. The server stays
 * the authority on time: it rejects answers after the deadline (plus a short
 * sync grace), so going offline never buys extra time.
 *
 * Entries carry the owner's userId. Only the signed-in user's entries are
 * sent, so a shared phone never submits one student's answers as another.
 */

const STORAGE_KEY = 'cakale-exam-outbox';
const RECORDINGS_DIR = `${FileSystem.documentDirectory ?? ''}exam-recordings/`;

interface PendingAnswer {
  userId: string;
  attemptId: string;
  assessmentQuestionId: string;
  answer: string;
  /** Changes on every edit, so a send that raced a newer edit never deletes it. */
  version: number;
}

interface PendingSubmit {
  userId: string;
  attemptId: string;
  timeRemaining: number;
}

interface PendingRecording {
  userId: string;
  attemptId: string;
  /** Moved out of the camera cache, which the OS may clear at any time. */
  uri: string;
}

export interface ExamRejection {
  attemptId: string;
  kind: 'answer' | 'submit';
  message: string;
}

interface OutboxState {
  answers: PendingAnswer[];
  submits: PendingSubmit[];
  recordings: PendingRecording[];
  /** Local answer copy per attempt, so a resume offline still shows them. */
  drafts: Record<string, Record<string, string>>;
  /** Server refusals (e.g. deadline passed) the student should hear about. */
  rejected: ExamRejection[];
}

const EMPTY: OutboxState = { answers: [], submits: [], recordings: [], drafts: {}, rejected: [] };

let state: OutboxState = EMPTY;
let loaded: Promise<void> | null = null;
let flushing: Promise<void> | null = null;
let rerun = false;
let versionCounter = Date.now();
const listeners = new Set<() => void>();

function load(): Promise<void> {
  loaded ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<OutboxState>) };
    })
    .catch(() => {
      state = EMPTY;
    });
  return loaded;
}

function commit(next: OutboxState): Promise<void> {
  state = next;
  listeners.forEach((l) => l());
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

/* ── Public API ──────────────────────────────────────────────── */

/** Answers saved on this device for an attempt (used to restore a resumed exam). */
export async function getDraftAnswers(attemptId: string): Promise<Record<string, string>> {
  await load();
  return state.drafts[attemptId] ?? {};
}

/**
 * Save an answer locally and queue it for the server. Resolves once it is
 * safely on disk, not when the server has it.
 */
export async function queueAnswer(
  attemptId: string,
  assessmentQuestionId: string,
  answer: string,
): Promise<void> {
  const userId = currentUserId();
  if (!userId) return;
  await load();
  const pending: PendingAnswer = {
    userId,
    attemptId,
    assessmentQuestionId,
    answer,
    version: ++versionCounter,
  };
  await commit({
    ...state,
    answers: [
      ...state.answers.filter(
        (a) => !(a.attemptId === attemptId && a.assessmentQuestionId === assessmentQuestionId),
      ),
      pending,
    ],
    drafts: {
      ...state.drafts,
      [attemptId]: { ...state.drafts[attemptId], [assessmentQuestionId]: answer },
    },
  });
  void flushExamOutbox();
}

export type SubmitOutcome = 'submitted' | 'queued';

/**
 * Submit an attempt after all its answers are delivered. Returns 'queued'
 * when offline: the device finishes the job when the connection returns.
 * Throws the server's message when the submit itself is refused.
 */
export async function submitAttemptViaOutbox(
  attemptId: string,
  timeRemaining: number,
): Promise<SubmitOutcome> {
  const userId = currentUserId();
  if (!userId) throw new Error('Please sign in again to submit.');
  await load();
  await commit({
    ...state,
    submits: [...state.submits.filter((s) => s.attemptId !== attemptId), { userId, attemptId, timeRemaining }],
  });
  await flushExamOutbox();

  const rejection = state.rejected.find((r) => r.attemptId === attemptId && r.kind === 'submit');
  if (rejection) {
    await commit({ ...state, rejected: state.rejected.filter((r) => r !== rejection) });
    throw new Error(rejection.message);
  }
  return state.submits.some((s) => s.attemptId === attemptId) ? 'queued' : 'submitted';
}

/**
 * Upload the proctoring video, or keep it on the device and retry later.
 * Returns true when uploaded now.
 */
export async function queueRecording(attemptId: string, cameraUri: string): Promise<boolean> {
  const userId = currentUserId();
  if (!userId) return false;
  await load();
  await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true }).catch(() => undefined);
  const ext = cameraUri.split('.').pop() ?? 'mp4';
  const uri = `${RECORDINGS_DIR}${attemptId}.${ext}`;
  await FileSystem.moveAsync({ from: cameraUri, to: uri });
  await commit({
    ...state,
    recordings: [...state.recordings.filter((r) => r.attemptId !== attemptId), { userId, attemptId, uri }],
  });
  await flushExamOutbox();
  return !state.recordings.some((r) => r.attemptId === attemptId);
}

/**
 * Send everything queued for the signed-in user, in order: answers, then
 * submits, then recordings. Single-flight; stops at the first network error
 * and leaves the rest for the next attempt.
 */
export function flushExamOutbox(): Promise<void> {
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
      await runFlush();
    } while (rerun);
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

async function runFlush(): Promise<void> {
  await load();
  // Always read the next item from live state, not a snapshot: edits queued
  // while a send is in flight are picked up in the same run.
  for (;;) {
    const userId = currentUserId();
    if (!userId || !onlineManager.isOnline()) return;

    const answer = state.answers.find((a) => a.userId === userId);
    if (answer) {
      if (!(await send(answer.attemptId, 'answer', () =>
        studentAttemptService.submitAnswer({
          attemptId: answer.attemptId,
          assessmentQuestionId: answer.assessmentQuestionId,
          answer: answer.answer,
        }),
      ))) return;
      // By version: a newer edit of the same question stays queued.
      await commit({ ...state, answers: state.answers.filter((a) => a.version !== answer.version) });
      continue;
    }

    // Answers are all delivered at this point, so a submit never outruns one.
    const submit = state.submits.find((s) => s.userId === userId);
    if (submit) {
      if (!(await send(submit.attemptId, 'submit', () =>
        studentAttemptService.submitAttempt({
          attemptId: submit.attemptId,
          timeRemaining: submit.timeRemaining,
        }),
      ))) return;
      const drafts = { ...state.drafts };
      delete drafts[submit.attemptId];
      await commit({ ...state, drafts, submits: state.submits.filter((s) => s !== submit) });
      continue;
    }

    const recording = state.recordings.find((r) => r.userId === userId);
    if (recording) {
      if (!(await send(recording.attemptId, null, () =>
        studentAttemptService.uploadRecordingDirect(recording.attemptId, recording.uri),
      ))) return;
      await FileSystem.deleteAsync(recording.uri, { idempotent: true }).catch(() => undefined);
      await commit({ ...state, recordings: state.recordings.filter((r) => r !== recording) });
      continue;
    }

    return;
  }
}

/**
 * Run one send. Returns false to stop the run (retry later), true when the
 * item is finished: delivered, or refused for good. A permanent refusal
 * (deadline passed, attempt closed) is recorded and the queue moves on;
 * retrying it forever would block everything behind it.
 */
async function send(
  attemptId: string,
  kind: ExamRejection['kind'] | null,
  request: () => Promise<unknown>,
): Promise<boolean> {
  try {
    await request();
    return true;
  } catch (err) {
    if (isRetryableError(err)) return false;
    const message = err instanceof Error ? err.message : 'The server refused this exam update.';
    console.warn(`[exam-outbox] ${kind ?? 'recording'} refused: ${message}`);
    if (kind) await commit({ ...state, rejected: [...state.rejected, { attemptId, kind, message }] });
    return true;
  }
}

/** Take (and clear) answer refusals so the student can be told once. */
export async function takeAnswerRejections(attemptId: string): Promise<ExamRejection[]> {
  await load();
  const mine = state.rejected.filter((r) => r.attemptId === attemptId && r.kind === 'answer');
  if (mine.length) {
    await commit({ ...state, rejected: state.rejected.filter((r) => !mine.includes(r)) });
  }
  return mine;
}

/* ── React bindings ──────────────────────────────────────────── */

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Number of exam items (answers, submits, recordings) still waiting to reach the server. */
export function usePendingExamCount(attemptId?: string): number {
  return useSyncExternalStore(subscribe, () => {
    const match = <T extends { attemptId: string }>(items: T[]) =>
      attemptId ? items.filter((i) => i.attemptId === attemptId).length : items.length;
    return match(state.answers) + match(state.submits) + match(state.recordings);
  });
}

let flushTriggersInstalled = false;

/** Retry the outbox whenever the device comes back online. Call once at startup. */
export function installExamOutboxSync(): void {
  if (flushTriggersInstalled) return;
  flushTriggersInstalled = true;
  onlineManager.subscribe((online) => {
    if (online) void flushExamOutbox();
  });
  void flushExamOutbox();
}
