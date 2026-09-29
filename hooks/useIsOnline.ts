import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

/** Device connectivity, as React Query sees it (wired to NetInfo in lib/queryClient). */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}
