import { apiClient } from './axios.service';
import {
  AnswerSubmission,
  StudentAttempt,
  StartAttemptPayload,
  SubmitAnswerPayload,
  SubmitAttemptPayload,
} from '@/interface/attempt.interface';

export const studentAttemptService = {
  startAttempt: async (payload: StartAttemptPayload): Promise<StudentAttempt> => {
    const res = await apiClient.post('/student-attempts/start', payload);
    return (res.data?.data ?? res.data) as StudentAttempt;
  },

  submitAnswer: async (payload: SubmitAnswerPayload): Promise<void> => {
    await apiClient.post('/student-attempts/submit-answer', payload);
  },

  submitAttempt: async (payload: SubmitAttemptPayload): Promise<StudentAttempt> => {
    const res = await apiClient.post('/student-attempts/submit', payload);
    return (res.data?.data ?? res.data) as StudentAttempt;
  },

  getMyAttempts: async (): Promise<StudentAttempt[]> => {
    const res = await apiClient.get('/student-attempts/student/my-attempts');
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },

  getAttemptById: async (attemptId: string): Promise<StudentAttempt> => {
    const res = await apiClient.get(`/student-attempts/${attemptId}`);
    const d = res.data?.data ?? res.data;
    // Backend returns { attempt, answers, summary } from getAttemptWithAnswers
    if (d && typeof d === 'object' && 'attempt' in d && 'answers' in d) {
      type RawAnswer = {
        id: string;
        assessmentQuestionId: string;
        answer: string;
        markingStatus?: string;
        assessmentQuestion?: {
          id: string;
          marks: number;
          question?: {
            id: string;
            questionText: string;
            questionImage?: string | null;
            type: string;
            options?: string[] | null;
          };
        };
      };
      const raw = d as { attempt: StudentAttempt; answers: RawAnswer[] };
      return {
        ...raw.attempt,
        answerSubmissions: (raw.answers ?? []).map(a => ({
          id: a.id,
          assessmentQuestionId: a.assessmentQuestionId,
          answer: a.answer ?? '',
          markingStatus: a.markingStatus as AnswerSubmission['markingStatus'],
          question: a.assessmentQuestion?.question
            ? {
                id: a.assessmentQuestion.question.id,
                question: a.assessmentQuestion.question.questionText,
                questionImage: a.assessmentQuestion.question.questionImage ?? null,
                questionType: a.assessmentQuestion.question.type,
                options: a.assessmentQuestion.question.options ?? [],
                marks: a.assessmentQuestion.marks,
              }
            : undefined,
        })),
      };
    }
    return d as StudentAttempt;
  },

  uploadRecording: async (attemptId: string, videoUri: string): Promise<void> => {
    // iOS records as .mov (video/quicktime); Android records as .mp4 (video/mp4).
    // Use the real extension so R2 stores the correct ContentType and the player can decode it.
    const ext = videoUri.split('.').pop()?.toLowerCase() ?? 'mp4';
    const mimeType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';

    const formData = new FormData();
    formData.append('recording', {
      uri: videoUri,
      type: mimeType,
      name: `proctor_${attemptId}.${ext}`,
    } as unknown as Blob);
    // 'multipart/form-data' without boundary lets the native XHR layer attach the boundary.
    // timeout: 0 disables the 15 s default — videos can be large and slow to upload.
    await apiClient.post(`/student-attempts/${attemptId}/recording`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    });
  },

  getSignedViewUrl: async (fileUrl: string): Promise<string> => {
    const res = await apiClient.get('/files/view-url', { params: { fileUrl } });
    return res.data?.url ?? res.data;
  },

  getAttemptsForAssessment: async (assessmentId: string): Promise<StudentAttempt[]> => {
    const res = await apiClient.get(
      `/student-attempts/assessment/${assessmentId}/attempts`,
    );
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },
};
