import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  markingService,
  MarkTheoryAnswerPayload,
  SubmitMarkingPayload,
} from '@/services/marking.service';

export const usePendingMarking = (assessmentId: string | undefined) =>
  useQuery({
    queryKey: ['marking-pending', assessmentId],
    queryFn: () => markingService.getPendingByAssessment(assessmentId!),
    enabled: !!assessmentId,
    staleTime: 30_000,
  });

export const useAttemptMarkingDetails = (attemptId: string | undefined) =>
  useQuery({
    queryKey: ['marking-details', attemptId],
    queryFn: () => markingService.getAttemptMarkingDetails(attemptId!),
    enabled: !!attemptId,
    staleTime: 15_000,
  });

export const useMarkTheoryAnswer = (assessmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MarkTheoryAnswerPayload) =>
      markingService.markTheoryAnswer(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['marking-pending', assessmentId] });
      qc.invalidateQueries({ queryKey: ['marking-details'] });
    },
  });
};

export const useSubmitMarking = (assessmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitMarkingPayload) =>
      markingService.submitMarking(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marking-pending', assessmentId] });
      qc.invalidateQueries({ queryKey: ['scores', assessmentId] });
    },
  });
};
