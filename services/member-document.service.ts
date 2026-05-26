import { apiClient } from './axios.service';
import { MemberDocument } from '@/interface/document.interface';

const exList = <T>(d: unknown): T[] => {
  if (d && typeof d === 'object' && 'data' in d) {
    const inner = (d as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(d)) return d as T[];
  return [];
};

export const memberDocumentService = {
  getMyDocuments: async (schoolId: string): Promise<MemberDocument[]> => {
    const res = await apiClient.get(`/member-documents/schools/${schoolId}/my`);
    return exList<MemberDocument>(res.data);
  },

  getPublicDocuments: async (schoolId: string): Promise<MemberDocument[]> => {
    const res = await apiClient.get(`/member-documents/schools/${schoolId}/public`);
    return exList<MemberDocument>(res.data);
  },

  getSignedViewUrl: async (fileUrl: string): Promise<string> => {
    const res = await apiClient.get('/files/view-url', { params: { fileUrl } });
    return res.data?.url ?? res.data;
  },
};
