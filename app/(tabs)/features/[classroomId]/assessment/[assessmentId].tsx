import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import { AssessmentStatus, AssessmentType, UpdateAssessmentPayload } from '@/interface/assessment.interface';
import { Question } from '@/interface/question.interface';
import {
  useAssessment, usePublishAssessment, useDeleteAssessment, useUpdateAssessment,
  useAssessmentQuestions, useAddAssessmentQuestions, useRemoveAssessmentQuestion,
} from '@/hooks/useAssessment';
import { useQuestions } from '@/hooks/useQuestionBank';
import { useAttemptsForAssessment, useStartAttempt, useMyAttempts } from '@/hooks/useStudentAttempt';
import { useScoresForAssessment, useAssessmentStats, useMyScoreForAssessment } from '@/hooks/useStudentScore';
import { useRetakesForAssessment, useMyRetakeRequests, useCreateRetakeRequest } from '@/hooks/useRetakeRequest';
import { usePendingMarking, useAttemptMarkingDetails, useMarkTheoryAnswer, useSubmitMarking } from '@/hooks/useMarking';
import { PendingAttempt, TheoryAnswer } from '@/services/marking.service';
import { studentAttemptService } from '@/services/student-attempt.service';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';
import ScoreCard from '@/components/assessment/ScoreCard';
import RetakeRequestRow from '@/components/assessment/RetakeRequestRow';
import LoadingScreen from '@/components/ui/LoadingScreen';


/* ── Color maps ─────────────────────────────────────────────────── */
const TYPE_COLORS: Record<AssessmentType, string> = {
  exam: '#F5486A', test: '#4C3FC4', quiz: '#0ea5e9', assignment: '#10b981',
};
const STATUS_STYLE: Record<AssessmentStatus, { bg: string; text: string; label: string }> = {
  draft:     { bg: '#f3f4f6', text: '#6b7280', label: 'Draft' },
  published: { bg: '#dcfce7', text: '#16a34a', label: 'Published' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
  completed: { bg: '#F0EEFF', text: '#4C3FC4', label: 'Completed' },
};

type StaffTab   = 'info' | 'questions' | 'attempts' | 'scores' | 'marking' | 'retakes';
type StudentTab = 'info' | 'score';
type AdminTab   = 'info' | 'scores';
type AnyTab     = StaffTab | StudentTab | AdminTab;

function EmptyState({ icon, title, subtitle }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 32 }}>
      <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={24} color="#9ca3af" />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#374151', textAlign: 'center' }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text>}
    </View>
  );
}

export default function AssessmentDetailScreen() {
  const { classroomId, assessmentId } = useLocalSearchParams<{
    classroomId: string;
    assessmentId: string;
  }>();
  const router = useRouter();

  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId)
    ?? memberships.find(m => m.isPrimary) ?? memberships[0] ?? null;
  const role = primary?.role;
  const isAdmin  = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;
  const isStaff  = role === UserRole.STAFF;
  const isStudent = role === UserRole.STUDENT;

  const [activeTab, setActiveTab] = useState<AnyTab>('info');
  const [retakeReason, setRetakeReason] = useState('');
  const [showRetakeInput, setShowRetakeInput] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, number | undefined>>({}); // questionId → marks

  /* Edit assessment state */
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTotalMarks, setEditTotalMarks] = useState('');
  const [editPassingMarks, setEditPassingMarks] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editInstructions, setEditInstructions] = useState('');

  /* Marking state */
  const [markingAttempt, setMarkingAttempt] = useState<PendingAttempt | null>(null);
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});
  const [localFeedback, setLocalFeedback] = useState<Record<string, string>>({});
  const [overallRemarks, setOverallRemarks] = useState('');
  const [recordingPlayerUrl, setRecordingPlayerUrl] = useState<string | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);

  /* Data */
  const { data: assessment, isLoading } = useAssessment(assessmentId);
  const schoolId = assessment?.schoolId ?? '';
  const { data: questions = [], isLoading: loadingQuestions } = useAssessmentQuestions(
    isStaff && activeTab === 'questions' ? assessmentId : undefined,
  );
  const bankFilter = useMemo(() => {
    if (!assessment) return undefined;
    const f: Record<string, string> = {};
    if (assessment.subjectId) f.subjectId = assessment.subjectId;
    if (assessment.questionType !== 'mixed') f.type = assessment.questionType;
    return Object.keys(f).length ? f : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.subjectId, assessment?.questionType]);

  const { data: bankQuestions = [], isLoading: loadingBank } = useQuestions(
    isStaff && pickerOpen ? schoolId : undefined,
    bankFilter as import('@/interface/question.interface').QuestionFilters | undefined,
  );
  const addMutation = useAddAssessmentQuestions(assessmentId ?? '');
  const removeMutation = useRemoveAssessmentQuestion(assessmentId ?? '');
  const { data: attempts = [], isLoading: loadingAttempts } = useAttemptsForAssessment(
    (isStaff || isAdmin) && activeTab === 'attempts' ? assessmentId : undefined,
  );
  const { data: allScores = [], isLoading: loadingScores } = useScoresForAssessment(
    (isStaff || isAdmin) && activeTab === 'scores' ? assessmentId : undefined,
  );
  const { data: stats, isLoading: loadingStats } = useAssessmentStats(
    (isStaff || isAdmin) && activeTab === 'scores' ? assessmentId : undefined,
  );
  const { data: releaseStats } = useAssessmentStats(
    (isStaff || isAdmin) ? assessmentId : undefined,
  );
  const scoresReleased = (releaseStats?.releasedCount ?? 0) > 0;
  const { data: myScore, isLoading: loadingMyScore } = useMyScoreForAssessment(
    isStudent && activeTab === 'score' ? assessmentId : undefined,
  );
  const { data: retakes = [], isLoading: loadingRetakes } = useRetakesForAssessment(
    isStaff && activeTab === 'retakes' ? assessmentId : undefined,
  );
  const { data: myRetakeRequests = [] } = useMyRetakeRequests(isStudent);
  const { data: myAttempts = [], isLoading: loadingMyAttempts } = useMyAttempts(isStudent);

  const { data: pendingMarking = [], isLoading: loadingMarking } = usePendingMarking(
    isStaff && activeTab === 'marking' ? assessmentId : undefined,
  );
  const { data: markingDetails, isLoading: loadingMarkingDetails } = useAttemptMarkingDetails(
    markingAttempt?.attemptId,
  );

  /* Mutations */
  const publishMutation  = usePublishAssessment(assessmentId ?? '', classroomId ?? '');
  const deleteMutation   = useDeleteAssessment(classroomId ?? '');
  const updateMutation   = useUpdateAssessment(assessmentId ?? '');
  const startMutation    = useStartAttempt();
  const retakeMutation   = useCreateRetakeRequest();
  const markAnswerMutation = useMarkTheoryAnswer(assessmentId ?? '');
  const submitMarkingMutation = useSubmitMarking(assessmentId ?? '');

  /* Derived */
  const typeColor = assessment ? (TYPE_COLORS[assessment.type] ?? '#4C3FC4') : '#4C3FC4';
  const statusSt  = assessment ? STATUS_STYLE[assessment.status] : STATUS_STYLE.draft;

  const existingQuestionIds = useMemo(
    () => new Set(questions.map(q => q.questionId)),
    [questions],
  );
  const availableBank = useMemo(
    () => (bankQuestions as Question[]).filter(q => !existingQuestionIds.has(q.id)),
    [bankQuestions, existingQuestionIds],
  );

  const toggleSelect = (q: Question) => {
    setSelected(prev => {
      if (q.id in prev) {
        const next = { ...prev }; delete next[q.id]; return next;
      }
      return { ...prev, [q.id]: undefined };
    });
  };

  const handleAddQuestions = async () => {
    const entries = Object.entries(selected);
    if (entries.length === 0) return;
    const missing = entries.some(([, marks]) => !marks);
    if (missing) {
      Alert.alert('Missing Marks', 'Enter marks for all selected questions before adding.');
      return;
    }
    const nextOrder = questions.length + 1;
    try {
      await addMutation.mutateAsync(
        entries.map(([questionId, marks], i) => ({
          questionId, marks: marks as number, questionOrder: nextOrder + i,
        })),
      );
      setSelected({});
      setPickerOpen(false);
      toast.success(`${entries.length} question${entries.length !== 1 ? 's' : ''} added`);
    } catch (err) {
      Alert.alert('Failed to Add Questions', err instanceof Error ? err.message : 'Failed to add questions');
    }
  };

  const handleRemoveQuestion = (questionId: string) => {
    Alert.alert('Remove Question', 'Remove this question from the assessment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await removeMutation.mutateAsync(questionId);
            toast.success('Question removed');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove question');
          }
        },
      },
    ]);
  };

  const myPendingRetake = myRetakeRequests.find(
    r => r.assessmentId === assessmentId && r.status === 'pending',
  );
  const myCompletedAttempt = myAttempts.find(
    a => a.assessmentId === assessmentId && a.status !== 'in_progress',
  );

  /* Tabs */
  const staffTabs:   { key: StaffTab;   label: string }[] = [
    { key: 'info',      label: 'Info' },
    { key: 'questions', label: 'Questions' },
    { key: 'attempts',  label: 'Attempts' },
    { key: 'marking',   label: 'Marking' },
    { key: 'scores',    label: 'Scores' },
    { key: 'retakes',   label: 'Retakes' },
  ];
  const studentTabs: { key: StudentTab; label: string }[] = [
    { key: 'info',  label: 'Info' },
    { key: 'score', label: 'My Score' },
  ];
  const adminTabs:   { key: AdminTab;   label: string }[] = [
    { key: 'info',   label: 'Info' },
    { key: 'scores', label: 'Scores' },
  ];

  const tabs = isStaff ? staffTabs : isStudent ? studentTabs : adminTabs;

  /* Handlers */
  const handlePublish = () => {
    Alert.alert('Publish Assessment', 'Make this assessment visible to students?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: async () => {
          try {
            await publishMutation.mutateAsync();
            toast.success('Assessment published — students can now start it');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to publish');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Assessment', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(assessmentId ?? '');
            router.back();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete assessment');
          }
        },
      },
    ]);
  };

  const handleStart = async () => {
    try {
      const attempt = await startMutation.mutateAsync({ assessmentId: assessmentId ?? '' });
      router.push(
        `/features/${classroomId}/assessment/take?assessmentId=${assessmentId}&attemptId=${attempt.id}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start assessment. Please try again.');
    }
  };

  const handleOpenEdit = () => {
    if (!assessment) return;
    setEditTitle(assessment.title);
    setEditTotalMarks(String(assessment.totalMarks));
    setEditPassingMarks(String(assessment.passingMarks));
    setEditDuration(assessment.duration ? String(assessment.duration) : '');
    setEditDate(assessment.scheduledDate
      ? new Date(assessment.scheduledDate).toISOString().split('T')[0]
      : '');
    setEditStartTime(assessment.startTime ? assessment.startTime.slice(0, 5) : '');
    setEditEndTime(assessment.endTime ? assessment.endTime.slice(0, 5) : '');
    setEditInstructions(assessment.instructions ?? '');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) { toast.error('Title is required'); return; }
    const payload: UpdateAssessmentPayload = {
      title: editTitle.trim(),
      totalMarks: Number(editTotalMarks) || assessment?.totalMarks,
      passingMarks: Number(editPassingMarks) || assessment?.passingMarks,
      duration: editDuration ? Number(editDuration) : undefined,
      scheduledDate: editDate || undefined,
      startTime: editStartTime || undefined,
      endTime: editEndTime || undefined,
      instructions: editInstructions.trim() || undefined,
    };
    try {
      await updateMutation.mutateAsync(payload);
      setEditOpen(false);
      toast.success('Assessment updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update assessment');
    }
  };

  const handleOpenMarking = (attempt: PendingAttempt) => {
    setMarkingAttempt(attempt);
    setLocalMarks({});
    setLocalFeedback({});
    setOverallRemarks('');
    setRecordingPlayerUrl(null);
    setRecordingLoading(false);
  };

  const handleMarkAnswer = async (answer: TheoryAnswer) => {
    const marksStr = localMarks[answer.id] ?? String(answer.marksAwarded ?? '');
    const marks = parseFloat(marksStr);
    if (isNaN(marks) || marks < 0) { toast.error('Enter a valid mark'); return; }
    const maxMarks = answer.assessmentQuestion?.marks ?? 0;
    if (marks > maxMarks) { toast.error(`Max marks for this question is ${maxMarks}`); return; }
    try {
      await markAnswerMutation.mutateAsync({
        answerSubmissionId: answer.id,
        marksAwarded: marks,
        feedback: localFeedback[answer.id] || undefined,
      });
      toast.success('Answer marked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark answer');
    }
  };

  const handleSubmitMarking = () => {
    if (!markingAttempt) return;
    const isFullyMarked = markingDetails?.statistics?.isFullyMarked;
    if (!isFullyMarked) {
      Alert.alert('Incomplete Marking', 'Some theory answers are still pending. Submit anyway?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: doSubmitMarking },
      ]);
    } else {
      doSubmitMarking();
    }
  };

  const doSubmitMarking = async () => {
    if (!markingAttempt) return;
    try {
      await submitMarkingMutation.mutateAsync({
        attemptId: markingAttempt.attemptId,
        overallRemarks: overallRemarks.trim() || undefined,
      });
      setMarkingAttempt(null);
      toast.success('Marking submitted — score calculated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit marking');
    }
  };

  const handleRetakeRequest = async () => {
    if (retakeReason.trim().length < 10) {
      toast.error('Please explain why you need a retake (min 10 characters)');
      return;
    }
    try {
      await retakeMutation.mutateAsync({ assessmentId: assessmentId ?? '', reason: retakeReason.trim() });
      setShowRetakeInput(false);
      setRetakeReason('');
      toast.success('Retake request submitted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send retake request');
    }
  };

  if (isLoading) return <LoadingScreen color={typeColor} message="Loading assessment" />;

  if (!assessment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
        <EmptyState icon="alert-circle-outline" title="Assessment not found" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={{ backgroundColor: '#4C3FC4', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', flex: 1, letterSpacing: -0.3 }} numberOfLines={2}>
            {assessment.title}
          </Text>
        </View>

        {/* Badges */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: typeColor, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'capitalize' }}>
              {assessment.type}
            </Text>
          </View>
          <View style={{ backgroundColor: statusSt.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: statusSt.text }}>{statusSt.label}</Text>
          </View>
          {assessment.subject && (
            <View style={{ backgroundColor: (assessment.subject.color ?? '#6366f1') + '30', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                {assessment.subject.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <ClassroomDetailTabs
        tabs={tabs as { key: AnyTab; label: string }[]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={typeColor}
      />

      {/* ── Content ─────────────────────────────────────────────── */}

      {/* INFO TAB */}
      {activeTab === 'info' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
          {/* Core stats */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Assessment Details
            </Text>
            {[
              { label: 'Total Marks',    value: assessment.totalMarks },
              { label: 'Passing Marks',  value: assessment.passingMarks },
              { label: 'Duration',       value: assessment.duration ? `${assessment.duration} minutes` : '—' },
              { label: 'Question Type',  value: assessment.questionType },
              { label: 'Term',           value: assessment.term },
              { label: 'Academic Year',  value: assessment.academicYear },
            ].map(row => (
              <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>{row.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', textTransform: 'capitalize' }}>
                  {String(row.value)}
                </Text>
              </View>
            ))}
          </View>

          {/* Schedule */}
          {assessment.scheduledDate && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Schedule
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>Date</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>
                  {new Date(assessment.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
              {assessment.startTime && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#6b7280' }}>Time</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>
                    {assessment.startTime}{assessment.endTime ? ` – ${assessment.endTime}` : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Instructions */}
          {assessment.instructions && (
            <View style={{ backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#bfdbfe', gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#2563eb' }}>Instructions</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 20 }}>{assessment.instructions}</Text>
            </View>
          )}

          {/* Creator */}
          {(isStaff || isAdmin) && assessment.creator && (
            <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              Created by {assessment.creator.firstName} {assessment.creator.lastName}
            </Text>
          )}

          {/* Staff actions */}
          {isStaff && (
            <View style={{ gap: 10, marginTop: 4 }}>
              {assessment.status === 'draft' && (
                <Pressable
                  onPress={handlePublish}
                  disabled={publishMutation.isPending}
                  style={({ pressed }) => ({ opacity: pressed || publishMutation.isPending ? 0.8 : 1 })}
                >
                  <View style={{
                    backgroundColor: '#22c55e',
                    borderRadius: 14, paddingVertical: 13,
                    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
                  }}>
                    {publishMutation.isPending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                      {publishMutation.isPending ? 'Publishing…' : 'Publish Assessment'}
                    </Text>
                  </View>
                </Pressable>
              )}
              {!scoresReleased && (
                <Pressable
                  onPress={handleOpenEdit}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 14, paddingVertical: 13,
                    borderWidth: 1, borderColor: '#c7d2fe',
                    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
                  }}>
                    <Ionicons name="create-outline" size={16} color="#4C3FC4" />
                    <Text style={{ color: '#4C3FC4', fontSize: 14, fontWeight: '700' }}>Edit Assessment</Text>
                  </View>
                </Pressable>
              )}
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                style={({ pressed }) => ({ opacity: pressed || deleteMutation.isPending ? 0.8 : 1 })}
              >
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 14, paddingVertical: 13,
                  borderWidth: 1, borderColor: '#fca5a5',
                  flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
                }}>
                  {deleteMutation.isPending
                    ? <ActivityIndicator color="#dc2626" size="small" />
                    : <Ionicons name="trash-outline" size={16} color="#dc2626" />}
                  <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '700' }}>
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete Assessment'}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* Student start button */}
          {isStudent && assessment.status === 'published' && !myCompletedAttempt && (
            <Pressable
              onPress={handleStart}
              disabled={startMutation.isPending}
              style={({ pressed }) => ({ opacity: pressed || startMutation.isPending ? 0.8 : 1 })}
            >
              <View style={{
                backgroundColor: '#4C3FC4',
                borderRadius: 14, paddingVertical: 14,
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
              }}>
                {startMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="play-circle-outline" size={20} color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  {startMutation.isPending ? 'Starting…' : 'Start Assessment'}
                </Text>
              </View>
            </Pressable>
          )}

          {isStudent && myCompletedAttempt && (
            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
              <Text style={{ color: '#16a34a', fontSize: 14, fontWeight: '700' }}>
                ✓ Submitted — view your score in the My Score tab
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* QUESTIONS TAB (staff only) */}
      {activeTab === 'questions' && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
            {loadingQuestions ? (
              <View style={{ paddingTop: 40, alignItems: 'center' }}>
                <ActivityIndicator color={typeColor} />
              </View>
            ) : (
              <>
                {questions.length > 0 && (
                  <View style={{ backgroundColor: typeColor + '12', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="list-outline" size={16} color={typeColor} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: typeColor }}>
                      {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}

                {questions.length === 0 && (
                  <EmptyState icon="help-circle-outline" title="No questions yet" subtitle="Add questions from your question bank below." />
                )}

                {[...questions].sort((a, b) => a.questionOrder - b.questionOrder).map((aq, idx) => (
                  <View key={aq.id} style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: typeColor + '18', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: typeColor }}>{idx + 1}</Text>
                      </View>
                      <View style={{ backgroundColor: aq.question.type === 'objective' ? '#dbeafe' : '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: aq.question.type === 'objective' ? '#1d4ed8' : '#b45309', textTransform: 'capitalize' }}>{aq.question.type}</Text>
                      </View>
                      <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>{aq.marks} mk{aq.marks !== 1 ? 's' : ''}</Text>
                      </View>
                      <Pressable onPress={() => handleRemoveQuestion(aq.questionId)} style={{ marginLeft: 'auto' }}>
                        <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      </Pressable>
                    </View>
                    <Text style={{ fontSize: 14, color: '#1e293b', lineHeight: 20 }}>{aq.question.questionText}</Text>
                    {aq.question.type === 'objective' && aq.question.options && aq.question.options.length > 0 && (
                      <View style={{ gap: 6 }}>
                        {aq.question.options.map((opt, oi) => {
                          const isCorrect = aq.question.correctAnswer === opt;
                          return (
                            <View key={oi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: isCorrect ? '#f0fdf4' : '#f8fafc', borderWidth: 1, borderColor: isCorrect ? '#bbf7d0' : '#f1f5f9' }}>
                              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: isCorrect ? '#16a34a' : '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: isCorrect ? '#16a34a' : 'transparent' }}>
                                {isCorrect && <Ionicons name="checkmark" size={11} color="#fff" />}
                              </View>
                              <Text style={{ fontSize: 13, color: isCorrect ? '#15803d' : '#374151', flex: 1, fontWeight: isCorrect ? '700' : '400' }}>{opt}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          {/* Add Questions FAB */}
          {assessment?.status === 'draft' && (
            <Pressable
              onPress={() => { setSelected({}); setPickerOpen(true); }}
              style={{ position: 'absolute', bottom: 24, right: 20 }}
            >
              <View style={{ backgroundColor: typeColor, borderRadius: 28, paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: typeColor, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6 }}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Add Questions</Text>
              </View>
            </Pressable>
          )}

          {/* Question Picker Modal */}
          <Modal visible={pickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerOpen(false)}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 }}>
                <Pressable onPress={() => setPickerOpen(false)}>
                  <Ionicons name="close" size={22} color="#374151" />
                </Pressable>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', flex: 1 }}>Add from Question Bank</Text>
                {Object.keys(selected).length > 0 && (
                  <View style={{ backgroundColor: typeColor + '18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: typeColor }}>{Object.keys(selected).length} selected</Text>
                  </View>
                )}
              </View>

              {/* Marks summary bar */}
              {Object.keys(selected).length > 0 && (() => {
                const selectedTotal = Object.values(selected).reduce((s, m) => s + (m ?? 0), 0);
                const assessmentTotal = assessment?.totalMarks ?? 0;
                const over = selectedTotal > assessmentTotal;
                const exact = selectedTotal === assessmentTotal;
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: over ? '#fff7ed' : exact ? '#f0fdf4' : '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                    <Ionicons name={over ? 'warning-outline' : exact ? 'checkmark-circle-outline' : 'calculator-outline'} size={15} color={over ? '#d97706' : exact ? '#16a34a' : '#6b7280'} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: over ? '#92400e' : exact ? '#15803d' : '#374151' }}>
                      Selected total: <Text style={{ color: over ? '#d97706' : exact ? '#16a34a' : typeColor }}>{selectedTotal}</Text>
                      {' / '}{assessmentTotal} marks
                    </Text>
                    {over && <Text style={{ fontSize: 11, color: '#d97706', marginLeft: 'auto' }}>Exceeds assessment total</Text>}
                    {exact && <Text style={{ fontSize: 11, color: '#16a34a', marginLeft: 'auto' }}>Perfect match</Text>}
                  </View>
                );
              })()}

              {/* Question list */}
              {loadingBank ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={typeColor} size="large" />
                </View>
              ) : availableBank.length === 0 ? (
                <View style={{ flex: 1 }}>
                  <EmptyState icon="library-outline" title="No questions available" subtitle={bankQuestions.length > 0 ? 'All questions in this subject are already added.' : 'Add questions to your question bank first.'} />
                </View>
              ) : (
                <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
                  {(availableBank as Question[]).map(q => {
                    const isSelected = q.id in selected;
                    const DIFF_COLOR: Record<string, string> = { easy: '#16a34a', medium: '#d97706', hard: '#dc2626' };
                    return (
                      <Pressable key={q.id} onPress={() => toggleSelect(q)}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: isSelected ? typeColor : '#f1f5f9', padding: 14, gap: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: isSelected ? typeColor : '#d1d5db', backgroundColor: isSelected ? typeColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                            </View>
                            <View style={{ backgroundColor: q.type === 'objective' ? '#dbeafe' : '#fef3c7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: q.type === 'objective' ? '#1d4ed8' : '#b45309', textTransform: 'capitalize' }}>{q.type}</Text>
                            </View>
                            {q.difficulty && (
                              <View style={{ borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: (DIFF_COLOR[q.difficulty] ?? '#6b7280') + '18' }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: DIFF_COLOR[q.difficulty] ?? '#6b7280', textTransform: 'capitalize' }}>{q.difficulty}</Text>
                              </View>
                            )}
                            {isSelected && (
                              <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={{ fontSize: 11, color: '#6b7280' }}>Marks:</Text>
                                <TextInput
                                  value={selected[q.id] !== undefined ? String(selected[q.id]) : ''}
                                  placeholder="0"
                                  placeholderTextColor={typeColor + '60'}
                                  onChangeText={v => setSelected(prev => ({ ...prev, [q.id]: v === '' ? undefined : (parseFloat(v) || undefined) }))}
                                  keyboardType="decimal-pad"
                                  style={{ backgroundColor: typeColor + '12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontSize: 13, fontWeight: '700', color: typeColor, minWidth: 44, textAlign: 'center' }}
                                  onPress={e => e.stopPropagation?.()}
                                />
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 19 }} numberOfLines={3}>{q.questionText}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Add button */}
              {Object.keys(selected).length > 0 && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                  <Pressable onPress={handleAddQuestions} disabled={addMutation.isPending} style={({ pressed }) => ({ opacity: pressed || addMutation.isPending ? 0.8 : 1 })}>
                    <View style={{ backgroundColor: typeColor, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                      {addMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="add-circle-outline" size={18} color="#fff" />}
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                        {addMutation.isPending ? 'Adding…' : `Add ${Object.keys(selected).length} Question${Object.keys(selected).length !== 1 ? 's' : ''}`}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}
            </SafeAreaView>
          </Modal>
        </>
      )}

      {/* ATTEMPTS TAB (staff/admin) */}
      {activeTab === 'attempts' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
          {loadingAttempts ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator color={typeColor} />
            </View>
          ) : attempts.length === 0 ? (
            <EmptyState icon="documents-outline" title="No attempts yet" subtitle="Students haven't started this assessment." />
          ) : (
            attempts.map(attempt => {
              const studentName = attempt.student
                ? `${attempt.student.firstName} ${attempt.student.lastName}`
                : 'Unknown Student';
              const statusColors: Record<string, { bg: string; text: string }> = {
                submitted:      { bg: '#dcfce7', text: '#16a34a' },
                auto_submitted: { bg: '#fef3c7', text: '#b45309' },
                in_progress:    { bg: '#dbeafe', text: '#2563eb' },
              };
              const atSt = statusColors[attempt.status] ?? statusColors.in_progress;
              return (
                <View key={attempt.id} style={{
                  backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
                  borderWidth: 1, borderColor: '#f1f5f9', gap: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b' }}>{studentName}</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        Attempt #{attempt.attemptNumber}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: atSt.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: atSt.text, textTransform: 'capitalize' }}>
                        {attempt.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>
                      Started: {new Date(attempt.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {attempt.submittedAt && (
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>
                        Submitted: {new Date(attempt.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                    {attempt.timeSpent && (
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>
                        Time: {Math.round(attempt.timeSpent / 60)}min
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* SCORES TAB (staff/admin) */}
      {(activeTab === 'scores' && (isStaff || isAdmin)) && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
          {(loadingScores || loadingStats) ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator color={typeColor} />
            </View>
          ) : (
            <>
              {stats && (
                <View style={{
                  margin: 16, backgroundColor: '#4C3FC4', borderRadius: 16, padding: 16,
                  flexDirection: 'row', flexWrap: 'wrap', gap: 0,
                }}>
                  {[
                    { label: 'Avg',      value: `${Math.round(stats.averagePercentage ?? 0)}%` },
                    { label: 'Highest',  value: `${stats.highestScore ?? 0}` },
                    { label: 'Pass Rate',value: `${Math.round(stats.passPercentage ?? 0)}%` },
                    { label: 'Graded',   value: `${allScores.length}` },
                  ].map((s, i) => (
                    <View key={s.label} style={{
                      width: '50%', alignItems: 'center', paddingVertical: 10,
                      borderRightWidth: i % 2 === 0 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)',
                      borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.1)',
                    }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>{s.value}</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
                {allScores.length === 0 ? (
                  <EmptyState icon="bar-chart-outline" title="No scores yet" subtitle="Scores appear after students submit." />
                ) : (
                  allScores.map(score => <ScoreCard key={score.id} score={score} compact />)
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* MY SCORE TAB (student) */}
      {activeTab === 'score' && isStudent && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
          {(loadingMyScore || loadingMyAttempts) ? (
            <View style={{ paddingTop: 60, alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color={typeColor} size="large" />
              <Text style={{ fontSize: 13, color: '#9ca3af' }}>Loading your score…</Text>
            </View>
          ) : !myCompletedAttempt ? (
            /* Not taken yet */
            <View style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: '#e0e7ff', shadowColor: '#4C3FC4', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3 }}>
              <View style={{ backgroundColor: '#f5f3ff', paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center', gap: 16 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ede9fe', borderWidth: 3, borderColor: '#ddd6fe', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="clipboard-outline" size={38} color="#7c3aed" />
                </View>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#4c1d95', letterSpacing: -0.3 }}>Not Attempted Yet</Text>
                  <Text style={{ fontSize: 13, color: '#6d28d9', textAlign: 'center', lineHeight: 20 }}>
                    Take the assessment first.{'\n'}Your score will show here once submitted.
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ede9fe' }}>
                {[
                  { icon: 'play-circle-outline' as const, label: 'Start from Info tab', color: '#7c3aed' },
                  { icon: 'star-outline' as const, label: 'Earn your grade', color: '#0ea5e9' },
                  { icon: 'trophy-outline' as const, label: 'Track your progress', color: '#f59e0b' },
                ].map((s, i) => (
                  <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, gap: 6, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: '#f5f3ff' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: s.color + '15', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={s.icon} size={17} color={s.color} />
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#6b7280', textAlign: 'center', paddingHorizontal: 4 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            /* Attempted — show pending card if not yet graded, else real score */
            <>
              <ScoreCard
                score={myScore ?? { id: '', assessmentId: assessmentId ?? '', studentId: '', score: 0, totalMarks: 0, percentage: 0, isPassed: false, grade: '', gradePoint: 0, correctAnswers: 0, incorrectAnswers: 0, questionsAnswered: 0 }}
                compact={false}
                pending={!myScore}
                underReview={!!myScore && myScore.isReleased === false}
              />

              {/* Retake section */}
              {myScore && myScore.isReleased === true && !myPendingRetake && (
                <View style={{ gap: 10 }}>
                  {showRetakeInput ? (
                    <>
                      <TextInput
                        value={retakeReason}
                        onChangeText={setRetakeReason}
                        placeholder="Explain why you need a retake..."
                        placeholderTextColor="#9ca3af"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={{
                          backgroundColor: '#fff',
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          borderRadius: 14,
                          padding: 12,
                          fontSize: 13,
                          color: '#1e293b',
                          minHeight: 100,
                        }}
                      />
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Pressable
                            onPress={() => { setShowRetakeInput(false); setRetakeReason(''); }}
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                          >
                            <View style={{
                              paddingVertical: 12, borderRadius: 12,
                              borderWidth: 1, borderColor: '#e5e7eb',
                              backgroundColor: '#fff', alignItems: 'center',
                            }}>
                              <Text style={{ color: '#6b7280', fontWeight: '700' }}>Cancel</Text>
                            </View>
                          </Pressable>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Pressable
                            onPress={handleRetakeRequest}
                            disabled={retakeMutation.isPending}
                            style={({ pressed }) => ({ opacity: pressed || retakeMutation.isPending ? 0.8 : 1 })}
                          >
                            <View style={{
                              paddingVertical: 12, borderRadius: 12,
                              backgroundColor: '#4C3FC4',
                              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                            }}>
                              {retakeMutation.isPending && <ActivityIndicator color="#fff" size="small" />}
                              <Text style={{ color: '#fff', fontWeight: '800' }}>
                                {retakeMutation.isPending ? 'Sending…' : 'Send Request'}
                              </Text>
                            </View>
                          </Pressable>
                        </View>
                      </View>
                    </>
                  ) : (
                    <Pressable
                      onPress={() => setShowRetakeInput(true)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    >
                      <View style={{
                        backgroundColor: '#f5f3ff',
                        borderRadius: 14, paddingVertical: 13,
                        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
                        borderWidth: 1, borderColor: '#ddd6fe',
                      }}>
                        <Ionicons name="refresh-outline" size={16} color="#4C3FC4" />
                        <Text style={{ color: '#4C3FC4', fontSize: 14, fontWeight: '800' }}>Request Retake</Text>
                      </View>
                    </Pressable>
                  )}
                </View>
              )}

              {myPendingRetake && (
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="hourglass-outline" size={18} color="#b45309" />
                  <Text style={{ color: '#92400e', fontSize: 13, fontWeight: '700', flex: 1 }}>
                    Retake request pending — awaiting teacher approval
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* MARKING TAB (staff) */}
      {activeTab === 'marking' && isStaff && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 12 }}>
          {loadingMarking ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator color={typeColor} />
            </View>
          ) : pendingMarking.length === 0 ? (
            <EmptyState
              icon="checkmark-done-circle-outline"
              title="All marked"
              subtitle="No theory answers are waiting for marking."
            />
          ) : (
            <>
              <View style={{ backgroundColor: typeColor + '12', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pencil-outline" size={15} color={typeColor} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: typeColor }}>
                  {pendingMarking.filter(p => !p.isFullyMarked).length} attempt{pendingMarking.filter(p => !p.isFullyMarked).length !== 1 ? 's' : ''} need marking
                </Text>
              </View>
              {pendingMarking.map((attempt, idx) => (
                <Pressable
                  key={attempt.attemptId ?? `pending-${idx}`}
                  onPress={() => handleOpenMarking(attempt)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <View style={{
                    backgroundColor: '#fff', borderRadius: 16, padding: 14,
                    borderWidth: 1, borderColor: attempt.isFullyMarked ? '#bbf7d0' : '#f1f5f9',
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: attempt.isFullyMarked ? '#dcfce7' : typeColor + '18',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons
                        name={attempt.isFullyMarked ? 'checkmark-circle' : 'pencil'}
                        size={20}
                        color={attempt.isFullyMarked ? '#16a34a' : typeColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b' }}>
                        {attempt.studentName}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        Attempt #{attempt.attemptNumber} · {attempt.totalTheory} theory q{attempt.totalTheory !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={{
                        backgroundColor: attempt.isFullyMarked ? '#dcfce7' : '#fef3c7',
                        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: attempt.isFullyMarked ? '#16a34a' : '#b45309' }}>
                          {attempt.isFullyMarked ? 'Ready' : `${attempt.pendingCount} pending`}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* RETAKES TAB (staff) */}
      {activeTab === 'retakes' && isStaff && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
          {loadingRetakes ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator color={typeColor} />
            </View>
          ) : retakes.length === 0 ? (
            <EmptyState icon="refresh-circle-outline" title="No retake requests" subtitle="Retake requests from students will appear here." />
          ) : (
            [...retakes]
              .sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1))
              .map(r => (
                <RetakeRequestRow key={r.id} request={r} assessmentId={assessmentId ?? ''} />
              ))
          )}
        </ScrollView>
      )}
      {/* ── EDIT ASSESSMENT MODAL ──────────────────────────────── */}
      <Modal visible={editOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 }}>
            <Pressable onPress={() => setEditOpen(false)}>
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', flex: 1 }}>Edit Assessment</Text>
            <Pressable onPress={handleSaveEdit} disabled={updateMutation.isPending} style={({ pressed }) => ({ opacity: pressed || updateMutation.isPending ? 0.7 : 1 })}>
              <View style={{ backgroundColor: '#4C3FC4', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {updateMutation.isPending && <ActivityIndicator color="#fff" size="small" />}
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                  {updateMutation.isPending ? 'Saving…' : 'Save'}
                </Text>
              </View>
            </Pressable>
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>

              {[
                { label: 'Title', value: editTitle, onChange: setEditTitle, placeholder: 'Assessment title', multiline: false },
                { label: 'Instructions', value: editInstructions, onChange: setEditInstructions, placeholder: 'Optional instructions…', multiline: true },
              ].map(f => (
                <View key={f.label} style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{f.label}</Text>
                  <TextInput
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder={f.placeholder}
                    placeholderTextColor="#9ca3af"
                    multiline={f.multiline}
                    numberOfLines={f.multiline ? 4 : 1}
                    textAlignVertical={f.multiline ? 'top' : 'center'}
                    style={{
                      backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
                      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                      fontSize: 14, color: '#1e293b',
                      minHeight: f.multiline ? 90 : undefined,
                    }}
                  />
                </View>
              ))}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { label: 'Total Marks', value: editTotalMarks, onChange: setEditTotalMarks },
                  { label: 'Passing Marks', value: editPassingMarks, onChange: setEditPassingMarks },
                  { label: 'Duration (min)', value: editDuration, onChange: setEditDuration },
                ].map(f => (
                  <View key={f.label} style={{ flex: 1, gap: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{f.label}</Text>
                    <TextInput
                      value={f.value}
                      onChangeText={f.onChange}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9ca3af"
                      placeholder="—"
                      style={{
                        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
                        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                        fontSize: 14, color: '#1e293b', textAlign: 'center',
                      }}
                    />
                  </View>
                ))}
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Scheduled Date</Text>
                <TextInput
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1e293b' }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { label: 'Start Time', value: editStartTime, onChange: setEditStartTime },
                  { label: 'End Time', value: editEndTime, onChange: setEditEndTime },
                ].map(f => (
                  <View key={f.label} style={{ flex: 1, gap: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{f.label}</Text>
                    <TextInput
                      value={f.value}
                      onChangeText={f.onChange}
                      placeholder="HH:MM"
                      placeholderTextColor="#9ca3af"
                      style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b', textAlign: 'center' }}
                    />
                  </View>
                ))}
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── MARKING DETAILS MODAL ──────────────────────────────── */}
      <Modal visible={!!markingAttempt} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMarkingAttempt(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
          {/* Header */}
          <View style={{
            paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
            borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <Pressable onPress={() => setMarkingAttempt(null)}>
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>
                {markingAttempt?.studentName ?? 'Marking'}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                Attempt #{markingAttempt?.attemptNumber} · {markingAttempt?.totalTheory} theory question{markingAttempt?.totalTheory !== 1 ? 's' : ''}
              </Text>
            </View>
            {markingDetails?.statistics?.isFullyMarked && (
              <View style={{ backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#16a34a' }}>✓ All marked</Text>
              </View>
            )}
          </View>

          {loadingMarkingDetails ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator color={typeColor} size="large" />
              <Text style={{ fontSize: 13, color: '#9ca3af' }}>Loading answers…</Text>
            </View>
          ) : (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}>

                {/* Stats strip */}
                {markingDetails?.statistics && (
                  <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
                    {[
                      { label: 'Total', value: markingDetails.statistics.totalTheory, color: '#4C3FC4' },
                      { label: 'Marked', value: markingDetails.statistics.markedCount, color: '#16a34a' },
                      { label: 'Pending', value: markingDetails.statistics.pendingMarking, color: '#d97706' },
                    ].map((s, i) => (
                      <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: s.color }}>{s.value}</Text>
                        <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recording */}
                {markingDetails?.attempt?.recordingUrl && (
                  recordingPlayerUrl ? (
                    <InlineRecordingPlayer
                      url={recordingPlayerUrl}
                      onClose={() => setRecordingPlayerUrl(null)}
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={recordingLoading}
                      onPress={async () => {
                        try {
                          setRecordingLoading(true);
                          const url = await studentAttemptService.getSignedViewUrl(
                            markingDetails.attempt.recordingUrl!,
                          );
                          setRecordingPlayerUrl(url);
                        } catch {
                          toast.error('Could not load recording');
                        } finally {
                          setRecordingLoading(false);
                        }
                      }}
                      style={{
                        backgroundColor: '#1e1b4b', borderRadius: 14, padding: 14,
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="videocam" size={20} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Proctoring Recording</Text>
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Tap to watch the session recording</Text>
                      </View>
                      {recordingLoading
                        ? <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                        : <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.7)" />}
                    </TouchableOpacity>
                  )
                )}

                {/* Theory answers */}
                {(markingDetails?.answers ?? []).map((answer, idx) => {
                  const maxMarks = answer.assessmentQuestion?.marks ?? 0;
                  const isMarked = answer.markingStatus === 'marked';
                  const curMarks = localMarks[answer.id] ?? (isMarked ? String(answer.marksAwarded ?? 0) : '');

                  return (
                    <View key={answer.id} style={{
                      backgroundColor: '#fff', borderRadius: 16,
                      borderWidth: 1, borderColor: isMarked ? '#bbf7d0' : '#f1f5f9',
                      overflow: 'hidden',
                    }}>
                      {/* Question header */}
                      <View style={{ backgroundColor: isMarked ? '#f0fdf4' : '#f8fafc', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: typeColor + '18', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: typeColor }}>{idx + 1}</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#374151' }}>
                          {answer.assessmentQuestion?.question?.questionText ?? 'Question'}
                        </Text>
                        <View style={{ backgroundColor: isMarked ? '#dcfce7' : '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: isMarked ? '#16a34a' : '#b45309' }}>
                            {isMarked ? `${answer.marksAwarded}/${maxMarks}` : `—/${maxMarks}`}
                          </Text>
                        </View>
                      </View>

                      <View style={{ padding: 14, gap: 12 }}>
                        {/* Student answer */}
                        <View style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: typeColor }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 5 }}>{"Student's Answer"}</Text>
                          <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 20 }}>
                            {answer.answer?.trim() || <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>No answer provided</Text>}
                          </Text>
                        </View>

                        {/* Marks input */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5 }}>
                              Marks Awarded <Text style={{ color: '#9ca3af' }}>/ {maxMarks}</Text>
                            </Text>
                            <TextInput
                              value={curMarks}
                              onChangeText={v => setLocalMarks(prev => ({ ...prev, [answer.id]: v }))}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor="#9ca3af"
                              style={{
                                backgroundColor: '#f8fafc', borderWidth: 1,
                                borderColor: '#e5e7eb', borderRadius: 10,
                                paddingHorizontal: 12, paddingVertical: 8,
                                fontSize: 15, fontWeight: '700', color: '#1e293b',
                              }}
                            />
                          </View>
                          <View style={{ paddingTop: 20 }}>
                            <Pressable
                              onPress={() => handleMarkAnswer(answer)}
                              disabled={markAnswerMutation.isPending}
                              style={({ pressed }) => ({ opacity: pressed || markAnswerMutation.isPending ? 0.7 : 1 })}
                            >
                              <View style={{
                                backgroundColor: isMarked ? '#f0fdf4' : typeColor,
                                borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                borderWidth: isMarked ? 1 : 0, borderColor: '#bbf7d0',
                              }}>
                                <Ionicons
                                  name={isMarked ? 'checkmark-circle' : 'checkmark'}
                                  size={15}
                                  color={isMarked ? '#16a34a' : '#fff'}
                                />
                                <Text style={{ fontSize: 13, fontWeight: '800', color: isMarked ? '#16a34a' : '#fff' }}>
                                  {isMarked ? 'Update' : 'Mark'}
                                </Text>
                              </View>
                            </Pressable>
                          </View>
                        </View>

                        {/* Feedback input */}
                        <View>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5 }}>Feedback (optional)</Text>
                          <TextInput
                            value={localFeedback[answer.id] ?? answer.feedback ?? ''}
                            onChangeText={v => setLocalFeedback(prev => ({ ...prev, [answer.id]: v }))}
                            placeholder="Leave feedback for the student…"
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={2}
                            textAlignVertical="top"
                            style={{
                              backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb',
                              borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
                              fontSize: 13, color: '#1e293b', minHeight: 64,
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Overall remarks */}
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Overall Remarks (optional)</Text>
                  <TextInput
                    value={overallRemarks}
                    onChangeText={setOverallRemarks}
                    placeholder="General remarks for this attempt…"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={{
                      backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
                      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                      fontSize: 13, color: '#1e293b', minHeight: 80,
                    }}
                  />
                </View>

              </ScrollView>

              {/* Submit marking button */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                <Pressable onPress={handleSubmitMarking} disabled={submitMarkingMutation.isPending} style={({ pressed }) => ({ opacity: pressed || submitMarkingMutation.isPending ? 0.8 : 1 })}>
                  <View style={{ backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    {submitMarkingMutation.isPending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Ionicons name="checkmark-done-circle-outline" size={18} color="#fff" />}
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                      {submitMarkingMutation.isPending ? 'Submitting…' : 'Submit Marking & Calculate Score'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

function InlineRecordingPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  const [playerError, setPlayerError] = React.useState(false);

  const player = useVideoPlayer(url, p => {
    p.play();
  });

  React.useEffect(() => {
    const sub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'error') setPlayerError(true);
    });
    return () => sub.remove();
  }, [player]);

  if (playerError) {
    return (
      <View style={{ borderRadius: 16, backgroundColor: '#1e1b4b', padding: 20, alignItems: 'center', gap: 12 }}>
        <Ionicons name="warning-outline" size={32} color="#ef4444" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
          Could not play this recording
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
          This recording was captured before a system update and cannot be decoded. New recordings will play automatically. You can try the browser, but older recordings may not play there either.
        </Text>
        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(url)}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <View style={{ backgroundColor: '#4C3FC4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="globe-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Try in browser</Text>
          </View>
        </Pressable>
        <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 12 }}>Dismiss</Text>
        </Pressable>
      </View>
    );
  }

  return (
    // No overflow:hidden — silently clips native views (VideoView) on iOS.
    <View style={{ borderRadius: 16, backgroundColor: '#000' }}>
      <VideoView
        player={player}
        style={{ width: '100%', height: 320, borderRadius: 16 }}
        contentFit="contain"
        nativeControls
        fullscreenOptions={{ enable: true }}
        // textureView is required on Android when VideoView is inside a ScrollView or Modal —
        // the default surfaceView does not render in overlapping/scrollable containers.
        surfaceType="textureView"
      />
      <Pressable
        onPress={onClose}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, position: 'absolute', top: 10, right: 10 })}
      >
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={18} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}
