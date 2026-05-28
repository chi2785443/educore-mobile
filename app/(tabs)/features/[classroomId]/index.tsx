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
import MemberRow from '@/components/classroom/MemberRow';
import AssessmentCard from '@/components/assessment/AssessmentCard';
import CreateAssessmentSheet from '@/components/assessment/CreateAssessmentSheet';
import LoadingScreen from '@/components/ui/LoadingScreen';

/* ── Grade palette ─────────────────────────────────────────────── */
const GRADE_PALETTE: Record<string, { fg: string; grad: string }> = {
  JSS1: { fg: '#F5486A', grad: '#F5486A' },
  JSS2: { fg: '#4C3FC4', grad: '#4C3FC4' },
  JSS3: { fg: '#059669', grad: '#059669' },
  SS1:  { fg: '#d97706', grad: '#d97706' },
  SS2:  { fg: '#0284c7', grad: '#0284c7' },
  SS3:  { fg: '#7c3aed', grad: '#7c3aed' },
};
const DEFAULT_PAL = { fg: '#4C3FC4', grad: '#4C3FC4' };
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

/* ── Timetable view ────────────────────────────────────────────── */
function TimetableView({
  timetable,
  pal,
  refreshing,
  onRefresh,
}: {
  timetable: Partial<Record<DayOfWeek, import('@/interface/timetable.interface').TimetableEntry[]>>;
  pal: { fg: string; grad: string };
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const today = getTodayDayOfWeek();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);

  const hasAny = ORDERED_DAYS.some(d => (timetable[d]?.length ?? 0) > 0);
  const dayPeriods = (timetable[selectedDay] ?? []).slice().sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  if (!hasAny) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
        <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="calendar-outline" size={28} color="#9ca3af" />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No timetable set</Text>
        <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
          No periods have been scheduled for this classroom yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Day selector */}
      <View style={{
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
        flexDirection: 'row',
        paddingHorizontal: 12, paddingVertical: 10,
        gap: 6,
      }}>
        {ORDERED_DAYS.map(day => {
          const isActive = selectedDay === day;
          const isToday = day === today;
          const count = timetable[day]?.length ?? 0;
          return (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              style={{ flex: 1, alignItems: 'center', gap: 4 }}
            >
              <View style={{
                width: '100%', paddingVertical: 8, borderRadius: 12,
                alignItems: 'center', gap: 2,
                backgroundColor: isActive ? pal.fg : isToday ? pal.fg + '15' : '#f8fafc',
                borderWidth: 1.5,
                borderColor: isActive ? pal.fg : isToday ? pal.fg + '40' : '#f1f5f9',
              }}>
                <Text style={{
                  fontSize: 12, fontWeight: '800', letterSpacing: 0.2,
                  color: isActive ? '#fff' : isToday ? pal.fg : '#6b7280',
                }}>
                  {DAY_LABELS[day]}
                </Text>
                {count > 0 ? (
                  <View style={{
                    minWidth: 16, height: 16, borderRadius: 8,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : pal.fg + '20',
                    alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isActive ? '#fff' : pal.fg }}>
                      {count}
                    </Text>
                  </View>
                ) : (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isActive ? 'rgba(255,255,255,0.4)' : '#d1d5db' }} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Period list for selected day */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={pal.fg} colors={[pal.fg]} />}
      >
        {dayPeriods.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48, paddingHorizontal: 24 }}>
            <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="cafe-outline" size={24} color="#d1d5db" />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#6b7280', textAlign: 'center' }}>
              No classes on {DAY_LABELS[selectedDay]}
            </Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Free day!</Text>
          </View>
        ) : (
          dayPeriods.map((entry, idx) => {
            const color = entry.subject?.color ?? pal.fg;
            const subjectName = entry.subject?.name ?? 'Unknown Subject';
            const teacherName = entry.teacher
              ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
              : null;
            return (
              <View
                key={entry.id}
                style={{
                  flexDirection: 'row',
                  backgroundColor: '#fff',
                  borderRadius: 18,
                  marginBottom: 10,
                  overflow: 'hidden',
                  shadowColor: color,
                  shadowOpacity: 0.10,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 10,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: '#f1f5f9',
                }}
              >
                {/* Colored left bar */}
                <View style={{ width: 5, backgroundColor: color }} />

                {/* Period number badge */}
                <View style={{
                  width: 44, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: color + '12',
                  borderRightWidth: 1, borderRightColor: '#f1f5f9',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: color + 'aa' }}>PER</Text>
                  <Text style={{ fontSize: 22, fontWeight: '900', color, lineHeight: 26 }}>
                    {entry.periodNumber ?? idx + 1}
                  </Text>
                </View>

                {/* Content */}
                <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 }} numberOfLines={1}>
                    {subjectName}
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={13} color="#9ca3af" />
                      <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>
                        {entry.startTime} – {entry.endTime}
                      </Text>
                    </View>
                    {teacherName && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="person-outline" size={13} color="#9ca3af" />
                        <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }} numberOfLines={1}>
                          {teacherName}
                        </Text>
                      </View>
                    )}
                    {entry.roomNumber && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="location-outline" size={13} color="#9ca3af" />
                        <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>
                          {entry.roomNumber}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
      <View style={{ backgroundColor: '#4C3FC4', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
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
          {loadingTimetable ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={pal.fg} />
            </View>
          ) : (
            <TimetableView timetable={timetable} pal={pal} refreshing={refreshing} onRefresh={onRefresh} />
          )}
        </View>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C3FC4" colors={['#4C3FC4']} />}>
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
                <View style={{ backgroundColor: '#F0EEFF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#4C3FC4' }}>{teachers.length}</Text>
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
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C3FC4" colors={['#4C3FC4']} />}
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
                backgroundColor: pressed ? '#3b32a0' : '#4C3FC4',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#4C3FC4',
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
