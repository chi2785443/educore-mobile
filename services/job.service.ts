import { apiClient } from './axios.service';
import { Job, JobApplication } from '@/interface/job.interface';

export const jobService = {
  browsePublic: async (params?: { search?: string; schoolId?: string }): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs/public', { params });
    return response.data;
  },

  apply: async (schoolId: string, data: JobApplication): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('jobId', data.jobId);
    formData.append('coverLetter', data.coverLetter);
    formData.append('yearsOfExperience', String(data.yearsOfExperience));
    if (data.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);

    if (data.resumeUri && data.resumeName && data.resumeMimeType) {
      formData.append('resume', {
        uri: data.resumeUri,
        name: data.resumeName,
        type: data.resumeMimeType,
      } as unknown as Blob);
    }

    const response = await apiClient.post<{ message: string }>(
      `/jobs/schools/${schoolId}/applications`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
};
