import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, formatDistanceToNow } from 'date-fns';
import { useStudentDashboard } from '@/hooks/useDashboardRole';
import {
  DashLoader, GradCard, Card, CardHeader,
  AnnouncementRow, EventRow, PeriodRow, SectionLabel,
} from './DashboardPrimitives';
import { StudentDashboardData } from '@/services/dashboard-role.service';

interface Props { schoolId: string; schoolName: string; firstName: string }

const TERM_LABELS: Record<string, string> = {
  FIRST_TERM: '1st Term', SECOND_TERM: '2nd Term', THIRD_TERM: '3rd Term',
  FIRST_SEMESTER: '1st Semester', SECOND_SEMESTER: '2nd Semester',
};

type DashScore = StudentDashboardData['recentScores'][number];

const TYPE_COLOR: Record<string, string> = {
  exam: '#F5486A', test: '#4C3FC4', quiz: '#0ea5e9', assignment: '#10b981',
};
const TYPE_BG: Record<string, string> = {
  exam: '#fff0f3', test: '#F0EEFF', quiz: '#f0f9ff', assignment: '#f0fdf4',
};

function pctColor(pct: number) {
  if (pct >= 75) return '#16a34a';
  if (pct >= 60) return '#0284c7';
  if (pct >= 45) return '#d97706';
  return '#dc2626';
}
function pctBg(pct: number) {
  if (pct >= 75) return '#dcfce7';
  if (pct >= 60) return '#dbeafe';
  if (pct >= 45) return '#fef3c7';
  return '#fee2e2';
}

function ScoreDetailModal({ score, onClose }: { score: DashScore; onClose: () => void }) {
  const pct = Math.round(score.percentage);
  const color = pctColor(pct);
  const typeColor = TYPE_COLOR[score.type] ?? '#4C3FC4';

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View style={{ backgroundColor: typeColor, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={18} color="#fff" />
                </View>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={2}>
                  {score.title}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{score.type}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Score circle + breakdown */}
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 90, height: 90, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>{pct}%</Text>
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Score</Text>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{score.score} / {score.totalMarks}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{score.grade || '—'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>GRADE</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: score.isPassed ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                    <Ionicons name={score.isPassed ? 'checkmark-circle' : 'close-circle'} size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{score.isPassed ? 'PASSED' : 'FAILED'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={{ padding: 16, gap: 14 }}>
            {/* Answer breakdown */}
            {score.questionsAnswered > 0 && (
              <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' }}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7 }}>Answer Breakdown</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {[
                    { label: 'Answered', value: String(score.questionsAnswered), color: '#4C3FC4' },
                    { label: 'Correct', value: String(score.correctAnswers), color: '#16a34a' },
                    { label: 'Incorrect', value: String(score.incorrectAnswers), color: '#dc2626' },
                    { label: 'GPA', value: score.gradePoint != null ? Number(score.gradePoint).toFixed(1) : '—', color: '#7c3aed' },
                  ].map((item, i) => (
                    <View key={item.label} style={{ flex: 1, padding: 14, alignItems: 'center', borderRightWidth: i < 3 ? 1 : 0, borderRightColor: '#f1f5f9' }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: item.color }}>{item.value}</Text>
                      <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600', marginTop: 3, textAlign: 'center' }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ marginHorizontal: 14, marginBottom: 14, height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden', flexDirection: 'row' }}>
                  <View style={{ flex: score.correctAnswers, backgroundColor: '#16a34a', borderRadius: 4 }} />
                  <View style={{ flex: score.incorrectAnswers, backgroundColor: '#dc2626', borderRadius: 4 }} />
                  <View style={{ flex: Math.max(0, score.questionsAnswered - score.correctAnswers - score.incorrectAnswers), backgroundColor: '#e2e8f0', borderRadius: 4 }} />
                </View>
              </View>
            )}

            {/* Remarks */}
            {score.remarks ? (
              <View style={{ backgroundColor: '#f0f9ff', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#0ea5e9' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Teacher's Remarks</Text>
                <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 20 }}>{score.remarks}</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>No remarks provided</Text>
              </View>
            )}

            {/* Graded date */}
            {score.gradedAt && (
              <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                Graded on {format(new Date(score.gradedAt), 'MMM d, yyyy')}
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

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
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScore, setSelectedScore] = useState<DashScore | null>(null);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !data) return <DashLoader color="#4C3FC4" message="Loading your dashboard..." />;
  const d = data;

  return (
    <>
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
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedScore(s)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  className={`flex-row items-center gap-3 py-2.5 ${i < d.recentScores.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
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
                </Pressable>
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

    {selectedScore && (
      <ScoreDetailModal score={selectedScore} onClose={() => setSelectedScore(null)} />
    )}
    </>
  );
}
