import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useMyScores } from '@/hooks/useStudentScore';
import { StudentScore } from '@/interface/attempt.interface';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';

/* ── Constants ───────────────────────────────────────────────────── */
const TYPE_COLOR: Record<string, string> = {
  exam: '#F5486A', test: '#4C3FC4', quiz: '#0ea5e9', assignment: '#10b981',
};
const TYPE_BG: Record<string, string> = {
  exam: '#fff0f3', test: '#F0EEFF', quiz: '#f0f9ff', assignment: '#f0fdf4',
};
const TERM_LABELS: Record<string, string> = {
  FIRST_TERM: '1st Term', SECOND_TERM: '2nd Term', THIRD_TERM: '3rd Term',
  FIRST_SEMESTER: '1st Sem', SECOND_SEMESTER: '2nd Sem',
};

/* ── Helpers ─────────────────────────────────────────────────────── */
function pctColor(pct: number): string {
  if (pct >= 75) return '#16a34a';
  if (pct >= 60) return '#0284c7';
  if (pct >= 45) return '#d97706';
  return '#dc2626';
}
function pctBg(pct: number): string {
  if (pct >= 75) return '#dcfce7';
  if (pct >= 60) return '#dbeafe';
  if (pct >= 45) return '#fef3c7';
  return '#fee2e2';
}

/* ── Score Detail Modal ──────────────────────────────────────────── */
function ScoreDetailModal({ score, onClose }: { score: StudentScore; onClose: () => void }) {
  const pct = Math.round(score.percentage);
  const color = pctColor(pct);
  const bg = pctBg(pct);
  const typeColor = TYPE_COLOR[score.assessment?.type ?? ''] ?? '#4C3FC4';
  const typeBg = TYPE_BG[score.assessment?.type ?? ''] ?? '#F0EEFF';
  const termLabel = TERM_LABELS[score.assessment?.term ?? ''] ?? (score.assessment?.term ?? '');

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
                  {score.assessment?.title ?? 'Assessment'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
                      {score.assessment?.type ?? ''}
                    </Text>
                  </View>
                  {score.assessment?.subject?.name && (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                        {score.assessment.subject.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Big score circle + pass badge */}
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 90, height: 90, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>{pct}%</Text>
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Score</Text>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
                    {score.score} / {score.totalMarks}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{score.grade}</Text>
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
            {/* Assessment info */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7 }}>Assessment Info</Text>
              </View>
              {[
                { label: 'Subject', value: score.assessment?.subject?.name ?? '—', dot: score.assessment?.subject?.color },
                { label: 'Type', value: score.assessment?.type ? score.assessment.type.charAt(0).toUpperCase() + score.assessment.type.slice(1) : '—', badge: typeColor, badgeBg: typeBg },
                { label: 'Term', value: termLabel || '—' },
                { label: 'Year', value: score.assessment?.academicYear ?? '—' },
                { label: 'Class', value: score.assessment?.classroom?.name ?? '—' },
              ].map((row, i, arr) => (
                <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: '#f9fafb' }}>
                  <Text style={{ fontSize: 13, color: '#9ca3af' }}>{row.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {row.dot && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.dot }} />}
                    {row.badge ? (
                      <View style={{ backgroundColor: row.badgeBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: row.badge }}>{row.value}</Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>{row.value}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

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
                  ].map((s, i) => (
                    <View key={s.label} style={{ flex: 1, padding: 14, alignItems: 'center', borderRightWidth: i < 3 ? 1 : 0, borderRightColor: '#f1f5f9' }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: s.color }}>{s.value}</Text>
                      <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600', marginTop: 3, textAlign: 'center' }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                {/* Correct/incorrect bar */}
                <View style={{ marginHorizontal: 14, marginBottom: 14, height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden', flexDirection: 'row' }}>
                  {score.questionsAnswered > 0 && (
                    <>
                      <View style={{ flex: score.correctAnswers, backgroundColor: '#16a34a', borderRadius: 4 }} />
                      <View style={{ flex: score.incorrectAnswers, backgroundColor: '#dc2626', borderRadius: 4 }} />
                      <View style={{ flex: Math.max(0, score.questionsAnswered - score.correctAnswers - score.incorrectAnswers), backgroundColor: '#e2e8f0', borderRadius: 4 }} />
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Remarks */}
            {score.remarks && (
              <View style={{ backgroundColor: '#f0f9ff', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#0ea5e9' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Teacher's Remarks</Text>
                <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 20 }}>{score.remarks}</Text>
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

/* ── Score card (list item) ──────────────────────────────────────── */
function ScoreCard({ score, onPress }: { score: StudentScore; onPress: () => void }) {
  const pct = Math.round(score.percentage);
  const color = pctColor(pct);
  const bg = pctBg(pct);
  const typeColor = TYPE_COLOR[score.assessment?.type ?? ''] ?? '#4C3FC4';
  const typeBg = TYPE_BG[score.assessment?.type ?? ''] ?? '#F0EEFF';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1 }}>
        {/* Type + subject dot */}
        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: typeBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons
              name={score.assessment?.type === 'exam' ? 'document-text' : score.assessment?.type === 'quiz' ? 'help-circle' : score.assessment?.type === 'assignment' ? 'create' : 'clipboard'}
              size={20}
              color={typeColor}
            />
          </View>
          {score.assessment?.subject?.color && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: score.assessment.subject.color }} />
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>
            {score.assessment?.title ?? 'Assessment'}
          </Text>
          {score.assessment?.subject?.name && (
            <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              {score.assessment.subject.name}
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, alignItems: 'center' }}>
            <View style={{ backgroundColor: typeBg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: typeColor, textTransform: 'capitalize' }}>
                {score.assessment?.type ?? ''}
              </Text>
            </View>
            {score.assessment?.term && (
              <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600' }}>
                {TERM_LABELS[score.assessment.term] ?? score.assessment.term} · {score.assessment.academicYear}
              </Text>
            )}
          </View>
        </View>

        {/* Score badge */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ backgroundColor: bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderColor: color + '50', alignItems: 'center', minWidth: 56 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color }}>{pct}%</Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color, marginTop: 1 }}>{score.grade}</Text>
          </View>
          <Text style={{ fontSize: 10, color: '#9ca3af' }}>{score.score}/{score.totalMarks}</Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
      </View>
    </Pressable>
  );
}

/* ── Main screen ─────────────────────────────────────────────────── */
export default function StudentScoresScreen() {
  const router = useRouter();
  const { data: allScores = [], isLoading, refetch } = useMyScores();
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<StudentScore | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  /* ── Derive filter options from data ─────────────────────────── */
  const years = useMemo(() => {
    const s = new Set(allScores.map(s => s.assessment?.academicYear).filter(Boolean) as string[]);
    return ['All', ...Array.from(s).sort((a, b) => b.localeCompare(a))];
  }, [allScores]);

  const terms = useMemo(() => {
    const order = ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM', 'FIRST_SEMESTER', 'SECOND_SEMESTER'];
    const s = new Set(allScores.map(s => s.assessment?.term).filter(Boolean) as string[]);
    return ['All', ...order.filter(t => s.has(t))];
  }, [allScores]);

  const subjects = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: string }>();
    allScores.forEach(s => {
      const sub = s.assessment?.subject;
      if (sub) seen.set(sub.id, sub);
    });
    return [null, ...Array.from(seen.values())];
  }, [allScores]);

  const types = ['all', 'exam', 'test', 'quiz', 'assignment'] as const;
  type TypeFilter = typeof types[number];

  const [activeYear, setActiveYear] = useState('All');
  const [activeTerm, setActiveTerm] = useState('All');
  const [activeSubject, setActiveSubject] = useState<string | null>(null); // null = all
  const [activeType, setActiveType] = useState<TypeFilter>('all');

  /* ── Filter ──────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return allScores.filter(s => {
      if (activeYear !== 'All' && s.assessment?.academicYear !== activeYear) return false;
      if (activeTerm !== 'All' && s.assessment?.term !== activeTerm) return false;
      if (activeSubject !== null && s.assessment?.subject?.id !== activeSubject) return false;
      if (activeType !== 'all' && s.assessment?.type !== activeType) return false;
      return true;
    }).sort((a, b) => {
      const da = a.gradedAt ? new Date(a.gradedAt).getTime() : 0;
      const db = b.gradedAt ? new Date(b.gradedAt).getTime() : 0;
      return db - da;
    });
  }, [allScores, activeYear, activeTerm, activeSubject, activeType]);

  /* ── Summary stats ───────────────────────────────────────────── */
  const avgPct = filtered.length
    ? Math.round(filtered.reduce((a, s) => a + s.percentage, 0) / filtered.length)
    : 0;
  const passCount = filtered.filter(s => s.isPassed).length;

  const yearTabs = years.map(y => ({ key: y, label: y }));
  const termTabs = terms.map(t => ({ key: t, label: t === 'All' ? 'All Terms' : (TERM_LABELS[t] ?? t) }));
  const typeTabs: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'exam', label: 'Exams' },
    { key: 'test', label: 'Tests' },
    { key: 'quiz', label: 'Quizzes' },
    { key: 'assignment', label: 'Assignments' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#3b1f7a', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Scores</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {filtered.length} assessment{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Ionicons name="bar-chart-outline" size={22} color="#a78bfa" />
        </View>

        {/* Stats */}
        {allScores.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Avg Score', value: `${avgPct}%` },
              { label: 'Pass Rate', value: filtered.length ? `${Math.round((passCount / filtered.length) * 100)}%` : '—' },
              { label: 'Total', value: String(filtered.length) },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2, fontWeight: '600' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#7c3aed" size="large" />
        </View>
      ) : allScores.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No scores yet</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Your graded assessment scores will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}
        >
          {/* Year filter */}
          {years.length > 2 && (
            <View style={{ marginTop: 16 }}>
              <ClassroomDetailTabs
                tabs={yearTabs}
                activeTab={activeYear}
                onTabChange={setActiveYear}
                accentColor="#7c3aed"
              />
            </View>
          )}

          {/* Term filter */}
          {terms.length > 2 && (
            <ClassroomDetailTabs
              tabs={termTabs}
              activeTab={activeTerm}
              onTabChange={setActiveTerm}
              accentColor="#7c3aed"
            />
          )}

          {/* Type filter */}
          <ClassroomDetailTabs
            tabs={typeTabs}
            activeTab={activeType}
            onTabChange={setActiveType}
            accentColor="#7c3aed"
          />

          {/* Subject pills */}
          {subjects.length > 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
            >
              {subjects.map(sub => {
                const isActive = sub === null ? activeSubject === null : activeSubject === sub.id;
                return (
                  <Pressable
                    key={sub?.id ?? 'all'}
                    onPress={() => setActiveSubject(sub === null ? null : sub.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: isActive ? '#7c3aed' : '#e2e8f0', backgroundColor: isActive ? '#f5f3ff' : '#fff' }}>
                      {sub?.color && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sub.color }} />}
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#7c3aed' : '#6b7280' }}>
                        {sub === null ? 'All Subjects' : sub.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Score list */}
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
              <Ionicons name="search-outline" size={36} color="#d1d5db" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>No scores match filters</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingTop: 4, gap: 10 }}>
              {filtered.map(score => (
                <ScoreCard key={score.id} score={score} onPress={() => setSelected(score)} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {selected && <ScoreDetailModal score={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  );
}
