import { apiClient } from './axios.service';
import { LibraryDocument, LibraryVisibility } from '@/interface/library.interface';

const exList = <T>(d: unknown): T[] => {
  if (d && typeof d === 'object' && 'data' in d) {
    const inner = (d as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(d)) return d as T[];
  return [];
};

export interface UploadLibraryDocumentParams {
  schoolId: string;
  title: string;
  description?: string;
  category?: string;
  visibility?: LibraryVisibility;
  isDownloadable?: boolean;
  tags?: string[];
  fileUri: string;
  fileName: string;
  fileMimeType: string;
}

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

  uploadDocument: async (params: UploadLibraryDocumentParams): Promise<LibraryDocument> => {
    const form = new FormData();
    form.append('title', params.title);
    if (params.description) form.append('description', params.description);
    if (params.category) form.append('category', params.category);
    if (params.visibility) form.append('visibility', params.visibility);
    form.append('isDownloadable', String(params.isDownloadable ?? true));
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(t => form.append('tags[]', t));
    }
    form.append('file', { uri: params.fileUri, name: params.fileName, type: params.fileMimeType } as unknown as Blob);
    const res = await apiClient.post(`/library/schools/${params.schoolId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data ?? res.data;
  },

  deleteDocument: async (schoolId: string, documentId: string): Promise<void> => {
    await apiClient.delete(`/library/schools/${schoolId}/${documentId}`);
  },
};
