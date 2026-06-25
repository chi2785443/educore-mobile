import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import { useMyAssessments, useSchoolAssessments } from '@/hooks/useAssessment';
import { useMyTeacherClassrooms, useClassroomsBySchool } from '@/hooks/useClassroom';
import { useSchoolSettings } from '@/hooks/useSchool';
import { Assessment, AssessmentStatus, AssessmentType } from '@/interface/assessment.interface';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import CreateAssessmentSheet from '@/components/assessment/CreateAssessmentSheet';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';
import LoadingScreen from '@/components/ui/LoadingScreen';

const TYPE_COLOR: Record<AssessmentType, string> = {
  exam: '#e11d48', test: '#7c3aed', quiz: '#0ea5e9', assignment: '#10b981',
};

type StatusFilter = 'all' | AssessmentStatus;

export default function AssessmentsScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';
  const role = primary?.role ?? '';
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreate, setShowCreate] = useState(false);

  // Staff see their own assessments; admins see all school assessments
  const staffResult = useMyAssessments(!isAdmin);
  const adminResult = useSchoolAssessments(isAdmin ? schoolId : undefined);
  const { data: rawData, isLoading, refetch } = isAdmin ? adminResult : staffResult;

  // Classrooms for the create sheet's internal classroom search
  const adminClassrooms = useClassroomsBySchool(isAdmin ? schoolId : undefined);
  const staffClassrooms = useMyTeacherClassrooms(!isAdmin ? schoolId : undefined);
  const classroomData = isAdmin ? adminClassrooms.data : staffClassrooms.data;
  const classrooms: { id: string; name: string; grade?: string; section?: string }[] = useMemo(() => {
    const d = classroomData as unknown;
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object' && 'data' in d) return (d as { data: { id: string; name: string }[] }).data ?? [];
    return [];
  }, [classroomData]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const assessments: Assessment[] = useMemo(() => {
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object' && 'data' in rawData)
      return (rawData as { data: Assessment[] }).data ?? [];
    return [];
  }, [rawData]);

  const filtered = useMemo(() =>
    statusFilter === 'all' ? assessments : assessments.filter(a => a.status === statusFilter),
    [assessments, statusFilter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { subjectName: string; subjectColor: string; items: Assessment[] }>();
    for (const a of filtered) {
      const key = a.subjectId ?? '__no_subject';
      if (!map.has(key)) {
        map.set(key, {
          subjectName: a.subject?.name ?? 'General',
          subjectColor: a.subject?.color ?? '#4C3FC4',
          items: [],
        });
      }
      map.get(key)!.items.push(a);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[1].subjectName.localeCompare(b[1].subjectName)
    );
  }, [filtered]);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'published', label: 'Published' },
    { key: 'completed', label: 'Completed' },
  ];

  const handleCreate = () => setShowCreate(true);

  if (isLoading) return <LoadingScreen color="#4C3FC4" message="Loading assessments" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#4C3FC4', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Assessments</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 1 }}>
              {filtered.length} assessment{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Pressable
            onPress={handleCreate}
            style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#F5486A', alignItems: 'center', justifyContent: 'center', shadowColor: '#F5486A', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6 }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ClassroomDetailTabs
        tabs={statusTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        accentColor="#4C3FC4"
      />

      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No assessments</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {statusFilter !== 'all' ? 'No assessments match this filter.' : 'Tap + to create your first assessment.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 36 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C3FC4" colors={['#4C3FC4']} />}
        >
          {grouped.map(([subjectKey, { subjectName, subjectColor, items }]) => (
            <View key={subjectKey} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: subjectColor }} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 }}>
                  {subjectName}
                </Text>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>{items.length}</Text>
              </View>
              {items.map(a => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  onPress={() => a.classroomId
                    ? router.push(`/assessment/${a.classroomId}/${a.id}`)
                    : undefined
                  }
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <CreateAssessmentSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        classrooms={classrooms}
        schoolId={schoolId}
      />
    </SafeAreaView>
  );
}
