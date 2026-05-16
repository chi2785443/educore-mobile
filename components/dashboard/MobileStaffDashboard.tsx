import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useStaffDashboard } from '@/hooks/useDashboardRole';
import {
  DashLoader, GradCard, Card, CardHeader,
  AnnouncementRow, EventRow, PeriodRow, SectionLabel,
} from './DashboardPrimitives';

interface Props { schoolId: string; schoolName: string; firstName: string }

export default function MobileStaffDashboard({ schoolId, schoolName, firstName }: Props) {
  const { data, isLoading } = useStaffDashboard(schoolId);

  if (isLoading || !data) return <DashLoader color="#14b8a6" message="Loading your workspace..." />;
  const d = data;

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

      {/* ── Hero ─────────────────────────────────────────── */}
      <View style={{
        marginHorizontal: 16, marginTop: 8, borderRadius: 20,
        backgroundColor: '#0f4c42', padding: 20, overflow: 'hidden',
      }}>
        <View style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(20,184,166,0.2)' }} />
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
          {schoolName} · Staff
        </Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
          Hello, {firstName}!
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
          Here's an overview of your activities today.
        </Text>

        {/* Clock-in status pill */}
        <View style={{
          marginTop: 14, alignSelf: 'flex-start',
          backgroundColor: d.myAttendanceToday.clockedIn
            ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)',
          borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
          flexDirection: 'row', alignItems: 'center', gap: 6,
        }}>
          <Ionicons
            name={d.myAttendanceToday.clockedIn ? 'checkmark-circle' : 'time-outline'}
            size={13}
            color={d.myAttendanceToday.clockedIn ? '#34d399' : '#fbbf24'}
          />
          <Text style={{
            fontSize: 11, fontWeight: '700',
            color: d.myAttendanceToday.clockedIn ? '#34d399' : '#fbbf24',
          }}>
            {d.myAttendanceToday.clockedIn ? 'Clocked In' : 'Not clocked in yet'}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>

        {/* ── Stats ────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GradCard label="My Classes" value={d.counts.totalClassrooms} icon="school" colors={['#14b8a6', '#0d9488']} />
          <GradCard label="My Students" value={d.counts.totalStudents} icon="people" colors={['#6366f1', '#4f46e5']} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GradCard label="Assessments" value={d.counts.totalAssessments} icon="clipboard" colors={['#7c3aed', '#6d28d9']} sub={`${d.counts.publishedAssessments} published`} />
          <GradCard label="Reports" value={d.counts.myReports} icon="document-text" colors={['#f59e0b', '#d97706']} sub={d.counts.pendingReports > 0 ? `${d.counts.pendingReports} pending` : 'all reviewed'} />
        </View>

        {/* ── Today's schedule ─────────────────────────────── */}
        <SectionLabel>Today's Schedule</SectionLabel>
        <Card>
          <CardHeader icon="time" iconColor="#14b8a6" title={`${new Date().toLocaleDateString('en', { weekday: 'long' })}'s Classes`} />
          {d.todayTimetable.length === 0 ? (
            <View className="items-center py-6 gap-2">
              <Ionicons name="calendar-outline" size={28} color="#d1d5db" />
              <Text className="text-xs text-gray-400">No classes scheduled today</Text>
            </View>
          ) : d.todayTimetable.map((p, i) => {
            const [sh] = p.startTime.split(':').map(Number);
            const [eh] = p.endTime.split(':').map(Number);
            const isNow = new Date().getHours() >= sh && new Date().getHours() < eh;
            return (
              <PeriodRow
                key={p.id} subject={p.subject} classroom={p.classroom}
                start={p.startTime} end={p.endTime}
                isNow={isNow} isLast={i === d.todayTimetable.length - 1}
              />
            );
          })}
        </Card>

        {/* ── My classrooms ────────────────────────────────── */}
        {d.myClassrooms.length > 0 && (
          <>
            <SectionLabel>My Classrooms</SectionLabel>
            <Card>
              {d.myClassrooms.slice(0, 4).map((c, i) => {
                const colorPairs = [['#6366f1','#e0e7ff'],['#14b8a6','#d1fae5'],['#7c3aed','#ede9fe'],['#f59e0b','#fef3c7']];
                const [fg, bg] = colorPairs[i % colorPairs.length];
                return (
                  <View key={c.id} className={`flex-row items-center gap-3 py-2.5 ${i < d.myClassrooms.length - 1 && i < 3 ? 'border-b border-gray-50' : ''}`}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: fg, fontWeight: '900', fontSize: 14 }}>{c.name[0]}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-gray-800">{c.name}</Text>
                      <Text className="text-[10px] text-gray-400">{[c.grade, c.section].filter(Boolean).join(' · ')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {/* ── Recent assessments ───────────────────────────── */}
        {d.recentAssessments.length > 0 && (
          <>
            <SectionLabel>Recent Assessments</SectionLabel>
            <Card>
              {d.recentAssessments.map((a, i) => (
                <View key={a.id} className={`flex-row items-center gap-3 py-2.5 ${i < d.recentAssessments.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <View className="w-8 h-8 rounded-lg bg-violet-50 items-center justify-center shrink-0">
                    <Ionicons name="document-outline" size={14} color="#7c3aed" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>{a.title}</Text>
                    <Text className="text-[10px] text-gray-400 capitalize">{a.type} · {a.totalMarks} marks</Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
                    backgroundColor: a.status === 'published' ? '#ecfdf5' : '#fffbeb',
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: a.status === 'published' ? '#065f46' : '#92400e' }}>
                      {a.status}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* ── Announcements ────────────────────────────────── */}
        <SectionLabel>Announcements</SectionLabel>
        <Card>
          {d.recentAnnouncements.length === 0
            ? <Text className="text-xs text-gray-400 text-center py-4">No announcements</Text>
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
