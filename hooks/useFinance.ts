import { useQuery } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';

export const useSalaryStructure = (employeeId: string | undefined) =>
  useQuery({
    queryKey: ['salary-structure', employeeId],
    queryFn: () => financeService.getSalaryStructureByEmployee(employeeId!),
    enabled: !!employeeId,
    staleTime: 5 * 60_000,
  });

export const useMyStudentFees = (
  userId: string | undefined,
  params?: { academicYear?: string; term?: string },
) =>
  useQuery({
    queryKey: ['student-fees', userId, params],
    queryFn: () => financeService.getMyStudentFees(userId!, params),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
