import { apiClient } from './axios.service';
import {
  TodayStatus, AttendanceRecord, AttendanceListResponse,
  AttendanceSettings, ClockPayload, DailyAttendanceResponse,
} from '@/interface/attendance.interface';

const ex = <T>(d: unknown): T => {
  if (d && typeof d === 'object' && 'data' in d) return (d as { data: T }).data;
  return d as T;
};

export const attendanceService = {
  getTodayStatus: async (schoolId: string): Promise<TodayStatus> => {
    const res = await apiClient.get(`/attendance/schools/${schoolId}/my/today`);
    return ex<TodayStatus>(res.data);
  },

  getMyAttendance: async (
    schoolId: string,
    params?: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string },
  ): Promise<AttendanceListResponse> => {
    const res = await apiClient.get(`/attendance/schools/${schoolId}/my`, {
      params: { page: 1, limit: 30, ...params },
    });
    const d = ex<AttendanceListResponse | AttendanceRecord[]>(res.data);
    if (Array.isArray(d)) return { records: d, total: d.length };
    return d as AttendanceListResponse;
  },

  getAttendanceSettings: async (schoolId: string): Promise<AttendanceSettings | null> => {
    try {
      const res = await apiClient.get(`/attendance/schools/${schoolId}/settings`);
      return ex<AttendanceSettings>(res.data);
    } catch {
      return null;
    }
  },

  clockAttendance: async (schoolId: string, payload: ClockPayload): Promise<AttendanceRecord> => {
    const res = await apiClient.post(`/attendance/schools/${schoolId}/clock`, payload);
    return ex<AttendanceRecord>(res.data);
  },

  getMyDailyAttendance: async (
    schoolId: string,
    month?: number,
    year?: number,
  ): Promise<DailyAttendanceResponse> => {
    const res = await apiClient.get(`/attendance/schools/${schoolId}/my/daily`, {
      params: { month, year },
    });
    return ex<DailyAttendanceResponse>(res.data);
  },
};
