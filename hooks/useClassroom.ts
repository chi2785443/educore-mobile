import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/axios.service';
import { classroomService } from '@/services/classroom.service';

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

export const useClassroomDetail = (classroomId: string | undefined) =>
  useQuery({
    queryKey: ['classroom', classroomId],
    queryFn: () => classroomService.getClassroomDetail(classroomId!),
    enabled: !!classroomId,
    staleTime: STALE,
  });

export const useClassroomStudents = (classroomId: string | undefined) =>
  useQuery({
    queryKey: ['classroom', classroomId, 'students'],
    queryFn: () => classroomService.getClassroomStudents(classroomId!),
    enabled: !!classroomId,
    staleTime: STALE,
  });

export const useClassroomTeachers = (classroomId: string | undefined) =>
  useQuery({
    queryKey: ['classroom', classroomId, 'teachers'],
    queryFn: () => classroomService.getClassroomTeachers(classroomId!),
    enabled: !!classroomId,
    staleTime: STALE,
  });
