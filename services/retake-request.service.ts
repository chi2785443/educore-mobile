import { apiClient } from './axios.service';
import {
  RetakeRequest,
  CreateRetakePayload,
  RespondRetakePayload,
} from '@/interface/attempt.interface';

export const retakeRequestService = {
  createRetakeRequest: async (payload: CreateRetakePayload): Promise<RetakeRequest> => {
    const res = await apiClient.post('/retake-requests', payload);
    return (res.data?.data ?? res.data) as RetakeRequest;
  },

  getRetakesForAssessment: async (assessmentId: string): Promise<RetakeRequest[]> => {
    const res = await apiClient.get(
      `/retake-requests/assessment/${assessmentId}`,
    );
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },

  getMyRetakeRequests: async (): Promise<RetakeRequest[]> => {
    const res = await apiClient.get('/retake-requests/my');
    const d = res.data?.data ?? res.data;
    return Array.isArray(d) ? d : [];
  },

  respondToRetake: async (
    id: string,
    payload: RespondRetakePayload,
  ): Promise<RetakeRequest> => {
    const res = await apiClient.patch(`/retake-requests/${id}/respond`, payload);
    return (res.data?.data ?? res.data) as RetakeRequest;
  },
};
