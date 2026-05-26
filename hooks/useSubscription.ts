import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';

export const useSubscriptionSummary = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['subscription-summary', schoolId],
    queryFn: () => subscriptionService.getSubscriptionSummary(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });
