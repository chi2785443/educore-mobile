import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { CameraView } from 'expo-camera';
import {
  flushExamOutbox,
  queueProctoringEvents,
  queueProctoringMedia,
} from '@/lib/examOutbox';
import type { ProctoringEventInput, ProctoringTrigger } from '@/interface/proctoring.interface';

/**
 * Proctoring capture for the exam screen. Replaces one hour-long recording with
 *  - short clips at randomised gaps (so they cannot be timed),
 *  - a small photo every ~30s,
 *  - a longer clip when the student comes back from another app,
 *  - an event log of every time the app left the foreground, with duration.
 *
 * Captures go through the offline outbox (kept on the device and retried), so
 * a weak connection or a crash loses at most the clip in progress. A phone
 * cannot report which app the student switched to, only that, and for how
 * long, they left.
 */

const CLIP_SECONDS = 10;
const EVENT_CLIP_SECONDS = 15;
const CLIP_GAP_MIN_S = 240;
const CLIP_GAP_MAX_S = 360;
const PHOTO_EVERY_S = 150;
const PHOTO_JITTER_S = 20;
/** Retry a photo this soon when it collided with a clip in progress. */
const PHOTO_RETRY_MS = 3000;
/** Ignore sub-second focus flickers (permission dialogs, notification shade). */
const MIN_AWAY_SECONDS = 1;
const EVENT_CLIP_COOLDOWN_MS = 60_000;
/** Submit waits this long for uploads; the outbox keeps going afterwards. */
const FLUSH_TIMEOUT_MS = 15_000;
/** Stop trying photos after this many consecutive failures (unsupported device/mode). */
const MAX_PHOTO_FAILURES = 3;

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

interface Options {
  /** The attempt's id; capture does not start until it is known. */
  attemptId: string | undefined;
  startedAt: string | Date | undefined;
  cameraRef: React.RefObject<CameraView | null>;
  /** True once the camera reported ready. */
  ready: boolean;
}

export interface ProctoringCapture {
  /** True while a clip is being recorded (drives the REC indicator). */
  recording: boolean;
  /**
   * Stop capturing, queue what is pending and give uploads a short window.
   * Await before leaving the screen; anything unfinished continues from the
   * outbox in the background.
   */
  flush: () => Promise<void>;
}

export function useProctoringCapture({
  attemptId,
  startedAt,
  cameraRef,
  ready,
}: Options): ProctoringCapture {
  const [recording, setRecording] = useState(false);
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const flushedRef = useRef(false);

  const startMsRef = useRef(0);
  useEffect(() => {
    const t = startedAt ? new Date(startedAt).getTime() : NaN;
    startMsRef.current = Number.isFinite(t) ? t : Date.now();
  }, [startedAt]);

  const flush = useCallback(async (): Promise<void> => {
    flushedRef.current = true;
    if (stopRef.current) await stopRef.current();
    await Promise.race([
      flushExamOutbox(),
      new Promise<void>((resolve) => setTimeout(resolve, FLUSH_TIMEOUT_MS)),
    ]);
  }, []);

  useEffect(() => {
    if (!ready || !attemptId) return;
    flushedRef.current = false;
    const id = attemptId;
    let disposed = false;

    const offsetNow = (): number =>
      startMsRef.current === 0 ? 0 : Math.max(0, Math.round((Date.now() - startMsRef.current) / 1000));

    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number): void => {
      const t = setTimeout(() => {
        timers.delete(t);
        if (!disposed) fn();
      }, ms);
      timers.add(t);
    };

    /* ── Clips ──────────────────────────────────────────────────────── */
    let clip: { promise: Promise<void>; trigger: ProctoringTrigger } | null = null;
    let lastEventClipAt = 0;

    const stopCurrentClip = async (): Promise<void> => {
      if (!clip) return;
      const current = clip;
      cameraRef.current?.stopRecording();
      await current.promise;
    };

    const recordClip = (trigger: ProctoringTrigger, seconds: number): void => {
      const cam = cameraRef.current;
      if (!cam || clip) return; // one capture at a time
      const offset = offsetNow();
      const t0 = Date.now();
      setRecording(true);
      const promise = (async (): Promise<void> => {
        try {
          const result = await cam.recordAsync({ maxDuration: seconds });
          if (result?.uri) {
            await queueProctoringMedia(id, result.uri, {
              kind: 'clip',
              trigger,
              offsetSeconds: offset,
              // Actual length: a clip can be cut short by an event or by submit.
              durationSeconds: Math.max(1, Math.round((Date.now() - t0) / 1000)),
            });
          }
        } catch {
          // Camera busy or interrupted by the OS - non-critical.
        } finally {
          clip = null;
          setRecording(false);
        }
      })();
      clip = { promise, trigger };
    };

    const scheduleClip = (): void => {
      later(
        () => {
          recordClip('interval', CLIP_SECONDS);
          scheduleClip();
        },
        randomBetween(CLIP_GAP_MIN_S, CLIP_GAP_MAX_S) * 1000,
      );
    };

    const eventClip = (trigger: ProctoringTrigger): void => {
      const now = Date.now();
      if (now - lastEventClipAt < EVENT_CLIP_COOLDOWN_MS) return;
      lastEventClipAt = now;
      // A routine clip in progress must not swallow the moment worth a look.
      if (clip && (clip.trigger === 'start' || clip.trigger === 'interval')) {
        void stopCurrentClip().then(() => recordClip(trigger, EVENT_CLIP_SECONDS));
      } else {
        recordClip(trigger, EVENT_CLIP_SECONDS);
      }
    };

    /* ── Photos ─────────────────────────────────────────────────────── */
    let photoFailures = 0;

    const takePhoto = async (): Promise<boolean> => {
      const cam = cameraRef.current;
      if (!cam || clip || photoFailures >= MAX_PHOTO_FAILURES) return false;
      try {
        const offset = offsetNow();
        // Low quality and scale keep a still to a few tens of KB (server cap: 1 MB).
        const pic = await cam.takePictureAsync({ quality: 0.3, scale: 0.3, shutterSound: false });
        if (pic?.uri) {
          await queueProctoringMedia(id, pic.uri, { kind: 'photo', trigger: 'interval', offsetSeconds: offset });
        }
        photoFailures = 0;
        return true;
      } catch {
        photoFailures += 1;
        return false;
      }
    };

    const schedulePhoto = (delayMs: number): void => {
      later(async () => {
        const taken = await takePhoto();
        if (disposed) return;
        // Collided with a clip (or hiccuped): try again shortly instead of skipping a whole cycle.
        if (!taken && photoFailures < MAX_PHOTO_FAILURES && clip) {
          schedulePhoto(PHOTO_RETRY_MS);
        } else {
          schedulePhoto((PHOTO_EVERY_S + randomBetween(-PHOTO_JITTER_S, PHOTO_JITTER_S)) * 1000);
        }
      }, delayMs);
    };

    /* ── Events: the app leaving the foreground ─────────────────────── */
    const events: ProctoringEventInput[] = [];
    let awaySince: number | null = null;

    const sendEvents = (): void => {
      if (events.length === 0) return;
      void queueProctoringEvents(id, events.splice(0, events.length));
    };

    const closeAway = (): void => {
      if (awaySince === null) return;
      const seconds = Math.round((Date.now() - awaySince) / 1000);
      awaySince = null;
      if (seconds >= MIN_AWAY_SECONDS) {
        events.push({ type: 'window_blur', offsetSeconds: offsetNow(), durationSeconds: seconds });
      }
      sendEvents();
    };

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        const wasAway = awaySince !== null;
        closeAway();
        // The camera cannot record while backgrounded, so capture on return.
        if (wasAway) eventClip('window_blur');
      } else if (awaySince === null) {
        awaySince = Date.now();
      }
    });

    /* ── Go ─────────────────────────────────────────────────────────── */
    later(() => recordClip('start', 8), 4000);
    schedulePhoto(3000);
    scheduleClip();

    stopRef.current = async (): Promise<void> => {
      disposed = true;
      timers.forEach(clearTimeout);
      timers.clear();
      sub.remove();
      await stopCurrentClip();
      closeAway();
      sendEvents();
    };

    return () => {
      // Unmount without an explicit flush: still stop the camera work.
      if (!flushedRef.current && stopRef.current) void stopRef.current();
      stopRef.current = null;
    };
  }, [ready, attemptId, cameraRef]);

  return { recording, flush };
}
