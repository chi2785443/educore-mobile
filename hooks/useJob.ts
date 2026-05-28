import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/job.service';
import {
  ApplyJobPayload, CreateJobPosting, UpdateApplicationStatus, ScheduleInterviewPayload,
} from '@/interface/job.interface';

// ─── Staff / public ────────────────────────────────────────────────────────────

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

// ─── Admin: postings ───────────────────────────────────────────────────────────

export function useSchoolPostings(schoolId: string, status?: string) {
  return useQuery({
    queryKey: ['jobs', 'school-postings', schoolId, status ?? 'all'],
    queryFn: () => jobService.getSchoolPostings(schoolId, status),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  });
}

export function useCreatePosting(schoolId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobPosting) => jobService.createPosting(schoolId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'school-postings', schoolId] });
      onSuccess?.();
    },
  });
}

export function useUpdatePosting(schoolId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobPosting> }) =>
      jobService.updatePosting(schoolId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'school-postings', schoolId] });
      onSuccess?.();
    },
  });
}

export function useDeletePosting(schoolId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobService.deletePosting(schoolId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'school-postings', schoolId] });
      onSuccess?.();
    },
  });
}

// ─── Admin: applications ───────────────────────────────────────────────────────

export function useSchoolApplications(schoolId: string, status?: string, jobPostingId?: string) {
  return useQuery({
    queryKey: ['jobs', 'school-applications', schoolId, status ?? 'all', jobPostingId ?? 'all'],
    queryFn: () => jobService.getSchoolApplications(schoolId, status, jobPostingId),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  });
}

export function useUpdateApplication(schoolId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationStatus }) =>
      jobService.updateApplication(schoolId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'school-applications', schoolId] });
      onSuccess?.();
    },
  });
}

// ─── Admin: interviews ─────────────────────────────────────────────────────────

export function useSchoolInterviews(schoolId: string) {
  return useQuery({
    queryKey: ['jobs', 'school-interviews', schoolId],
    queryFn: () => jobService.getSchoolInterviews(schoolId),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  });
}

export function useScheduleInterview(schoolId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleInterviewPayload) => jobService.scheduleInterview(schoolId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', 'school-interviews', schoolId] });
      qc.invalidateQueries({ queryKey: ['jobs', 'school-applications', schoolId] });
      onSuccess?.();
    },
  });
}
