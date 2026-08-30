import React from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAttemptReview } from '@/hooks/useStudentAttempt';
import type { AttemptReviewQuestion } from '@/interface/attempt.interface';

/**
 * Per-question answer review, shown once a score has been released.
 *
 * Objective questions render every option with the student's pick and the
 * correct one marked; theory questions show the submitted text against the
 * expected answer, since there is no option list to mark up.
 */

function isObjective(q: AttemptReviewQuestion): boolean {
  return !!q.options?.length;
}

/** Compares an option against a stored answer, tolerating case/spacing drift. */
function sameAnswer(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function Pill({
  text,
  color,
  bg,
  icon,
}: {
  text: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: bg,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
      }}
    >
      <Ionicons name={icon} size={11} color={color} />
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{text}</Text>
    </View>
  );
}

function QuestionCard({ q, index }: { q: AttemptReviewQuestion; index: number }) {
  const objective = isObjective(q);
  const unanswered = !q.studentAnswer?.trim();
  const pending = q.markingStatus === 'pending' && !objective;

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        gap: 12,
      }}
    >
      {/* Prompt */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748b' }}>
            {index + 1}
          </Text>
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: '600',
            color: '#0f172a',
            lineHeight: 20,
          }}
        >
          {q.questionText}
        </Text>
        {pending ? (
          <Pill text="Pending" color="#b45309" bg="#fef3c7" icon="time-outline" />
        ) : q.isCorrect ? (
          <Pill text="Correct" color="#047857" bg="#d1fae5" icon="checkmark-circle" />
        ) : (
          <Pill text="Wrong" color="#dc2626" bg="#fee2e2" icon="close-circle" />
        )}
      </View>

      {q.questionImage ? (
        <Image
          source={{ uri: q.questionImage }}
          style={{ width: '100%', height: 160, borderRadius: 12, backgroundColor: '#f1f5f9' }}
          resizeMode="contain"
        />
      ) : null}

      {/* Answers */}
      {objective ? (
        <View style={{ gap: 6 }}>
          {q.options!.map((opt, i) => {
            const chosen = sameAnswer(opt, q.studentAnswer);
            const correct = sameAnswer(opt, q.correctAnswer);
            const bg = correct ? '#ecfdf5' : chosen ? '#fef2f2' : '#f8fafc';
            const border = correct ? '#a7f3d0' : chosen ? '#fecaca' : '#f1f5f9';
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: border,
                  borderRadius: 11,
                  paddingHorizontal: 11,
                  paddingVertical: 9,
                }}
              >
                <Ionicons
                  name={correct ? 'checkmark-circle' : chosen ? 'close-circle' : 'ellipse-outline'}
                  size={15}
                  color={correct ? '#059669' : chosen ? '#dc2626' : '#cbd5e1'}
                  style={{ marginTop: 1 }}
                />
                <Text style={{ flex: 1, fontSize: 13, color: '#1e293b', lineHeight: 19 }}>
                  {opt}
                </Text>
                {chosen ? (
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '800',
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    Yours
                  </Text>
                ) : null}
              </View>
            );
          })}
          {unanswered ? (
            <Text style={{ fontSize: 12, fontStyle: 'italic', color: '#94a3b8' }}>
              You did not answer this question.
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                marginBottom: 4,
              }}
            >
              Your answer
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: unanswered ? '#94a3b8' : '#1e293b',
                fontStyle: unanswered ? 'italic' : 'normal',
                lineHeight: 19,
                backgroundColor: '#f8fafc',
                borderRadius: 11,
                padding: 11,
              }}
            >
              {unanswered ? 'No answer submitted' : q.studentAnswer}
            </Text>
          </View>
          {q.correctAnswer ? (
            <View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  marginBottom: 4,
                }}
              >
                Expected answer
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: '#065f46',
                  lineHeight: 19,
                  backgroundColor: '#ecfdf5',
                  borderRadius: 11,
                  padding: 11,
                }}
              >
                {q.correctAnswer}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Teacher remark */}
      {q.feedback ? (
        <View
          style={{
            backgroundColor: '#f0f9ff',
            borderRadius: 11,
            padding: 11,
            borderLeftWidth: 3,
            borderLeftColor: '#0ea5e9',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: '#0284c7',
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 4,
            }}
          >
            {"Teacher's remark"}
          </Text>
          <Text style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 19 }}>{q.feedback}</Text>
        </View>
      ) : null}

      {/* Explanation */}
      {q.explanation ? (
        <View
          style={{
            backgroundColor: '#eef2ff',
            borderRadius: 11,
            padding: 11,
            borderLeftWidth: 3,
            borderLeftColor: '#6366f1',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: '#4f46e5',
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 4,
            }}
          >
            Explanation
          </Text>
          <Text style={{ fontSize: 13, color: '#312e81', lineHeight: 19 }}>{q.explanation}</Text>
        </View>
      ) : null}

      <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>
        {q.marksAwarded ?? 0} / {q.maxMarks} marks
      </Text>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 }}>
      {children}
    </View>
  );
}

export function AnswerReview({
  attemptId,
  isReleased,
}: {
  attemptId: string | undefined;
  /** Skips the request entirely when the teacher has not released the score. */
  isReleased: boolean;
}) {
  const { data, isLoading, isError, error } = useAttemptReview(attemptId, isReleased);

  if (!isReleased) {
    return (
      <Centered>
        <Ionicons name="lock-closed-outline" size={26} color="#94a3b8" />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>
          Answers not released yet
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: '#94a3b8',
            textAlign: 'center',
            paddingHorizontal: 32,
            lineHeight: 18,
          }}
        >
          Once your teacher releases this score you will see every question, your
          answer and the correct one here.
        </Text>
      </Centered>
    );
  }

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator color="#4C3FC4" />
        <Text style={{ fontSize: 13, color: '#94a3b8' }}>Loading your answers…</Text>
      </Centered>
    );
  }

  if (isError || !data) {
    return (
      <Centered>
        <Ionicons name="alert-circle-outline" size={26} color="#94a3b8" />
        <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 }}>
          {(error as Error)?.message ?? 'Could not load the answer review.'}
        </Text>
      </Centered>
    );
  }

  if (data.questions.length === 0) {
    return (
      <Centered>
        <Text style={{ fontSize: 13, color: '#94a3b8' }}>
          No questions recorded for this attempt.
        </Text>
      </Centered>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          {
            label: 'Score',
            value:
              data.score !== null && data.totalMarks !== null
                ? `${data.score} / ${data.totalMarks}`
                : '—',
          },
          { label: 'Correct', value: `${data.correctCount} / ${data.questionCount}` },
          {
            label: 'Grade',
            value:
              data.grade ??
              (data.percentage !== null ? `${data.percentage.toFixed(1)}%` : '—'),
          },
        ].map((s) => (
          <View
            key={s.label}
            style={{
              flex: 1,
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{s.value}</Text>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                marginTop: 2,
              }}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {data.questions.map((q, i) => (
        <QuestionCard key={q.assessmentQuestionId} q={q} index={i} />
      ))}
    </View>
  );
}

export default AnswerReview;
