import { useQuery } from '@tanstack/react-query';
import { studentScoreService } from '@/services/student-score.service';

const STALE = 60_000;

export const useScoresForAssessment = (assessmentId: string | undefined) =>
  useQuery({
    queryKey: ['scores', 'assessment', assessmentId],
    queryFn: () => studentScoreService.getScoresForAssessment(assessmentId!),
    enabled: !!assessmentId,
    staleTime: STALE,
  });

export const useAssessmentStats = (assessmentId: string | undefined) =>
  useQuery({
    queryKey: ['scores', 'assessment', assessmentId, 'stats'],
    queryFn: () => studentScoreService.getAssessmentStats(assessmentId!),
    enabled: !!assessmentId,
    staleTime: STALE,
  });

export const useMyScores = (enabled = true) =>
  useQuery({
    queryKey: ['scores', 'mine'],
    queryFn: () => studentScoreService.getMyScores(),
    enabled,
    staleTime: STALE,
  });

export const useMyScoreForAssessment = (assessmentId: string | undefined) =>
  useQuery({
    queryKey: ['scores', 'mine', assessmentId],
    queryFn: () => studentScoreService.getMyScoreForAssessment(assessmentId!),
    enabled: !!assessmentId,
    staleTime: STALE,
  });
