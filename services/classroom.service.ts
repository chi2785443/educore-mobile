import { apiClient } from './axios.service';
import { ClassroomDetail, ClassroomMember, CreateClassroomPayload } from '@/interface/classroom.interface';

const ex = <T>(d: unknown): T => {
  if (d && typeof d === 'object' && 'data' in d) return (d as { data: T }).data;
  return d as T;
};

const exList = (d: unknown): unknown[] => {
  const inner = ex<unknown[] | { data: unknown[] }>(d);
  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === 'object' && 'data' in inner)
    return (inner as { data: unknown[] }).data;
  return [];
};

// The backend returns junction table records: { id, studentId, student: User }
// or { id, teacherId, teacher: User } — or sometimes flat User objects.
// This normalises all shapes to ClassroomMember.
function normaliseMember(item: unknown): ClassroomMember | null {
  if (!item || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;

  // Case 1: already flat (has firstName directly)
  if (typeof r.firstName === 'string') {
    return {
      id: String(r.id ?? r.userId ?? ''),
      firstName: r.firstName,
      lastName: String(r.lastName ?? ''),
      email: r.email as string | undefined,
      profilePicture: r.profilePicture as string | undefined,
      jobTitle: r.jobTitle as string | undefined,
      role: r.role as string | undefined,
    };
  }

  // Case 2: junction record with nested user/student/teacher
  const nested =
    (r.user ?? r.student ?? r.teacher ?? r.member) as Record<string, unknown> | undefined;

  if (nested && typeof nested === 'object' && typeof nested.firstName === 'string') {
    return {
      id: String(nested.id ?? r.userId ?? r.studentId ?? r.teacherId ?? r.id ?? ''),
      firstName: nested.firstName,
      lastName: String(nested.lastName ?? ''),
      email: nested.email as string | undefined,
      profilePicture: nested.profilePicture as string | undefined,
      jobTitle: nested.jobTitle as string | undefined,
      role: nested.role as string | undefined,
    };
  }

  return null;
}

export const classroomService = {
  getClassroomDetail: async (classroomId: string): Promise<ClassroomDetail> => {
    const res = await apiClient.get(`/classrooms/${classroomId}`);
    return (res.data?.data ?? res.data) as ClassroomDetail;
  },

  getClassroomStudents: async (classroomId: string): Promise<ClassroomMember[]> => {
    const res = await apiClient.get(`/classrooms/${classroomId}/students`);
    return exList(res.data).map(normaliseMember).filter((m): m is ClassroomMember => m !== null);
  },

  getClassroomTeachers: async (classroomId: string): Promise<ClassroomMember[]> => {
    const res = await apiClient.get(`/classrooms/${classroomId}/teachers`);
    return exList(res.data).map(normaliseMember).filter((m): m is ClassroomMember => m !== null);
  },

  createClassroom: async (payload: CreateClassroomPayload): Promise<ClassroomDetail> => {
    const res = await apiClient.post('/classrooms', payload);
    return (res.data?.data ?? res.data) as ClassroomDetail;
  },

  addTeacher: async (classroomId: string, userId: string): Promise<void> => {
    await apiClient.post(`/classrooms/${classroomId}/teachers`, { userId });
  },

  removeTeacher: async (classroomId: string, teacherId: string): Promise<void> => {
    await apiClient.delete(`/classrooms/${classroomId}/teachers/${teacherId}`);
  },

  addStudent: async (classroomId: string, userId: string): Promise<void> => {
    await apiClient.post(`/classrooms/${classroomId}/students`, { userId });
  },

  removeStudent: async (classroomId: string, studentId: string): Promise<void> => {
    await apiClient.delete(`/classrooms/${classroomId}/students/${studentId}`);
  },
};
