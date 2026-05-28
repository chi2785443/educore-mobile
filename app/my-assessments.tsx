import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useMyStudentClassrooms } from '@/hooks/useClassroom';
import { assessmentService } from '@/services/assessment.service';
import { Assessment } from '@/interface/assessment.interface';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import LoadingScreen from '@/components/ui/LoadingScreen';

type StatusFilter = 'all' | 'available' | 'completed';

export default function MyAssessmentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  /* Fetch only classrooms this student is enrolled in */
  const { data: rawClassrooms, isLoading: loadingClassrooms, refetch: refetchClassrooms } =
    useMyStudentClassrooms(schoolId);

  const classroomIds = useMemo(() => {
    const d = rawClassrooms as unknown;
    if (Array.isArray(d)) return (d as { id: string }[]).map(c => c.id);
    if (d && typeof d === 'object' && 'data' in d) {
      const inner = (d as { data: { id: string }[] }).data;
      return Array.isArray(inner) ? inner.map(c => c.id) : [];
    }
    return [];
  }, [rawClassrooms]);

  /* Fan-out: one query per enrolled classroom */
  const assessmentQueries = useQueries({
    queries: classroomIds.map(cId => ({
      queryKey: ['assessments', 'classroom', cId] as const,
      queryFn: () => assessmentService.getAssessments({ classroomId: cId }),
      staleTime: 60_000,
    })),
  });

  const isLoading = loadingClassrooms || assessmentQueries.some(q => q.isLoading && !q.data);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchClassrooms();
    await queryClient.invalidateQueries({ queryKey: ['assessments', 'classroom'] });
    setRefreshing(false);
  }, [refetchClassrooms, queryClient]);

  /* Merge + deduplicate across classrooms */
  const assessments: Assessment[] = useMemo(() => {
    const seen = new Set<string>();
    const all: Assessment[] = [];
    for (const q of assessmentQueries) {
      for (const a of (q.data ?? [])) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          all.push(a);
        }
      }
    }
    return all;
  }, [assessmentQueries]);

  /* Students only see published/completed, respecting targetStudentIds */
  const visible = useMemo(() => assessments.filter(a => {
    if (a.status !== 'published' && a.status !== 'completed') return false;
    if (a.targetStudentIds && a.targetStudentIds.length > 0 && user?.id) {
      return a.targetStudentIds.includes(user.id);
    }
    return true;
  }), [assessments, user?.id]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return visible;
    if (statusFilter === 'available') return visible.filter(a => a.status === 'published');
    return visible.filter(a => a.status === 'completed');
  }, [visible, statusFilter]);

  /* Group by classroom */
  const grouped = useMemo(() => {
    const map = new Map<string, { classroomName: string; items: Assessment[] }>();
    for (const a of filtered) {
      const key = a.classroomId ?? '__no_class';
      if (!map.has(key)) {
        map.set(key, { classroomName: a.classroom?.name ?? 'General', items: [] });
      }
      map.get(key)!.items.push(a);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const statusTabs: { key: StatusFilter; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { key: 'all',       label: 'All',       icon: 'grid-outline' },
    { key: 'available', label: 'Available', icon: 'clipboard-outline' },
    { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
  ];

  if (isLoading) return <LoadingScreen color="#6366f1" message="Loading assessments" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#0c1a40', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Assessments</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {visible.length} assessment{visible.length !== 1 ? 's' : ''} assigned
            </Text>
          </View>
        </View>

        {/* Stats strip */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Available', value: visible.filter(a => a.status === 'published').length,  color: '#6366f1' },
            { label: 'Completed', value: visible.filter(a => a.status === 'completed').length,  color: '#10b981' },
            { label: 'Total',     value: visible.length,                                         color: '#f59e0b' },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: s.color, fontSize: 20, fontWeight: '900' }}>{s.value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Filter chips */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        {statusTabs.map(s => {
          const active = statusFilter === s.key;
          return (
            <Pressable key={s.key} onPress={() => setStatusFilter(s.key)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? '#6366f1' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#6366f1' : '#e5e7eb' }}>
              <Ionicons name={s.icon} size={13} color={active ? '#fff' : '#6b7280'} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
            {classroomIds.length === 0
              ? 'Not enrolled in any class'
              : statusFilter === 'available' ? 'No available assessments'
              : statusFilter === 'completed' ? 'No completed assessments'
              : 'No assessments yet'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {classroomIds.length === 0
              ? 'Enroll in a class to see your assessments here.'
              : 'Published assessments from your teachers will appear here.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 36 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
        >
          {grouped.map(([cId, { classroomName, items }]) => (
            <View key={cId} style={{ gap: 10 }}>
              {/* Classroom section header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366f1' }} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 }}>
                  {classroomName}
                </Text>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>{items.length}</Text>
              </View>
              {items.map(a => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  onPress={() => a.classroomId
                    ? router.push(`/features/${a.classroomId}/assessment/${a.id}`)
                    : undefined
                  }
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
