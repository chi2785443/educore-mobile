import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/axios.service';
import { classroomService } from '@/services/classroom.service';
import { CreateClassroomPayload } from '@/interface/classroom.interface';

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

export const useCreateClassroom = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassroomPayload) => classroomService.createClassroom(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classrooms', 'school', schoolId] }),
  });
};

export const useAddTeacher = (classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => classroomService.addTeacher(classroomId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classroom', classroomId, 'teachers'] }),
  });
};

export const useRemoveTeacher = (classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teacherId: string) => classroomService.removeTeacher(classroomId, teacherId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classroom', classroomId, 'teachers'] }),
  });
};

export const useAddStudent = (classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => classroomService.addStudent(classroomId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom', classroomId, 'students'] });
      qc.invalidateQueries({ queryKey: ['classroom', classroomId] });
    },
  });
};

export const useRemoveStudent = (classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => classroomService.removeStudent(classroomId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classroom', classroomId, 'students'] });
      qc.invalidateQueries({ queryKey: ['classroom', classroomId] });
    },
  });
};
