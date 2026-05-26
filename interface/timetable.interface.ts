export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY';

export interface TimetableEntry {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  periodNumber?: number;
  roomNumber?: string;
  subject?: { name: string; color: string };
  teacher?: { firstName: string; lastName: string };
}

export type WeeklyTimetable = Partial<Record<DayOfWeek, TimetableEntry[]>>;
