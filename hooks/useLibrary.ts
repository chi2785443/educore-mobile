import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryService, UploadLibraryDocumentParams } from '@/services/library.service';

export const useLibraryCategories = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['library-categories', schoolId],
    queryFn: () => libraryService.getCategories(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });

export const useLibraryDocuments = (schoolId: string | undefined, category?: string) =>
  useQuery({
    queryKey: ['library-docs', schoolId, category],
    queryFn: () => libraryService.getDocuments(schoolId!, category),
    enabled: !!schoolId,
    staleTime: 60_000,
  });

export function useUploadLibraryDocument(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: UploadLibraryDocumentParams) => libraryService.uploadDocument(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-docs', schoolId] });
      qc.invalidateQueries({ queryKey: ['library-categories', schoolId] });
    },
  });
}

export function useDeleteLibraryDocument(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => libraryService.deleteDocument(schoolId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-docs', schoolId] });
      qc.invalidateQueries({ queryKey: ['library-categories', schoolId] });
    },
  });
}
