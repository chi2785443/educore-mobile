import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMyResults } from '@/hooks/useResults';
import { TermResult, SubjectResult } from '@/interface/result.interface';

/* ── Grade colour ───────────────────────────────────────────────── */
function gradeColor(pct: number): string {
  if (pct >= 75) return '#16a34a';
  if (pct >= 60) return '#0284c7';
  if (pct >= 45) return '#d97706';
  return '#dc2626';
}
function gradeBg(pct: number): string {
  if (pct >= 75) return '#dcfce7';
  if (pct >= 60) return '#dbeafe';
  if (pct >= 45) return '#fef3c7';
  return '#fee2e2';
}

/* ── Subject result row ─────────────────────────────────────────── */
function SubjectRow({ sub }: { sub: SubjectResult }) {
  const color = sub.subject?.color ?? '#6366f1';
  const pct = Math.round(sub.percentage);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, flexShrink: 0 }} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' }} numberOfLines={1}>
        {sub.subject?.name ?? 'Subject'}
      </Text>
      <View style={{ backgroundColor: gradeBg(pct), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: gradeColor(pct) }}>
          {sub.grade ?? `${pct}%`}
        </Text>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: gradeColor(pct), width: 38, textAlign: 'right' }}>
        {pct}%
      </Text>
    </View>
  );
}

/* ── Result card ────────────────────────────────────────────────── */
function ResultCard({ result, expanded, onToggle, isLatest }: {
  result: TermResult; expanded: boolean; onToggle: () => void; isLatest: boolean;
}) {
  const pct = Math.round(result.overallPercentage);
  const color = gradeColor(pct);
  const bg = gradeBg(pct);

  const termLabel = result.term
    .replace('_', ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 20,
      borderWidth: isLatest ? 2 : 1,
      borderColor: isLatest ? '#6366f1' : '#f1f5f9',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: isLatest ? 0.08 : 0.04,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
      elevation: isLatest ? 4 : 2,
    }}>
      {isLatest && (
        <View style={{ backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 6 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
            ⭐ MOST RECENT RESULT
          </Text>
        </View>
      )}

      <Pressable onPress={onToggle} style={{ padding: 16 }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>{termLabel}</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{result.academicYear}</Text>
            {result.classroom && (
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {result.classroom.name}
                {result.classroom.grade ? ` · ${result.classroom.grade}` : ''}
              </Text>
            )}
          </View>

          {/* Big percentage */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 68, height: 68, borderRadius: 20, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color + '40' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color }}>{pct}%</Text>
            </View>
            {result.overallGrade && (
              <Text style={{ fontSize: 13, fontWeight: '900', color }}>{result.overallGrade}</Text>
            )}
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 0, backgroundColor: '#f8fafc', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Passed', value: result.subjectsPassed, color: '#16a34a' },
            { label: 'Failed', value: result.subjectsFailed, color: '#dc2626' },
            { label: 'Position', value: result.classPosition ? `#${result.classPosition}` : '—', color: '#6366f1' },
            { label: 'GPA', value: result.gpa ? result.gpa.toFixed(1) : '—', color: '#7c3aed' },
          ].map((s, i) => (
            <View key={s.label} style={{ flex: 1, padding: 10, alignItems: 'center', borderRightWidth: i < 3 ? 1 : 0, borderRightColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Expand toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: '#6366f1', fontWeight: '700' }}>
            {expanded ? 'Hide' : 'Show'} subject breakdown
          </Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#6366f1" />
        </View>
      </Pressable>

      {/* Subject results (expandable) */}
      {expanded && result.subjectResults && result.subjectResults.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8 }}>Subject</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8 }}>Grade · %</Text>
          </View>
          {result.subjectResults.map(sub => (
            <SubjectRow key={sub.id} sub={sub} />
          ))}
        </View>
      )}

      {/* Teacher/principal remarks */}
      {expanded && (result.teacherRemarks || result.principalRemarks) && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', padding: 14, gap: 8 }}>
          {result.teacherRemarks && (
            <View style={{ backgroundColor: '#f0f9ff', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#0ea5e9' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#0284c7', marginBottom: 4 }}>Teacher's Remarks</Text>
              <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 20 }}>{result.teacherRemarks}</Text>
            </View>
          )}
          {result.principalRemarks && (
            <View style={{ backgroundColor: '#f5f3ff', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#7c3aed' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#7c3aed', marginBottom: 4 }}>Principal's Remarks</Text>
              <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 20 }}>{result.principalRemarks}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/* ── Main screen ────────────────────────────────────────────────── */
export default function ResultsScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: results = [], isLoading, refetch } = useMyResults();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sorted = [...results].sort((a, b) => {
    if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
    return a.term.localeCompare(b.term);
  });

  // Summary across all results
  const avgPct = sorted.length
    ? Math.round(sorted.reduce((a, r) => a + r.overallPercentage, 0) / sorted.length)
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#0c1a40', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Results</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {sorted.length} term result{sorted.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Ionicons name="trophy-outline" size={22} color="#0ea5e9" />
        </View>

        {/* Overall average */}
        {sorted.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{avgPct}%</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>Overall Avg</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{sorted.length}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>Terms Taken</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>
                {sorted[0]?.overallGrade ?? '—'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>Latest Grade</Text>
            </View>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0ea5e9" size="large" />
        </View>
      ) : sorted.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
            No results yet
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Your term results will appear here once published by your school.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}
        >
          {sorted.map((result, i) => (
            <ResultCard
              key={result.id}
              result={result}
              isLatest={i === 0}
              expanded={expandedId === result.id}
              onToggle={() => setExpandedId(expandedId === result.id ? null : result.id)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
