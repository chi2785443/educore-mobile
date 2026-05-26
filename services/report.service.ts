import { apiClient } from './axios.service';
import { StudentReport, CreateReportPayload, RejectReportPayload } from '@/interface/report.interface';

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

export const reportService = {
  createReport: async (
    schoolId: string,
    classroomId: string,
    payload: CreateReportPayload,
  ): Promise<StudentReport> => {
    const res = await apiClient.post(
      `/reports/schools/${schoolId}/classrooms/${classroomId}`,
      payload,
    );
    return ex<StudentReport>(res.data);
  },

  submitReport: async (schoolId: string, reportId: string): Promise<StudentReport> => {
    const res = await apiClient.patch(`/reports/${reportId}/schools/${schoolId}/submit`);
    return ex<StudentReport>(res.data);
  },

  getSchoolReports: async (
    schoolId: string,
    params?: { status?: string; classroomId?: string },
  ): Promise<StudentReport[]> => {
    const res = await apiClient.get(`/reports/schools/${schoolId}`, { params });
    return exList<StudentReport>(res.data);
  },

  approveReport: async (schoolId: string, reportId: string): Promise<StudentReport> => {
    const res = await apiClient.patch(`/reports/${reportId}/schools/${schoolId}/approve`);
    return ex<StudentReport>(res.data);
  },

  rejectReport: async (
    schoolId: string,
    reportId: string,
    payload: RejectReportPayload,
  ): Promise<StudentReport> => {
    const res = await apiClient.patch(
      `/reports/${reportId}/schools/${schoolId}/reject`,
      payload,
    );
    return ex<StudentReport>(res.data);
  },
};
