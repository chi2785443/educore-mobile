// interface/proctoring.interface.ts
// Mirrors backend proctoring DTOs (src/student-attempts/dto/proctoring-media.dto.ts).

/** Why a clip or photo was captured. Event triggers mark moments worth a look. */
export type ProctoringTrigger =
  | 'start'
  | 'interval'
  | 'tab_hidden'
  | 'window_blur'
  | 'fullscreen_exit';

/**
 * The phone cannot report which app the student switched to, only that, and
 * for how long, they left the exam.
 */
export type ProctoringEventType =
  | 'tab_hidden'
  | 'window_blur'
  | 'fullscreen_exit'
  | 'paste'
  | 'copy'
  | 'second_screen';

export interface ProctoringEventInput {
  type: ProctoringEventType;
  /** Seconds after the attempt started. */
  offsetSeconds: number;
  durationSeconds?: number;
}
