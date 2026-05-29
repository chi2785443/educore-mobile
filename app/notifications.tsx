import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { Notification } from '@/interface/notification.interface';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';

const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  ASSESSMENT:     { icon: 'clipboard-outline',      color: '#4C3FC4', bg: '#F0EEFF' },
  GRADE:          { icon: 'trophy-outline',          color: '#059669', bg: '#d1fae5' },
  ANNOUNCEMENT:   { icon: 'megaphone-outline',       color: '#d97706', bg: '#fef3c7' },
  MESSAGE:        { icon: 'chatbubble-outline',      color: '#0891b2', bg: '#e0f2fe' },
  ATTENDANCE:     { icon: 'calendar-outline',        color: '#4C3FC4', bg: '#F0EEFF' },
  PAYMENT:        { icon: 'cash-outline',            color: '#16a34a', bg: '#dcfce7' },
  ENROLLMENT:     { icon: 'school-outline',          color: '#0284c7', bg: '#e0f2fe' },
  ENQUIRY:        { icon: 'help-circle-outline',     color: '#db2777', bg: '#fce7f3' },
  JOB_APPLICATION:{ icon: 'briefcase-outline',       color: '#ea580c', bg: '#ffedd5' },
  RESULT:         { icon: 'bar-chart-outline',       color: '#4C3FC4', bg: '#F0EEFF' },
  DOCUMENT:       { icon: 'document-text-outline',   color: '#64748b', bg: '#f1f5f9' },
  SYSTEM:         { icon: 'notifications-outline',   color: '#475569', bg: '#f8fafc' },
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH:   '#f97316',
  NORMAL: '#4C3FC4',
  LOW:    '#94a3b8',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function NotifRow({ notif, onRead, onDelete }: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TYPE_META[notif.type] ?? TYPE_META.SYSTEM;

  return (
    <Pressable
      onPress={() => { if (!notif.isRead) onRead(notif.id); }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: notif.isRead ? '#fff' : '#f5f7ff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
      }}>
        {/* Icon */}
        <View style={{
          width: 42, height: 42, borderRadius: 14,
          backgroundColor: meta.bg,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>

        {/* Content */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{
              fontSize: 14, fontWeight: notif.isRead ? '500' : '700',
              color: '#0f172a', flex: 1,
            }} numberOfLines={1}>
              {notif.title}
            </Text>
            {!notif.isRead && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4C3FC4', flexShrink: 0 }} />
            )}
          </View>
          <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 18 }} numberOfLines={2}>
            {notif.message}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(notif.createdAt)}</Text>
            {notif.priority !== 'NORMAL' && notif.priority !== 'LOW' && (
              <View style={{
                backgroundColor: PRIORITY_COLOR[notif.priority] + '18',
                borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
              }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: PRIORITY_COLOR[notif.priority] }}>
                  {notif.priority.charAt(0) + notif.priority.slice(1).toLowerCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Delete */}
        <Pressable
          onPress={() => onDelete(notif.id)}
          hitSlop={8}
          style={{ padding: 4, marginTop: 2 }}
        >
          <Ionicons name="close" size={16} color="#cbd5e1" />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  type NotifTab = 'all' | 'unread';
  const [notifTab, setNotifTab] = useState<NotifTab>('all');
  const { data: notifications = [], isLoading, refetch } = useNotifications(notifTab === 'unread');
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const deleteNotif = useDeleteNotification();
  const hasAutoMarkedRef = useRef(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Auto-mark all as read as soon as the screen loads and there are unread notifications
  useEffect(() => {
    if (!hasAutoMarkedRef.current && !isLoading && unreadCount > 0) {
      hasAutoMarkedRef.current = true;
      markAll.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, unreadCount]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
        gap: 12,
      }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', flex: 1 }}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <Pressable
            onPress={() => markAll.mutate()}
            style={{
              backgroundColor: '#eef2ff', borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 5,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4C3FC4' }}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      <ClassroomDetailTabs
        tabs={[
          { key: 'all',    label: 'All' },
          { key: 'unread', label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread' },
        ] as { key: NotifTab; label: string }[]}
        activeTab={notifTab}
        onTabChange={setNotifTab}
        accentColor="#4C3FC4"
      />

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#4C3FC4" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: '#f1f5f9',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="notifications-off-outline" size={32} color="#cbd5e1" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569', textAlign: 'center' }}>
            {notifTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 }}>
            You're all caught up! Notifications about assessments, announcements, and more will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NotifRow
              notif={item}
              onRead={(id) => markRead.mutate(id)}
              onDelete={(id) => deleteNotif.mutate(id)}
            />
          )}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
