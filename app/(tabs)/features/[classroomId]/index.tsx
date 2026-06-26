import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl,
  Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import { DayOfWeek } from '@/interface/timetable.interface';
import { Assessment, AssessmentStatus } from '@/interface/assessment.interface';
import {
  useClassroomDetail, useClassroomStudents, useClassroomTeachers,
  useAddTeacher, useRemoveTeacher, useAddStudent, useRemoveStudent,
} from '@/hooks/useClassroom';
import { useClassroomTimetable, useCreateTimetableEntry, useDeleteTimetableEntry } from '@/hooks/useTimetable';
import { useSubjects , useMyAssessments, useClassroomAssessments } from '@/hooks/useAssessment';
import { useSchoolMembers } from '@/hooks/useSchool';
import { TimePickerModal } from '@/components/ui/TimePickerModal';
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
const getPalette = (grade?: string): { fg: string; grad: string } => (grade ? GRADE_PALETTE[grade] : null) ?? DEFAULT_PAL;

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
  timetable, pal, refreshing, onRefresh, isAdmin, onDeletePeriod, onAddPeriod,
}: {
  timetable: Partial<Record<DayOfWeek, import('@/interface/timetable.interface').TimetableEntry[]>>;
  pal: { fg: string; grad: string };
  refreshing: boolean;
  onRefresh: () => void;
  isAdmin: boolean;
  onDeletePeriod: (id: string) => void;
  onAddPeriod: () => void;
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
                {isAdmin && (
                  <Pressable onPress={() => onDeletePeriod(entry.id)} style={{ paddingHorizontal: 14, justifyContent: 'center' }}>
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {isAdmin && (
        <Pressable onPress={onAddPeriod} style={{ position: 'absolute', bottom: 24, right: 20 }}>
          <View style={{ backgroundColor: pal.fg, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: pal.fg, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6 }}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Add Period</Text>
          </View>
        </Pressable>
      )}
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

  // Admin: member picker
  const [memberPickerRole, setMemberPickerRole] = useState<'teacher' | 'student' | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Admin: add period
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [periodDay, setPeriodDay] = useState<DayOfWeek>('MONDAY');
  const [periodSubjectId, setPeriodSubjectId] = useState('');
  const [periodTeacherId, setPeriodTeacherId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [periodNumber, setPeriodNumber] = useState('');
  const [periodRoom, setPeriodRoom] = useState('');
  const [timePickerFor, setTimePickerFor] = useState<'start' | 'end' | null>(null);

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
  // Admin mutations
  const addTeacherMutation = useAddTeacher(classroomId ?? '');
  const removeTeacherMutation = useRemoveTeacher(classroomId ?? '');
  const addStudentMutation = useAddStudent(classroomId ?? '');
  const removeStudentMutation = useRemoveStudent(classroomId ?? '');
  const createPeriodMutation = useCreateTimetableEntry(classroomId ?? '');
  const deletePeriodMutation = useDeleteTimetableEntry(classroomId ?? '');

  // Admin data for pickers
  const { data: schoolMembersRaw = [] } = useSchoolMembers(isAdmin ? schoolId : undefined);
  const { data: subjects = [] } = useSubjects(isAdmin ? schoolId : undefined);

  const schoolMembers = Array.isArray(schoolMembersRaw) ? schoolMembersRaw : [];
  const staffMembers = schoolMembers.filter(m => m.role === UserRole.STAFF);
  const studentMembers = schoolMembers.filter(m => m.role === UserRole.STUDENT);

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
            <TimetableView
              timetable={timetable} pal={pal} refreshing={refreshing} onRefresh={onRefresh}
              isAdmin={isAdmin}
              onDeletePeriod={id => Alert.alert('Delete Period', 'Remove this period from the timetable?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                  try { await deletePeriodMutation.mutateAsync(id); toast.success('Period removed'); }
                  catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
                }},
              ])}
              onAddPeriod={() => { setPeriodDay(getTodayDayOfWeek()); setPeriodSubjectId(''); setPeriodTeacherId(''); setPeriodStart(''); setPeriodEnd(''); setPeriodNumber(''); setPeriodRoom(classroom?.roomNumber ?? ''); setShowAddPeriod(true); }}
            />
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
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#6b7280', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 }}>Teachers</Text>
                <View style={{ backgroundColor: '#F0EEFF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#4C3FC4' }}>{teachers.length}</Text>
                </View>
                <Pressable onPress={() => { setMemberPickerRole('teacher'); setMemberSearch(''); }}>
                  <View style={{ backgroundColor: '#4C3FC4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="add" size={14} color="#fff" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Add</Text>
                  </View>
                </Pressable>
              </View>
              <View style={{ backgroundColor: '#fff' }}>
                {teachers.length === 0 ? (
                  <Text style={{ padding: 16, color: '#9ca3af', fontSize: 13 }}>No teachers assigned</Text>
                ) : (
                  teachers.map(t => (
                    <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <MemberRow member={t} role="teacher" onPress={() => router.push({ pathname: `/features/${classroomId}/member/${t.id}` as never, params: { memberId: t.id, classroomId, firstName: t.firstName, lastName: t.lastName, email: t.email ?? '', jobTitle: t.jobTitle ?? '', role: 'teacher', profilePicture: t.profilePicture ?? '', classroomName: classroom?.name ?? '' } })} />
                      </View>
                      <Pressable onPress={() => Alert.alert('Remove Teacher', `Remove ${t.firstName} from this classroom?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { try { await removeTeacherMutation.mutateAsync(t.id); toast.success('Teacher removed'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); } } }])} style={{ paddingHorizontal: 16 }}>
                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* Students section */}
          {!loadingStudents && (
            <View style={{ marginTop: isAdmin ? 8 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#6b7280', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 }}>Students</Text>
                <View style={{ backgroundColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>{students.length}</Text>
                </View>
                {isAdmin && (
                  <Pressable onPress={() => { setMemberPickerRole('student'); setMemberSearch(''); }}>
                    <View style={{ backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="add" size={14} color="#fff" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Add</Text>
                    </View>
                  </Pressable>
                )}
              </View>
              <View style={{ backgroundColor: '#fff' }}>
                {students.length === 0 ? (
                  <Text style={{ padding: 16, color: '#9ca3af', fontSize: 13 }}>No students enrolled</Text>
                ) : (
                  students.map(s => (
                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <MemberRow member={s} role="student" onPress={() => router.push({ pathname: `/features/${classroomId}/member/${s.id}` as never, params: { memberId: s.id, classroomId, firstName: s.firstName, lastName: s.lastName, email: s.email ?? '', jobTitle: '', role: 'student', profilePicture: s.profilePicture ?? '', classroomName: classroom?.name ?? '' } })} />
                      </View>
                      {isAdmin && (
                        <Pressable onPress={() => Alert.alert('Remove Student', `Remove ${s.firstName} from this classroom?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { try { await removeStudentMutation.mutateAsync(s.id); toast.success('Student removed'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); } } }])} style={{ paddingHorizontal: 16 }}>
                          <Ionicons name="trash-outline" size={18} color="#dc2626" />
                        </Pressable>
                      )}
                    </View>
                  ))
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

      {/* Member Picker Modal */}
      {memberPickerRole !== null && (() => {
        const candidates = memberPickerRole === 'teacher' ? staffMembers : studentMembers;
        const existing = new Set(memberPickerRole === 'teacher' ? teachers.map(t => t.id) : students.map(s => s.id));
        const filtered = candidates.filter(m => {
          const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
          return !existing.has(m.userId) && (!memberSearch || name.includes(memberSearch.toLowerCase()));
        });
        const isPending = addTeacherMutation.isPending || addStudentMutation.isPending;
        const handleAdd = async (userId: string) => {
          try {
            if (memberPickerRole === 'teacher') await addTeacherMutation.mutateAsync(userId);
            else await addStudentMutation.mutateAsync(userId);
            toast.success(`${memberPickerRole === 'teacher' ? 'Teacher' : 'Student'} added`);
          } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
        };
        return (
          <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMemberPickerRole(null)}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 }}>
                <Pressable onPress={() => setMemberPickerRole(null)}><Ionicons name="close" size={22} color="#374151" /></Pressable>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', flex: 1 }}>
                  Add {memberPickerRole === 'teacher' ? 'Teacher' : 'Student'}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TextInput value={memberSearch} onChangeText={setMemberSearch} placeholder="Search by name…" placeholderTextColor="#9ca3af" style={{ backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1e293b' }} />
              </View>
              {filtered.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Ionicons name="people-outline" size={36} color="#d1d5db" />
                  <Text style={{ fontSize: 14, color: '#9ca3af' }}>
                    {memberSearch ? 'No matches found' : `No ${memberPickerRole === 'teacher' ? 'staff' : 'students'} available to add`}
                  </Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                  {filtered.map(m => (
                    <Pressable key={m.userId} onPress={() => handleAdd(m.userId)} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc', backgroundColor: '#fff' }}>
                        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#4C3FC4' }}>{m.user.firstName[0]}{m.user.lastName[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{m.user.firstName} {m.user.lastName}</Text>
                          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{m.user.email}</Text>
                        </View>
                        <View style={{ backgroundColor: '#4C3FC4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Add</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </SafeAreaView>
          </Modal>
        );
      })()}

      {/* Add Period Modal */}
      <Modal visible={showAddPeriod} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddPeriod(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 }}>
            <Pressable onPress={() => setShowAddPeriod(false)}><Ionicons name="close" size={22} color="#374151" /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', flex: 1 }}>Add Period</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
            {/* Day */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Day *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'] as DayOfWeek[]).map(d => {
                  const active = periodDay === d;
                  const label = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' }[d];
                  return (
                    <Pressable key={d} onPress={() => setPeriodDay(d)} style={{ flex: 1 }}>
                      <View style={{ paddingVertical: 8, borderRadius: 10, backgroundColor: active ? pal.fg : '#f3f4f6', borderWidth: 1, borderColor: active ? pal.fg : '#e5e7eb', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{label}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Subject */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Subject *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(subjects as { id: string; name: string; color: string }[]).map(s => {
                    const active = periodSubjectId === s.id;
                    return (
                      <Pressable key={s.id} onPress={() => setPeriodSubjectId(s.id)}>
                        <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? s.color : '#f3f4f6', borderWidth: 1, borderColor: active ? s.color : '#e5e7eb' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{s.name}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Teacher (optional) */}
            {teachers.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Teacher (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => setPeriodTeacherId('')}>
                      <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: !periodTeacherId ? '#4C3FC4' : '#f3f4f6', borderWidth: 1, borderColor: !periodTeacherId ? '#4C3FC4' : '#e5e7eb' }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: !periodTeacherId ? '#fff' : '#6b7280' }}>None</Text>
                      </View>
                    </Pressable>
                    {teachers.map(t => {
                      const active = periodTeacherId === t.id;
                      return (
                        <Pressable key={t.id} onPress={() => setPeriodTeacherId(t.id)}>
                          <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? '#4C3FC4' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#4C3FC4' : '#e5e7eb' }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{t.firstName} {t.lastName}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Time */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Start Time *</Text>
                <Pressable onPress={() => setTimePickerFor('start')}>
                  <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="time-outline" size={16} color={periodStart ? '#4C3FC4' : '#9ca3af'} />
                    <Text style={{ fontSize: 14, color: periodStart ? '#1e293b' : '#9ca3af' }}>{periodStart || 'HH:MM'}</Text>
                  </View>
                </Pressable>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>End Time *</Text>
                <Pressable onPress={() => setTimePickerFor('end')}>
                  <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="time-outline" size={16} color={periodEnd ? '#4C3FC4' : '#9ca3af'} />
                    <Text style={{ fontSize: 14, color: periodEnd ? '#1e293b' : '#9ca3af' }}>{periodEnd || 'HH:MM'}</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Period # and Room */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Period #</Text>
                <TextInput value={periodNumber} onChangeText={setPeriodNumber} placeholder="e.g. 1" placeholderTextColor="#9ca3af" keyboardType="number-pad" style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1e293b' }} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Room</Text>
                <TextInput value={periodRoom} onChangeText={setPeriodRoom} placeholder={classroom?.roomNumber ?? 'e.g. B12'} placeholderTextColor="#9ca3af" style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1e293b' }} />
              </View>
            </View>

            <Pressable
              disabled={createPeriodMutation.isPending}
              onPress={async () => {
                if (!periodSubjectId) { toast.error('Select a subject'); return; }
                if (!periodStart || !periodEnd) { toast.error('Set start and end times'); return; }
                try {
                  await createPeriodMutation.mutateAsync({ classroomId: classroomId ?? '', subjectId: periodSubjectId, teacherId: periodTeacherId || undefined, dayOfWeek: periodDay, startTime: periodStart, endTime: periodEnd, periodNumber: periodNumber ? parseInt(periodNumber, 10) : undefined, roomNumber: periodRoom.trim() || undefined });
                  toast.success('Period added');
                  setShowAddPeriod(false);
                } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to add period'); }
              }}
              style={({ pressed }) => ({ opacity: pressed || createPeriodMutation.isPending ? 0.8 : 1 })}
            >
              <View style={{ backgroundColor: pal.fg, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                {createPeriodMutation.isPending && <ActivityIndicator color="#fff" size="small" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>{createPeriodMutation.isPending ? 'Adding…' : 'Add Period'}</Text>
              </View>
            </Pressable>
          </ScrollView>

          {/* Time pickers — nested inside this modal */}
          <TimePickerModal visible={timePickerFor === 'start'} value={periodStart} label="Start Time" onSelect={setPeriodStart} onClose={() => setTimePickerFor(null)} />
          <TimePickerModal visible={timePickerFor === 'end'} value={periodEnd} label="End Time" onSelect={setPeriodEnd} onClose={() => setTimePickerFor(null)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
