import { apiClient } from './axios.service';
import { CalendarEvent, CreateCalendarEventPayload } from '@/interface/calendar.interface';

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

export const calendarService = {
  createCalendarEvent: async (
    schoolId: string,
    payload: CreateCalendarEventPayload,
  ): Promise<CalendarEvent> => {
    const res = await apiClient.post(`/schools/${schoolId}/calendar`, payload);
    return ex<CalendarEvent>(res.data);
  },

  getUpcomingEvents: async (schoolId: string, limit = 5): Promise<CalendarEvent[]> => {
    const res = await apiClient.get(`/schools/${schoolId}/calendar/upcoming`, {
      params: { limit },
    });
    return exList<CalendarEvent>(res.data);
  },
};
