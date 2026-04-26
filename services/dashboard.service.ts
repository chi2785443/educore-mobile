import { apiClient } from './axios.service';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  eventType: string;
  location?: string;
  color?: string;
}

export const dashboardService = {
  getStudents: async (schoolId: string): Promise<unknown[]> => {
    const res = await apiClient.get(`/schools/${schoolId}/students`);
    return res.data?.data ?? res.data ?? [];
  },

  getStaff: async (schoolId: string): Promise<unknown[]> => {
    const res = await apiClient.get(`/schools/${schoolId}/staff`);
    return res.data?.data ?? res.data ?? [];
  },

  getAnnouncements: async (schoolId: string): Promise<Announcement[]> => {
    const res = await apiClient.get(`/announcements/school/${schoolId}`);
    return res.data?.data ?? res.data ?? [];
  },

  getUpcomingEvents: async (schoolId: string, limit = 5): Promise<CalendarEvent[]> => {
    const res = await apiClient.get(`/schools/${schoolId}/calendar/upcoming`, {
      params: { limit },
    });
    return res.data?.data ?? res.data ?? [];
  },
};
