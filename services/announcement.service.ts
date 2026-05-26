import { apiClient } from './axios.service';
import { Announcement, CreateAnnouncementPayload } from '@/interface/announcement.interface';

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

export const announcementService = {
  createAnnouncement: async (payload: CreateAnnouncementPayload): Promise<Announcement> => {
    const res = await apiClient.post('/announcements', payload);
    return ex<Announcement>(res.data);
  },

  getSchoolAnnouncements: async (schoolId: string): Promise<Announcement[]> => {
    const res = await apiClient.get(`/announcements/school/${schoolId}`);
    return exList<Announcement>(res.data);
  },
};
