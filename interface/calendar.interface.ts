export type CalendarEventType =
  | 'academic' | 'holiday' | 'exam' | 'sports' | 'cultural' | 'meeting' | 'other';

export type EventVisibility = 'all' | 'staff_only' | 'classroom_specific';

export interface CreateCalendarEventPayload {
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  color?: string;
  location?: string;
  meetingLink?: string;
  visibility?: EventVisibility;
  isHoliday?: boolean;
  isPinned?: boolean;
}

export interface CalendarEvent {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  color?: string;
  location?: string;
  meetingLink?: string;
  visibility: EventVisibility;
  isHoliday: boolean;
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
