import { apiClient } from './axios.service';
import { Enrollment, CreateEnrollment } from '@/interface/enrollment.interface';

export const enrollmentService = {
  getMy: async (): Promise<Enrollment[]> => {
    const response = await apiClient.get('/enrollments/my');
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
  },

  create: async (data: CreateEnrollment): Promise<Enrollment> => {
    const formData = new FormData();
    formData.append('schoolId', data.schoolId);
    formData.append('trainingInterest', data.trainingInterest);
    if (data.gradeLevel) formData.append('gradeLevel', data.gradeLevel);
    if (data.previousSchool) formData.append('previousSchool', data.previousSchool);
    if (data.personalStatement) formData.append('personalStatement', data.personalStatement);
    formData.append('document1Name', data.document1Name);
    formData.append('document2Name', data.document2Name);

    formData.append('document1', {
      uri: data.document1Uri,
      name: data.document1FileName,
      type: data.document1MimeType,
    } as unknown as Blob);

    formData.append('document2', {
      uri: data.document2Uri,
      name: data.document2FileName,
      type: data.document2MimeType,
    } as unknown as Blob);

    const response = await apiClient.post<Enrollment>('/enrollments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
