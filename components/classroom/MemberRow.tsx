import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ClassroomMember } from '@/interface/classroom.interface';

interface Props {
  member: ClassroomMember;
  role?: 'teacher' | 'student';
  onPress?: () => void;
}

const AVATAR_COLORS = [
  '#4C3FC4', '#0ea5e9', '#14b8a6', '#F5486A',
  '#f59e0b', '#059669', '#10b981', '#f97316',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MemberRow({ member, role, onPress }: Props) {
  const firstName = member?.firstName ?? '';
  const lastName = member?.lastName ?? '';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
  const avatarColor = getAvatarColor(member?.id ?? firstName + lastName);
  const isTeacher = role === 'teacher';
  const roleBg = isTeacher ? '#F0EEFF' : '#E8F5EE';
  const roleFg = isTeacher ? '#4C3FC4' : '#059669';
  const roleLabel = isTeacher ? 'Teacher' : role === 'student' ? 'Student' : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed && !!onPress ? 0.75 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 13,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f8fafc',
          gap: 12,
        }}
      >
        {/* Avatar */}
        {member?.profilePicture ? (
          <Image
            source={{ uri: member.profilePicture }}
            style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: avatarColor,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{initials}</Text>
          </View>
        )}

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
            {firstName} {lastName}
          </Text>
          {(member?.jobTitle || member?.email) && (
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }} numberOfLines={1}>
              {member.jobTitle ?? member.email}
            </Text>
          )}
        </View>

        {/* Role badge */}
        {roleLabel && (
          <View style={{ backgroundColor: roleBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: roleFg }}>{roleLabel}</Text>
          </View>
        )}

        {/* Chevron if tappable */}
        {!!onPress && (
          <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
        )}
      </View>
    </Pressable>
  );
}
