import { apiClient } from './axios.service';
import { Notification, UnreadCountResponse } from '@/interface/notification.interface';

export const getNotifications = async (unreadOnly?: boolean): Promise<Notification[]> => {
  const params = unreadOnly ? { unreadOnly: 'true' } : {};
  const res = await apiClient.get('/notifications', { params });
  return res.data?.data ?? res.data ?? [];
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await apiClient.get('/notifications/unread-count');
  const data: UnreadCountResponse = res.data?.data ?? res.data;
  return data?.count ?? 0;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.patch('/notifications/mark-all-read');
};

export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/notifications/${id}`);
};
