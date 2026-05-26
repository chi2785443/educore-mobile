import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollmentService } from '@/services/enrollment.service';
import { CreateEnrollment } from '@/interface/enrollment.interface';

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
