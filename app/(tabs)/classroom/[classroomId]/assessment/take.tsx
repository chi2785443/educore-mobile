import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAssessment, useAssessmentQuestions } from '@/hooks/useAssessment';
import { useAttemptById, useSubmitAnswer, useSubmitAttempt } from '@/hooks/useStudentAttempt';
import { AnswerSubmission } from '@/interface/attempt.interface';
import LoadingScreen from '@/components/ui/LoadingScreen';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.15)' }}>
      <View style={{ height: 3, width: `${pct}%`, backgroundColor: color }} />
    </View>
  );
}

export default function TakeAssessmentScreen() {
  const { assessmentId, attemptId } = useLocalSearchParams<{
    assessmentId: string;
    attemptId: string;
  }>();
  const router = useRouter();

  const { data: assessment, isLoading: loadingAssessment } = useAssessment(assessmentId);
  const { data: assessmentQs = [], isLoading: loadingQs } = useAssessmentQuestions(assessmentId);
  const { data: attempt, isLoading: loadingAttempt } = useAttemptById(attemptId);
  const submitAnswerMutation = useSubmitAnswer();
  const submitAttemptMutation = useSubmitAttempt();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const theoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Build questions array from assessment questions (sorted by order) */
  const questions = useMemo<AnswerSubmission[]>(() =>
    [...assessmentQs]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(aq => ({
        id: aq.id,
        assessmentQuestionId: aq.id,
        answer: '',
        question: {
          id: aq.question.id,
          question: aq.question.question,
          questionType: aq.question.questionType,
          options: aq.question.options,
          marks: aq.marks,
        },
      })),
    [assessmentQs],
  );

  const currentQ = questions[currentIndex];
  const totalQ = questions.length;

  /* Pre-populate answers from any existing submissions (resume) */
  useEffect(() => {
    if (!attempt?.answerSubmissions?.length) return;
    const existing: Record<string, string> = {};
    for (const sub of attempt.answerSubmissions) {
      if (sub.answer) existing[sub.assessmentQuestionId] = sub.answer;
    }
    if (Object.keys(existing).length > 0) setAnswers(existing);
  }, [attempt?.answerSubmissions]);

  /* Initialise timer once assessment loads */
  useEffect(() => {
    if (!assessment?.duration || timerStarted) return;
    setTimeRemaining(assessment.duration * 60);
    setTimerStarted(true);
  }, [assessment?.duration, timerStarted]);

  /* Countdown */
  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitAttemptMutation.mutateAsync({ attemptId: attemptId ?? '', timeRemaining: 0 });
    } catch {
      // auto-submit best-effort
    }
    router.replace('/classroom');
  }, [submitting, attemptId, submitAttemptMutation, router]);

  useEffect(() => {
    if (!timerStarted || timeRemaining <= 0) return;
    const id = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          clearInterval(id);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerStarted]); // intentionally only on timerStarted

  /* Save answer fire-and-forget */
  const saveAnswer = useCallback((questionId: string, answer: string) => {
    if (!answer.trim() || !attemptId) return;
    submitAnswerMutation.mutate({ attemptId, assessmentQuestionId: questionId, answer });
  }, [attemptId, submitAnswerMutation]);

  const handleNext = () => {
    if (currentQ) saveAnswer(currentQ.assessmentQuestionId, answers[currentQ.assessmentQuestionId] ?? '');
    if (currentIndex < totalQ - 1) setCurrentIndex(i => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const handleSubmit = () => {
    const answered = Object.values(answers).filter(a => a.trim()).length;
    Alert.alert(
      'Submit Assessment',
      `You have answered ${answered} of ${totalQ} questions. Submit now?`,
      [
        { text: 'Continue Reviewing', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            if (currentQ) saveAnswer(currentQ.assessmentQuestionId, answers[currentQ.assessmentQuestionId] ?? '');
            setSubmitting(true);
            try {
              await submitAttemptMutation.mutateAsync({ attemptId: attemptId ?? '', timeRemaining });
              router.replace('/classroom');
            } catch (err) {
              setSubmitting(false);
              toast.error(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleClose = () => {
    Alert.alert(
      'Exit Assessment',
      'Your progress is saved. You can resume later from the assessment screen.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', onPress: () => router.back() },
      ],
    );
  };

  const handleTheoryChange = (text: string) => {
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.assessmentQuestionId]: text }));
    if (theoryDebounceRef.current) clearTimeout(theoryDebounceRef.current);
    theoryDebounceRef.current = setTimeout(() => {
      saveAnswer(currentQ.assessmentQuestionId, text);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (theoryDebounceRef.current) clearTimeout(theoryDebounceRef.current);
    };
  }, []);

  if (loadingAssessment || loadingAttempt || loadingQs) {
    return <LoadingScreen color="#6366f1" message="Loading assessment" />;
  }

  /* No questions — assessment has none added yet */
  if (totalQ === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#0B0F14', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}
        edges={['top', 'bottom']}
      >
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="help-circle-outline" size={38} color="#6366f1" />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
          No Questions Yet
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
          This assessment has no questions added yet. Please contact your teacher to add questions before attempting.
        </Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{ backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Go Back</Text>
          </View>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isObjective = currentQ?.question?.questionType === 'objective';
  const options: string[] = currentQ?.question?.options ?? [];
  const currentAnswer = answers[currentQ?.assessmentQuestionId ?? ''] ?? '';
  const answeredCount = Object.values(answers).filter(a => a.trim()).length;
  const timerCritical = timeRemaining > 0 && timeRemaining < 120;
  const timerColor = timerCritical ? '#ef4444' : '#a5b4fc';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F14' }} edges={['top', 'bottom']}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={handleClose} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>

        <Text style={{ flex: 1, color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
          Question {currentIndex + 1} of {totalQ}
        </Text>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: timerCritical ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
          borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
          borderWidth: 1, borderColor: timerCritical ? 'rgba(239,68,68,0.4)' : 'transparent',
        }}>
          <Ionicons name="timer-outline" size={14} color={timerColor} />
          <Text style={{ color: timerColor, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* ── Progress bar ────────────────────────────────────────── */}
      <ProgressBar current={answeredCount} total={totalQ} color="#6366f1" />

      {/* ── Question body ───────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, gap: 20 }}
        style={{ flex: 1 }}
      >
        {/* Marks + type badge */}
        {currentQ?.question?.marks !== undefined && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                {currentQ.question.marks} mark{currentQ.question.marks !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                {currentQ.question.questionType}
              </Text>
            </View>
          </View>
        )}

        {/* Question text */}
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', lineHeight: 26 }}>
          {currentQ?.question?.question ?? '(Question text not available)'}
        </Text>

        {/* Answer area */}
        {isObjective && options.length > 0 ? (
          <View style={{ gap: 10 }}>
            {options.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx] ?? String(idx + 1);
              const selected = currentAnswer === opt;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setAnswers(prev => ({ ...prev, [currentQ.assessmentQuestionId]: opt }))}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: selected ? '#6366f1' : 'rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: selected ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  }}>
                    <View style={{
                      width: 30, height: 30, borderRadius: 15,
                      backgroundColor: selected ? '#fff' : 'rgba(255,255,255,0.1)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: selected ? '#6366f1' : 'rgba(255,255,255,0.5)' }}>
                        {letter}
                      </Text>
                    </View>
                    <Text style={{
                      flex: 1, fontSize: 14, lineHeight: 20,
                      color: selected ? '#fff' : 'rgba(255,255,255,0.8)',
                      fontWeight: selected ? '700' : '400',
                    }}>
                      {opt}
                    </Text>
                    {selected && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : isObjective && options.length === 0 ? (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              Options not available for this question.
            </Text>
          </View>
        ) : (
          <TextInput
            value={currentAnswer}
            onChangeText={handleTheoryChange}
            placeholder="Write your answer here..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            style={{
              backgroundColor: '#1a2030',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: 14,
              color: '#fff',
              fontSize: 14,
              lineHeight: 22,
              minHeight: 160,
            }}
          />
        )}

        {/* Question navigator dots */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 8 }}>
            {questions.map((q, i) => {
              const hasAnswer = !!(answers[q.assessmentQuestionId]?.trim());
              const isCurrent = i === currentIndex;
              return (
                <Pressable
                  key={i}
                  onPress={() => setCurrentIndex(i)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: isCurrent
                      ? '#6366f1'
                      : hasAnswer
                        ? 'rgba(99,102,241,0.3)'
                        : 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    borderColor: isCurrent ? '#6366f1' : hasAnswer ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{
                      fontSize: 11, fontWeight: '700',
                      color: isCurrent ? '#fff' : hasAnswer ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                    }}>
                      {i + 1}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      {/* ── Bottom navigation bar ───────────────────────────────── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 14,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#0B0F14',
      }}>
        {/* Prev */}
        <Pressable
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={({ pressed }) => ({ opacity: currentIndex === 0 ? 0.3 : pressed ? 0.7 : 1 })}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
          }}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Prev</Text>
          </View>
        </Pressable>

        {/* Answer counter */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' }}>
            {answeredCount}/{totalQ} answered
          </Text>
        </View>

        {/* Next or Submit */}
        {currentIndex < totalQ - 1 ? (
          <Pressable onPress={handleNext} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#6366f1',
              borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
            }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => ({ opacity: pressed || submitting ? 0.8 : 1 })}
          >
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#22c55e',
              borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
            }}>
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                {submitting ? 'Submitting…' : 'Submit'}
              </Text>
            </View>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
