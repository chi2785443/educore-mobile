import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import { AssessmentStatus, AssessmentType } from '@/interface/assessment.interface';
import { useAssessment, usePublishAssessment, useDeleteAssessment } from '@/hooks/useAssessment';
import { useAttemptsForAssessment, useStartAttempt, useMyAttempts } from '@/hooks/useStudentAttempt';
import { useScoresForAssessment, useAssessmentStats, useMyScoreForAssessment } from '@/hooks/useStudentScore';
import { useRetakesForAssessment, useMyRetakeRequests, useCreateRetakeRequest } from '@/hooks/useRetakeRequest';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';
import ScoreCard from '@/components/assessment/ScoreCard';
import RetakeRequestRow from '@/components/assessment/RetakeRequestRow';
import LoadingScreen from '@/components/ui/LoadingScreen';

/* ── Color maps ─────────────────────────────────────────────────── */
const TYPE_COLORS: Record<AssessmentType, string> = {
  exam: '#e11d48', test: '#7c3aed', quiz: '#0ea5e9', assignment: '#10b981',
};
const STATUS_STYLE: Record<AssessmentStatus, { bg: string; text: string; label: string }> = {
  draft:     { bg: '#f3f4f6', text: '#6b7280', label: 'Draft' },
  published: { bg: '#dcfce7', text: '#16a34a', label: 'Published' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
  completed: { bg: '#ede9fe', text: '#7c3aed', label: 'Completed' },
};

type StaffTab   = 'info' | 'questions' | 'attempts' | 'scores' | 'retakes';
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

  /* Data */
  const { data: assessment, isLoading } = useAssessment(assessmentId);
  const { data: attempts = [], isLoading: loadingAttempts } = useAttemptsForAssessment(
    (isStaff || isAdmin) && activeTab === 'attempts' ? assessmentId : undefined,
  );
  const { data: allScores = [], isLoading: loadingScores } = useScoresForAssessment(
    (isStaff || isAdmin) && activeTab === 'scores' ? assessmentId : undefined,
  );
  const { data: stats, isLoading: loadingStats } = useAssessmentStats(
    (isStaff || isAdmin) && activeTab === 'scores' ? assessmentId : undefined,
  );
  const { data: myScore, isLoading: loadingMyScore } = useMyScoreForAssessment(
    isStudent && activeTab === 'score' ? assessmentId : undefined,
  );
  const { data: retakes = [], isLoading: loadingRetakes } = useRetakesForAssessment(
    isStaff && activeTab === 'retakes' ? assessmentId : undefined,
  );
  const { data: myRetakeRequests = [] } = useMyRetakeRequests(isStudent);
  const { data: myAttempts = [] } = useMyAttempts(isStudent);

  /* Mutations */
  const publishMutation  = usePublishAssessment(assessmentId ?? '', classroomId ?? '');
  const deleteMutation   = useDeleteAssessment(classroomId ?? '');
  const startMutation    = useStartAttempt();
  const retakeMutation   = useCreateRetakeRequest();

  /* Derived */
  const typeColor = assessment ? (TYPE_COLORS[assessment.type] ?? '#6366f1') : '#6366f1';
  const statusSt  = assessment ? STATUS_STYLE[assessment.status] : STATUS_STYLE.draft;

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
        `/classroom/${classroomId}/assessment/take?assessmentId=${assessmentId}&attemptId=${attempt.id}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start assessment. Please try again.');
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
      <View style={{ backgroundColor: '#0B0F14', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
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
                backgroundColor: '#6366f1',
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
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ backgroundColor: '#eff6ff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#bfdbfe', gap: 12, alignItems: 'center' }}>
            <Ionicons name="help-circle-outline" size={40} color="#2563eb" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e40af', textAlign: 'center' }}>
              {assessment.questionCount !== undefined
                ? `${assessment.questionCount} question${assessment.questionCount !== 1 ? 's' : ''} added`
                : 'No question count available'}
            </Text>
            <Text style={{ fontSize: 13, color: '#3b82f6', textAlign: 'center', lineHeight: 20 }}>
              Question management is available on the web platform. After adding questions, return here to publish the assessment.
            </Text>
          </View>
        </View>
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
                  margin: 16, backgroundColor: '#0B0F14', borderRadius: 16, padding: 16,
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
          {loadingMyScore ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator color={typeColor} />
            </View>
          ) : !myScore ? (
            <EmptyState
              icon="hourglass-outline"
              title="Score not available yet"
              subtitle="Your score will appear here after your submission is graded."
            />
          ) : (
            <>
              <ScoreCard score={myScore} compact={false} />

              {/* Retake section */}
              {!myScore.isPassed && !myPendingRetake && (
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
                        <Pressable
                          onPress={() => { setShowRetakeInput(false); setRetakeReason(''); }}
                          style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}
                        >
                          <View style={{
                            paddingVertical: 12, borderRadius: 12,
                            borderWidth: 1, borderColor: '#e5e7eb',
                            backgroundColor: '#fff', alignItems: 'center',
                          }}>
                            <Text style={{ color: '#6b7280', fontWeight: '700' }}>Cancel</Text>
                          </View>
                        </Pressable>
                        <Pressable
                          onPress={handleRetakeRequest}
                          disabled={retakeMutation.isPending}
                          style={({ pressed }) => ({ flex: 1, opacity: pressed || retakeMutation.isPending ? 0.8 : 1 })}
                        >
                          <View style={{
                            paddingVertical: 12, borderRadius: 12,
                            backgroundColor: '#6366f1',
                            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                          }}>
                            {retakeMutation.isPending && <ActivityIndicator color="#fff" size="small" />}
                            <Text style={{ color: '#fff', fontWeight: '800' }}>
                              {retakeMutation.isPending ? 'Sending…' : 'Send Request'}
                            </Text>
                          </View>
                        </Pressable>
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
                        <Ionicons name="refresh-outline" size={16} color="#7c3aed" />
                        <Text style={{ color: '#7c3aed', fontSize: 14, fontWeight: '800' }}>Request Retake</Text>
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
    </SafeAreaView>
  );
}
