import * as FileSystem from 'expo-file-system/legacy';
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

  /**
   * Upload a proctoring recording straight to R2 via a presigned PUT.
   *
   * Replaces posting the file through the API, which capped recordings at
   * nginx's 50M client_max_body_size - about 3 minutes of 480p - so longer
   * assessments could never upload.
   */
  uploadRecordingDirect: async (
    attemptId: string,
    videoUri: string,
  ): Promise<void> => {
    const ext = videoUri.split('.').pop()?.toLowerCase() ?? 'mp4';
    const mimeType =
      ext === 'mov' ? 'video/quicktime' : ext === 'webm' ? 'video/webm' : 'video/mp4';

    const { data } = await apiClient.post<{ uploadUrl: string; key: string }>(
      `/student-attempts/${attemptId}/recording-url`,
      { extension: ext },
    );

    // FileSystem.uploadAsync streams from disk — reading a large video into
    // memory to build a Blob would risk an OOM on low-end devices.
    const result = await FileSystem.uploadAsync(data.uploadUrl, videoUri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Content-Type': mimeType },
    });

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Recording upload failed (HTTP ${result.status})`);
    }

    await apiClient.post(`/student-attempts/${attemptId}/recording-confirm`, {
      key: data.key,
    });
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
