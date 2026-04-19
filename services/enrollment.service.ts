import { apiClient } from './axios.service';
import { Enrollment, CreateEnrollment } from '@/interface/enrollment.interface';

export const enrollmentService = {
  create: async (data: CreateEnrollment): Promise<Enrollment> => {
    const formData = new FormData();
    formData.append('schoolId', data.schoolId);
    formData.append('trainingInterest', data.trainingInterest);
    if (data.gradeLevel) formData.append('gradeLevel', data.gradeLevel);
    if (data.previousSchool) formData.append('previousSchool', data.previousSchool);
    if (data.personalStatement) formData.append('personalStatement', data.personalStatement);
    formData.append('document1Type', data.document1Type);
    formData.append('document2Type', data.document2Type);

    formData.append('document1', {
      uri: data.document1Uri,
      name: data.document1Name,
      type: data.document1MimeType,
    } as unknown as Blob);

    formData.append('document2', {
      uri: data.document2Uri,
      name: data.document2Name,
      type: data.document2MimeType,
    } as unknown as Blob);

    const response = await apiClient.post<Enrollment>('/enrollments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMy: async (): Promise<Enrollment[]> => {
    const response = await apiClient.get<Enrollment[]>('/enrollments/my');
    return response.data;
  },
};
