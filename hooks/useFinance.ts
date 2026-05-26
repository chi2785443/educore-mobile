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
  schoolId: string | undefined,
  params?: { academicYear?: string; term?: string },
) =>
  useQuery({
    queryKey: ['student-fees', schoolId, params],
    queryFn: () => financeService.getMyStudentFees(schoolId!, params),
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });
