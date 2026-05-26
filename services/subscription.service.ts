import { apiClient } from './axios.service';
import { SubscriptionSummary } from '@/interface/subscription.interface';

const ex = <T>(d: unknown): T => {
  if (d && typeof d === 'object' && 'data' in d) return (d as { data: T }).data;
  return d as T;
};

export const subscriptionService = {
  getSubscriptionSummary: async (schoolId: string): Promise<SubscriptionSummary> => {
    const res = await apiClient.get(`/subscriptions/schools/${schoolId}/summary`);
    return ex<SubscriptionSummary>(res.data);
  },
};
