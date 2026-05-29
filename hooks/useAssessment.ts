import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentService } from '@/services/assessment.service';
import { AssessmentQuestion, CreateAssessmentPayload, UpdateAssessmentPayload } from '@/interface/assessment.interface';

export const useGradeConfigs = (schoolId: string | undefined) =>
  useQuery<{ id: string; enabledAssessmentTypes: string[] }[]>({
    queryKey: ['grade-configs', schoolId],
    queryFn: async () => {
      const { apiClient } = await import('@/services/axios.service');
      const res = await apiClient.get('/grade-configurations', { params: { schoolId } });
      const d = res.data?.data ?? res.data;
      return Array.isArray(d) ? d : [];
    },
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });

const STALE = 60_000;

export const useClassroomAssessments = (
  classroomId: string | undefined,
  schoolId?: string,
) =>
  useQuery({
    queryKey: ['assessments', 'classroom', classroomId],
    queryFn: () =>
      assessmentService.getAssessments({
        classroomId: classroomId!,
        ...(schoolId ? { schoolId } : {}),
      }),
    enabled: !!classroomId,
    staleTime: STALE,
  });

export const useMyAssessments = (enabled = true) =>
  useQuery({
    queryKey: ['assessments', 'teacher', 'mine'],
    queryFn: () => assessmentService.getMyAssessments(),
    enabled,
    staleTime: STALE,
  });

export const useSchoolAssessments = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['assessments', 'school', schoolId],
    queryFn: () => assessmentService.getAssessments({ schoolId: schoolId! }),
    enabled: !!schoolId,
    staleTime: STALE,
  });

export const useCreateAssessmentGlobal = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssessmentPayload) =>
      assessmentService.createAssessment(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assessments', 'school', schoolId] });
      qc.invalidateQueries({ queryKey: ['assessments', 'classroom', vars.classroomId] });
      qc.invalidateQueries({ queryKey: ['assessments', 'teacher', 'mine'] });
    },
  });
};

export const useAssessment = (assessmentId: string | undefined) =>
  useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentService.getAssessment(assessmentId!),
    enabled: !!assessmentId,
    staleTime: STALE,
  });

export const useAssessmentQuestions = (assessmentId: string | undefined, enabled = true) =>
  useQuery<AssessmentQuestion[]>({
    queryKey: ['assessment-questions', assessmentId],
    queryFn: () => assessmentService.getAssessmentQuestions(assessmentId!),
    enabled: !!assessmentId && enabled,
    staleTime: 5 * 60_000,
  });

export const useSubjects = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['subjects', schoolId],
    queryFn: () => assessmentService.getSubjects(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });

export const useCreateAssessment = (classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssessmentPayload) =>
      assessmentService.createAssessment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessments', 'classroom', classroomId] });
      qc.invalidateQueries({ queryKey: ['assessments', 'teacher', 'mine'] });
    },
  });
};

export const useUpdateAssessment = (assessmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAssessmentPayload) =>
      assessmentService.updateAssessment(assessmentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
  });
};

export const usePublishAssessment = (assessmentId: string, classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => assessmentService.publishAssessment(assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessment', assessmentId] });
      qc.invalidateQueries({ queryKey: ['assessments', 'classroom', classroomId] });
      qc.invalidateQueries({ queryKey: ['assessments', 'teacher', 'mine'] });
    },
  });
};

export const useAddAssessmentQuestions = (assessmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questions: { questionId: string; questionOrder: number; marks: number }[]) =>
      assessmentService.addAssessmentQuestions({ assessmentId, questions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessment-questions', assessmentId] });
      qc.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
  });
};

export const useRemoveAssessmentQuestion = (assessmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      assessmentService.removeAssessmentQuestion(assessmentId, questionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessment-questions', assessmentId] });
      qc.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
  });
};

export const useDeleteAssessment = (classroomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) =>
      assessmentService.deleteAssessment(assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessments', 'classroom', classroomId] });
      qc.invalidateQueries({ queryKey: ['assessments', 'teacher', 'mine'] });
    },
  });
};
