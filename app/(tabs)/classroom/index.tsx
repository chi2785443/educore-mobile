import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import {
  useMyTeacherClassrooms, useMyStudentClassrooms, useClassroomsBySchool,
} from '@/hooks/useClassroom';
import { UserRole } from '@/interface/user.interface';
import LoadingScreen from '@/components/ui/LoadingScreen';

/* ── Grade colour map ──────────────────────────────────────────── */
const GRADE_PALETTE: Record<string, { fg: string; bg: string; grad: string }> = {
  JSS1: { fg: '#6366f1', bg: '#e0e7ff', grad: '#6366f1' },
  JSS2: { fg: '#0ea5e9', bg: '#e0f2fe', grad: '#0ea5e9' },
  JSS3: { fg: '#14b8a6', bg: '#d1fae5', grad: '#14b8a6' },
  SS1:  { fg: '#7c3aed', bg: '#ede9fe', grad: '#7c3aed' },
  SS2:  { fg: '#f59e0b', bg: '#fef3c7', grad: '#f59e0b' },
  SS3:  { fg: '#e11d48', bg: '#fce7f3', grad: '#e11d48' },
};
const DEFAULT_PAL = { fg: '#6366f1', bg: '#e0e7ff', grad: '#6366f1' };
const getPalette = (grade?: string) => (grade && GRADE_PALETTE[grade]) ?? DEFAULT_PAL;

/* ── Classroom type ────────────────────────────────────────────── */
interface Classroom {
  id: string;
  name: string;
  grade?: string;
  section?: string;
  capacity?: number;
  currentStudentCount?: number;
  isActive?: boolean;
  roomNumber?: string;
}

/* ── Classroom card ────────────────────────────────────────────── */
function ClassroomCard({ classroom }: { classroom: Classroom }) {
  const router = useRouter();
  const pal = getPalette(classroom.grade);
  const initials = classroom.name.slice(0, 2).toUpperCase();
  const occupancy = classroom.currentStudentCount ?? 0;
  const cap = classroom.capacity ?? 0;
  const pct = cap > 0 ? Math.min((occupancy / cap) * 100, 100) : 0;
  const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';

  return (
    <Pressable
      onPress={() => router.push(`/classroom/${classroom.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#f8fafc' : '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
      })}
    >
      {/* Gradient top band */}
      <View style={{
        height: 56, backgroundColor: pal.grad,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
      }}>
        {/* Circle initial */}
        <View style={{
          width: 36, height: 36, borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, lineHeight: 19 }} numberOfLines={1}>
            {classroom.name}
          </Text>
          {classroom.grade && (
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600', marginTop: 1 }}>
              {classroom.grade}{classroom.section ? ` · Section ${classroom.section}` : ''}
            </Text>
          )}
        </View>
        {classroom.isActive === false ? (
          <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>INACTIVE</Text>
          </View>
        ) : (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
        )}
      </View>

      {/* Body */}
      <View style={{ padding: 14, gap: 12 }}>
        {/* Meta pills */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {classroom.roomNumber && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Ionicons name="location-outline" size={11} color="#9ca3af" />
              <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>{classroom.roomNumber}</Text>
            </View>
          )}
          {cap > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Ionicons name="people-outline" size={11} color="#9ca3af" />
              <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>
                {occupancy}/{cap} students
              </Text>
            </View>
          )}
        </View>

        {/* Occupancy bar */}
        {cap > 0 && (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af' }}>Occupancy</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: barColor }}>{Math.round(pct)}%</Text>
            </View>
            <View style={{ height: 4, backgroundColor: '#f3f4f6', borderRadius: 2 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: barColor, width: `${pct}%` as `${number}%` }} />
            </View>
          </View>
        )}

        {/* Footer row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: classroom.isActive === false ? '#d1d5db' : '#4ade80' }} />
            <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '500' }}>
              {classroom.isActive === false ? 'Inactive' : 'Active'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 11, color: pal.fg, fontWeight: '700' }}>View details</Text>
            <Ionicons name="arrow-forward" size={12} color={pal.fg} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ── Main screen ───────────────────────────────────────────────── */
export default function ClassroomTab() {
  const [search, setSearch] = useState('');
  const [activeGrade, setActiveGrade] = useState<string | null>(null);

  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];

  const primary =
    memberships.find(m => m.schoolId === selectedSchoolId) ??
    memberships.find(m => m.isPrimary) ?? memberships[0] ?? null;

  const schoolId = primary?.schoolId ?? '';
  const role = primary?.role;
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN;
  const isStaff = role === UserRole.STAFF;
  const isStudent = role === UserRole.STUDENT;

  const adminResult = useClassroomsBySchool(isAdmin ? schoolId : undefined);
  const staffResult = useMyTeacherClassrooms(isStaff ? schoolId : undefined);
  const studentResult = useMyStudentClassrooms(isStudent ? schoolId : undefined);

  const result = isAdmin ? adminResult : isStaff ? staffResult : studentResult;
  const { isLoading, refetch } = result;
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const rawData: unknown = result.data;
  const classrooms: Classroom[] = useMemo(() => (
    Array.isArray(rawData) ? rawData
      : rawData && typeof rawData === 'object' && 'data' in rawData
        ? (rawData as { data: Classroom[] }).data ?? []
        : []
  ), [rawData]);

  const grades = useMemo(() => {
    const g = [...new Set(classrooms.map(c => c.grade).filter(Boolean))] as string[];
    return g.sort();
  }, [classrooms]);

  const filtered = useMemo(() => classrooms.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.grade?.toLowerCase().includes(search.toLowerCase()) ||
      c.section?.toLowerCase().includes(search.toLowerCase());
    const matchGrade = !activeGrade || c.grade === activeGrade;
    return matchSearch && matchGrade;
  }), [classrooms, search, activeGrade]);

  const pageTitle = isAdmin ? 'All Classrooms' : isStaff ? 'My Classrooms' : 'My Classes';

  if (isLoading) return <LoadingScreen color="#7c3aed" message="Loading classrooms" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>

      {/* ── Dark header ──────────────────────────────────────── */}
      <View style={{ backgroundColor: '#0B0F14', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
              {pageTitle}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
              {filtered.length} classroom{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="grid-outline" size={18} color="rgba(255,255,255,0.6)" />
          </View>
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 11,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        }}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.35)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, grade..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={{ flex: 1, color: '#fff', fontSize: 14, paddingVertical: 0 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.35)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Grade filter chips ────────────────────────────────── */}
      {grades.length > 1 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' }}
        >
          <Pressable
            onPress={() => setActiveGrade(null)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
              backgroundColor: !activeGrade ? '#7c3aed' : '#f3f4f6',
              borderWidth: 1, borderColor: !activeGrade ? '#7c3aed' : '#e5e7eb',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: !activeGrade ? '#fff' : '#6b7280' }}>
              All
            </Text>
          </Pressable>
          {grades.map(g => {
            const pal = getPalette(g);
            const isActive = activeGrade === g;
            return (
              <Pressable
                key={g}
                onPress={() => setActiveGrade(isActive ? null : g)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: isActive ? pal.fg : '#f3f4f6',
                  borderWidth: 1, borderColor: isActive ? pal.fg : '#e5e7eb',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : '#6b7280' }}>
                  {g}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* ── Content ──────────────────────────────────────────── */}
      {!primary ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="school-outline" size={30} color="#7c3aed" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No school selected</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Select a school from the Account tab to view classrooms.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="book-outline" size={30} color="#7c3aed" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
            {search ? 'No results found' : 'No classrooms yet'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {search
              ? `No classrooms match "${search}".`
              : 'Classrooms assigned to you will appear here.'}
          </Text>
          {(search || activeGrade) && (
            <Pressable
              onPress={() => { setSearch(''); setActiveGrade(null); }}
              style={{ marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#7c3aed' }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Clear filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}
        >
          {filtered.map(c => <ClassroomCard key={c.id} classroom={c} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
