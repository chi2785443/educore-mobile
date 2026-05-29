import { apiClient } from './axios.service';
import { StudentScore, ClassStats } from '@/interface/attempt.interface';

export const studentScoreService = {
  getScoresForAssessment: async (assessmentId: string): Promise<StudentScore[]> => {
    const res = await apiClient.get(`/student-scores/assessment/${assessmentId}`);
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },

  getAssessmentStats: async (assessmentId: string): Promise<ClassStats> => {
    const res = await apiClient.get(
      `/student-scores/assessment/${assessmentId}/stats`,
    );
    return (res.data?.data ?? res.data) as ClassStats;
  },

  getMyScores: async (): Promise<StudentScore[]> => {
    const res = await apiClient.get('/student-scores/my-scores');
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },

  getMyScoreForAssessment: async (assessmentId: string): Promise<StudentScore | null> => {
    try {
      // Mirror web: use the bulk my-scores endpoint (returns all scores including
      // unreleased ones) then filter client-side by assessmentId.
      // The per-assessment endpoint may return 404 for unreleased scores.
      const res = await apiClient.get('/student-scores/my-scores');
      const d = res.data?.data ?? res.data;
      const scores: StudentScore[] = Array.isArray(d) ? d : [];
      return scores.find(s => s.assessmentId === assessmentId) ?? null;
    } catch {
      return null;
    }
  },
};
