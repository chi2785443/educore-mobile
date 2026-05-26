import { useQuery } from '@tanstack/react-query';
import { resultsService } from '@/services/results.service';

export const useMyResults = (enabled = true) =>
  useQuery({
    queryKey: ['my-results'],
    queryFn: () => resultsService.getMyResults(),
    enabled,
    staleTime: 5 * 60_000,
  });
