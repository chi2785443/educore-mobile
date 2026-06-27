import { useQuery } from '@tanstack/react-query';
import {
  getAdminDashboard,
  getStaffDashboard,
  getStudentDashboard,
  getParentDashboard,
} from '@/services/dashboard-role.service';

const STALE = 60_000;

export const useAdminDashboard = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['dashboard', 'admin', schoolId],
    queryFn: () => getAdminDashboard(schoolId!),
    enabled: !!schoolId,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });

export const useStaffDashboard = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['dashboard', 'staff', schoolId],
    queryFn: () => getStaffDashboard(schoolId!),
    enabled: !!schoolId,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });

export const useStudentDashboard = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['dashboard', 'student', schoolId],
    queryFn: () => getStudentDashboard(schoolId!),
    enabled: !!schoolId,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });

export const useParentDashboard = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['dashboard', 'parent', schoolId],
    queryFn: () => getParentDashboard(schoolId!),
    enabled: !!schoolId,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });
