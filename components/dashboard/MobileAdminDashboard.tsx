import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useAdminDashboard } from '@/hooks/useDashboardRole';
import {
  DashLoader, fmt, GradCard, Card, CardHeader,
  AnnouncementRow, EventRow, PendingBadge, SectionLabel,
} from './DashboardPrimitives';

interface Props { schoolId: string; schoolName: string; firstName: string }

export default function MobileAdminDashboard({ schoolId, schoolName, firstName }: Props) {
  const { data, isLoading } = useAdminDashboard(schoolId);

  if (isLoading || !data) return <DashLoader color="#6366f1" message="Loading school overview..." />;
  const d = data;
  const hasPending = Object.values(d.pendingActions).some(v => v > 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

      {/* ── Hero ─────────────────────────────────────────── */}
      <View style={{
        marginHorizontal: 16, marginTop: 8, borderRadius: 20, overflow: 'hidden',
        backgroundColor: '#1a0533', padding: 20,
      }}>
        {/* Decorative circles */}
        <View style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(99,102,241,0.15)' }} />
        <View style={{ position: 'absolute', bottom: -20, left: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(167,139,250,0.1)' }} />

        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
          {schoolName}
        </Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 26 }}>
          Hello, {firstName}!
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
          Here's your school at a glance.
        </Text>

        {/* Finance strip */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Income', value: fmt(d.finance.totalIncome), color: '#34d399' },
            { label: 'Expenses', value: fmt(d.finance.totalExpenses), color: '#f87171' },
            { label: 'Balance', value: fmt(Math.abs(d.finance.netBalance)), color: '#818cf8' },
          ].map(f => (
            <View key={f.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 }}>
              <Text style={{ color: f.color, fontSize: 13, fontWeight: '900' }}>{f.value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '600', marginTop: 2 }}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>

        {/* ── 4 Stat cards ─────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GradCard label="Students" value={d.counts.totalStudents} icon="people" colors={['#6366f1', '#4f46e5']} />
          <GradCard label="Staff" value={d.counts.totalStaff} icon="briefcase" colors={['#7c3aed', '#6d28d9']} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GradCard label="Classrooms" value={d.counts.totalClassrooms} icon="school" colors={['#f59e0b', '#d97706']} />
          <GradCard label="Subjects" value={d.counts.totalSubjects} icon="book" colors={['#14b8a6', '#0d9488']} />
        </View>

        {/* ── Attendance today ─────────────────────────────── */}
        <Card>
          <CardHeader icon="checkmark-circle" iconColor="#10b981" title="Today's Attendance" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Present', value: d.attendance.presentToday, bg: '#ecfdf5', text: '#065f46' },
              { label: 'Absent', value: Math.max(0, d.attendance.absentToday), bg: '#f9fafb', text: '#374151' },
              { label: 'Flagged', value: d.attendance.flaggedRecords, bg: '#fffbeb', text: '#92400e' },
            ].map(a => (
              <View key={a.label} style={{ flex: 1, backgroundColor: a.bg, borderRadius: 12, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: a.text }}>{a.value}</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: a.text, opacity: 0.7, marginTop: 2 }}>{a.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* ── Pending actions ──────────────────────────────── */}
        {hasPending && (
          <Card>
            <CardHeader icon="alert-circle" iconColor="#f59e0b" title="Needs Attention" />
            <PendingBadge label="Pending Enrollments" count={d.pendingActions.enrollments} bg="bg-indigo-50" text="text-indigo-700" />
            <PendingBadge label="Open Enquiries" count={d.pendingActions.enquiries} bg="bg-amber-50" text="text-amber-700" />
            <PendingBadge label="Job Applications" count={d.pendingActions.jobApplications} bg="bg-violet-50" text="text-violet-700" />
            <PendingBadge label="Reports for Review" count={d.pendingActions.reports} bg="bg-blue-50" text="text-blue-700" />
          </Card>
        )}

        {/* ── Announcements ────────────────────────────────── */}
        <SectionLabel>Announcements</SectionLabel>
        <Card>
          {d.recentAnnouncements.length === 0 ? (
            <Text className="text-xs text-gray-400 text-center py-4">No announcements yet</Text>
          ) : d.recentAnnouncements.map((a, i) => (
            <AnnouncementRow
              key={a.id} title={a.title}
              timeAgo={formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              isLast={i === d.recentAnnouncements.length - 1}
            />
          ))}
        </Card>

        {/* ── Upcoming events ──────────────────────────────── */}
        <SectionLabel>Upcoming Events</SectionLabel>
        <Card>
          {d.upcomingEvents.length === 0 ? (
            <Text className="text-xs text-gray-400 text-center py-4">No upcoming events</Text>
          ) : d.upcomingEvents.map((e, i) => (
            <EventRow
              key={e.id} title={e.title} date={e.startDate}
              type={e.eventType} color={e.color}
              isLast={i === d.upcomingEvents.length - 1}
            />
          ))}
        </Card>

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}
