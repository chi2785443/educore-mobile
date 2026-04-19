import { useMutation, useQuery } from '@tanstack/react-query';
import { jobService } from '@/services/job.service';
import { JobApplication } from '@/interface/job.interface';

export function useBrowseJobs(params?: { search?: string }) {
  return useQuery({
    queryKey: ['jobs', 'public', params],
    queryFn: () => jobService.browsePublic(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useApplyForJob(schoolId: string, onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: JobApplication) => jobService.apply(schoolId, data),
    onSuccess: () => onSuccess?.(),
  });
}
