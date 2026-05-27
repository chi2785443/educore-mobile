import { apiClient } from './axios.service';
import { Enquiry, CreateEnquiry, ReplyEnquiry, EnquiryStatus } from '@/interface/enquiry.interface';

export const enquiryService = {
  getMy: async (): Promise<Enquiry[]> => {
    const response = await apiClient.get('/enquiries/my');
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
  },

  create: async (data: CreateEnquiry): Promise<Enquiry> => {
    const response = await apiClient.post<Enquiry>('/enquiries', data);
    return response.data;
  },

  getBySchool: async (schoolId: string, status?: EnquiryStatus): Promise<Enquiry[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/enquiries/schools/${schoolId}`, { params });
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
  },

  reply: async (schoolId: string, id: string, data: ReplyEnquiry): Promise<Enquiry> => {
    const response = await apiClient.patch<Enquiry>(`/enquiries/schools/${schoolId}/${id}/reply`, data);
    return response.data;
  },

  close: async (schoolId: string, id: string): Promise<Enquiry> => {
    const response = await apiClient.patch<Enquiry>(`/enquiries/schools/${schoolId}/${id}/close`);
    return response.data;
  },
};
