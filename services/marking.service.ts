import { apiClient } from './axios.service';

export interface MarkTheoryAnswerPayload {
  answerSubmissionId: string;
  marksAwarded: number;
  feedback?: string;
}

export interface SubmitMarkingPayload {
  attemptId: string;
  overallRemarks?: string;
}

export interface PendingAttempt {
  attemptId: string;
  studentId: string;
  studentName: string;
  attemptNumber: number;
  submittedAt: string;
  pendingCount: number;
  totalTheory: number;
  isFullyMarked: boolean;
  recordingUrl?: string | null;
}

export interface TheoryAnswer {
  id: string;
  answer: string;
  marksAwarded?: number | null;
  feedback?: string | null;
  markingStatus: 'pending' | 'marked';
  assessmentQuestion?: {
    id: string;
    marks: number;
    question?: {
      id: string;
      questionText: string;
    };
  };
}

export interface AttemptMarkingDetails {
  attempt: {
    id: string;
    studentId: string;
    recordingUrl?: string | null;
  };
  answers: TheoryAnswer[];
  statistics: {
    totalTheory: number;
    pendingMarking: number;
    markedCount: number;
    isFullyMarked: boolean;
    objectiveQuestions: number;
  };
}

export const markingService = {
  getPendingByAssessment: async (assessmentId: string): Promise<PendingAttempt[]> => {
    const res = await apiClient.get(`/marking/pending/assessment/${assessmentId}`);
    const d = res.data?.data ?? res.data;
    if (!Array.isArray(d)) return [];
    return d.map((item: {
      attempt: {
        id: string;
        studentId: string;
        attemptNumber: number;
        submittedAt: string;
        student?: { firstName?: string; lastName?: string };
        recordingUrl?: string | null;
      };
      totalTheoryQuestions: number;
      pendingQuestions: number;
    }): PendingAttempt => ({
      attemptId: item.attempt.id,
      studentId: item.attempt.studentId,
      studentName: item.attempt.student
        ? `${item.attempt.student.firstName ?? ''} ${item.attempt.student.lastName ?? ''}`.trim()
        : 'Unknown Student',
      attemptNumber: item.attempt.attemptNumber,
      submittedAt: item.attempt.submittedAt,
      pendingCount: item.pendingQuestions,
      totalTheory: item.totalTheoryQuestions,
      isFullyMarked: item.pendingQuestions === 0,
      recordingUrl: item.attempt.recordingUrl,
    }));
  },

  getAttemptMarkingDetails: async (attemptId: string): Promise<AttemptMarkingDetails> => {
    const res = await apiClient.get(`/marking/attempt/${attemptId}`);
    return (res.data?.data ?? res.data) as AttemptMarkingDetails;
  },

  markTheoryAnswer: async (payload: MarkTheoryAnswerPayload): Promise<void> => {
    await apiClient.post('/marking/mark-answer', payload);
  },

  submitMarking: async (payload: SubmitMarkingPayload): Promise<void> => {
    await apiClient.post('/marking/submit-marking', payload);
  },
};
