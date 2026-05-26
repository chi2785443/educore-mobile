export interface Notification {
  id: string;
  userId: string;
  schoolId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
