export type AnnouncementType =
  | 'school_wide' | 'class' | 'department' | 'teachers'
  | 'parents' | 'students' | 'urgent' | 'general' | 'result' | 'assessment';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface CreateAnnouncementPayload {
  schoolId: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority?: Priority;
  classroomId?: string;
  isPinned?: boolean;
  targetRoles?: string[];
}

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: Priority;
  isPinned: boolean;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
