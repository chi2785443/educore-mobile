import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService } from '@/services/calendar.service';
import { CreateCalendarEventPayload } from '@/interface/calendar.interface';

export const useUpcomingEvents = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['calendar-upcoming', schoolId],
    queryFn: () => calendarService.getUpcomingEvents(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });

export const useCreateCalendarEvent = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalendarEventPayload) =>
      calendarService.createCalendarEvent(schoolId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar-upcoming', schoolId] });
    },
  });
};
