import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useClassroomsBySchool, useMyTeacherClassrooms } from '@/hooks/useClassroom';
import { useGenerateResults } from '@/hooks/useResults';
import { UserRole } from '@/interface/user.interface';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';

/* ── Constants ─────────────────────────────────────────────────── */

const HEADER_BG = '#4C3FC4';

const TERMS: { key: string; label: string }[] = [
  { key: 'FIRST_TERM',      label: '1st Term'    },
  { key: 'SECOND_TERM',     label: '2nd Term'    },
  { key: 'THIRD_TERM',      label: '3rd Term'    },
  { key: 'FIRST_SEMESTER',  label: '1st Sem'     },
  { key: 'SECOND_SEMESTER', label: '2nd Sem'     },
];

const TERM_FULL: Record<string, string> = {
  FIRST_TERM: 'First Term', SECOND_TERM: 'Second Term', THIRD_TERM: 'Third Term',
  FIRST_SEMESTER: 'First Semester', SECOND_SEMESTER: 'Second Semester',
};

function buildYears(): { key: string; label: string }[] {
  const y = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const yr = y - i;
    return { key: `${yr}/${yr + 1}`, label: `${yr}/${yr + 1}` };
  });
}

function mapTermToEnum(term: string | null | undefined): string {
  if (!term) return '';
  const t = term.toLowerCase();
  if (t.includes('first') && t.includes('sem')) return 'FIRST_SEMESTER';
  if (t.includes('second') && t.includes('sem')) return 'SECOND_SEMESTER';
  if (t.includes('first') || t.includes('1')) return 'FIRST_TERM';
  if (t.includes('second') || t.includes('2')) return 'SECOND_TERM';
  if (t.includes('third') || t.includes('3')) return 'THIRD_TERM';
  return '';
}

type Classroom = { id: string; name: string; grade?: string; section?: string };

/* ── Classroom picker modal ────────────────────────────────────── */

function ClassroomPickerModal({
  visible,
  classrooms,
  selectedId,
  showAll,
  onSelect,
  onClose,
}: {
  visible: boolean;
  classrooms: Classroom[];
  selectedId: string;
  showAll: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        {/* Modal header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>Select Classroom</Text>
          <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color="#374151" />
            </View>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* "All classrooms" option — admin only */}
          {showAll && (
            <Pressable
              onPress={() => onSelect('all')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: '#f8fafc',
                backgroundColor: selectedId === 'all' ? '#F0EEFF' : '#fff',
              }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 13,
                  backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Ionicons name="grid-outline" size={19} color="#4C3FC4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>All Classrooms</Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Generate for every classroom at once</Text>
                </View>
                {selectedId === 'all' && <Ionicons name="checkmark-circle" size={20} color="#4C3FC4" />}
              </View>
            </Pressable>
          )}

          {classrooms.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c.id)}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: '#f8fafc',
                backgroundColor: selectedId === c.id ? '#F0EEFF' : '#fff',
              }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 13,
                  backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#4C3FC4' }}>
                    {c.name[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{c.name}</Text>
                  {(c.grade || c.section) && (
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {[c.grade, c.section].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
                {selectedId === c.id && <Ionicons name="checkmark-circle" size={20} color="#4C3FC4" />}
              </View>
            </Pressable>
          ))}

          {classrooms.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 56, gap: 10 }}>
              <Ionicons name="school-outline" size={40} color="#d1d5db" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>No classrooms found</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 }}>
                You haven't been assigned to any classrooms yet.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ── Main screen ───────────────────────────────────────────────── */

export default function GenerateResultsScreen() {
  const router = useRouter();

  const user       = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary    = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0] ?? null;
  const schoolId   = primary?.schoolId ?? '';
  const role       = primary?.role ?? '';
  const isAdmin    = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;
  const isStaff    = role === UserRole.STAFF;

  // Default term/year from school settings
  const defaultTerm = mapTermToEnum(primary?.school?.currentTerm) || TERMS[0].key;
  const schoolYear  = primary?.school?.currentSession?.replace(/-/g, '/') ?? '';
  const years       = useMemo(buildYears, []);
  const defaultYear = schoolYear || years[0]?.key || '';

  /* Form state */
  const [classroomId,        setClassroomId]        = useState<string>('all');
  const [term,               setTerm]               = useState(defaultTerm);
  const [academicYear,       setAcademicYear]       = useState(defaultYear);
  const [showClassroomPicker, setShowClassroomPicker] = useState(false);
  const [done,               setDone]               = useState(false);

  /* Classrooms */
  const { data: adminRaw,  isLoading: loadingAdmin }  = useClassroomsBySchool(isAdmin ? schoolId : undefined);
  const { data: staffRaw,  isLoading: loadingStaff }  = useMyTeacherClassrooms(!isAdmin ? schoolId : undefined);

  const classrooms = useMemo<Classroom[]>(() => {
    const raw = isAdmin ? adminRaw : staffRaw;
    if (Array.isArray(raw)) return raw as Classroom[];
    if (raw && typeof raw === 'object' && 'data' in raw)
      return ((raw as { data: Classroom[] }).data ?? []);
    return [];
  }, [isAdmin, adminRaw, staffRaw]);

  const loadingClassrooms = isAdmin ? loadingAdmin : loadingStaff;

  // Staff: auto-select first classroom once loaded
  useEffect(() => {
    if (isStaff && !isAdmin && classrooms.length > 0 && classroomId === 'all') {
      setClassroomId(classrooms[0].id);
    }
  }, [isStaff, isAdmin, classrooms, classroomId]);

  const selectedClassroom = classrooms.find(c => c.id === classroomId);
  const canSubmit = !!term && !!academicYear && (isAdmin || classroomId !== 'all');

  const generate = useGenerateResults();

  const handleGenerate = () => {
    if (!canSubmit || generate.isPending) return;
    generate.mutate(
      {
        schoolId,
        term,
        academicYear,
        ...(classroomId !== 'all' ? { classroomId } : {}),
      },
      {
        onSuccess: () => setDone(true),
        onError: (err: Error) => {
          Alert.alert('Generation Failed', err.message || 'Could not generate results. Please try again.');
        },
      },
    );
  };

  const resetForm = () => {
    setDone(false);
    if (isStaff && !isAdmin) {
      setClassroomId(classrooms[0]?.id ?? 'all');
    } else {
      setClassroomId('all');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={{
        backgroundColor: HEADER_BG,
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{
              width: 34, height: 34, borderRadius: 11,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>
              Generate Results
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 }}>
              Compile scores into term results
            </Text>
          </View>
          <View style={{
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="bar-chart-outline" size={18} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 56 }}
      >

        {/* ── Success state ───────────────────────────────────── */}
        {done ? (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 16 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="checkmark-circle" size={46} color="#059669" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 }}>
              Results Generated!
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, maxWidth: 280 }}>
              {classroomId !== 'all'
                ? `Results for ${selectedClassroom?.name ?? 'the classroom'}`
                : 'Results for all classrooms'}{' '}
              ({TERM_FULL[term] ?? term} · {academicYear}) have been compiled successfully.
            </Text>

            {/* Staff reminder */}
            {isStaff && (
              <View style={{
                backgroundColor: '#fffbeb', borderRadius: 14,
                borderWidth: 1, borderColor: '#fde68a', padding: 14, width: '100%',
              }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Ionicons name="information-circle-outline" size={16} color="#d97706" style={{ marginTop: 1 }} />
                  <Text style={{ fontSize: 12, color: '#92400e', flex: 1, lineHeight: 18 }}>
                    Go to Results → your classroom → Submit for Approval so admins can review and publish.
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <Pressable onPress={resetForm} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}>
                <View style={{
                  borderWidth: 1.5, borderColor: HEADER_BG,
                  borderRadius: 14, paddingVertical: 14, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: HEADER_BG }}>Generate Again</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => router.back()} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}>
                <View style={{
                  backgroundColor: HEADER_BG, borderRadius: 14,
                  paddingVertical: 14, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Done</Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {/* ── Staff info banner ──────────────────────────── */}
            {isStaff && !isAdmin && (
              <View style={{
                backgroundColor: '#F0EEFF', borderRadius: 14,
                borderWidth: 1, borderColor: '#c7d2fe', padding: 14,
              }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Ionicons name="information-circle-outline" size={16} color="#4C3FC4" style={{ marginTop: 1 }} />
                  <Text style={{ fontSize: 12, color: '#3730a3', flex: 1, lineHeight: 18 }}>
                    You can generate results for your assigned classrooms. After generating, submit them for admin approval before students can see them.
                  </Text>
                </View>
              </View>
            )}

            {/* ── Form card ──────────────────────────────────── */}
            <View style={{
              backgroundColor: '#fff', borderRadius: 20,
              borderWidth: 1, borderColor: '#f1f5f9',
              shadowColor: '#0f172a', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
              overflow: 'hidden',
            }}>
              {/* Card header */}
              <View style={{
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: '#f8fafc',
                flexDirection: 'row', alignItems: 'center', gap: 10,
              }}>
                <View style={{
                  width: 30, height: 30, borderRadius: 10,
                  backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="options-outline" size={15} color="#4C3FC4" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>Result Parameters</Text>
              </View>

              <View style={{ padding: 16, gap: 22 }}>

                {/* Classroom picker */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Classroom</Text>
                    {isStaff && !isAdmin
                      ? <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '700' }}> *</Text>
                      : <Text style={{ fontSize: 11, color: '#94a3b8' }}> (optional)</Text>
                    }
                  </View>

                  <Pressable
                    onPress={() => setShowClassroomPicker(true)}
                    disabled={loadingClassrooms}
                    style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                  >
                    <View style={{
                      backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e5e7eb',
                      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      {loadingClassrooms ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color="#9ca3af" />
                          <Text style={{ fontSize: 14, color: '#9ca3af' }}>Loading classrooms…</Text>
                        </View>
                      ) : classroomId === 'all' ? (
                        <Text style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic' }}>All classrooms</Text>
                      ) : selectedClassroom ? (
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                            {selectedClassroom.name}
                          </Text>
                          {(selectedClassroom.grade || selectedClassroom.section) && (
                            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                              {[selectedClassroom.grade, selectedClassroom.section].filter(Boolean).join(' · ')}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <Text style={{ fontSize: 14, color: '#9ca3af' }}>Select a classroom</Text>
                      )}
                      <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                    </View>
                  </Pressable>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginHorizontal: -16 }} />

                {/* Term selector */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Term / Semester</Text>
                    <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '700' }}>*</Text>
                  </View>
                  <ClassroomDetailTabs
                    tabs={TERMS}
                    activeTab={term}
                    onTabChange={setTerm}
                    accentColor="#4C3FC4"
                  />
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginHorizontal: -16 }} />

                {/* Academic year selector */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Academic Year</Text>
                    <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '700' }}>*</Text>
                  </View>
                  <ClassroomDetailTabs
                    tabs={years}
                    activeTab={academicYear}
                    onTabChange={setAcademicYear}
                    accentColor="#0ea5e9"
                  />
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginHorizontal: -16 }} />

                {/* What this does */}
                <View style={{
                  backgroundColor: '#f8fafc', borderRadius: 12,
                  borderWidth: 1, borderColor: '#e5e7eb', padding: 14, gap: 8,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>What this does:</Text>
                  {[
                    'Pulls all scored assessments for the selected term and year',
                    'Applies grade configuration weights to each subject score',
                    'Ranks students by overall performance and assigns class positions',
                    isStaff
                      ? 'Results must be submitted for admin approval before publishing'
                      : 'Results can be reviewed and regenerated before publishing to students',
                  ].map((line, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 7, alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 12, color: HEADER_BG, marginTop: 1 }}>•</Text>
                      <Text style={{ fontSize: 12, color: '#64748b', flex: 1, lineHeight: 17 }}>{line}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ── Generate button ─────────────────────────────── */}
            <Pressable
              onPress={handleGenerate}
              disabled={!canSubmit || generate.isPending}
              style={({ pressed }) => ({
                opacity: pressed || !canSubmit || generate.isPending ? 0.65 : 1,
              })}
            >
              <View style={{
                backgroundColor: HEADER_BG, borderRadius: 16,
                paddingVertical: 16,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
              }}>
                {generate.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="bar-chart-outline" size={19} color="#fff" />
                )}
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff' }}>
                  {generate.isPending
                    ? 'Generating…'
                    : classroomId !== 'all'
                    ? 'Generate Results'
                    : 'Generate for All Classrooms'}
                </Text>
              </View>
            </Pressable>

            <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 }}>
              Regenerating updates existing results without resetting publish status.
            </Text>
          </>
        )}
      </ScrollView>

      {/* ── Classroom picker modal ──────────────────────────────── */}
      <ClassroomPickerModal
        visible={showClassroomPicker}
        classrooms={classrooms}
        selectedId={classroomId}
        showAll={isAdmin}
        onSelect={(id) => { setClassroomId(id); setShowClassroomPicker(false); }}
        onClose={() => setShowClassroomPicker(false)}
      />
    </SafeAreaView>
  );
}
