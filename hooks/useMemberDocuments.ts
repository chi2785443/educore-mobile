import { useQuery } from '@tanstack/react-query';
import { memberDocumentService } from '@/services/member-document.service';

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
