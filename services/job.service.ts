import { apiClient } from './axios.service';
import { Job, MyApplication, MyInterview, ApplyJobPayload } from '@/interface/job.interface';

export const jobService = {
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
};
