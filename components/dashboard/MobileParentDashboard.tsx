import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useParentDashboard } from '@/hooks/useDashboardRole';
import {
  DashLoader, GradCard, Card,
  AnnouncementRow, EventRow, SectionLabel,
} from './DashboardPrimitives';

interface Props { schoolId: string; schoolName: string; firstName: string }

const statusStyle = (s: string) => {
  if (s === 'replied') return { bg: '#ecfdf5', fg: '#065f46', icon: 'checkmark-circle' as const };
  if (s === 'closed') return { bg: '#f9fafb', fg: '#6b7280', icon: 'lock-closed' as const };
  return { bg: '#fffbeb', fg: '#92400e', icon: 'time' as const };
};

export default function MobileParentDashboard({ schoolId, schoolName, firstName }: Props) {
  const { data, isLoading, refetch } = useParentDashboard(schoolId);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !data) return <DashLoader color="#F5486A" message="Loading your portal..." />;
  const d = data;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5486A" colors={['#F5486A']} />}
    >

      {/* ── Hero ─────────────────────────────────────────── */}
      <View style={{
        marginHorizontal: 16, marginTop: 8, borderRadius: 20,
        backgroundColor: '#F5486A', padding: 20, overflow: 'hidden',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <View style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
          {schoolName} · Parent
        </Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
          Hello, {firstName}!
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
          {"Stay connected with your child's school."}
        </Text>

        {/* Quick resource chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {['Announcements', 'Library', 'Documents'].map(label => (
            <View key={label} style={{
              backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20,
              paddingHorizontal: 12, paddingVertical: 6,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>

        {/* ── Enquiry stats ─────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GradCard label="Total Enquiries" value={d.enquiries.total} icon="help-circle" colors={['#F5486A', '#E03058']} />
          <GradCard label="Awaiting Reply" value={d.enquiries.open} icon="time" colors={['#d97706', '#b45309']} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GradCard label="Replied" value={d.enquiries.replied} icon="checkmark-circle" colors={['#059669', '#047857']} />
          <GradCard label="Closed" value={d.enquiries.closed} icon="lock-closed" colors={['#6b7280', '#4b5563']} />
        </View>

        {/* ── Linked children ───────────────────────────────── */}
        {d.linkedStudents.length > 0 && (
          <>
            <SectionLabel>My Children</SectionLabel>
            <Card>
              {d.linkedStudents.map((s, i) => (
                <View key={s.userId} className={`flex-row items-center gap-3 py-2.5 ${i < d.linkedStudents.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#4C3FC4', fontWeight: '900', fontSize: 16 }}>
                      {s.firstName?.[0]}{s.lastName?.[0]}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-800">{s.firstName} {s.lastName}</Text>
                    <Text className="text-xs text-gray-400">Student</Text>
                  </View>
                  <View style={{ backgroundColor: '#F0EEFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: '#4C3FC4', fontSize: 10, fontWeight: '700' }}>Linked</Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* ── Recent enquiries ──────────────────────────────── */}
        <SectionLabel>My Enquiries</SectionLabel>
        <Card>
          {d.recentEnquiries.length === 0 ? (
            <View className="items-center py-8 gap-3">
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#F5486A" />
              </View>
              <Text className="text-xs text-gray-400">No enquiries submitted yet</Text>
            </View>
          ) : d.recentEnquiries.map((e, i) => {
            const { bg, fg, icon } = statusStyle(e.status);
            return (
              <View key={e.id} className={`flex-row items-center gap-3 py-2.5 ${i < d.recentEnquiries.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chatbubble-outline" size={14} color="#F5486A" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>{e.subject}</Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">
                    {e.repliedAt
                      ? `Replied ${formatDistanceToNow(new Date(e.repliedAt), { addSuffix: true })}`
                      : formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: bg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 }}>
                  <Ionicons name={icon} size={10} color={fg} />
                  <Text style={{ fontSize: 9, fontWeight: '700', color: fg, textTransform: 'capitalize' }}>{e.status}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* ── Announcements ────────────────────────────────── */}
        <SectionLabel>School Announcements</SectionLabel>
        <Card>
          {d.recentAnnouncements.length === 0
            ? <Text className="text-xs text-gray-400 text-center py-4">No announcements yet</Text>
            : d.recentAnnouncements.map((a, i) => (
              <AnnouncementRow key={a.id} title={a.title}
                timeAgo={formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                isLast={i === d.recentAnnouncements.length - 1}
              />
            ))}
        </Card>

        {/* ── Events ───────────────────────────────────────── */}
        <SectionLabel>Upcoming Events</SectionLabel>
        <Card>
          {d.upcomingEvents.length === 0
            ? <Text className="text-xs text-gray-400 text-center py-4">No upcoming events</Text>
            : d.upcomingEvents.map((e, i) => (
              <EventRow key={e.id} title={e.title} date={e.startDate}
                type={e.eventType} color={e.color} isLast={i === d.upcomingEvents.length - 1}
              />
            ))}
        </Card>

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}
