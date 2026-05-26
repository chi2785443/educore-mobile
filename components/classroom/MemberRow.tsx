import React from 'react';
import { View, Text } from 'react-native';
import { ClassroomMember } from '@/interface/classroom.interface';

interface Props {
  member: ClassroomMember;
  role?: 'teacher' | 'student';
}

const AVATAR_COLORS = [
  '#6366f1', '#0ea5e9', '#14b8a6', '#7c3aed',
  '#f59e0b', '#e11d48', '#10b981', '#f97316',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MemberRow({ member, role }: Props) {
  const firstName = member?.firstName ?? '';
  const lastName = member?.lastName ?? '';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
  const avatarColor = getAvatarColor(member?.id ?? firstName + lastName);
  const displayRole = role === 'teacher' ? 'Teacher' : role === 'student' ? 'Student' : undefined;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
        gap: 12,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: avatarColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }}>
          {firstName} {lastName}
        </Text>
        {(member?.jobTitle || member?.email) && (
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }} numberOfLines={1}>
            {member.jobTitle ?? member.email}
          </Text>
        )}
      </View>

      {/* Role badge */}
      {displayRole && (
        <View
          style={{
            backgroundColor: role === 'teacher' ? '#ede9fe' : '#dbeafe',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: role === 'teacher' ? '#7c3aed' : '#2563eb',
            }}
          >
            {displayRole}
          </Text>
        </View>
      )}
    </View>
  );
}
