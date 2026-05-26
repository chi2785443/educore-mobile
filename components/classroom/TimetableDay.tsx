import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimetableEntry } from '@/interface/timetable.interface';

interface Props {
  entry: TimetableEntry;
}

export default function TimetableDay({ entry }: Props) {
  const subjectColor = entry.subject?.color ?? '#6366f1';
  const subjectName = entry.subject?.name ?? 'Unknown Subject';
  const teacherName = entry.teacher
    ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
    : null;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
      }}
    >
      {/* Color bar */}
      <View style={{ width: 4, backgroundColor: subjectColor }} />

      <View style={{ flex: 1, padding: 14, gap: 6 }}>
        {/* Subject + period */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', flex: 1 }} numberOfLines={1}>
            {subjectName}
          </Text>
          {entry.periodNumber !== undefined && (
            <View
              style={{
                backgroundColor: subjectColor + '20',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: subjectColor }}>
                P{entry.periodNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Time + teacher + room */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={12} color="#9ca3af" />
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>
              {entry.startTime} – {entry.endTime}
            </Text>
          </View>

          {teacherName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="person-outline" size={12} color="#9ca3af" />
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>
                {teacherName}
              </Text>
            </View>
          )}

          {entry.roomNumber && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={12} color="#9ca3af" />
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>
                {entry.roomNumber}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
