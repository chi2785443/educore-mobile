import { apiClient } from './axios.service';
import { Enquiry, CreateEnquiry } from '@/interface/enquiry.interface';

export const enquiryService = {
  create: async (data: CreateEnquiry): Promise<Enquiry> => {
    const response = await apiClient.post<Enquiry>('/enquiries', data);
    return response.data;
  },

  getMy: async (): Promise<Enquiry[]> => {
    const response = await apiClient.get<Enquiry[]>('/enquiries/my');
    return response.data;
  },
};
