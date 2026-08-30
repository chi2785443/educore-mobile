import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAttemptService } from '@/services/student-attempt.service';
import {
  StartAttemptPayload,
  SubmitAnswerPayload,
  SubmitAttemptPayload,
} from '@/interface/attempt.interface';

const STALE = 30_000;

export const useMyAttempts = (enabled = true) =>
  useQuery({
    queryKey: ['attempts', 'mine'],
    queryFn: () => studentAttemptService.getMyAttempts(),
    enabled,
    staleTime: STALE,
  });

export const useAttemptById = (attemptId: string | undefined) =>
  useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => studentAttemptService.getAttemptById(attemptId!),
    enabled: !!attemptId,
    staleTime: STALE,
  });

export const useAttemptsForAssessment = (assessmentId: string | undefined) =>
  useQuery({
    queryKey: ['attempts', 'assessment', assessmentId],
    queryFn: () => studentAttemptService.getAttemptsForAssessment(assessmentId!),
    enabled: !!assessmentId,
    staleTime: STALE,
  });

/**
 * Post-release answer review for one attempt.
 *
 * `enabled` should carry the score's `isReleased` — the endpoint 403s before
 * release and retrying that is pointless.
 */
export const useAttemptReview = (attemptId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['attempts', 'review', attemptId],
    queryFn: () => studentAttemptService.getAttemptReview(attemptId!),
    enabled: !!attemptId && enabled,
    retry: false,
    staleTime: 5 * 60_000,
  });

export const useStartAttempt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartAttemptPayload) =>
      studentAttemptService.startAttempt(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
    },
  });
};

export const useSubmitAnswer = () =>
  useMutation({
    mutationFn: (payload: SubmitAnswerPayload) =>
      studentAttemptService.submitAnswer(payload),
  });

export const useSubmitAttempt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitAttemptPayload) =>
      studentAttemptService.submitAttempt(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['scores', 'mine'] });
    },
  });
};
