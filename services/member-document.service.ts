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

export interface AdminUploadDocumentParams {
  schoolId: string;
  userId: string;
  title: string;
  description?: string;
  visibility?: 'public' | 'private';
  fileUri: string;
  fileName: string;
  fileMimeType: string;
}

export interface RequestUploadLinkParams {
  schoolId: string;
  recipientEmail: string;
  documentTitle: string;
  message?: string;
}

export const memberDocumentService = {
  getMyDocuments: async (schoolId: string): Promise<MemberDocument[]> => {
    const res = await apiClient.get(`/member-documents/schools/${schoolId}/my`);
    return exList<MemberDocument>(res.data);
  },

  getPublicDocuments: async (schoolId: string): Promise<MemberDocument[]> => {
    const res = await apiClient.get(`/member-documents/schools/${schoolId}/public`);
    return exList<MemberDocument>(res.data);
  },

  getAllDocuments: async (schoolId: string): Promise<MemberDocument[]> => {
    const res = await apiClient.get(`/member-documents/schools/${schoolId}`);
    return exList<MemberDocument>(res.data);
  },

  getSignedViewUrl: async (fileUrl: string): Promise<string> => {
    const res = await apiClient.get('/files/view-url', { params: { fileUrl } });
    return res.data?.url ?? res.data;
  },

  adminUpload: async (params: AdminUploadDocumentParams): Promise<MemberDocument> => {
    const form = new FormData();
    form.append('userId', params.userId);
    form.append('title', params.title);
    if (params.description) form.append('description', params.description);
    if (params.visibility) form.append('visibility', params.visibility);
    form.append('file', { uri: params.fileUri, name: params.fileName, type: params.fileMimeType } as unknown as Blob);
    const res = await apiClient.post(`/member-documents/schools/${params.schoolId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data ?? res.data;
  },

  deleteDocument: async (schoolId: string, documentId: string): Promise<void> => {
    await apiClient.delete(`/member-documents/schools/${schoolId}/${documentId}`);
  },

  requestUploadLink: async (params: RequestUploadLinkParams): Promise<void> => {
    await apiClient.post(`/member-documents/schools/${params.schoolId}/request-upload`, {
      recipientEmail: params.recipientEmail,
      documentTitle: params.documentTitle,
      message: params.message,
    });
  },
};
