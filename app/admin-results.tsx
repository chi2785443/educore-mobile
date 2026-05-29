import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useResultsFilters, useSchoolResults } from '@/hooks/useResults';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';
import LoadingScreen from '@/components/ui/LoadingScreen';

const HEADER_BG = '#1e1b4b';

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

const TERM_LABELS: Record<string, string> = {
  first_term: 'First Term',
  second_term: 'Second Term',
  third_term: 'Third Term',
};

export default function AdminResultsScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';

  const { data: filters, isLoading: loadingFilters } = useResultsFilters(schoolId);

  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    if (filters) {
      if (!selectedTerm && filters.terms.length > 0) setSelectedTerm(filters.terms[0]);
      if (!selectedYear && filters.academicYears.length > 0) setSelectedYear(filters.academicYears[0]);
    }
  }, [filters]);

  const { data: results, isLoading: loadingResults } = useSchoolResults(schoolId, selectedTerm, selectedYear);

  if (loadingFilters) return <LoadingScreen color="#4C3FC4" message="Loading results" />;

  const hasFilters = filters && (filters.terms.length > 0 || filters.academicYears.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: HEADER_BG,
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Results Overview</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 }}>School-wide performance</Text>
          </View>
          <Ionicons name="trophy-outline" size={22} color="#a5b4fc" />
        </View>

        {/* Summary stats */}
        {results && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Students', value: results.totalStudents, color: '#fff' },
              { label: 'Avg Score', value: `${results.overallAverage}%`, color: results.overallAverage >= 60 ? '#4ade80' : '#fbbf24' },
              { label: 'Passed', value: `${results.passPercentage}%`, color: results.passPercentage >= 60 ? '#4ade80' : '#fbbf24' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Filter tabs */}
      {!hasFilters ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No results yet</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Generate results from the web dashboard to see them here.
          </Text>
        </View>
      ) : (
        <>
          {/* Academic year selector */}
          {filters.academicYears.length > 1 && (
            <ClassroomDetailTabs
              tabs={filters.academicYears.map(y => ({ key: y, label: y }))}
              activeTab={selectedYear}
              onTabChange={setSelectedYear}
              accentColor="#4C3FC4"
            />
          )}

          {/* Term selector */}
          {filters.terms.length > 1 && (
            <ClassroomDetailTabs
              tabs={filters.terms.map(t => ({ key: t, label: TERM_LABELS[t] ?? t }))}
              activeTab={selectedTerm}
              onTabChange={setSelectedTerm}
              accentColor="#6366f1"
            />
          )}

          {loadingResults ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#4C3FC4" size="large" />
            </View>
          ) : !results || results.classrooms.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
              <Ionicons name="document-outline" size={48} color="#d1d5db" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center' }}>
                No results for {TERM_LABELS[selectedTerm] ?? selectedTerm} {selectedYear}
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
              {results.classrooms.map(cls => {
                const avg = cls.classAverage;
                const passRate = cls.totalStudents > 0
                  ? Math.round((cls.passCount / cls.totalStudents) * 100)
                  : 0;
                const topName = cls.topStudent?.student
                  ? `${cls.topStudent.student.firstName} ${cls.topStudent.student.lastName}`
                  : null;
                return (
                  <View key={cls.classroomId} style={{
                    backgroundColor: '#fff', borderRadius: 20,
                    borderWidth: 1, borderColor: '#f1f5f9',
                    shadowColor: '#0f172a', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
                    overflow: 'hidden',
                  }}>
                    {/* Card header */}
                    <View style={{ backgroundColor: HEADER_BG, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{cls.classroomName}</Text>
                      <View style={{ backgroundColor: gradeBg(avg), borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: gradeColor(avg) }}>{avg}%</Text>
                      </View>
                    </View>

                    {/* Stats row */}
                    <View style={{ flexDirection: 'row', padding: 14, gap: 8 }}>
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>{cls.totalStudents}</Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8' }}>Students</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: gradeColor(passRate) }}>{passRate}%</Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8' }}>Pass Rate</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#16a34a' }}>{cls.passCount}</Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8' }}>Passed</Text>
                      </View>
                    </View>

                    {/* Top student */}
                    {topName && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 12 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="medal-outline" size={14} color="#d97706" />
                        </View>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                          Top: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{topName}</Text>
                          {cls.topStudent?.overallPercentage != null && (
                            <Text style={{ color: gradeColor(cls.topStudent.overallPercentage) }}> · {Math.round(cls.topStudent.overallPercentage)}%</Text>
                          )}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
