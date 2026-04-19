import { apiClient } from './axios.service';
import { School, CreateSchool } from '@/interface/school.interface';

export const schoolService = {
  browse: async (params?: { search?: string; city?: string }): Promise<School[]> => {
    const response = await apiClient.get<School[]>('/schools/browse', { params });
    return response.data;
  },

  create: async (data: CreateSchool): Promise<School> => {
    const response = await apiClient.post<School>('/schools', data);
    return response.data;
  },

  getById: async (id: string): Promise<School> => {
    const response = await apiClient.get<School>(`/schools/${id}`);
    return response.data;
  },
};
