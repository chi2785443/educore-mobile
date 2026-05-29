import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStudentAllResults } from '@/hooks/useResults';
import { TermResult } from '@/interface/result.interface';

const TERM_LABELS: Record<string, string> = {
  FIRST_TERM:      'First Term',
  SECOND_TERM:     'Second Term',
  THIRD_TERM:      'Third Term',
  FIRST_SEMESTER:  'First Semester',
  SECOND_SEMESTER: 'Second Semester',
};

const TERM_ORDER: Record<string, number> = {
  FIRST_TERM: 1, FIRST_SEMESTER: 1,
  SECOND_TERM: 2, SECOND_SEMESTER: 2,
  THIRD_TERM: 3,
};

function positionSuffix(n: number | null): string {
  if (!n) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function perfColor(pct: number) {
  if (pct >= 80) return '#6366f1';
  if (pct >= 65) return '#3b82f6';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function ResultCard({ result }: { result: TermResult }) {
  const pct = Number(result.overallPercentage);
  const isPassed = result.subjectsFailed === 0;
  const color = perfColor(pct);
  const barColor = isPassed ? color : '#ef4444';

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#f1f5f9',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    }}>
      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: '#f1f5f9' }}>
        <View style={{ height: 4, width: `${Math.min(100, pct)}%`, backgroundColor: barColor }} />
      </View>

      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: color + '18',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="school-outline" size={20} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
              {TERM_LABELS[result.term] ?? result.term}
            </Text>
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {result.classroom?.name ?? 'Class'}
            </Text>
          </View>
        </View>

        {/* Score + position */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 34, fontWeight: '900', color: barColor, lineHeight: 38 }}>
              {pct.toFixed(0)}<Text style={{ fontSize: 16, fontWeight: '600' }}>%</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons
                name={isPassed ? 'checkmark-circle' : 'close-circle'}
                size={15}
                color={isPassed ? '#16a34a' : '#ef4444'}
              />
              <Text style={{
                fontSize: 12, fontWeight: '700',
                color: isPassed ? '#16a34a' : '#ef4444',
              }}>
                {isPassed ? 'Passed' : 'Failed'}
              </Text>
              {result.overallGrade && (
                <>
                  <Text style={{ color: '#e2e8f0' }}>·</Text>
                  <View style={{
                    backgroundColor: color + '18', borderRadius: 6,
                    paddingHorizontal: 8, paddingVertical: 2,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color }}>
                      Grade {result.overallGrade}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
          {result.classPosition && (
            <View style={{
              backgroundColor: '#fef3c7', borderRadius: 14,
              paddingHorizontal: 12, paddingVertical: 8,
              alignItems: 'center',
            }}>
              <Ionicons name="trophy" size={14} color="#f59e0b" />
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#d97706', lineHeight: 20 }}>
                {positionSuffix(result.classPosition)}
              </Text>
              <Text style={{ fontSize: 9, color: '#d97706', fontWeight: '600' }}>
                of {result.totalStudents ?? '—'}
              </Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{
            flex: 1, backgroundColor: '#f8fafc', borderRadius: 10,
            padding: 8, alignItems: 'center',
            borderWidth: 1, borderColor: '#f1f5f9',
          }}>
            <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
              Subjects
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#374151' }}>{result.subjectsTaken}</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: '#f0fdf4', borderRadius: 10,
            padding: 8, alignItems: 'center',
            borderWidth: 1, borderColor: '#dcfce7',
          }}>
            <Text style={{ fontSize: 9, color: '#16a34a', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
              Passed
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#15803d' }}>{result.subjectsPassed}</Text>
          </View>
          {result.gpa !== null && result.gpa !== undefined ? (
            <View style={{
              flex: 1, borderRadius: 10, padding: 8, alignItems: 'center',
              backgroundColor: color + '10', borderWidth: 1, borderColor: color + '30',
            }}>
              <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2, color }}>
                GPA
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color }}>{Number(result.gpa).toFixed(2)}</Text>
            </View>
          ) : (
            <View style={{
              flex: 1, backgroundColor: '#fef2f2', borderRadius: 10,
              padding: 8, alignItems: 'center',
              borderWidth: 1, borderColor: '#fee2e2',
            }}>
              <Text style={{ fontSize: 9, color: '#ef4444', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
                Failed
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#dc2626' }}>{result.subjectsFailed}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderColor: '#f8fafc',
        }}>
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>
            {TERM_LABELS[result.term] ?? result.term} · {result.academicYear}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
      <View style={{ height: 4, backgroundColor: '#e2e8f0' }} />
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f5f9' }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 14, backgroundColor: '#f1f5f9', borderRadius: 6, width: '55%' }} />
            <View style={{ height: 10, backgroundColor: '#f1f5f9', borderRadius: 6, width: '35%' }} />
          </View>
        </View>
        <View style={{ height: 34, backgroundColor: '#f1f5f9', borderRadius: 6, width: '40%' }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3].map(i => <View key={i} style={{ flex: 1, height: 52, backgroundColor: '#f1f5f9', borderRadius: 10 }} />)}
        </View>
      </View>
    </View>
  );
}

export default function ChildResultsScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const { data: results = [], isLoading } = useStudentAllResults(studentId);

  const byYear = results.reduce<Record<string, TermResult[]>>((acc, r) => {
    const year = r.academicYear ?? 'Unknown';
    if (!acc[year]) acc[year] = [];
    acc[year].push(r);
    return acc;
  }, {});
  const sortedYears = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  const studentName = results[0]?.student
    ? `${results[0].student.firstName} ${results[0].student.lastName}`
    : 'Child';

  const avgPct = results.length
    ? results.reduce((s, r) => s + Number(r.overallPercentage), 0) / results.length
    : 0;
  const bestResult = results.reduce<TermResult | null>(
    (best, r) => !best || Number(r.overallPercentage) > Number(best.overallPercentage) ? r : best,
    null,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#0ea5e9',
        paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>
              {studentName}'s Results
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
              Published term results · grouped by year
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
      >
        {/* Summary stats */}
        {!isLoading && results.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { label: 'Terms', value: `${results.length}`, color: '#6366f1' },
              { label: 'Avg Score', value: `${avgPct.toFixed(1)}%`, color: '#3b82f6' },
              { label: 'Best', value: bestResult ? `${Number(bestResult.overallPercentage).toFixed(0)}%` : '—', color: '#f59e0b' },
              { label: 'Latest Pos.', value: positionSuffix(results[0]?.classPosition ?? null), color: '#10b981' },
            ].map(s => (
              <View key={s.label} style={{
                flex: 1, borderRadius: 14, padding: 10,
                backgroundColor: s.color,
              }}>
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {s.label}
                </Text>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff', marginTop: 2 }} numberOfLines={1}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : results.length === 0 ? (
          <View style={{
            alignItems: 'center', paddingVertical: 56,
            backgroundColor: '#fff', borderRadius: 20,
            borderWidth: 2, borderColor: '#e0f2fe', borderStyle: 'dashed',
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: '#e0f2fe', marginBottom: 16,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="bar-chart-outline" size={32} color="#7dd3fc" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151' }}>No results yet</Text>
            <Text style={{
              fontSize: 12, color: '#9ca3af', marginTop: 6,
              textAlign: 'center', maxWidth: 220, lineHeight: 18,
            }}>
              Results will appear here once published by the school.
            </Text>
          </View>
        ) : (
          sortedYears.map(year => {
            const yearResults = byYear[year]
              .slice()
              .sort((a, b) => (TERM_ORDER[a.term] ?? 99) - (TERM_ORDER[b.term] ?? 99));
            return (
              <View key={year} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                  <Text style={{
                    fontSize: 10, fontWeight: '700', color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: 1.2,
                  }}>
                    {year} · {yearResults.length} {yearResults.length === 1 ? 'term' : 'terms'}
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                </View>
                {yearResults.map(result => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
