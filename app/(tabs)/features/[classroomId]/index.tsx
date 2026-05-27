import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import { DayOfWeek } from '@/interface/timetable.interface';
import { Assessment, AssessmentStatus, AssessmentType } from '@/interface/assessment.interface';
import {
  useClassroomDetail,
  useClassroomStudents,
  useClassroomTeachers,
} from '@/hooks/useClassroom';
import { useClassroomTimetable } from '@/hooks/useTimetable';
import { useMyAssessments, useClassroomAssessments } from '@/hooks/useAssessment';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';
import TimetableDay from '@/components/classroom/TimetableDay';
import MemberRow from '@/components/classroom/MemberRow';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import CreateAssessmentSheet from '@/components/assessment/CreateAssessmentSheet';
import LoadingScreen from '@/components/ui/LoadingScreen';

/* ── Grade palette ─────────────────────────────────────────────── */
const GRADE_PALETTE: Record<string, { fg: string; grad: string }> = {
  JSS1: { fg: '#6366f1', grad: '#6366f1' },
  JSS2: { fg: '#0ea5e9', grad: '#0ea5e9' },
  JSS3: { fg: '#14b8a6', grad: '#14b8a6' },
  SS1:  { fg: '#7c3aed', grad: '#7c3aed' },
  SS2:  { fg: '#f59e0b', grad: '#f59e0b' },
  SS3:  { fg: '#e11d48', grad: '#e11d48' },
};
const DEFAULT_PAL = { fg: '#6366f1', grad: '#6366f1' };
const getPalette = (grade?: string) => (grade && GRADE_PALETTE[grade]) ?? DEFAULT_PAL;

const ORDERED_DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri',
};

function getTodayDayOfWeek(): DayOfWeek {
  const day = new Date().getDay(); // 0=Sun ... 6=Sat
  const map: Record<number, DayOfWeek> = {
    1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY',
  };
  return map[day] ?? 'MONDAY';
}

type DetailTab = 'schedule' | 'members' | 'assessments';
type StatusFilter = 'all' | AssessmentStatus;

/* ── Empty state ───────────────────────────────────────────────── */
function EmptyState({ icon, title, subtitle }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 32 }}>
      <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={28} color="#9ca3af" />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#374151', textAlign: 'center' }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text>}
    </View>
  );
}

/* ── Main screen ───────────────────────────────────────────────── */
export default function ClassroomDetailScreen() {
  const { classroomId } = useLocalSearchParams<{ classroomId: string }>();
  const router = useRouter();

  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId)
    ?? memberships.find(m => m.isPrimary) ?? memberships[0] ?? null;
  const schoolId = primary?.schoolId ?? '';
  const role = primary?.role;
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;
  const isStaff = role === UserRole.STAFF;
  const isStudent = role === UserRole.STUDENT;

  const [activeTab, setActiveTab] = useState<DetailTab>('schedule');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreate, setShowCreate] = useState(false);

  /* Data */
  const { data: classroom, isLoading: loadingClassroom, refetch: refetchClassroom } = useClassroomDetail(classroomId);
  const { data: timetable = {}, isLoading: loadingTimetable, refetch: refetchTimetable } = useClassroomTimetable(classroomId);
  const { data: students = [], isLoading: loadingStudents, refetch: refetchStudents } = useClassroomStudents(
    activeTab === 'members' ? classroomId : undefined,
  );
  const { data: teachers = [], isLoading: loadingTeachers, refetch: refetchTeachers } = useClassroomTeachers(
    (activeTab === 'members' && isAdmin) ? classroomId : undefined,
  );
  // Staff: own assessments filtered by classroom; admin/student: classroom assessments
  const { data: myAssessments = [], isLoading: loadingMine, refetch: refetchMine } = useMyAssessments(
    isStaff && activeTab === 'assessments',
  );
  const { data: classroomAssessments = [], isLoading: loadingCls, refetch: refetchCls } = useClassroomAssessments(
    (isAdmin || isStudent) && activeTab === 'assessments' ? classroomId : undefined,
    schoolId,
  );
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchClassroom(), refetchTimetable(), refetchStudents(), refetchTeachers(), refetchMine(), refetchCls()]);
    setRefreshing(false);
  }, [refetchClassroom, refetchTimetable, refetchStudents, refetchTeachers, refetchMine, refetchCls]);

  /* Derived assessments */
  const rawAssessments: Assessment[] = isStaff
    ? myAssessments.filter(a => a.classroomId === classroomId)
    : classroomAssessments;

  const filteredAssessments = useMemo(() => {
    if (statusFilter === 'all') return rawAssessments;
    return rawAssessments.filter(a => a.status === statusFilter);
  }, [rawAssessments, statusFilter]);

  const pal = getPalette(classroom?.grade);

  /* Tabs config */
  const tabs: { key: DetailTab; label: string }[] = isStudent
    ? [{ key: 'schedule', label: 'Schedule' }, { key: 'assessments', label: 'Assessments' }]
    : [
        { key: 'schedule', label: 'Schedule' },
        { key: 'members', label: 'Members' },
        { key: 'assessments', label: 'Assessments' },
      ];

  const statusTabs: { key: StatusFilter; label: string }[] = isStudent
    ? [
        { key: 'all', label: 'All' },
        { key: 'published', label: 'Available' },
        { key: 'completed', label: 'Completed' },
      ]
    : [
        { key: 'all', label: 'All' },
        { key: 'draft', label: 'Draft' },
        { key: 'published', label: 'Published' },
        { key: 'completed', label: 'Completed' },
      ];

  if (loadingClassroom) return <LoadingScreen color={pal.fg} message="Loading classroom" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={{ backgroundColor: '#0B0F14', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }} numberOfLines={1}>
              {classroom?.name ?? '—'}
            </Text>
            {(classroom?.grade || classroom?.section) && (
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>
                {[classroom.grade, classroom.section ? `Section ${classroom.section}` : null]
                  .filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
          {/* Grade badge */}
          {classroom?.grade && (
            <View style={{ backgroundColor: pal.grad, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{classroom.grade}</Text>
            </View>
          )}
        </View>

        {/* Meta row */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {classroom?.roomNumber && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.4)" />
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' }}>{classroom.roomNumber}</Text>
            </View>
          )}
          {classroom?.currentStudentCount !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.4)" />
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' }}>
                {classroom.currentStudentCount} students
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <ClassroomDetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={pal.fg}
      />

      {/* ── Content ─────────────────────────────────────────────── */}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <View style={{ flex: 1 }}>
          {/* Day selector — compact circles, visually distinct from main tabs */}
          <View style={{
            backgroundColor: '#fff',
            borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
            flexDirection: 'row',
            paddingHorizontal: 16, paddingVertical: 10,
            justifyContent: 'space-between',
          }}>
            {ORDERED_DAYS.map(day => {
              const isActive = selectedDay === day;
              const isToday = getTodayDayOfWeek() === day;
              return (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isActive ? pal.fg : isToday ? pal.fg + '18' : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: isActive ? '800' : '600',
                    color: isActive ? '#fff' : isToday ? pal.fg : '#6b7280',
                  }}>
                    {DAY_LABELS[day]}
                  </Text>
                  {/* Today dot */}
                  {isToday && !isActive && (
                    <View style={{
                      width: 4, height: 4, borderRadius: 2,
                      backgroundColor: pal.fg,
                      position: 'absolute', bottom: 5,
                    }} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {loadingTimetable ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={pal.fg} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 36 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}
            >
              {(timetable[selectedDay] ?? []).length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title={`No periods on ${selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}`}
                  subtitle="No classes are scheduled for this day."
                />
              ) : (
                (timetable[selectedDay] ?? []).map(entry => (
                  <TimetableDay key={entry.id} entry={entry} />
                ))
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
          {(loadingTeachers || loadingStudents) && (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator color={pal.fg} />
            </View>
          )}

          {/* Teachers section (admin only) */}
          {isAdmin && !loadingTeachers && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#6b7280', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 }}>
                  Teachers
                </Text>
                <View style={{ backgroundColor: '#ede9fe', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed' }}>{teachers.length}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#fff' }}>
                {teachers.length === 0 ? (
                  <Text style={{ padding: 16, color: '#9ca3af', fontSize: 13 }}>No teachers assigned</Text>
                ) : (
                  teachers.map(t => <MemberRow key={t.id} member={t} role="teacher" />)
                )}
              </View>
            </View>
          )}

          {/* Students section */}
          {!loadingStudents && (
            <View style={{ marginTop: isAdmin ? 8 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#6b7280', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 }}>
                  Students
                </Text>
                <View style={{ backgroundColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>{students.length}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#fff' }}>
                {students.length === 0 ? (
                  <Text style={{ padding: 16, color: '#9ca3af', fontSize: 13 }}>No students enrolled</Text>
                ) : (
                  students.map(s => <MemberRow key={s.id} member={s} role="student" />)
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ASSESSMENTS TAB */}
      {activeTab === 'assessments' && (
        <View style={{ flex: 1 }}>
          {/* Status filter chips */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', maxHeight: 52 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' }}
          >
            {statusTabs.map(s => {
              const isActive = statusFilter === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setStatusFilter(s.key)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                    backgroundColor: isActive ? pal.fg : '#f3f4f6',
                    borderWidth: 1, borderColor: isActive ? pal.fg : '#e5e7eb',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : '#6b7280' }}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {(loadingMine || loadingCls) ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={pal.fg} />
            </View>
          ) : filteredAssessments.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="No assessments"
              subtitle={
                isStaff
                  ? "Create your first assessment using the + button below."
                  : "No assessments have been assigned to this classroom yet."
              }
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}
            >
              {filteredAssessments.map(a => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  onPress={() =>
                    router.push(`/features/${classroomId}/assessment/${a.id}`)
                  }
                />
              ))}
            </ScrollView>
          )}

          {/* FAB — staff only */}
          {isStaff && (
            <Pressable
              onPress={() => setShowCreate(true)}
              style={({ pressed }) => ({
                position: 'absolute',
                bottom: 24,
                right: 20,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: pressed ? '#4f46e5' : '#6366f1',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6366f1',
                shadowOpacity: 0.45,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 12,
                elevation: 8,
              })}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
          )}
        </View>
      )}

      {/* Create Assessment Sheet */}
      <CreateAssessmentSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        classroomId={classroomId ?? ''}
        schoolId={schoolId}
      />
    </SafeAreaView>
  );
}
