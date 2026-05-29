import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, RefreshControl, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import {
  useMyTeacherClassrooms, useMyStudentClassrooms, useClassroomsBySchool, useCreateClassroom,
} from '@/hooks/useClassroom';
import { UserRole } from '@/interface/user.interface';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';

/* ── Grade colour map ──────────────────────────────────────────── */
const GRADE_PALETTE: Record<string, { fg: string; bg: string; grad: string }> = {
  JSS1: { fg: '#F5486A', bg: '#FFF0F0', grad: '#F5486A' },
  JSS2: { fg: '#4C3FC4', bg: '#F0EEFF', grad: '#4C3FC4' },
  JSS3: { fg: '#059669', bg: '#E8F5EE', grad: '#059669' },
  SS1:  { fg: '#d97706', bg: '#FEF3C7', grad: '#d97706' },
  SS2:  { fg: '#0284c7', bg: '#E8F4FF', grad: '#0284c7' },
  SS3:  { fg: '#7c3aed', bg: '#EDE9FE', grad: '#7c3aed' },
};
const DEFAULT_PAL = { fg: '#4C3FC4', bg: '#F0EEFF', grad: '#4C3FC4' };
const getPalette = (grade?: string): { fg: string; bg: string; grad: string } => (grade ? GRADE_PALETTE[grade] : null) ?? DEFAULT_PAL;

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

function ClassroomCard({ classroom }: { classroom: Classroom }) {
  const router = useRouter();
  const pal = getPalette(classroom.grade);
  const initials = classroom.name.slice(0, 2).toUpperCase();
  const occupancy = classroom.currentStudentCount ?? 0;
  const cap = classroom.capacity ?? 0;
  const isInactive = classroom.isActive === false;

  return (
    <Pressable
      onPress={() => router.push(`/features/${classroom.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1, marginBottom: 10 })}
    >
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        flexDirection: 'row',
        shadowColor: pal.fg,
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 3,
      }}>
        {/* Colored left accent */}
        <View style={{ width: 6, backgroundColor: pal.fg }} />

        {/* Avatar */}
        <View style={{ paddingVertical: 16, paddingLeft: 14, paddingRight: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: 48, height: 48, borderRadius: 16,
            backgroundColor: pal.bg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: pal.fg, fontWeight: '900', fontSize: 16 }}>{initials}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 5 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 }} numberOfLines={1}>
            {classroom.name}
          </Text>

          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {classroom.grade && (
              <View style={{ backgroundColor: pal.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: pal.fg, fontSize: 11, fontWeight: '700' }}>
                  {classroom.grade}{classroom.section ? ` · ${classroom.section}` : ''}
                </Text>
              </View>
            )}
            {cap > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="people-outline" size={11} color="#9ca3af" />
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>{occupancy}/{cap}</Text>
              </View>
            )}
            {classroom.roomNumber && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="location-outline" size={11} color="#9ca3af" />
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>{classroom.roomNumber}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isInactive ? '#d1d5db' : '#4ade80' }} />
            <Text style={{ fontSize: 10, color: isInactive ? '#9ca3af' : '#22c55e', fontWeight: '600' }}>
              {isInactive ? 'Inactive' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <View style={{ paddingRight: 14, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: pal.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-forward" size={15} color={pal.fg} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const GRADES = ['JSS1','JSS2','JSS3','SS1','SS2','SS3'];
const SECTIONS = ['A','B','C','D','E'];

function CreateClassroomSheet({ visible, onClose, schoolId }: { visible: boolean; onClose: () => void; schoolId: string }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [capacity, setCapacity] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const mutation = useCreateClassroom(schoolId);

  const reset = () => { setName(''); setGrade(''); setSection(''); setCapacity(''); setRoomNumber(''); };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Classroom name is required'); return; }
    try {
      await mutation.mutateAsync({ schoolId, name: name.trim(), grade: grade || undefined, section: section || undefined, capacity: capacity ? parseInt(capacity, 10) : undefined, roomNumber: roomNumber.trim() || undefined });
      toast.success('Classroom created');
      reset(); onClose();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to create classroom'); }
  };

  const inputStyle = { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1e293b' };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 }}>
          <Pressable onPress={onClose}><Ionicons name="close" size={22} color="#374151" /></Pressable>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', flex: 1 }}>New Classroom</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Name *</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. JSS1A" placeholderTextColor="#9ca3af" style={inputStyle} />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Grade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {GRADES.map(g => { const active = grade === g; return (
                  <Pressable key={g} onPress={() => setGrade(active ? '' : g)}>
                    <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? '#4C3FC4' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#4C3FC4' : '#e5e7eb' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{g}</Text>
                    </View>
                  </Pressable>
                ); })}
              </View>
            </ScrollView>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Section</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SECTIONS.map(s => { const active = section === s; return (
                  <Pressable key={s} onPress={() => setSection(active ? '' : s)}>
                    <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? '#6366f1' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#6366f1' : '#e5e7eb' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{s}</Text>
                    </View>
                  </Pressable>
                ); })}
              </View>
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Capacity</Text>
              <TextInput value={capacity} onChangeText={setCapacity} placeholder="e.g. 40" placeholderTextColor="#9ca3af" keyboardType="number-pad" style={inputStyle} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Room Number</Text>
              <TextInput value={roomNumber} onChangeText={setRoomNumber} placeholder="e.g. B12" placeholderTextColor="#9ca3af" style={inputStyle} />
            </View>
          </View>
          <Pressable onPress={handleCreate} disabled={mutation.isPending} style={({ pressed }) => ({ opacity: pressed || mutation.isPending ? 0.8 : 1 })}>
            <View style={{ backgroundColor: '#4C3FC4', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              {mutation.isPending && <ActivityIndicator color="#fff" size="small" />}
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>{mutation.isPending ? 'Creating…' : 'Create Classroom'}</Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ClassroomListScreen() {
  const [search, setSearch] = useState('');
  const [activeGrade, setActiveGrade] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

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
    const matchGrade = activeGrade === 'all' || c.grade === activeGrade;
    return matchSearch && matchGrade;
  }), [classrooms, search, activeGrade]);

  const pageTitle = isAdmin ? 'All Classrooms' : isStaff ? 'My Classrooms' : 'My Classes';

  if (isLoading) return <LoadingScreen color="#4C3FC4" message="Loading classrooms" />;

  return (
    <>
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <View style={{ backgroundColor: '#4C3FC4', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
            {pageTitle}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>
            {filtered.length} classroom{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>

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

      {grades.length > 1 && (
        <ClassroomDetailTabs
          tabs={[{ key: 'all', label: 'All' }, ...grades.map(g => ({ key: g, label: g }))]}
          activeTab={activeGrade}
          onTabChange={setActiveGrade}
          accentColor="#4C3FC4"
        />
      )}

      <View style={{ flex: 1 }}>
      {!primary ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="school-outline" size={30} color="#4C3FC4" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No school selected</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Select a school from the Account tab to view classrooms.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="book-outline" size={30} color="#4C3FC4" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
            {search ? 'No results found' : 'No classrooms yet'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {search
              ? `No classrooms match "${search}".`
              : 'Classrooms assigned to you will appear here.'}
          </Text>
          {(search || activeGrade !== 'all') && (
            <Pressable
              onPress={() => { setSearch(''); setActiveGrade('all'); }}
              style={{ marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#4C3FC4' }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Clear filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C3FC4" colors={['#4C3FC4']} />}
        >
          {filtered.map(c => <ClassroomCard key={c.id} classroom={c} />)}
        </ScrollView>
      )}

      {/* FAB — admin only */}
      {isAdmin && (
        <Pressable onPress={() => setShowCreate(true)} style={{ position: 'absolute', bottom: 28, right: 20 }}>
          <View style={{ backgroundColor: '#4C3FC4', width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', shadowColor: '#4C3FC4', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6 }}>
            <Ionicons name="add" size={26} color="#fff" />
          </View>
        </Pressable>
      )}
      </View>
    </SafeAreaView>
    <CreateClassroomSheet visible={showCreate} onClose={() => setShowCreate(false)} schoolId={schoolId} />
    </>
  );
}
