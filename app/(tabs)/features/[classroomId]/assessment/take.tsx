import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { toast } from '@/components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAssessment, useAssessmentQuestions } from '@/hooks/useAssessment';
import { useAttemptById, useSubmitAnswer, useSubmitAttempt } from '@/hooks/useStudentAttempt';
import { studentAttemptService } from '@/services/student-attempt.service';
import { AnswerSubmission } from '@/interface/attempt.interface';
import LoadingScreen from '@/components/ui/LoadingScreen';

/** Picture-in-picture camera preview size. */
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
  const submitAnswerMutation = useSubmitAnswer();
  const submitAttemptMutation = useSubmitAttempt();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const theoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Camera / proctoring ─────────────────────────────────────── */
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isRecording, setIsRecording] = useState(false);
  /**
   * The PiP camera floats above the question. Docked bottom-right (over the
   * empty area under the jump-to-question strip) rather than top-right, where
   * it sat directly on top of the question text and could not be scrolled
   * clear. Tapping it collapses it to a small pill for the rare layout where
   * it still gets in the way.
   */
  const [pipCollapsed, setPipCollapsed] = useState(false);
  const isRecordingRef = useRef(false);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

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

  /* Start recording once camera is mounted and ready */
  const handleCameraReady = useCallback(() => {
    if (isRecordingRef.current) return;
    // Small delay to let the camera's internal video pipeline fully initialise
    // before calling recordAsync — avoids the "Camera is not ready yet" race.
    setTimeout(() => {
      if (!cameraRef.current || isRecordingRef.current) return;
      try {
        isRecordingRef.current = true;
        setIsRecording(true);
        // maxFileSize deliberately NOT set. It previously capped at 45MB to stay
        // under nginx's body limit, but expo-camera 480p is ~2 Mbps, so that
        // ceiling stopped recording after roughly 3 minutes - silently
        // truncating any real assessment. Uploads now go direct to R2, so the
        // limit no longer exists and the full attempt is captured.
        recordingPromiseRef.current = cameraRef.current.recordAsync({
          maxDuration: 7200,
        });
        recordingPromiseRef.current.catch(() => {
          isRecordingRef.current = false;
          setIsRecording(false);
        });
      } catch {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    }, 500);
  }, []);

  /**
   * Stop recording, wait for the camera to finish writing the file, then upload
   * it. Returns a promise the caller MUST await before navigating away.
   *
   * This used to be fire-and-forget: it attached a .then() to the recording
   * promise and returned immediately, while the caller submitted and then
   * called router.back(). The camera finishes writing the file well after
   * stopRecording() returns, so the upload was typically kicked off (or still
   * in flight) as the screen unmounted, and the video never reached the server.
   * Both failure paths were also swallowed by empty .catch() blocks, so a lost
   * proctoring recording was completely invisible to student and teacher.
   */
  const stopAndUploadRecording = useCallback(async (): Promise<void> => {
    if (!isRecordingRef.current || !cameraRef.current) return;
    cameraRef.current.stopRecording();
    isRecordingRef.current = false;
    setIsRecording(false);

    const promise = recordingPromiseRef.current;
    recordingPromiseRef.current = null;
    if (!promise || !attemptId) return;

    try {
      const result = await promise;
      if (!result?.uri) return;
      setUploadingRecording(true);
      await studentAttemptService.uploadRecording(attemptId, result.uri);
    } catch (err) {
      // Surfaced rather than swallowed - the teacher has no other signal that
      // the proctoring video is missing.
      console.warn('[proctoring] recording upload failed', err);
      toast.error(
        'Your exam recording could not be uploaded. Please let your teacher know.',
      );
    } finally {
      setUploadingRecording(false);
    }
  }, [attemptId]);

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

  /* Pre-populate answers from existing submissions (resume) */
  useEffect(() => {
    if (!attempt?.answerSubmissions?.length) return;
    const existing: Record<string, string> = {};
    for (const sub of attempt.answerSubmissions) {
      if (sub.answer) existing[sub.assessmentQuestionId] = sub.answer;
    }
    if (Object.keys(existing).length > 0) setAnswers(existing);
  }, [attempt?.answerSubmissions]);

  /* Initialise timer */
  useEffect(() => {
    if (!assessment?.duration || timerStarted) return;
    setTimeRemaining(assessment.duration * 60);
    setTimerStarted(true);
  }, [assessment?.duration, timerStarted]);

  /* Countdown + auto-submit */
  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    // Start finalising + uploading the video now, but do not leave the screen
    // until it has finished - unmounting mid-upload loses the recording.
    const recordingDone = stopAndUploadRecording();
    try {
      await submitAttemptMutation.mutateAsync({ attemptId: attemptId ?? '', timeRemaining: 0 });
    } catch { /* best-effort */ }
    await recordingDone;
    router.back();
  }, [submitting, attemptId, submitAttemptMutation, router, stopAndUploadRecording]);

  useEffect(() => {
    if (!timerStarted || timeRemaining <= 0) return;
    const id = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) { clearInterval(id); handleAutoSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Stop recording on unmount (safety net) */
  useEffect(() => {
    const camera = cameraRef.current;
    return () => {
      if (isRecordingRef.current && camera) {
        camera.stopRecording();
        isRecordingRef.current = false;
      }
      if (theoryDebounceRef.current) clearTimeout(theoryDebounceRef.current);
    };
  }, []);

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
          text: 'Submit', style: 'destructive',
          onPress: async () => {
            if (currentQ) saveAnswer(currentQ.assessmentQuestionId, answers[currentQ.assessmentQuestionId] ?? '');
            setSubmitting(true);
            // Started before the submit so the file finalises in parallel, but
            // awaited before router.back() so the upload cannot be cut short.
            const recordingDone = stopAndUploadRecording();
            try {
              await submitAttemptMutation.mutateAsync({ attemptId: attemptId ?? '', timeRemaining });
              await recordingDone;
              router.back();
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
    if (theoryDebounceRef.current) clearTimeout(theoryDebounceRef.current);
    theoryDebounceRef.current = setTimeout(() => {
      saveAnswer(currentQ.assessmentQuestionId, text);
    }, 3000);
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
                    onPress={() => setAnswers(prev => ({ ...prev, [currentQ.assessmentQuestionId]: opt }))}
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
                      onPress={() => setCurrentIndex(i)}
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
          {pipCollapsed ? (
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.75)',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              {isRecording ? <RecordingDot /> : null}
              <Text style={{ color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                {isRecording ? 'REC' : 'CAM'}
              </Text>
            </View>
          ) : (
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
              {/* Recording indicator overlay */}
              <View style={{
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
              </View>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}
