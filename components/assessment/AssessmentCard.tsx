import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Assessment, AssessmentStatus, AssessmentType } from '@/interface/assessment.interface';

const TYPE_COLORS: Record<AssessmentType, string> = {
  exam:       '#e11d48',
  test:       '#7c3aed',
  quiz:       '#0ea5e9',
  assignment: '#10b981',
};

const STATUS_STYLE: Record<AssessmentStatus, { bg: string; text: string; label: string }> = {
  draft:     { bg: '#f3f4f6', text: '#6b7280', label: 'Draft' },
  published: { bg: '#dcfce7', text: '#16a34a', label: 'Published' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
  completed: { bg: '#ede9fe', text: '#7c3aed', label: 'Completed' },
};

interface Props {
  assessment: Assessment;
  onPress: () => void;
}

export default function AssessmentCard({ assessment, onPress }: Props) {
  const typeColor = TYPE_COLORS[assessment.type] ?? '#6366f1';
  const statusStyle = STATUS_STYLE[assessment.status] ?? STATUS_STYLE.draft;

  const scheduledDisplay = assessment.scheduledDate
    ? new Date(assessment.scheduledDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1, marginBottom: 12 })}
    >
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
      }}>
        {/* Top band */}
        <View style={{ height: 5, backgroundColor: typeColor }} />

        <View style={{ padding: 14, gap: 10 }}>
          {/* Title row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', lineHeight: 20 }} numberOfLines={2}>
                {assessment.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={{ marginTop: 2 }} />
          </View>

          {/* Badges row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <View style={{ backgroundColor: typeColor + '18', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: typeColor, textTransform: 'capitalize' }}>
                {assessment.type}
              </Text>
            </View>
            <View style={{ backgroundColor: statusStyle.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: statusStyle.text }}>
                {statusStyle.label}
              </Text>
            </View>
            {assessment.subject && (
              <View style={{ backgroundColor: (assessment.subject.color ?? '#6366f1') + '18', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: assessment.subject.color ?? '#6366f1' }} numberOfLines={1}>
                  {assessment.subject.name}
                </Text>
              </View>
            )}
          </View>

          {/* Meta row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trophy-outline" size={12} color="#9ca3af" />
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>
                {assessment.totalMarks} marks
              </Text>
            </View>
            {assessment.duration && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="timer-outline" size={12} color="#9ca3af" />
                <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>
                  {assessment.duration} min
                </Text>
              </View>
            )}
            {scheduledDisplay && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>
                  {scheduledDisplay}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
