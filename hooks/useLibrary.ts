import { useQuery } from '@tanstack/react-query';
import { libraryService } from '@/services/library.service';

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
