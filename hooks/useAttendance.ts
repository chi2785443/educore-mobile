import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance.service';
import { ClockPayload } from '@/interface/attendance.interface';

export const useTodayAttendance = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['attendance-today', schoolId],
    queryFn: () => attendanceService.getTodayStatus(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

export const useMyAttendance = (
  schoolId: string | undefined,
  params?: { page?: number; limit?: number; type?: string },
) =>
  useQuery({
    queryKey: ['attendance-my', schoolId, params],
    queryFn: () => attendanceService.getMyAttendance(schoolId!, params),
    enabled: !!schoolId,
    staleTime: 60_000,
  });

export const useAttendanceSettings = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['attendance-settings', schoolId],
    queryFn: () => attendanceService.getAttendanceSettings(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });

export const useClockAttendance = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClockPayload) =>
      attendanceService.clockAttendance(schoolId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-today', schoolId] });
      qc.invalidateQueries({ queryKey: ['attendance-my', schoolId] });
    },
  });
};
