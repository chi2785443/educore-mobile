import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StudentScore } from '@/interface/attempt.interface';

interface Props {
  score: StudentScore;
  compact?: boolean;
  /** true = no score record yet (not graded at all) */
  pending?: boolean;
  /** true = graded but teacher hasn't released it yet */
  underReview?: boolean;
}

/* ── Safe number helpers ─────────────────────────────────────────── */
function safeNum(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
function safePct(v: unknown): number {
  return Math.round(safeNum(v));
}
function safeStr(v: unknown, fallback = '—'): string {
  if (v == null) return fallback;
  const s = String(v).trim();
  return s === '' || s === 'undefined' || s === 'null' || s === 'NaN' ? fallback : s;
}
function safeGrade(v: unknown): string {
  const s = safeStr(v, '');
  return s || '—';
}


const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#14b8a6', '#7c3aed', '#f59e0b', '#e11d48'];
function getAvatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ── Pending grading card ────────────────────────────────────────── */
function PendingGradingCard() {
  return (
    <View style={{
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: '#fde68a',
      shadowColor: '#f59e0b',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 3,
    }}>
      {/* Top banner */}
      <View style={{ backgroundColor: '#fffbeb', paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 16 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: '#fef3c7',
          borderWidth: 3, borderColor: '#fde68a',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="hourglass-outline" size={38} color="#d97706" />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#92400e', letterSpacing: -0.3 }}>
            Awaiting Grading
          </Text>
          <Text style={{ fontSize: 13, color: '#b45309', textAlign: 'center', lineHeight: 20 }}>
            Your submission was received.{'\n'}{"Your teacher hasn't marked it yet."}
          </Text>
        </View>
      </View>

      {/* Info strip */}
      <View style={{ backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#fde68a' }}>
        {[
          { icon: 'checkmark-done-outline' as const, label: 'Submitted', color: '#16a34a' },
          { icon: 'time-outline' as const, label: 'Pending review', color: '#d97706' },
          { icon: 'notifications-outline' as const, label: "You'll be notified", color: '#0ea5e9' },
        ].map((s, i) => (
          <View key={s.label} style={{
            flex: 1, alignItems: 'center', paddingVertical: 16, gap: 6,
            borderRightWidth: i < 2 ? 1 : 0, borderRightColor: '#fef3c7',
          }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: s.color + '15', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={s.icon} size={17} color={s.color} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6b7280', textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── Under review card ───────────────────────────────────────────── */
function UnderReviewCard() {
  return (
    <View style={{
      borderRadius: 24, overflow: 'hidden',
      borderWidth: 1.5, borderColor: '#bfdbfe',
      shadowColor: '#3b82f6', shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
    }}>
      <View style={{ backgroundColor: '#eff6ff', paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 16 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: '#dbeafe', borderWidth: 3, borderColor: '#bfdbfe',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="eye-off-outline" size={38} color="#2563eb" />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#1e3a8a', letterSpacing: -0.3 }}>Under Review</Text>
          <Text style={{ fontSize: 13, color: '#3b82f6', textAlign: 'center', lineHeight: 20 }}>
            Your assessment has been marked.{'\n'}{"Your teacher hasn't released the scores yet."}
          </Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#bfdbfe' }}>
        {[
          { icon: 'checkmark-done-outline' as const, label: 'Marked', color: '#16a34a' },
          { icon: 'lock-closed-outline' as const, label: 'Pending release', color: '#2563eb' },
          { icon: 'notifications-outline' as const, label: "You'll be notified", color: '#0ea5e9' },
        ].map((s, i) => (
          <View key={s.label} style={{
            flex: 1, alignItems: 'center', paddingVertical: 16, gap: 6,
            borderRightWidth: i < 2 ? 1 : 0, borderRightColor: '#eff6ff',
          }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: s.color + '15', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={s.icon} size={17} color={s.color} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6b7280', textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ScoreCard({ score, compact = false, pending = false, underReview = false }: Props) {
  /* ── Compact row (staff scores list) ─────────────────────────── */
  if (compact) {
    const pct = safePct(score.percentage);
    const isPassed = !!score.isPassed;
    const passColor = isPassed ? '#16a34a' : '#dc2626';
    const passBg = isPassed ? '#dcfce7' : '#fee2e2';
    const grade = safeGrade(score.grade);
    const studentName = score.student
      ? `${safeStr(score.student.firstName, '?')} ${safeStr(score.student.lastName, '')}`
      : 'Student';
    const initials = score.student
      ? `${score.student.firstName?.[0] ?? ''}${score.student.lastName?.[0] ?? ''}`.toUpperCase() || '?'
      : '?';
    const avatarColor = getAvatarColor(score.studentId ?? '');

    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#f8fafc',
        backgroundColor: '#fff',
      }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }} numberOfLines={1}>{studentName}</Text>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
            {safeNum(score.score)}/{safeNum(score.totalMarks)} · {safeNum(score.questionsAnswered)} answered
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#1e293b' }}>{pct}%</Text>
          <View style={{ backgroundColor: passBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: passColor }}>
              {grade} · {isPassed ? 'Pass' : 'Fail'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  /* ── Full card — show pending/under-review if explicitly flagged ── */
  if (pending) return <PendingGradingCard />;
  if (underReview) return <UnderReviewCard />;


  /* ── Full card (graded) ───────────────────────────────────────── */
  const pct = safePct(score.percentage);
  const isPassed = !!score.isPassed;
  const grade = safeGrade(score.grade);
  const sc = safeNum(score.score);
  const total = safeNum(score.totalMarks);
  const correct = safeNum(score.correctAnswers);
  const incorrect = safeNum(score.incorrectAnswers);
  const answered = safeNum(score.questionsAnswered);
  const gp = score.gradePoint != null ? Number(score.gradePoint) : null;

  const passColor  = isPassed ? '#16a34a' : '#dc2626';
  const passBg     = isPassed ? '#dcfce7' : '#fee2e2';
  const heroBg     = isPassed ? '#f0fdf4' : '#fff5f5';
  const heroBorder = isPassed ? '#bbf7d0' : '#fecaca';

  return (
    <View style={{
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isPassed ? '#bbf7d0' : '#fecaca',
      overflow: 'hidden',
      shadowColor: passColor,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 4,
    }}>
      {/* Hero banner */}
      <View style={{ backgroundColor: heroBg, borderBottomWidth: 1, borderBottomColor: heroBorder, padding: 28, alignItems: 'center', gap: 14 }}>
        {/* Score circle */}
        <View style={{
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: passColor,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: passColor, shadowOpacity: 0.35,
          shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8,
        }}>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>{pct}%</Text>
        </View>

        {/* Grade + pass/fail badge */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: passBg, borderRadius: 24, paddingHorizontal: 22, paddingVertical: 8, borderWidth: 1.5, borderColor: heroBorder }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: passColor }}>
              Grade {grade}  ·  {isPassed ? 'Passed ✓' : 'Failed ✗'}
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: passColor, fontWeight: '700' }}>
            {sc} out of {total} marks
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ backgroundColor: '#fff', flexDirection: 'row' }}>
        {[
          { label: 'Correct',  value: String(correct),   icon: 'checkmark-circle-outline' as const, color: '#16a34a' },
          { label: 'Wrong',    value: String(incorrect),  icon: 'close-circle-outline' as const,     color: '#dc2626' },
          { label: 'Answered', value: String(answered),   icon: 'help-circle-outline' as const,      color: '#0ea5e9' },
          { label: 'GPA',      value: gp != null && !isNaN(gp) ? gp.toFixed(1) : '—', icon: 'trophy-outline' as const, color: '#7c3aed' },
        ].map((stat, i) => (
          <View key={stat.label} style={{
            flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14,
            borderRightWidth: i < 3 ? 1 : 0, borderRightColor: '#f1f5f9',
          }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: stat.color + '15', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={stat.icon} size={16} color={stat.color} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#1e293b' }}>{stat.value}</Text>
            <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600' }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Progress bar */}
      {answered > 0 && (
        <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af' }}>Accuracy</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#374151' }}>
              {answered > 0 ? Math.round((correct / answered) * 100) : 0}%
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#e2e8f0', overflow: 'hidden', flexDirection: 'row' }}>
            <View style={{ flex: correct, backgroundColor: '#16a34a', borderRadius: 4 }} />
            <View style={{ flex: incorrect, backgroundColor: '#dc2626', borderRadius: 4 }} />
            <View style={{ flex: Math.max(0, answered - correct - incorrect), backgroundColor: '#e2e8f0' }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#16a34a' }} />
              <Text style={{ fontSize: 10, color: '#6b7280' }}>Correct</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#dc2626' }} />
              <Text style={{ fontSize: 10, color: '#6b7280' }}>Wrong</Text>
            </View>
          </View>
        </View>
      )}

      {/* Remarks */}
      {score.remarks && (
        <View style={{ backgroundColor: '#f0f9ff', padding: 14, borderTopWidth: 1, borderTopColor: '#e0f2fe', gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#0284c7" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5 }}>{"Teacher's Remarks"}</Text>
          </View>
          <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 20 }}>{score.remarks}</Text>
        </View>
      )}
    </View>
  );
}
