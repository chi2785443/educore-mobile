import { useMutation, useQuery } from '@tanstack/react-query';
import { schoolService } from '@/services/school.service';
import { CreateSchool, SchoolSettings } from '@/interface/school.interface';

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

export function useSchoolMembers(schoolId: string | undefined) {
  return useQuery({
    queryKey: ['school-members', schoolId],
    queryFn: () => schoolService.getMembers(schoolId!),
    enabled: !!schoolId,
    staleTime: 3 * 60_000,
  });
}

export function useSchoolSettings(schoolId: string | undefined) {
  return useQuery<SchoolSettings | null>({
    queryKey: ['school-settings', schoolId],
    queryFn: () => schoolService.getSettings(schoolId!),
    enabled: !!schoolId,
    staleTime: 10 * 60_000,
  });
}
