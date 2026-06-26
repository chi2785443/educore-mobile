import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 14, paddingHorizontal: 20,
      borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#F0EEFF',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Ionicons name={icon} size={17} color="#4C3FC4" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a', marginTop: 1 }} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function MemberDetailScreen() {
  const router = useRouter();
  const {
    memberId,
    firstName,
    lastName,
    email,
    jobTitle,
    role,
    profilePicture,
    classroomName,
  } = useLocalSearchParams<{
    memberId: string;
    classroomId: string;
    firstName: string;
    lastName: string;
    email?: string;
    jobTitle?: string;
    role?: string;
    profilePicture?: string;
    classroomName?: string;
  }>();

  const isTeacher = role === 'teacher';
  const heroBg = isTeacher ? '#4C3FC4' : '#F5486A';
  const accentBg = isTeacher ? '#F0EEFF' : '#FFF0F0';
  const accentFg = isTeacher ? '#4C3FC4' : '#F5486A';

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const avatarColor = getAvatarColor(memberId ?? firstName ?? '');
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  const roleLabel = isTeacher ? 'Teacher' : 'Student';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Hero header */}
      <View style={{
        backgroundColor: heroBg,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 44,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <View style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <View style={{ position: 'absolute', bottom: -20, left: 20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>

        {/* Avatar + name */}
        <View style={{ alignItems: 'center', gap: 12 }}>
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={{ width: 88, height: 88, borderRadius: 28, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' }}
              contentFit="cover"
            />
          ) : (
            <View style={{
              width: 88, height: 88, borderRadius: 28,
              backgroundColor: avatarColor,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
              shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14,
              elevation: 8,
            }}>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900' }}>{initials}</Text>
            </View>
          )}

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }}>
              {fullName}
            </Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{roleLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ marginTop: -20 }}
      >
        {/* White card pulled up over the hero */}
        <View style={{ backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8 }}>

          {/* Classroom chip */}
          {classroomName && (
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
              >
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: accentBg,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                  alignSelf: 'flex-start',
                }}>
                  <Ionicons name="book-outline" size={14} color={accentFg} />
                  <Text style={{ color: accentFg, fontSize: 13, fontWeight: '700' }}>
                    {classroomName}
                  </Text>
                  <Ionicons name="chevron-back" size={13} color={accentFg} />
                </View>
              </Pressable>
            </View>
          )}

          {/* Info section */}
          <View style={{ marginTop: 16 }}>
            <Text style={{
              fontSize: 11, fontWeight: '700', color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: 1,
              paddingHorizontal: 20, paddingBottom: 8,
            }}>
              Details
            </Text>
            <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
              <InfoRow icon="person-outline" label="Full name" value={fullName || '—'} />
              {email ? (
                <InfoRow icon="mail-outline" label="Email" value={email} />
              ) : null}
              {jobTitle ? (
                <InfoRow icon="briefcase-outline" label="Job title" value={jobTitle} />
              ) : null}
              <InfoRow
                icon={isTeacher ? 'school-outline' : 'people-outline'}
                label="Role"
                value={roleLabel}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
