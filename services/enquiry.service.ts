import { apiClient } from './axios.service';
import { Enquiry, CreateEnquiry } from '@/interface/enquiry.interface';

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
};
