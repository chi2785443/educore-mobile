import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableService, CreateTimetablePayload } from '@/services/timetable.service';
import { DayOfWeek } from '@/interface/timetable.interface';

const STALE = 5 * 60_000;

export const useClassroomTimetable = (classroomId: string | undefined) =>
  useQuery({
    queryKey: ['timetable', 'classroom', classroomId],
    queryFn: () => timetableService.getClassroomTimetable(classroomId!),
    enabled: !!classroomId,
    staleTime: STALE,
  });

export const useCreateTimetableEntry = (classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTimetablePayload) => timetableService.createEntry(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'classroom', classroomId] }),
  });
};

export const useDeleteTimetableEntry = (classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timetableService.deleteEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'classroom', classroomId] }),
  });
};

export const useTeacherTimetable = (
  teacherId: string | undefined,
  dayOfWeek?: DayOfWeek,
) =>
  useQuery({
    queryKey: ['timetable', 'teacher', teacherId, dayOfWeek],
    queryFn: () => timetableService.getTeacherTimetable(teacherId!, dayOfWeek),
    enabled: !!teacherId,
    staleTime: STALE,
  });
