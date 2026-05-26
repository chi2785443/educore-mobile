import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionBankService } from '@/services/question-bank.service';
import {
  CreateObjectivePayload, CreateTheoryPayload, QuestionFilters,
} from '@/interface/question.interface';

export const useQuestions = (schoolId: string | undefined, filters?: QuestionFilters) =>
  useQuery({
    queryKey: ['questions', schoolId, filters],
    queryFn: () => questionBankService.getQuestions(schoolId!, filters),
    enabled: !!schoolId,
    staleTime: 60_000,
  });

export const useCreateObjective = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateObjectivePayload) =>
      questionBankService.createObjective(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', schoolId] });
    },
  });
};

export const useCreateTheory = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTheoryPayload) =>
      questionBankService.createTheory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', schoolId] });
    },
  });
};

export const useDeleteQuestion = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => questionBankService.deleteQuestion(questionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', schoolId] });
    },
  });
};
