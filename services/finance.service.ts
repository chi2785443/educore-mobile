import { apiClient } from './axios.service';
import { SalaryStructure, StudentFee } from '@/interface/finance.interface';

const ex = <T>(d: unknown): T => {
  if (d && typeof d === 'object' && 'data' in d) return (d as { data: T }).data;
  return d as T;
};
const exList = <T>(d: unknown): T[] => {
  const inner = ex<T[] | { data: T[] }>(d);
  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === 'object' && 'data' in inner) return (inner as { data: T[] }).data;
  return [];
};

export const financeService = {
  getSalaryStructureByEmployee: async (employeeId: string): Promise<SalaryStructure | null> => {
    try {
      const res = await apiClient.get(`/payroll/salary-structures/employee/${employeeId}`);
      return ex<SalaryStructure>(res.data);
    } catch {
      return null;
    }
  },

  getMyStudentFees: async (userId: string, params?: { academicYear?: string; term?: string }): Promise<StudentFee[]> => {
    const res = await apiClient.get(`/finance/student-fees/student/${userId}`, { params });
    return exList<StudentFee>(res.data);
  },
};
