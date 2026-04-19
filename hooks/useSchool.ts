import { useMutation, useQuery } from '@tanstack/react-query';
import { schoolService } from '@/services/school.service';
import { CreateSchool } from '@/interface/school.interface';

export function useBrowseSchools(params?: { search?: string; city?: string }) {
  return useQuery({
    queryKey: ['schools', 'browse', params],
    queryFn: () => schoolService.browse(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateSchool(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: CreateSchool) => schoolService.create(data),
    onSuccess: () => onSuccess?.(),
  });
}
