import { apiClient } from './axios.service';
import { WeeklyTimetable, TimetableEntry, DayOfWeek } from '@/interface/timetable.interface';

export interface CreateTimetablePayload {
  classroomId: string;
  subjectId: string;
  teacherId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  periodNumber?: number;
  roomNumber?: string;
}

export const timetableService = {
  getClassroomTimetable: async (classroomId: string): Promise<WeeklyTimetable> => {
    const res = await apiClient.get(`/timetables/classroom/${classroomId}`);
    const raw = res.data?.data ?? res.data ?? {};
    // Backend returns { schedule: [{ day, periods }], title, academicYear }
    // Backend DayOfWeek values are lowercase ('monday'); component keys are uppercase ('MONDAY')
    if (Array.isArray(raw.schedule)) {
      const weekly: WeeklyTimetable = {};
      for (const { day, periods } of raw.schedule as { day: string; periods: TimetableEntry[] }[]) {
        const key = day.toUpperCase() as DayOfWeek;
        weekly[key] = Array.isArray(periods) ? periods : [];
      }
      return weekly;
    }
    return raw as WeeklyTimetable;
  },

  createEntry: async (payload: CreateTimetablePayload): Promise<TimetableEntry> => {
    const res = await apiClient.post('/timetables', payload);
    return (res.data?.data ?? res.data) as TimetableEntry;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/timetables/${id}`);
  },

  getTeacherTimetable: async (
    teacherId: string,
    dayOfWeek?: DayOfWeek,
  ): Promise<TimetableEntry[]> => {
    const res = await apiClient.get(`/timetables/teacher/${teacherId}`, {
      params: dayOfWeek ? { dayOfWeek } : undefined,
    });
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },
};
