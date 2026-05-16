import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/axios.service';

const STALE = 60_000;

export const useClassroomsBySchool = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['classrooms', 'school', schoolId],
    queryFn: () => apiClient.get(`/classrooms?schoolId=${schoolId}`).then(r => r.data),
    enabled: !!schoolId,
    staleTime: STALE,
  });

export const useMyTeacherClassrooms = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['classrooms', 'teacher', schoolId],
    queryFn: () => apiClient.get(`/classrooms/my-classrooms?schoolId=${schoolId}`).then(r => r.data),
    enabled: !!schoolId,
    staleTime: STALE,
  });

export const useMyStudentClassrooms = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['classrooms', 'student', schoolId],
    queryFn: () => apiClient.get(`/classrooms/my-student-classrooms?schoolId=${schoolId}`).then(r => r.data),
    enabled: !!schoolId,
    staleTime: STALE,
  });
