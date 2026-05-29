import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberDocumentService, AdminUploadDocumentParams, RequestUploadLinkParams } from '@/services/member-document.service';

export const useMyDocuments = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['my-documents', schoolId],
    queryFn: () => memberDocumentService.getMyDocuments(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });

export const usePublicDocuments = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['public-documents', schoolId],
    queryFn: () => memberDocumentService.getPublicDocuments(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });

export const useAllMemberDocuments = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['all-member-documents', schoolId],
    queryFn: () => memberDocumentService.getAllDocuments(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });

export function useAdminUploadMemberDocument(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: AdminUploadDocumentParams) => memberDocumentService.adminUpload(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-member-documents', schoolId] });
      qc.invalidateQueries({ queryKey: ['my-documents', schoolId] });
    },
  });
}

export function useDeleteMemberDocument(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => memberDocumentService.deleteDocument(schoolId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-member-documents', schoolId] });
      qc.invalidateQueries({ queryKey: ['my-documents', schoolId] });
      qc.invalidateQueries({ queryKey: ['public-documents', schoolId] });
    },
  });
}

export function useRequestUploadLink() {
  return useMutation({
    mutationFn: (params: RequestUploadLinkParams) => memberDocumentService.requestUploadLink(params),
  });
}

export function useChildMemberDocuments(schoolId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['child-documents', schoolId, userId],
    queryFn: () => memberDocumentService.getChildDocuments(schoolId!, userId!),
    enabled: !!schoolId && !!userId,
    staleTime: 60_000,
  });
}
