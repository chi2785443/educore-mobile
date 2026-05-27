import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollmentService } from '@/services/enrollment.service';
import { CreateEnrollment, EnrollmentStatus, UpdateEnrollmentStatus } from '@/interface/enrollment.interface';

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentService.getMy(),
    staleTime: 60 * 1000,
  });
}

export function useCreateEnrollment(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEnrollment) => enrollmentService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments', 'my'] });
      onSuccess?.();
    },
  });
}

export function useSchoolEnrollments(schoolId: string, status?: EnrollmentStatus) {
  return useQuery({
    queryKey: ['enrollments', 'school', schoolId, status ?? 'all'],
    queryFn: () => enrollmentService.getBySchool(schoolId, status),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  });
}

export function useUpdateEnrollmentStatus(schoolId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEnrollmentStatus }) =>
      enrollmentService.updateStatus(schoolId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments', 'school', schoolId] });
      onSuccess?.();
    },
  });
}
