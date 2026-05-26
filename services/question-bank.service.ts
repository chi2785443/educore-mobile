import { apiClient } from './axios.service';
import {
  Question, CreateObjectivePayload, CreateTheoryPayload, QuestionFilters,
} from '@/interface/question.interface';

const exList = <T>(d: unknown): T[] => {
  if (d && typeof d === 'object' && 'data' in d) {
    const inner = (d as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(d)) return d as T[];
  return [];
};
const ex = <T>(d: unknown): T => {
  if (d && typeof d === 'object' && 'data' in d) return (d as { data: T }).data;
  return d as T;
};

export const questionBankService = {
  getQuestions: async (schoolId: string, filters?: QuestionFilters): Promise<Question[]> => {
    const res = await apiClient.get('/question-bank', {
      params: { schoolId, ...filters },
    });
    return exList<Question>(res.data);
  },

  createObjective: async (payload: CreateObjectivePayload): Promise<Question> => {
    const res = await apiClient.post('/question-bank/objective', payload);
    return ex<Question>(res.data);
  },

  createTheory: async (payload: CreateTheoryPayload): Promise<Question> => {
    const res = await apiClient.post('/question-bank/theory', payload);
    return ex<Question>(res.data);
  },

  uploadImage: async (uri: string, fileName: string, mimeType: string): Promise<string> => {
    const formData = new FormData();
    formData.append('image', { uri, name: fileName, type: mimeType } as unknown as Blob);
    const res = await apiClient.post('/question-bank/upload-image', formData, {
      headers: { 'Content-Type': undefined },
    });
    const d = res.data?.data ?? res.data;
    return (d as { url: string }).url;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await apiClient.delete(`/question-bank/${id}`);
  },
};
