import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { retakeRequestService } from '@/services/retake-request.service';
import { CreateRetakePayload, RespondRetakePayload } from '@/interface/attempt.interface';

const STALE = 60_000;

export const useRetakesForAssessment = (assessmentId: string | undefined) =>
  useQuery({
    queryKey: ['retakes', 'assessment', assessmentId],
    queryFn: () => retakeRequestService.getRetakesForAssessment(assessmentId!),
    enabled: !!assessmentId,
    staleTime: STALE,
  });

export const useMyRetakeRequests = (enabled = true) =>
  useQuery({
    queryKey: ['retakes', 'mine'],
    queryFn: () => retakeRequestService.getMyRetakeRequests(),
    enabled,
    staleTime: STALE,
  });

export const useCreateRetakeRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRetakePayload) =>
      retakeRequestService.createRetakeRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retakes', 'mine'] });
    },
  });
};

export const useRespondToRetake = (assessmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RespondRetakePayload }) =>
      retakeRequestService.respondToRetake(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retakes', 'assessment', assessmentId] });
    },
  });
};
