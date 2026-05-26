import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StudentScore } from '@/interface/attempt.interface';

interface Props {
  score: StudentScore;
  compact?: boolean;
}

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#14b8a6', '#7c3aed', '#f59e0b', '#e11d48'];
function getAvatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function ScoreCard({ score, compact = false }: Props) {
  const pct = Math.round(score.percentage);
  const passColor = score.isPassed ? '#16a34a' : '#dc2626';
  const passBg    = score.isPassed ? '#dcfce7' : '#fee2e2';
  const heroBg    = score.isPassed ? '#f0fdf4' : '#fff5f5';
  const heroBorder= score.isPassed ? '#bbf7d0' : '#fecaca';

  /* ── Compact row (staff scores list) ─────────────────────────── */
  if (compact) {
    const studentName = score.student
      ? `${score.student.firstName} ${score.student.lastName}`
      : 'Student';
    const initials = score.student
      ? `${score.student.firstName[0] ?? ''}${score.student.lastName[0] ?? ''}`.toUpperCase()
      : '?';
    const avatarColor = getAvatarColor(score.studentId);

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
            {score.score}/{score.totalMarks} · {score.questionsAnswered} answered
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#1e293b' }}>{pct}%</Text>
          <View style={{ backgroundColor: passBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: passColor }}>
              {score.grade} · {score.isPassed ? 'Pass' : 'Fail'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  /* ── Full card (student's own score) ─────────────────────────── */
  return (
    <View style={{
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#f1f5f9',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 4,
    }}>
      {/* Score hero banner */}
      <View style={{ backgroundColor: heroBg, borderBottomWidth: 1, borderBottomColor: heroBorder, padding: 24, alignItems: 'center', gap: 14 }}>
        {/* Score circle */}
        <View style={{
          width: 110, height: 110, borderRadius: 55,
          backgroundColor: passColor,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: passColor, shadowOpacity: 0.35,
          shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8,
        }}>
          <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>{pct}%</Text>
        </View>

        {/* Grade + pass/fail badge */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: passBg, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6, borderWidth: 1, borderColor: heroBorder }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: passColor }}>
              Grade {score.grade}  ·  {score.isPassed ? 'Passed ✓' : 'Failed ✗'}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: passColor, fontWeight: '600' }}>
            {score.score} out of {score.totalMarks} marks
          </Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={{ backgroundColor: '#fff', flexDirection: 'row' }}>
        {[
          { label: 'Correct',  value: `${score.correctAnswers}`,   icon: 'checkmark-circle-outline' as const, color: '#16a34a' },
          { label: 'Wrong',    value: `${score.incorrectAnswers}`,  icon: 'close-circle-outline' as const,     color: '#dc2626' },
          { label: 'Answered', value: `${score.questionsAnswered}`, icon: 'help-circle-outline' as const,      color: '#0ea5e9' },
          { label: 'Score',    value: `${score.score}/${score.totalMarks}`, icon: 'trophy-outline' as const,   color: '#7c3aed' },
        ].map((stat, i) => (
          <View key={stat.label} style={{
            flex: 1,
            alignItems: 'center', gap: 4, paddingVertical: 14,
            borderRightWidth: i < 3 ? 1 : 0,
            borderRightColor: '#f1f5f9',
          }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: stat.color + '15', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={stat.icon} size={16} color={stat.color} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#1e293b' }}>{stat.value}</Text>
            <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600' }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Remarks */}
      {score.remarks && (
        <View style={{ backgroundColor: '#f8fafc', padding: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280' }}>Teacher Remarks</Text>
          <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>{score.remarks}</Text>
        </View>
      )}
    </View>
  );
}
