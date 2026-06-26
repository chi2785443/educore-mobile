import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStudentReports } from '@/hooks/useReports';
import { StudentReport, ReportType } from '@/interface/report.interface';

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  baseline:    'Baseline Report',
  weekly:      'Weekly Report',
  monthly:     'Monthly Report',
  term_end:    'Term-End Report',
  session_end: 'Session-End Report',
};

const TYPE_COLORS: Record<ReportType, string> = {
  baseline:    '#6366f1',
  weekly:      '#3b82f6',
  monthly:     '#10b981',
  term_end:    '#f59e0b',
  session_end: '#8b5cf6',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < rating ? 'star' : 'star-outline'}
          size={11}
          color={i < rating ? '#f59e0b' : '#e2e8f0'}
        />
      ))}
    </View>
  );
}

function ReportCard({ report }: { report: StudentReport }) {
  const color = TYPE_COLORS[report.reportType] ?? '#6366f1';
  const label = report.title ?? REPORT_TYPE_LABELS[report.reportType] ?? report.reportType;
  const rating = report.behaviorRating ?? 0;
  const subCount = report.subjectEntries?.length ?? 0;
  const strCount = report.strengths?.length ?? 0;
  const afiCount = report.areasForImprovement?.length ?? 0;
  const teacherName = report.teacher
    ? `${report.teacher.firstName} ${report.teacher.lastName}`
    : null;

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
      {/* Color stripe */}
      <View style={{ height: 4, backgroundColor: color }} />

      <View style={{ padding: 16 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: color + '18',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="document-text" size={20} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }} numberOfLines={2}>
              {label}
            </Text>
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
              {report.classroom?.name ?? '—'}
              {report.academicYear ? ` · ${report.academicYear}` : ''}
            </Text>
          </View>
        </View>

        {/* Behavior rating */}
        {rating > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color, lineHeight: 32 }}>
              {rating}<Text style={{ fontSize: 14, fontWeight: '600', color: '#94a3b8' }}>/5</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <StarRow rating={rating} />
              <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>behaviour</Text>
            </View>
          </View>
        )}

        {/* General remarks */}
        {report.generalRemarks ? (
          <Text style={{
            fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 12,
          }} numberOfLines={3}>
            {report.generalRemarks}
          </Text>
        ) : null}

        {/* Mini stats */}
        {(subCount > 0 || strCount > 0 || afiCount > 0) && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {subCount > 0 && (
              <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                <Ionicons name="book-outline" size={13} color="#94a3b8" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#374151', marginTop: 2 }}>{subCount}</Text>
                <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Subjects</Text>
              </View>
            )}
            {strCount > 0 && (
              <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#dcfce7' }}>
                <Ionicons name="trending-up-outline" size={13} color="#16a34a" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#15803d', marginTop: 2 }}>{strCount}</Text>
                <Text style={{ fontSize: 9, color: '#16a34a', fontWeight: '700', textTransform: 'uppercase' }}>Strengths</Text>
              </View>
            )}
            {afiCount > 0 && (
              <View style={{ flex: 1, backgroundColor: '#fffbeb', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fef3c7' }}>
                <Ionicons name="trending-down-outline" size={13} color="#d97706" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#b45309', marginTop: 2 }}>{afiCount}</Text>
                <Text style={{ fontSize: 9, color: '#d97706', fontWeight: '700', textTransform: 'uppercase' }}>Improve</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, borderTopWidth: 1, borderColor: '#f8fafc',
        }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>{formatDate(report.createdAt)}</Text>
            </View>
            {teacherName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="person-outline" size={11} color="#94a3b8" />
                <Text style={{ fontSize: 10, color: '#94a3b8' }} numberOfLines={1}>{teacherName}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
      borderWidth: 1, borderColor: '#f1f5f9',
    }}>
      <View style={{ height: 4, backgroundColor: '#e2e8f0' }} />
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f5f9' }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 14, backgroundColor: '#f1f5f9', borderRadius: 6, width: '65%' }} />
            <View style={{ height: 10, backgroundColor: '#f1f5f9', borderRadius: 6, width: '45%' }} />
          </View>
        </View>
        <View style={{ height: 28, backgroundColor: '#f1f5f9', borderRadius: 6, width: '30%' }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ flex: 1, height: 58, backgroundColor: '#f1f5f9', borderRadius: 10 }} />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ChildReportsScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const { data: reports = [], isLoading } = useStudentReports(studentId);

  const byYear = reports.reduce<Record<string, StudentReport[]>>((acc, r) => {
    const year = r.academicYear ?? 'Unknown';
    if (!acc[year]) acc[year] = [];
    acc[year].push(r);
    return acc;
  }, {});
  const sortedYears = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  const studentName = reports[0]?.student
    ? `${reports[0].student.firstName} ${reports[0].student.lastName}`
    : 'Child';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#7c3aed',
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
              {studentName}&apos;s Reports
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
              Approved school reports · most recent first
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : reports.length === 0 ? (
          <View style={{
            alignItems: 'center', paddingVertical: 56,
            backgroundColor: '#fff', borderRadius: 20,
            borderWidth: 2, borderColor: '#ede9fe', borderStyle: 'dashed',
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: '#ede9fe', marginBottom: 16,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="document-text-outline" size={32} color="#a78bfa" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151' }}>No reports yet</Text>
            <Text style={{
              fontSize: 12, color: '#9ca3af', marginTop: 6,
              textAlign: 'center', maxWidth: 220, lineHeight: 18,
            }}>
              Reports will appear here once approved by the school.
            </Text>
          </View>
        ) : (
          sortedYears.map(year => (
            <View key={year} style={{ gap: 12 }}>
              {/* Year divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                <Text style={{
                  fontSize: 10, fontWeight: '700', color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 1.2,
                }}>
                  {year} · {byYear[year].length} {byYear[year].length === 1 ? 'report' : 'reports'}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              </View>
              {byYear[year]
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(report => (
                  <ReportCard key={report.id} report={report} />
                ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
