import { useQuery } from '@tanstack/react-query';
import { getLatestAppRelease } from '@/services/app-release.service';

export function useAppUpdateCheck() {
  return useQuery({
    queryKey: ['app-release', 'latest', 'android'],
    queryFn: () => getLatestAppRelease('android'),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });
}
