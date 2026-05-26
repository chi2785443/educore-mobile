import { apiClient } from './axios.service';
import { LibraryDocument } from '@/interface/library.interface';

const exList = <T>(d: unknown): T[] => {
  if (d && typeof d === 'object' && 'data' in d) {
    const inner = (d as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(d)) return d as T[];
  return [];
};

export const libraryService = {
  getCategories: async (schoolId: string): Promise<string[]> => {
    const res = await apiClient.get(`/library/schools/${schoolId}/categories`);
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },

  getDocuments: async (schoolId: string, category?: string): Promise<LibraryDocument[]> => {
    const res = await apiClient.get(`/library/schools/${schoolId}`, {
      params: category ? { category } : undefined,
    });
    return exList<LibraryDocument>(res.data);
  },

  getSignedViewUrl: async (fileUrl: string): Promise<string> => {
    const res = await apiClient.get('/files/view-url', { params: { fileUrl } });
    return res.data?.url ?? res.data;
  },

  recordDownload: async (schoolId: string, documentId: string): Promise<void> => {
    await apiClient.post(`/library/schools/${schoolId}/${documentId}/download`);
  },
};
