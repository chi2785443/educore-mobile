import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentService } from '@/services/assessment.service';
import { AssessmentQuestion, CreateAssessmentPayload, UpdateAssessmentPayload } from '@/interface/assessment.interface';

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
