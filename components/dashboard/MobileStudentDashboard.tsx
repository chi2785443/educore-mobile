import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useStudentDashboard } from '@/hooks/useDashboardRole';
import {
  DashLoader, GradCard, Card, CardHeader,
  AnnouncementRow, EventRow, PeriodRow, SectionLabel,
} from './DashboardPrimitives';

interface Props { schoolId: string; schoolName: string; firstName: string }

const TERM_LABELS: Record<string, string> = {
  FIRST_TERM: '1st Term', SECOND_TERM: '2nd Term', THIRD_TERM: '3rd Term',
  FIRST_SEMESTER: '1st Semester', SECOND_SEMESTER: '2nd Semester',
};

function ScoreRing({ pct, passed }: { pct: number; passed: boolean }) {
  const color = passed ? '#10b981' : '#f87171';
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 10, fontWeight: '900', color }}>{Math.round(pct)}%</Text>
    </View>
  );
}

export default function MobileStudentDashboard({ schoolId, schoolName, firstName }: Props) {
  const { data, isLoading, refetch } = useStudentDashboard(schoolId);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !data) return <DashLoader color="#4C3FC4" message="Loading your dashboard..." />;
  const d = data;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C3FC4" colors={['#4C3FC4']} />}
    >

      {/* ── Hero ─────────────────────────────────────────── */}
      <View style={{
        marginHorizontal: 16, marginTop: 8, borderRadius: 20,
        backgroundColor: '#4C3FC4', padding: 20, overflow: 'hidden',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <View style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.10)' }} />
        <View style={{ position: 'absolute', bottom: -10, left: 30, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(245,72,106,0.12)' }} />

        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
          {schoolName} · Student
        </Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
          Hello, {firstName}!
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
          Stay on top of your assessments and scores.
        </Text>

        {/* Attendance pill */}
        <View style={{
          marginTop: 14, alignSelf: 'flex-start',
          backgroundColor: d.clockedInToday ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)',
          borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
          flexDirection: 'row', alignItems: 'center', gap: 6,
        }}>
          <Ionicons
            name={d.clockedInToday ? 'checkmark-circle' : 'alert-circle-outline'}
            size={13}
            color={d.clockedInToday ? '#34d399' : '#fbbf24'}
          />
          <Text style={{ fontSize: 11, fontWeight: '700', color: d.clockedInToday ? '#34d399' : '#fbbf24' }}>
            {d.clockedInToday ? 'Attendance Marked' : 'Mark Attendance'}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>

        {/* ── Stats ────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GradCard label="My Classes" value={d.counts.totalClassrooms} icon="school" colors={['#4C3FC4', '#6B5FD6']} />
          <GradCard label="Avg Score" value={`${d.counts.avgScore.toFixed(1)}%`} icon="trending-up" colors={['#F5486A', '#E03058']} sub={`${d.counts.totalScored} scored`} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GradCard label="Passed" value={d.counts.passedCount} icon="checkmark-circle" colors={['#10b981', '#059669']} sub={`of ${d.counts.totalScored}`} />
          <GradCard label="Days Present" value={d.counts.daysAttendedThisMonth} icon="calendar" colors={['#14b8a6', '#0d9488']} sub="this month" />
        </View>

        {/* ── Latest result banner ─────────────────────────── */}
        {d.latestResult && (
          <View style={{
            borderRadius: 16, padding: 16, overflow: 'hidden',
            backgroundColor: '#b45309', flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: '#d97706', opacity: 0.5 }} />
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trophy" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                {TERM_LABELS[d.latestResult.term] ?? d.latestResult.term} · {d.latestResult.academicYear}
              </Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 }}>
                {Number(d.latestResult.overallPercentage).toFixed(1)}% — {d.latestResult.overallGrade}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
                Position {d.latestResult.classPosition} of {d.latestResult.totalStudents}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
          </View>
        )}

        {/* ── Outstanding fees warning ─────────────────────── */}
        {d.counts.outstandingFees > 0 && (
          <View style={{ borderRadius: 14, borderWidth: 2, borderColor: '#fca5a5', backgroundColor: '#fef2f2', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="wallet-outline" size={18} color="#dc2626" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-red-700">Outstanding Fees</Text>
              <Text className="text-xs text-red-400 mt-0.5">You have an unpaid balance.</Text>
            </View>
          </View>
        )}

        {/* ── Today's classes ──────────────────────────────── */}
        <SectionLabel>Today's Classes</SectionLabel>
        <Card>
          {d.todayTimetable.length === 0 ? (
            <View className="items-center py-6 gap-2">
              <Ionicons name="sunny-outline" size={28} color="#d1d5db" />
              <Text className="text-xs text-gray-400">No classes today — enjoy!</Text>
            </View>
          ) : d.todayTimetable.map((p, i) => {
            const [sh] = p.startTime.split(':').map(Number);
            const [eh] = p.endTime.split(':').map(Number);
            const isNow = new Date().getHours() >= sh && new Date().getHours() < eh;
            return (
              <PeriodRow key={p.id} subject={p.subject} classroom={p.classroom}
                start={p.startTime} end={p.endTime} isNow={isNow}
                isLast={i === d.todayTimetable.length - 1}
              />
            );
          })}
        </Card>

        {/* ── Recent scores ────────────────────────────────── */}
        {d.recentScores.length > 0 && (
          <>
            <SectionLabel>Recent Scores</SectionLabel>
            <Card>
              {d.recentScores.map((s, i) => (
                <View key={s.id} className={`flex-row items-center gap-3 py-2.5 ${i < d.recentScores.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <ScoreRing pct={Number(s.percentage)} passed={s.passed} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>{s.title}</Text>
                    <Text className="text-[10px] text-gray-400 capitalize mt-0.5">{s.type} · {s.totalMarks} marks</Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
                    backgroundColor: s.passed ? '#ecfdf5' : '#fef2f2',
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: s.passed ? '#065f46' : '#991b1b' }}>
                      {s.grade || (s.passed ? 'P' : 'F')}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* ── Announcements & Events ───────────────────────── */}
        <SectionLabel>Announcements</SectionLabel>
        <Card>
          {d.recentAnnouncements.length === 0
            ? <Text className="text-xs text-gray-400 text-center py-4">Nothing posted yet</Text>
            : d.recentAnnouncements.map((a, i) => (
              <AnnouncementRow key={a.id} title={a.title}
                timeAgo={formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                isLast={i === d.recentAnnouncements.length - 1}
              />
            ))}
        </Card>

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
