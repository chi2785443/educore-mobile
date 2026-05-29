import { apiClient } from './axios.service';
import {
  Job, MyApplication, MyInterview, ApplyJobPayload,
  JobPosting, JobApplication, JobInterview,
  CreateJobPosting, UpdateApplicationStatus, ScheduleInterviewPayload,
  SchoolJobRole, ApplicationStatus,
} from '@/interface/job.interface';

// Normalize raw backend application shape → JobApplication interface.
// Handles the legacy shape where `applicant` and `jobPosting` are plain IDs.
function normalizeApplication(raw: unknown): JobApplication {
  const r = raw as Record<string, unknown>;
  const details = r.applicantDetails as Record<string, unknown> | null | undefined;
  const rawApplicant = r.applicant as Record<string, unknown> | string | null | undefined;
  const rawPosting = r.jobPosting as Record<string, unknown> | string | null | undefined;

  const applicant: JobApplication['applicant'] =
    rawApplicant && typeof rawApplicant === 'object' && rawApplicant.firstName
      ? {
          id: rawApplicant.id as string,
          firstName: (rawApplicant.firstName ?? '') as string,
          lastName: (rawApplicant.lastName ?? '') as string,
          email: (rawApplicant.email ?? '') as string,
          phoneNumber: rawApplicant.phoneNumber as string | undefined,
          profilePicture: rawApplicant.profilePicture as string | null | undefined,
        }
      : details
        ? {
            id: details.id as string,
            firstName: (details.firstName ?? '') as string,
            lastName: (details.lastName ?? '') as string,
            email: (details.email ?? '') as string,
          }
        : undefined;

  const jobPosting: JobApplication['jobPosting'] =
    rawPosting && typeof rawPosting === 'object'
      ? {
          id: rawPosting.id as string,
          title: ((rawPosting.title ?? r.jobTitle) ?? '') as string,
          employmentType: rawPosting.employmentType as string | undefined,
          role: rawPosting.role as SchoolJobRole | undefined,
        }
      : typeof rawPosting === 'string'
        ? { id: rawPosting, title: (r.jobTitle ?? '') as string }
        : undefined;

  return {
    id: r.id as string,
    status: r.status as ApplicationStatus,
    coverLetter: r.coverLetter as string | undefined,
    yearsOfExperience: (r.yearsOfExperience as number) ?? 0,
    portfolioUrl: r.portfolioUrl as string | undefined,
    education: r.education as string | undefined,
    certifications: r.certifications as string | undefined,
    expectedSalary: r.expectedSalary as number | undefined,
    notes: r.notes as string | undefined,
    rejectionReason: r.rejectionReason as string | undefined,
    rejectionFeedback: r.rejectionFeedback as string | undefined,
    rating: r.rating as number | undefined,
    submittedAt: (r.submittedAt ?? r.createdAt) as string,
    updatedAt: r.updatedAt as string,
    resume: r.resume && typeof r.resume === 'string'
      ? { url: r.resume as string, publicId: '', name: undefined }
      : r.resume as JobApplication['resume'],
    applicant,
    jobPosting,
  };
}

export const jobService = {
  // ─── Staff / public ────────────────────────────────────────────────────────

  browsePublic: async (params?: { search?: string; schoolId?: string }): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs/public', { params });
    return response.data;
  },

  apply: async (data: ApplyJobPayload): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('jobPostingId', data.jobPostingId);
    formData.append('coverLetter', data.coverLetter);
    formData.append('yearsOfExperience', String(data.yearsOfExperience));
    if (data.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);
    if (data.education) formData.append('education', data.education);
    formData.append('resume', {
      uri: data.resumeUri,
      name: data.resumeName,
      type: data.resumeMimeType,
    } as unknown as Blob);
    const response = await apiClient.post<{ message: string }>(
      `/jobs/schools/${data.schoolId}/apply`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  getMyApplications: async (): Promise<MyApplication[]> => {
    const response = await apiClient.get<MyApplication[]>('/jobs/my-applications');
    return response.data;
  },

  withdrawApplication: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(`/jobs/my-applications/${id}/withdraw`);
    return response.data;
  },

  getMyInterviews: async (): Promise<MyInterview[]> => {
    const response = await apiClient.get<MyInterview[]>('/jobs/my-interviews');
    return response.data;
  },

  confirmInterview: async (id: string): Promise<MyInterview> => {
    const response = await apiClient.patch<MyInterview>(`/jobs/interviews/${id}/confirm`);
    return response.data;
  },

  // ─── Admin: postings ───────────────────────────────────────────────────────

  getSchoolPostings: async (schoolId: string, status?: string): Promise<JobPosting[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/jobs/schools/${schoolId}/postings`, { params });
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
  },

  createPosting: async (schoolId: string, data: CreateJobPosting): Promise<JobPosting> => {
    const response = await apiClient.post<JobPosting>(`/jobs/schools/${schoolId}/postings`, data);
    return response.data;
  },

  updatePosting: async (schoolId: string, id: string, data: Partial<CreateJobPosting>): Promise<JobPosting> => {
    const response = await apiClient.patch<JobPosting>(`/jobs/schools/${schoolId}/postings/${id}`, data);
    return response.data;
  },

  deletePosting: async (schoolId: string, id: string): Promise<void> => {
    await apiClient.delete(`/jobs/schools/${schoolId}/postings/${id}`);
  },

  // ─── Admin: applications ───────────────────────────────────────────────────

  getSchoolApplications: async (schoolId: string, status?: string, jobPostingId?: string): Promise<JobApplication[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (jobPostingId) params.jobPostingId = jobPostingId;
    const response = await apiClient.get(`/jobs/schools/${schoolId}/applications`, { params });
    const raw = response.data;
    const arr: unknown[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
    return arr.map(normalizeApplication);
  },

  updateApplication: async (schoolId: string, id: string, data: UpdateApplicationStatus): Promise<JobApplication> => {
    const response = await apiClient.patch<JobApplication>(`/jobs/schools/${schoolId}/applications/${id}`, data);
    return response.data;
  },

  // ─── Admin: interviews ─────────────────────────────────────────────────────

  getSchoolInterviews: async (schoolId: string): Promise<JobInterview[]> => {
    const response = await apiClient.get(`/jobs/schools/${schoolId}/interviews`);
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
  },

  scheduleInterview: async (schoolId: string, data: ScheduleInterviewPayload): Promise<JobInterview> => {
    const response = await apiClient.post<JobInterview>(`/jobs/schools/${schoolId}/interviews`, data);
    return response.data;
  },

  updateInterview: async (schoolId: string, id: string, data: Partial<ScheduleInterviewPayload>): Promise<JobInterview> => {
    const response = await apiClient.patch<JobInterview>(`/jobs/schools/${schoolId}/interviews/${id}`, data);
    return response.data;
  },
};
