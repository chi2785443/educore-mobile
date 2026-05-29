import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal, View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAssessmentSchema,
  CreateAssessmentFormValues,
} from '@/schemas/assessment.schema';
import { toast } from '@/components/ui/Toast';
import { useCreateAssessment, useSubjects, useGradeConfigs } from '@/hooks/useAssessment';
import { useSchoolById } from '@/hooks/useSchool';
import { AssessmentType, QuestionType } from '@/interface/assessment.interface';

interface Classroom { id: string; name: string; grade?: string; section?: string }

interface Props {
  visible: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  schoolId: string;
}

function mapTermToEnum(term: string): string {
  const t = term.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (t === 'firstterm' || t === 'term1' || t === '1stterm' || t === 'semester1' || t === 'first') return 'FIRST_TERM';
  if (t === 'secondterm' || t === 'term2' || t === '2ndterm' || t === 'semester2' || t === 'second') return 'SECOND_TERM';
  if (t === 'thirdterm' || t === 'term3' || t === '3rdterm' || t === 'semester3' || t === 'third') return 'THIRD_TERM';
  return term;
}

const ALL_TYPES: { value: AssessmentType; label: string; color: string }[] = [
  { value: 'exam',       label: 'Exam',       color: '#F5486A' },
  { value: 'test',       label: 'Test',       color: '#4C3FC4' },
  { value: 'quiz',       label: 'Quiz',       color: '#0ea5e9' },
  { value: 'assignment', label: 'Assignment', color: '#10b981' },
];

const QTYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'objective', label: 'Objective' },
  { value: 'theory',    label: 'Theory' },
  { value: 'mixed',     label: 'Mixed' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{label}</Text>
      {children}
      {error && <Text style={{ fontSize: 12, color: '#dc2626' }}>{error}</Text>}
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb',
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  fontSize: 14, color: '#1e293b',
};

/* ── Classroom picker modal ─────────────────────────────────────── */
function ClassroomPickerModal({ visible, classrooms, onSelect, onClose }: {
  visible: boolean;
  classrooms: Classroom[];
  onSelect: (c: Classroom | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return classrooms;
    const s = search.toLowerCase();
    return classrooms.filter(c => c.name.toLowerCase().includes(s));
  }, [classrooms, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color="#374151" />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Select Classroom</Text>
          <View style={{ width: 34 }} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Search classroom…"
              placeholderTextColor="#9ca3af"
              style={{ flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 0 }}
              autoFocus
            />
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {/* "All students" option */}
          <Pressable onPress={() => { onSelect(null); onClose(); }} style={({ pressed }) => ({ backgroundColor: pressed ? '#f8fafc' : '#fff' })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5EE', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="people-outline" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#059669' }}>All students (no class filter)</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Assessment visible to all</Text>
              </View>
            </View>
          </Pressable>

          {filtered.map((c, idx) => (
            <Pressable key={c.id} onPress={() => { onSelect(c); onClose(); }} style={({ pressed }) => ({ backgroundColor: pressed ? '#f8fafc' : '#fff' })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: idx < filtered.length - 1 ? 1 : 0, borderBottomColor: '#f1f5f9' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#4C3FC4', fontWeight: '900', fontSize: 14 }}>
                    {c.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{c.name}</Text>
                  {(c.grade || c.section) && (
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                      {[c.grade, c.section ? `Section ${c.section}` : null].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── Subject picker modal ───────────────────────────────────────── */
function SubjectPickerModal({ visible, subjects, onSelect, onClose }: {
  visible: boolean;
  subjects: { id: string; name: string; color?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return subjects;
    return subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [subjects, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color="#374151" />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Select Subject</Text>
          <View style={{ width: 34 }} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Search subjects…"
              placeholderTextColor="#9ca3af"
              style={{ flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 0 }}
              autoFocus
            />
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
              <Ionicons name="book-outline" size={32} color="#d1d5db" />
              <Text style={{ fontSize: 14, color: '#9ca3af' }}>No subjects found</Text>
            </View>
          ) : filtered.map((s, idx) => (
            <Pressable key={s.id} onPress={() => { onSelect(s.id); onClose(); }} style={({ pressed }) => ({ backgroundColor: pressed ? '#f8fafc' : '#fff' })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: idx < filtered.length - 1 ? 1 : 0, borderBottomColor: '#f1f5f9' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color ?? '#4C3FC4', flexShrink: 0 }} />
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#0f172a' }}>{s.name}</Text>
                <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── Date picker modal ──────────────────────────────────────────── */
function DatePickerModal({ visible, value, onSelect, onClose }: {
  visible: boolean;
  value: string | undefined;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setYear(d.getFullYear()); setMonth(d.getMonth()); setSelected(d.getDate());
      }
    }
  }, [value, visible]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleSelect = (day: number) => {
    setSelected(day);
    const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelect(s);
    onClose();
  };

  const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation?.()}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />

            {/* Month nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
              <Pressable onPress={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={18} color="#374151" />
              </Pressable>
              <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable onPress={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-forward" size={18} color="#374151" />
              </Pressable>
            </View>

            {/* Day name headers */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 }}>
              {DAY_NAMES.map(d => (
                <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9ca3af' }}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={{ paddingHorizontal: 12 }}>
              {Array.from({ length: cells.length / 7 }, (_, row) => (
                <View key={row} style={{ flexDirection: 'row', marginBottom: 4 }}>
                  {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                    const cellStr = day ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
                    const isToday = cellStr === todayStr;
                    const isSelected = day === selected;
                    return (
                      <Pressable
                        key={col}
                        onPress={() => day && handleSelect(day)}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 38 }}
                      >
                        {day ? (
                          <View style={{
                            width: 34, height: 34, borderRadius: 17,
                            backgroundColor: isSelected ? '#4C3FC4' : isToday ? '#F0EEFF' : 'transparent',
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: isToday && !isSelected ? 1.5 : 0,
                            borderColor: '#4C3FC4',
                          }}>
                            <Text style={{ fontSize: 14, fontWeight: isSelected || isToday ? '800' : '500', color: isSelected ? '#fff' : isToday ? '#4C3FC4' : '#1e293b' }}>
                              {day}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Time picker modal ──────────────────────────────────────────── */
function TimePickerModal({ visible, value, label, onSelect, onClose }: {
  visible: boolean;
  value: string | undefined;
  label: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}) {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h)) setHour(h);
      if (!isNaN(m)) setMinute(m);
    }
  }, [value, visible]);

  const confirm = () => {
    onSelect(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation?.()}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 24 }}>{label}</Text>

            {/* Hour + Minute display */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
              {/* Hour */}
              <View style={{ alignItems: 'center', gap: 10 }}>
                <Pressable onPress={() => setHour(h => (h + 1) % 24)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-up" size={20} color="#374151" />
                </Pressable>
                <View style={{ width: 80, height: 64, borderRadius: 16, backgroundColor: '#4C3FC4', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>{String(hour).padStart(2, '0')}</Text>
                </View>
                <Pressable onPress={() => setHour(h => (h - 1 + 24) % 24)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-down" size={20} color="#374151" />
                </Pressable>
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>HOUR</Text>
              </View>

              <Text style={{ fontSize: 32, fontWeight: '900', color: '#d1d5db', marginBottom: 24 }}>:</Text>

              {/* Minute */}
              <View style={{ alignItems: 'center', gap: 10 }}>
                <Pressable onPress={() => setMinute(m => (m + 5) % 60)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-up" size={20} color="#374151" />
                </Pressable>
                <View style={{ width: 80, height: 64, borderRadius: 16, backgroundColor: '#4C3FC4', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>{String(minute).padStart(2, '0')}</Text>
                </View>
                <Pressable onPress={() => setMinute(m => (m - 5 + 60) % 60)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-down" size={20} color="#374151" />
                </Pressable>
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>MIN</Text>
              </View>
            </View>

            <Pressable onPress={confirm} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <View style={{ backgroundColor: '#4C3FC4', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  Confirm {String(hour).padStart(2,'0')}:{String(minute).padStart(2,'0')}
                </Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Main sheet ─────────────────────────────────────────────────── */
export default function CreateAssessmentSheet({ visible, onClose, classrooms, schoolId }: Props) {
  const { data: subjects = [] } = useSubjects(visible ? schoolId : undefined);
  const { data: gradeConfigs = [] } = useGradeConfigs(visible ? schoolId : undefined);
  const { data: schoolDetail } = useSchoolById(visible ? schoolId : undefined);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [showClassroomPicker, setShowClassroomPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Allowed assessment types from the latest grade configuration
  const allowedTypes = useMemo(() => {
    const latest = gradeConfigs[0];
    const enabled = latest?.enabledAssessmentTypes;
    if (enabled && enabled.length > 0) {
      return ALL_TYPES.filter(t => (enabled as string[]).includes(t.value));
    }
    return ALL_TYPES;
  }, [gradeConfigs]);

  // Term and academic year — fetched fresh from GET /schools/:id
  const currentTerm = schoolDetail?.currentTerm ?? '';
  const currentSession = schoolDetail?.currentSession ?? '';

  const createMutation = useCreateAssessment(selectedClassroom?.id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAssessmentFormValues>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: {
      type: undefined,
      questionType: 'objective',
      totalMarks: 100,
      passingMarks: 50,
      term: mapTermToEnum(currentTerm),
      academicYear: currentSession,
    },
  });

  const watchedSubjectId = watch('subjectId');
  const watchedDate = watch('scheduledDate');
  const watchedStart = watch('startTime');
  const watchedEnd = watch('endTime');

  const selectedSubject = subjects.find(s => s.id === watchedSubjectId);

  // Auto-fill term + academicYear from school config whenever settings load
  useEffect(() => {
    if (currentTerm) setValue('term', mapTermToEnum(currentTerm));
    if (currentSession) setValue('academicYear', currentSession);
  }, [currentTerm, currentSession, setValue]);

  useEffect(() => {
    if (!visible) {
      reset({
        type: undefined,
        questionType: 'objective',
        totalMarks: 100,
        passingMarks: 50,
        term: mapTermToEnum(currentTerm),
        academicYear: currentSession,
      });
      setSelectedClassroom(null);
    }
  }, [visible, reset, currentTerm, currentSession]);

  const onSubmit = async (values: CreateAssessmentFormValues) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        classroomId: selectedClassroom?.id ?? '',
        schoolId,
      });
      onClose();
      toast.success('Assessment created as draft. Add questions and publish from the assessment screen.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assessment');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', flex: 1 }}>New Assessment</Text>
            <Pressable onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 48 }}>

            {/* Classroom (optional) */}
            <Field label="Classroom (optional)">
              <Pressable onPress={() => setShowClassroomPicker(true)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, ...inputStyle }}>
                  {selectedClassroom ? (
                    <>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ color: '#4C3FC4', fontWeight: '900', fontSize: 11 }}>
                          {selectedClassroom.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '600' }}>{selectedClassroom.name}</Text>
                      <Pressable onPress={() => setSelectedClassroom(null)} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Ionicons name="people-outline" size={18} color="#9ca3af" />
                      <Text style={{ flex: 1, fontSize: 14, color: '#9ca3af' }}>All students — or tap to select a class</Text>
                      <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                    </>
                  )}
                </View>
              </Pressable>
            </Field>

            {/* Title */}
            <Field label="Title *" error={errors.title?.message}>
              <Controller
                control={control} name="title"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput value={value} onChangeText={onChange} onBlur={onBlur}
                    placeholder="e.g. Mid-term Mathematics Exam"
                    placeholderTextColor="#9ca3af" style={inputStyle} />
                )}
              />
            </Field>

            {/* Type — from school config */}
            <Field label="Type *" error={errors.type?.message}>
              <Controller
                control={control} name="type"
                render={({ field: { value, onChange } }) => (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {allowedTypes.map(opt => {
                      const isActive = value === opt.value;
                      return (
                        <Pressable key={opt.value} onPress={() => onChange(opt.value)} style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: isActive ? opt.color : '#f3f4f6', borderWidth: 1.5, borderColor: isActive ? opt.color : '#e5e7eb' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#fff' : '#6b7280' }}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Field>

            {/* Question Type */}
            <Field label="Question Type *" error={errors.questionType?.message}>
              <Controller
                control={control} name="questionType"
                render={({ field: { value, onChange } }) => (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {QTYPE_OPTIONS.map(opt => {
                      const isActive = value === opt.value;
                      return (
                        <Pressable key={opt.value} onPress={() => onChange(opt.value)} style={{ flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: isActive ? '#4C3FC4' : '#f3f4f6', borderWidth: 1, borderColor: isActive ? '#4C3FC4' : '#e5e7eb', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : '#6b7280' }}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Field>

            {/* Subject — search picker */}
            <Field label="Subject *" error={errors.subjectId?.message}>
              <Controller
                control={control} name="subjectId"
                render={({ field: { onChange } }) => (
                  <Pressable onPress={() => setShowSubjectPicker(true)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, ...inputStyle }}>
                      {selectedSubject ? (
                        <>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedSubject.color ?? '#4C3FC4', flexShrink: 0 }} />
                          <Text style={{ flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '600' }}>{selectedSubject.name}</Text>
                          <Pressable onPress={() => onChange('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color="#9ca3af" />
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Ionicons name="book-outline" size={18} color="#9ca3af" />
                          <Text style={{ flex: 1, fontSize: 14, color: '#9ca3af' }}>Search and select a subject…</Text>
                          <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                        </>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            </Field>

            {/* Marks */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Total Marks *" error={errors.totalMarks?.message}>
                  <Controller control={control} name="totalMarks"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput value={value?.toString()} onChangeText={t => onChange(Number(t) || 0)} onBlur={onBlur} keyboardType="numeric" placeholder="100" placeholderTextColor="#9ca3af" style={inputStyle} />
                    )} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Passing Marks *" error={errors.passingMarks?.message}>
                  <Controller control={control} name="passingMarks"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput value={value?.toString()} onChangeText={t => onChange(Number(t) || 0)} onBlur={onBlur} keyboardType="numeric" placeholder="50" placeholderTextColor="#9ca3af" style={inputStyle} />
                    )} />
                </Field>
              </View>
            </View>

            {/* Duration */}
            <Field label="Duration (minutes)" error={errors.duration?.message}>
              <Controller control={control} name="duration"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput value={value?.toString() ?? ''} onChangeText={t => onChange(t ? Number(t) : undefined)} onBlur={onBlur} keyboardType="numeric" placeholder="e.g. 60" placeholderTextColor="#9ca3af" style={inputStyle} />
                )} />
            </Field>

            {/* Term + Academic Year — auto from school config, read-only */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Term</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: currentTerm ? '#0f172a' : '#9ca3af' }}>
                  {currentTerm || 'Not configured'}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Academic Year</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: currentSession ? '#0f172a' : '#9ca3af' }}>
                  {currentSession || 'Not configured'}
                </Text>
              </View>
            </View>
            {(!currentTerm || !currentSession) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F0', borderRadius: 10, padding: 10 }}>
                <Ionicons name="information-circle-outline" size={16} color="#F5486A" />
                <Text style={{ flex: 1, fontSize: 12, color: '#F5486A' }}>
                  Term and academic year are managed in your school settings on the website dashboard.
                </Text>
              </View>
            )}

            {/* Scheduled date — date picker */}
            <Field label="Scheduled Date" error={errors.scheduledDate?.message}>
              <Controller
                control={control} name="scheduledDate"
                render={({ field: { onChange } }) => (
                  <Pressable onPress={() => setShowDatePicker(true)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, ...inputStyle }}>
                      <Ionicons name="calendar-outline" size={18} color={watchedDate ? '#4C3FC4' : '#9ca3af'} />
                      <Text style={{ flex: 1, fontSize: 14, color: watchedDate ? '#0f172a' : '#9ca3af' }}>
                        {watchedDate || 'Select date…'}
                      </Text>
                      {watchedDate && (
                        <Pressable onPress={() => onChange(undefined)} hitSlop={8}>
                          <Ionicons name="close-circle" size={18} color="#9ca3af" />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            </Field>

            {/* Start + End time — time pickers */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Start Time" error={errors.startTime?.message}>
                  <Controller control={control} name="startTime"
                    render={({ field: { onChange } }) => (
                      <Pressable onPress={() => setShowStartPicker(true)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, ...inputStyle }}>
                          <Ionicons name="time-outline" size={16} color={watchedStart ? '#4C3FC4' : '#9ca3af'} />
                          <Text style={{ fontSize: 14, color: watchedStart ? '#0f172a' : '#9ca3af' }}>
                            {watchedStart || 'HH:MM'}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="End Time" error={errors.endTime?.message}>
                  <Controller control={control} name="endTime"
                    render={({ field: { onChange } }) => (
                      <Pressable onPress={() => setShowEndPicker(true)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, ...inputStyle }}>
                          <Ionicons name="time-outline" size={16} color={watchedEnd ? '#4C3FC4' : '#9ca3af'} />
                          <Text style={{ fontSize: 14, color: watchedEnd ? '#0f172a' : '#9ca3af' }}>
                            {watchedEnd || 'HH:MM'}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                  />
                </Field>
              </View>
            </View>

            {/* Instructions */}
            <Field label="Instructions" error={errors.instructions?.message}>
              <Controller control={control} name="instructions"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput value={value} onChangeText={onChange} onBlur={onBlur}
                    placeholder="Any special instructions for students..."
                    placeholderTextColor="#9ca3af" multiline numberOfLines={4}
                    textAlignVertical="top" style={[inputStyle, { minHeight: 90, paddingTop: 11 }]} />
                )}
              />
            </Field>

            {/* Submit */}
            <Pressable onPress={handleSubmit(onSubmit)} disabled={createMutation.isPending} style={({ pressed }) => ({ opacity: pressed || createMutation.isPending ? 0.8 : 1, marginTop: 4 })}>
              <View style={{ backgroundColor: '#4C3FC4', borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {createMutation.isPending && <ActivityIndicator color="#fff" size="small" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  {createMutation.isPending ? 'Creating…' : 'Create Assessment'}
                </Text>
              </View>
            </Pressable>
          </ScrollView>

          {/* All nested pickers rendered inside the main modal */}
          <ClassroomPickerModal
            visible={showClassroomPicker}
            classrooms={classrooms}
            onSelect={(c) => { setSelectedClassroom(c); setShowClassroomPicker(false); }}
            onClose={() => setShowClassroomPicker(false)}
          />
          <SubjectPickerModal
            visible={showSubjectPicker}
            subjects={subjects}
            onSelect={(id) => { setValue('subjectId', id); setShowSubjectPicker(false); }}
            onClose={() => setShowSubjectPicker(false)}
          />
          <DatePickerModal
            visible={showDatePicker}
            value={watchedDate}
            onSelect={(d) => { setValue('scheduledDate', d); setShowDatePicker(false); }}
            onClose={() => setShowDatePicker(false)}
          />
          <TimePickerModal
            visible={showStartPicker}
            value={watchedStart}
            label="Start Time"
            onSelect={(t) => { setValue('startTime', t); setShowStartPicker(false); }}
            onClose={() => setShowStartPicker(false)}
          />
          <TimePickerModal
            visible={showEndPicker}
            value={watchedEnd}
            label="End Time"
            onSelect={(t) => { setValue('endTime', t); setShowEndPicker(false); }}
            onClose={() => setShowEndPicker(false)}
          />
        </View>
      </View>
    </Modal>
  );
}
