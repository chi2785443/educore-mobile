import { useMutation, useQuery } from '@tanstack/react-query';
import { enrollmentService } from '@/services/enrollment.service';
import { CreateEnrollment } from '@/interface/enrollment.interface';

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentService.getMy(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEnrollment(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: CreateEnrollment) => enrollmentService.create(data),
    onSuccess: () => onSuccess?.(),
  });
}
