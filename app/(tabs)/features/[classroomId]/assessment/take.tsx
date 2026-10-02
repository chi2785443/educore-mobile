import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Easing, AppState,
} from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { toast } from '@/components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAssessment, useAssessmentQuestions } from '@/hooks/useAssessment';
import { useQueryClient } from '@tanstack/react-query';
import { useAttemptById } from '@/hooks/useStudentAttempt';
import {
  getDraftAnswers, queueAnswer, submitAttemptViaOutbox,
  takeAnswerRejections, usePendingExamCount,
} from '@/lib/examOutbox';
import { useProctoringCapture } from '@/hooks/useProctoringCapture';
import { useIsOnline } from '@/hooks/useIsOnline';
import { AnswerSubmission } from '@/interface/attempt.interface';
import LoadingScreen from '@/components/ui/LoadingScreen';

/** Picture-in-picture camera preview size. */
/** The exam is submitted automatically on this many times leaving the app. */
const MAX_LEAVES = 3;
const PIP_WIDTH = 76;
const PIP_HEIGHT = 104;
/** Approximate height of the bottom nav bar, excluding the safe-area inset. */
const FOOTER_HEIGHT = 56;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.12)' }}>
      <View style={{ height: 3, width: `${pct}%`, backgroundColor: color }} />
    </View>
  );
}

/* ── Pulsing red dot to indicate live recording ─────────────────── */
function RecordingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [scale]);
  return (
    <Animated.View style={{
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: '#ef4444',
      transform: [{ scale }],
    }} />
  );
}

export default function TakeAssessmentScreen() {
  const { assessmentId, attemptId } = useLocalSearchParams<{
    assessmentId: string;
    attemptId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: assessment, isLoading: loadingAssessment } = useAssessment(assessmentId);
  const { data: assessmentQs = [], isLoading: loadingQs } = useAssessmentQuestions(assessmentId);
  const { data: attempt, isLoading: loadingAttempt } = useAttemptById(attemptId);
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();
  const pendingSync = usePendingExamCount(attemptId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const autoSubmittedRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const theoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Latest typed theory text not yet handed to the outbox. */
  const pendingTheoryRef = useRef<{ questionId: string; text: string } | null>(null);

  /* ── Camera / proctoring ─────────────────────────────────────── */
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  /**
   * The PiP camera floats above the question. Docked bottom-right (over the
   * empty area under the jump-to-question strip) rather than top-right, where
   * it sat directly on top of the question text and could not be scrolled
   * clear. Tapping it collapses it to a small pill for the rare layout where
   * it still gets in the way.
   */
  const [pipCollapsed, setPipCollapsed] = useState(false);

  /* Request camera + mic on mount */
  useEffect(() => {
    (async () => {
      const cam = await requestCameraPermission();
      const mic = await requestMicPermission();
      if (!cam.granted || !mic.granted) {
        Alert.alert(
          'Camera Required',
          'Camera and microphone access is required for this proctored assessment.',
          [{ text: 'Go Back', onPress: () => router.back() }],
          { cancelable: false },
        );
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Proctoring: short clips at random gaps, periodic photos, a longer clip when
   * the student returns from another app, and a log of every time the app left
   * the foreground. Queued on the device and uploaded in the background.
   */
  const handleCameraReady = useCallback(() => {
    // Small delay to let the camera's internal video pipeline fully initialise
    // before the first capture - avoids the "Camera is not ready yet" race.
    setTimeout(() => setCameraReady(true), 500);
  }, []);

  const proctoring = useProctoringCapture({
    attemptId,
    startedAt: attempt?.startedAt,
    cameraRef,
    ready: cameraReady,
  });
  const isRecording = proctoring.recording;

  /**
   * Finish proctoring before leaving the screen: stop the clip in progress,
   * queue the events and give uploads a short window. Anything unfinished
   * keeps uploading from the outbox in the background.
   */
  const stopProctoring = useCallback(async (): Promise<void> => {
    setUploadingRecording(true);
    try {
      await proctoring.flush();
    } finally {
      setUploadingRecording(false);
    }
  }, [proctoring]);

  /* Build questions */
  const questions = useMemo<AnswerSubmission[]>(() =>
    [...assessmentQs]
      .sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0))
      .map(aq => ({
        id: aq.id,
        assessmentQuestionId: aq.id,
        answer: '',
        question: {
          id: aq.question.id,
          question: aq.question.questionText,
          questionImage: aq.question.questionImage ?? null,
          questionType: aq.question.type,
          options: aq.question.options ?? [],
          marks: aq.marks,
        },
      })),
    [assessmentQs],
  );

  const currentQ = questions[currentIndex];
  const totalQ = questions.length;

  /*
   * Resume: server answers, overlaid with any saved on this phone that have
   * not reached the server yet (the local copy is always the newer one).
   */
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;
    getDraftAnswers(attemptId).then((drafts) => {
      if (cancelled) return;
      const merged: Record<string, string> = {};
      for (const sub of attempt?.answerSubmissions ?? []) {
        if (sub.answer) merged[sub.assessmentQuestionId] = sub.answer;
      }
      Object.assign(merged, drafts);
      if (Object.keys(merged).length > 0) setAnswers((prev) => ({ ...merged, ...prev }));
    });
    return () => { cancelled = true; };
  }, [attemptId, attempt?.answerSubmissions]);

  /*
   * Count down to a fixed deadline (server start time + duration) rather than
   * ticking a counter. A counter restarted from the full duration on resume,
   * and it stalls while the phone sleeps or the app is backgrounded, so the
   * student's clock drifted behind the server's and answers were refused
   * "early". The server remains the authority either way.
   */
  const deadlineMs = assessment?.duration && attempt?.startedAt
    ? new Date(attempt.startedAt).getTime() + assessment.duration * 60_000
    : null;
  const timeRemaining = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / 1000)) : 0;

  useEffect(() => {
    if (!deadlineMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  /* Tell the student once if the server refused any saved answer. */
  useEffect(() => {
    if (!attemptId || pendingSync > 0) return;
    takeAnswerRejections(attemptId).then((refused) => {
      if (refused.length) toast.error(refused[0].message);
    });
  }, [attemptId, pendingSync]);

  /*
   * Saved to the phone immediately and delivered in the background with
   * retries. Previously this was a fire-and-forget request made only on
   * "Next": an option tap followed by Prev or the question grid never
   * reached the server, and any network blip dropped the answer silently.
   */
  const saveAnswer = useCallback((questionId: string, answer: string) => {
    if (!answer.trim() || !attemptId) return;
    void queueAnswer(attemptId, questionId, answer);
  }, [attemptId]);

  /** Send a theory answer still waiting on its typing debounce. */
  function flushTheoryDraft() {
    if (theoryDebounceRef.current) clearTimeout(theoryDebounceRef.current);
    theoryDebounceRef.current = null;
    const pending = pendingTheoryRef.current;
    pendingTheoryRef.current = null;
    if (pending) saveAnswer(pending.questionId, pending.text);
  }

  const finishAndLeave = useCallback(async (outcome: 'submitted' | 'queued') => {
    queryClient.invalidateQueries({ queryKey: ['attempts', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['scores', 'mine'] });
    if (outcome === 'queued') {
      toast.info("You're offline. Your answers are saved and will be submitted automatically when you reconnect.");
    }
    router.back();
  }, [queryClient, router]);

  /* Countdown + auto-submit */
  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    // Start finalising + uploading the video now, but do not leave the screen
    // until it has finished - unmounting mid-upload loses the recording.
    flushTheoryDraft();
    const recordingDone = stopProctoring();
    let outcome: 'submitted' | 'queued' = 'submitted';
    try {
      outcome = await submitAttemptViaOutbox(attemptId ?? '', 0);
    } catch (err) {
      // Usually "already auto-submitted" by the server at the deadline.
      toast.error(err instanceof Error ? err.message : 'Time is up.');
    }
    await recordingDone;
    await finishAndLeave(outcome);
  }, [submitting, attemptId, finishAndLeave, stopProctoring]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Leaving the exam: warn each time, end it on the third. */
  const leavesRef = useRef(0);
  useEffect(() => {
    let backgroundedAt = 0;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        backgroundedAt = Date.now();
        return;
      }
      // 'inactive' alone is a notification shade or system dialog, not leaving.
      if (next !== 'active' || backgroundedAt === 0) return;
      const awayMs = Date.now() - backgroundedAt;
      backgroundedAt = 0;
      if (awayMs < 2000 || autoSubmittedRef.current) return;
      leavesRef.current += 1;
      if (leavesRef.current >= MAX_LEAVES) {
        autoSubmittedRef.current = true;
        toast.error(`You left the exam ${MAX_LEAVES} times. It has ended and your answers are being submitted.`);
        void handleAutoSubmit();
      } else {
        const left = MAX_LEAVES - leavesRef.current;
        Alert.alert(
          `Warning ${leavesRef.current} of ${MAX_LEAVES}`,
          `You left the exam screen. Leaving ${left === 1 ? 'one more time' : `${left} more times`} will end the exam and submit your answers automatically.`,
        );
      }
    });
    return () => sub.remove();
  }, [handleAutoSubmit]);

  useEffect(() => {
    if (!deadlineMs || timeRemaining > 0 || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void handleAutoSubmit();
  }, [deadlineMs, timeRemaining, handleAutoSubmit]);

  /* Unmount safety net (the proctoring hook stops its own camera work). */
  useEffect(() => {
    return () => {
      // Leaving mid-sentence: keep what was typed rather than dropping it.
      if (theoryDebounceRef.current) clearTimeout(theoryDebounceRef.current);
      const pending = pendingTheoryRef.current;
      if (pending && attemptId && pending.text.trim()) {
        void queueAnswer(attemptId, pending.questionId, pending.text);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (index: number) => {
    flushTheoryDraft();
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < totalQ - 1) goTo(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };

  const handleSelectOption = (option: string) => {
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.assessmentQuestionId]: option }));
    saveAnswer(currentQ.assessmentQuestionId, option);
  };

  const handleSubmit = () => {
    const answered = Object.values(answers).filter(a => a.trim()).length;
    Alert.alert(
      'Submit Assessment',
      `You have answered ${answered} of ${totalQ} questions. Submit now?`,
      [
        { text: 'Continue Reviewing', style: 'cancel' },
        {
          text: 'Submit', style: 'destructive',
          onPress: async () => {
            flushTheoryDraft();
            setSubmitting(true);
            // Started before the submit so the file finalises in parallel, but
            // awaited before router.back() so the upload cannot be cut short.
            const recordingDone = stopProctoring();
            try {
              // Delivers every queued answer first, then submits; 'queued'
              // when offline, finished automatically on reconnect.
              const outcome = await submitAttemptViaOutbox(attemptId ?? '', timeRemaining);
              await recordingDone;
              await finishAndLeave(outcome);
            } catch (err) {
              await recordingDone;
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
    pendingTheoryRef.current = { questionId: currentQ.assessmentQuestionId, text };
    if (theoryDebounceRef.current) clearTimeout(theoryDebounceRef.current);
    theoryDebounceRef.current = setTimeout(flushTheoryDraft, 1500);
  };

  if (loadingAssessment || loadingAttempt || loadingQs) {
    return <LoadingScreen color="#6366f1" message="Loading assessment" />;
  }

  if (totalQ === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F14', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="help-circle-outline" size={38} color="#6366f1" />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>No Questions Yet</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
          This assessment has no questions added yet. Please contact your teacher.
        </Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{ backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Go Back</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  const isObjective = currentQ?.question?.questionType === 'objective';
  const options: string[] = (currentQ?.question?.options as string[]) ?? [];
  const currentAnswer = answers[currentQ?.assessmentQuestionId ?? ''] ?? '';
  const answeredCount = Object.values(answers).filter(a => a.trim()).length;
  const timerCritical = timeRemaining > 0 && timeRemaining < 120;
  const timerColor = timerCritical ? '#ef4444' : '#a5b4fc';
  const cameraGranted = !!cameraPermission?.granted && !!micPermission?.granted;

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F14' }}>
      {/* Safe top inset */}
      <View style={{ height: insets.top, backgroundColor: '#0B0F14' }} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={handleClose} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>
            {assessment?.title ?? 'Assessment'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 1 }}>
            Question {currentIndex + 1} of {totalQ}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons
              name={!isOnline ? 'cloud-offline-outline' : pendingSync > 0 ? 'sync-outline' : 'cloud-done-outline'}
              size={11}
              color={!isOnline ? '#fbbf24' : pendingSync > 0 ? '#a5b4fc' : '#34d399'}
            />
            <Text style={{ color: !isOnline ? '#fbbf24' : 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '600' }}>
              {!isOnline
                ? `Offline · ${pendingSync} saved on phone`
                : pendingSync > 0 ? 'Saving…' : 'All answers saved'}
            </Text>
          </View>
        </View>

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

      {/* ── Progress bar ─────────────────────────────────────────── */}
      <ProgressBar current={answeredCount} total={totalQ} color="#6366f1" />

      {/* ── Content ──────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: cameraGranted ? PIP_HEIGHT + 32 : 16, gap: 18 }}
          style={{ flex: 1 }}
        >
          {/* Marks + type badge */}
          {currentQ?.question?.marks !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
              {currentQ.question.questionImage && (
                <View style={{ backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ color: '#a5b4fc', fontSize: 11, fontWeight: '600' }}>📷 Has image</Text>
                </View>
              )}
            </View>
          )}

          {/* Question image */}
          {currentQ?.question?.questionImage && (
            <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <Image
                source={{ uri: currentQ.question.questionImage }}
                style={{ width: '100%', height: 200 }}
                contentFit="contain"
                transition={200}
              />
            </View>
          )}

          {/* Question text */}
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', lineHeight: 27 }}>
            {currentQ?.question?.question?.trim()
              ? currentQ.question.question
              : '(No question text)'}
          </Text>

          {/* ── Answer area ──────────────────────────────────────── */}
          {isObjective && options.length > 0 ? (
            <View style={{ gap: 10 }}>
              {options.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx] ?? String(idx + 1);
                const selected = currentAnswer === opt;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectOption(opt)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      backgroundColor: selected ? '#6366f1' : 'rgba(255,255,255,0.06)',
                      borderRadius: 14, padding: 14,
                      borderWidth: 1.5,
                      borderColor: selected ? '#818cf8' : 'rgba(255,255,255,0.1)',
                    }}>
                      <View style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: selected ? '#fff' : 'rgba(255,255,255,0.1)',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: selected ? '#6366f1' : 'rgba(255,255,255,0.5)' }}>
                          {letter}
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: selected ? '#fff' : 'rgba(255,255,255,0.8)', fontWeight: selected ? '700' : '400' }}>
                        {opt}
                      </Text>
                      {selected && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : isObjective && options.length === 0 ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={28} color="rgba(255,255,255,0.3)" />
              <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center' }}>
                No options for this question.
              </Text>
            </View>
          ) : (
            <TextInput
              value={currentAnswer}
              onChangeText={handleTheoryChange}
              placeholder="Write your answer here…"
              placeholderTextColor="rgba(255,255,255,0.25)"
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              style={{
                backgroundColor: '#1a2030',
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.12)',
                borderRadius: 14, padding: 14,
                color: '#fff', fontSize: 15, lineHeight: 23,
                minHeight: 140,
              }}
            />
          )}

          {/* ── Question navigator ───────────────────────────────── */}
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Jump to question
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                {questions.map((q, i) => {
                  const hasAnswer = !!(answers[q.assessmentQuestionId]?.trim());
                  const isCurrent = i === currentIndex;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => goTo(i)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <View style={{
                        width: 32, height: 32, borderRadius: 10,
                        backgroundColor: isCurrent ? '#6366f1' : hasAnswer ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.07)',
                        borderWidth: 1.5,
                        borderColor: isCurrent ? '#818cf8' : hasAnswer ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: isCurrent ? '#fff' : hasAnswer ? '#a5b4fc' : 'rgba(255,255,255,0.3)' }}>
                          {i + 1}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom nav bar ───────────────────────────────────────── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingTop: 12,
        paddingBottom: Math.max(insets.bottom + 4, 16),
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#0B0F14',
      }}>
        <Pressable
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={({ pressed }) => ({ opacity: currentIndex === 0 ? 0.25 : pressed ? 0.7 : 1 })}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
            paddingVertical: 13, paddingHorizontal: 18,
          }}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Prev</Text>
          </View>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' }}>
            {answeredCount}/{totalQ} answered
          </Text>
        </View>

        {currentIndex < totalQ - 1 ? (
          <Pressable onPress={handleNext} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#6366f1', borderRadius: 12,
              paddingVertical: 13, paddingHorizontal: 18,
            }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </Pressable>
        ) : (
          <Pressable onPress={handleSubmit} disabled={submitting} style={({ pressed }) => ({ opacity: pressed || submitting ? 0.8 : 1 })}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#22c55e', borderRadius: 12,
              paddingVertical: 13, paddingHorizontal: 18,
            }}>
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                {uploadingRecording
                  ? 'Uploading video…'
                  : submitting
                    ? 'Submitting…'
                    : 'Submit'}
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* ── PiP camera feed ──────────────────────────────────────── */}
      {cameraGranted && (
        <Pressable
          onPress={() => setPipCollapsed((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={
            pipCollapsed ? 'Expand camera preview' : 'Collapse camera preview'
          }
          style={{
            position: 'absolute',
            // Docked above the bottom nav bar, clear of the question text.
            bottom: FOOTER_HEIGHT + Math.max(insets.bottom + 4, 16) + 12,
            right: 10,
            width: pipCollapsed ? 44 : PIP_WIDTH,
            height: pipCollapsed ? 28 : PIP_HEIGHT,
            borderRadius: pipCollapsed ? 14 : 14,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: isRecording ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.15)',
            shadowColor: '#000',
            shadowOpacity: 0.5,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 12,
            zIndex: 999,
          }}
        >
          {/*
            The camera stays mounted even when the preview is collapsed: it used
            to be unmounted, which silently stopped proctoring capture.
          */}
          {(
            <>
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing="front"
                // Lowest standard quality: proctoring needs a recognisable
                // face, not detail, and it keeps the upload small on mobile data.
                videoQuality="480p"
                // Without this the device's 480p camcorder profile picks its own
                // bitrate (~2 Mbps on most Android hardware), making a one-hour
                // attempt roughly 1 GB in R2. 200 kbps matches what the web
                // recorder uses and brings that to about 90 MB.
                videoBitrate={200_000}
                mode="video"
                onCameraReady={handleCameraReady}
              />
              {/* Collapsed pill covers the live preview but leaves the camera running */}
              {pipCollapsed ? (
                <View style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  {isRecording ? <RecordingDot /> : null}
                  <Text style={{ color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                    {isRecording ? 'REC' : 'CAM'}
                  </Text>
                </View>
              ) : null}
              {/* Recording indicator overlay */}
              {pipCollapsed ? null : <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: 'rgba(0,0,0,0.55)',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 4, paddingVertical: 4,
              }}>
                {isRecording ? (
                  <>
                    <RecordingDot />
                    <Text style={{ color: '#ef4444', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>REC</Text>
                  </>
                ) : (
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>CAM</Text>
                )}
              </View>}
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}
