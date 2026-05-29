import { apiClient } from './axios.service';
import {
  Assessment,
  AssessmentQuestion,
  CreateAssessmentPayload,
  UpdateAssessmentPayload,
  Subject,
} from '@/interface/assessment.interface';

const extractList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'data' in data) {
    const inner = (data as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
};

export const assessmentService = {
  getAssessments: async (params: Record<string, string | undefined>): Promise<Assessment[]> => {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined),
    );
    const res = await apiClient.get('/assessments', { params: filtered });
    return extractList<Assessment>(res.data);
  },

  getMyAssessments: async (): Promise<Assessment[]> => {
    const res = await apiClient.get('/assessments/teacher/my-assessments');
    return extractList<Assessment>(res.data);
  },

  getAssessment: async (id: string): Promise<Assessment> => {
    const res = await apiClient.get(`/assessments/${id}`);
    return (res.data?.data ?? res.data) as Assessment;
  },

  createAssessment: async (payload: CreateAssessmentPayload): Promise<Assessment> => {
    const res = await apiClient.post('/assessments', payload);
    return (res.data?.data ?? res.data) as Assessment;
  },

  updateAssessment: async (id: string, payload: UpdateAssessmentPayload): Promise<Assessment> => {
    const res = await apiClient.patch(`/assessments/${id}`, payload);
    return (res.data?.data ?? res.data) as Assessment;
  },

  publishAssessment: async (id: string): Promise<Assessment> => {
    const res = await apiClient.patch(`/assessments/${id}/publish`);
    return (res.data?.data ?? res.data) as Assessment;
  },

  deleteAssessment: async (id: string): Promise<void> => {
    await apiClient.delete(`/assessments/${id}`);
  },

  getSubjects: async (schoolId: string): Promise<Subject[]> => {
    const res = await apiClient.get('/subjects', { params: { schoolId } });
    return extractList<Subject>(res.data);
  },

  getAssessmentQuestions: async (assessmentId: string): Promise<AssessmentQuestion[]> => {
    const res = await apiClient.get(`/assessment-questions/${assessmentId}`);
    return extractList<AssessmentQuestion>(res.data);
  },

  addAssessmentQuestions: async (payload: {
    assessmentId: string;
    questions: { questionId: string; questionOrder: number; marks: number }[];
  }): Promise<AssessmentQuestion[]> => {
    const res = await apiClient.post('/assessment-questions', payload);
    return extractList<AssessmentQuestion>(res.data);
  },

  removeAssessmentQuestion: async (assessmentId: string, questionId: string): Promise<void> => {
    await apiClient.delete(`/assessment-questions/${assessmentId}/questions/${questionId}`);
  },
};
