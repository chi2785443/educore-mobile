import { apiClient } from './axios.service';
import { TermResult } from '@/interface/result.interface';

const exList = <T>(d: unknown): T[] => {
  if (d && typeof d === 'object' && 'data' in d) {
    const inner = (d as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(d)) return d as T[];
  return [];
};

export const resultsService = {
  getMyResults: async (): Promise<TermResult[]> => {
    const res = await apiClient.get('/results/student/my-results');
    return exList<TermResult>(res.data);
  },
};
