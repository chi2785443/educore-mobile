import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useMyTeacherClassrooms } from '@/hooks/useClassroom';
import { useClassroomAssessments } from '@/hooks/useAssessment';
import { useScoresForAssessment, useAssessmentStats, useReleaseScores } from '@/hooks/useStudentScore';
import { Assessment, AssessmentType } from '@/interface/assessment.interface';
import { StudentScore, ClassStats } from '@/interface/attempt.interface';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';
import LoadingScreen from '@/components/ui/LoadingScreen';

const TYPE_COLOR: Record<AssessmentType, string> = {
  exam: '#F5486A', test: '#4C3FC4', quiz: '#0ea5e9', assignment: '#10b981',
};
const TYPE_BG: Record<AssessmentType, string> = {
  exam: '#fff0f3', test: '#F0EEFF', quiz: '#f0f9ff', assignment: '#f0fdf4',
};

type TypeFilter = 'all' | AssessmentType;

/* ── Score Detail Modal ────────────────────────────────────────── */
function ScoreDetailModal({
  assessment, onClose,
}: { assessment: Assessment; onClose: () => void }) {
  const { data: scores = [], isLoading: loadingScores } = useScoresForAssessment(assessment.id);
  const { data: stats, isLoading: loadingStats } = useAssessmentStats(assessment.id);
  const { mutate: release, isPending: releasing } = useReleaseScores(assessment.id);

  const s = stats as ClassStats | undefined;
  const allReleased = !!s && s.totalStudents > 0 && s.releasedCount >= s.totalStudents;
  const hasScores = !!s && s.totalStudents > 0;

  const sorted = useMemo(
    () => [...scores].sort((a, b) => b.percentage - a.percentage),
    [scores],
  );

  const typeColor = TYPE_COLOR[assessment.type] ?? '#4C3FC4';

  const handleRelease = () => {
    release(undefined, {
      onSuccess: (data) => {
        if (data.released === 0) Alert.alert('Already Released', 'All scores are already visible to students.');
        else Alert.alert('Scores Released', `${data.released} score(s) are now visible to students.`);
      },
      onError: (err: Error) => Alert.alert('Error', err.message),
    });
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
        {/* Header */}
        <View style={{ backgroundColor: typeColor, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={18} color="#fff" />
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={2}>{assessment.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1, textTransform: 'capitalize' }}>{assessment.type}</Text>
            </View>
            {/* Release button */}
            {hasScores && (
              allReleased ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }}>
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Released</Text>
                </View>
              ) : (
                <Pressable onPress={handleRelease} disabled={releasing} style={({ pressed }) => ({ opacity: pressed || releasing ? 0.7 : 1 })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }}>
                    {releasing
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="send" size={13} color="#fff" />}
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Release</Text>
                  </View>
                </Pressable>
              )
            )}
          </View>

          {stats && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'Avg', value: `${Math.round(stats.averagePercentage)}%` },
                { label: 'Highest', value: String(stats.highestScore) },
                { label: 'Pass rate', value: `${Math.round(stats.passPercentage)}%` },
                { label: 'Graded', value: String(scores.length) },
              ].map((s, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{s.value}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {(loadingScores || loadingStats) ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={typeColor} size="large" />
          </View>
        ) : sorted.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Ionicons name="bar-chart-outline" size={40} color="#d1d5db" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No scores yet</Text>
            <Text style={{ fontSize: 13, color: '#9ca3af' }}>Students haven't been graded yet.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Table header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' }}>
              <Text style={{ width: 28, fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>#</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Student</Text>
              <Text style={{ width: 52, fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', textAlign: 'center' }}>Score</Text>
              <Text style={{ width: 42, fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', textAlign: 'center' }}>Grade</Text>
              <Text style={{ width: 28, fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', textAlign: 'center' }}>✓</Text>
            </View>

            {sorted.map((s: StudentScore, i) => {
              const name = s.student ? `${s.student.firstName} ${s.student.lastName}` : `Student ${i + 1}`;
              const initials = s.student
                ? `${s.student.firstName[0] ?? ''}${s.student.lastName[0] ?? ''}`.toUpperCase()
                : '?';
              const pct = Math.round(s.percentage);
              const passed = s.isPassed;

              return (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f8fafc', backgroundColor: '#fff' }}>
                  <Text style={{ width: 28, fontSize: 12, fontWeight: '700', color: '#94a3b8' }}>{i + 1}</Text>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: passed ? '#f0fdf4' : '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: passed ? '#16a34a' : '#dc2626' }}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{name}</Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                        {s.correctAnswers}/{s.questionsAnswered} correct
                      </Text>
                    </View>
                  </View>
                  <Text style={{ width: 52, fontSize: 14, fontWeight: '800', color: passed ? '#16a34a' : '#dc2626', textAlign: 'center' }}>
                    {s.score}/{s.totalMarks}
                  </Text>
                  <View style={{ width: 42, alignItems: 'center' }}>
                    <View style={{ backgroundColor: passed ? '#f0fdf4' : '#fff1f2', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: passed ? '#16a34a' : '#dc2626' }}>{s.grade}</Text>
                    </View>
                  </View>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <Ionicons name={passed ? 'checkmark-circle' : 'close-circle'} size={18} color={passed ? '#16a34a' : '#dc2626'} />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* ── Assessment list for a classroom ──────────────────────────── */
function ClassroomScores({ classroomId, schoolId }: { classroomId: string; schoolId: string }) {
  const { data: assessments = [], isLoading } = useClassroomAssessments(classroomId, schoolId);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selected, setSelected] = useState<Assessment | null>(null);

  const typeTabs: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'exam', label: 'Exams' },
    { key: 'test', label: 'Tests' },
    { key: 'quiz', label: 'Quizzes' },
    { key: 'assignment', label: 'Assignments' },
  ];

  const filtered = useMemo(() => {
    const list = (assessments as Assessment[]).filter(a => a.status !== 'draft');
    return typeFilter === 'all' ? list : list.filter(a => a.type === typeFilter);
  }, [assessments, typeFilter]);

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#4C3FC4" />
    </View>
  );

  return (
    <>
      <ClassroomDetailTabs tabs={typeTabs} activeTab={typeFilter} onTabChange={setTypeFilter} accentColor="#4C3FC4" />

      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 }}>
          <Ionicons name="bar-chart-outline" size={36} color="#d1d5db" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>No assessments</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
            {typeFilter === 'all' ? 'No published assessments yet.' : `No ${typeFilter}s published yet.`}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
          {filtered.map(a => {
            const color = TYPE_COLOR[a.type] ?? '#4C3FC4';
            const bg = TYPE_BG[a.type] ?? '#F0EEFF';
            return (
              <Pressable key={a.id} onPress={() => setSelected(a)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ionicons name="bar-chart-outline" size={20} color={color} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>{a.title}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color, textTransform: 'capitalize' }}>{a.type}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>{a.totalMarks} marks</Text>
                      {a.scheduledDate && (
                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>· {format(new Date(a.scheduledDate), 'd MMM')}</Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {selected && <ScoreDetailModal assessment={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

/* ── Main Screen ───────────────────────────────────────────────── */
export default function StaffScoresScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0] ?? null;
  const schoolId = primary?.schoolId ?? '';

  const { data: classroomsRaw, isLoading: loadingClassrooms } = useMyTeacherClassrooms(schoolId);
  const classrooms = useMemo(() => {
    if (Array.isArray(classroomsRaw)) return classroomsRaw as { id: string; name: string }[];
    if (classroomsRaw && typeof classroomsRaw === 'object' && 'data' in classroomsRaw)
      return ((classroomsRaw as { data: { id: string; name: string }[] }).data ?? []);
    return [];
  }, [classroomsRaw]);

  const [classroomId, setClassroomId] = useState('');
  const activeId = classroomId || classrooms[0]?.id || '';

  const classroomTabs = useMemo(
    () => classrooms.map(c => ({ key: c.id, label: c.name })),
    [classrooms],
  );

  if (loadingClassrooms) return <LoadingScreen color="#4C3FC4" message="Loading classrooms…" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#4C3FC4', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Assessment Scores</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 }}>
              {classrooms.length} classroom{classrooms.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="bar-chart-outline" size={18} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </View>

      {classrooms.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
          <Ionicons name="school-outline" size={40} color="#d1d5db" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center' }}>No classrooms assigned</Text>
        </View>
      ) : (
        <>
          {classroomTabs.length > 1 && (
            <ClassroomDetailTabs
              tabs={classroomTabs}
              activeTab={activeId}
              onTabChange={setClassroomId}
              accentColor="#4C3FC4"
            />
          )}
          <ClassroomScores key={activeId} classroomId={activeId} schoolId={schoolId} />
        </>
      )}
    </SafeAreaView>
  );
}
