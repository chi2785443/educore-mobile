import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export function useSchoolStudents(schoolId: string) {
  return useQuery({
    queryKey: ['school', schoolId, 'students'],
    queryFn: () => dashboardService.getStudents(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchoolStaff(schoolId: string) {
  return useQuery({
    queryKey: ['school', schoolId, 'staff'],
    queryFn: () => dashboardService.getStaff(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchoolAnnouncements(schoolId: string) {
  return useQuery({
    queryKey: ['announcements', schoolId],
    queryFn: () => dashboardService.getAnnouncements(schoolId),
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpcomingEvents(schoolId: string) {
  return useQuery({
    queryKey: ['events', schoolId, 'upcoming'],
    queryFn: () => dashboardService.getUpcomingEvents(schoolId, 5),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}
