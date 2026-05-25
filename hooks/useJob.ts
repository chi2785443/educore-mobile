import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/job.service';
import { ApplyJobPayload } from '@/interface/job.interface';

export function useBrowseJobs(params?: { search?: string }) {
  return useQuery({
    queryKey: ['jobs', 'public', params],
    queryFn: () => jobService.browsePublic(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: ['jobs', 'my-applications'],
    queryFn: () => jobService.getMyApplications(),
    staleTime: 60 * 1000,
  });
}

export function useMyInterviews() {
  return useQuery({
    queryKey: ['jobs', 'my-interviews'],
    queryFn: () => jobService.getMyInterviews(),
    staleTime: 60 * 1000,
  });
}

export function useApplyForJob(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyJobPayload) => jobService.apply(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'my-applications'] });
      onSuccess?.();
    },
  });
}

export function useWithdrawApplication(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobService.withdrawApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'my-applications'] });
      onSuccess?.();
    },
  });
}

export function useConfirmInterview(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobService.confirmInterview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'my-interviews'] });
      onSuccess?.();
    },
  });
}
