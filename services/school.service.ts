import { apiClient } from './axios.service';
import { School, CreateSchool } from '@/interface/school.interface';
import { UserRole } from '@/interface/user.interface';

export interface SchoolMember {
  id: string;
  userId: string;
  role: UserRole;
  user: { id: string; firstName: string; lastName: string; email: string; profilePicture?: string | null };
}

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

  getMembers: async (schoolId: string): Promise<SchoolMember[]> => {
    const res = await apiClient.get(`/schools/${schoolId}/members`);
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },
};
