import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAdminTodayAttendance } from '@/hooks/useAttendance';
import { StaffTodayStatus } from '@/interface/attendance.interface';

const AVATAR_COLORS = ['#4C3FC4', '#0ea5e9', '#14b8a6', '#F5486A', '#f59e0b', '#059669'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StaffRow({ member }: { member: StaffTodayStatus }) {
  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase() || '?';
  const color = avatarColor(member.userId);

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 13, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: '#f8fafc',
      backgroundColor: '#fff',
    }}>
      {/* Avatar */}
      {member.profilePicture ? (
        <Image
          source={{ uri: member.profilePicture }}
          style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }}
          contentFit="cover"
        />
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{initials}</Text>
        </View>
      )}

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
          {member.firstName} {member.lastName}
        </Text>
        {member.jobTitle ? (
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }} numberOfLines={1}>
            {member.jobTitle}
          </Text>
        ) : null}
      </View>

      {/* Clock status */}
      {member.clockedIn ? (
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5EE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
              {member.clockInTime ? fmtTime(member.clockInTime) : 'Clocked In'}
            </Text>
          </View>
          {member.clockedOut && member.clockOutTime && (
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>
              Out {fmtTime(member.clockOutTime)}
            </Text>
          )}
        </View>
      ) : (
        <View style={{ backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af' }}>Not in yet</Text>
        </View>
      )}
    </View>
  );
}

export default function AdminAttendanceScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const primary = (user?.schools ?? []).find(m => m.schoolId === selectedSchoolId) ?? (user?.schools ?? [])[0];
  const schoolId = primary?.schoolId ?? '';

  const [filterPresent, setFilterPresent] = useState<boolean | null>(null);
  const { data, isLoading, refetch, error } = useAdminTodayAttendance(schoolId);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const today = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  const staff = data?.staff ?? [];
  const summary = data?.summary;
  const filtered = filterPresent === null
    ? staff
    : staff.filter(s => s.clockedIn === filterPresent);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#059669',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        overflow: 'hidden',
      }}>
        <View style={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Staff Attendance</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 1 }}>{today}</Text>
          </View>
        </View>

        {/* Summary chips */}
        {summary && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Total', value: summary.total, bg: 'rgba(255,255,255,0.18)', fg: '#fff' },
              { label: 'Present', value: summary.present, bg: 'rgba(74,222,128,0.25)', fg: '#4ade80' },
              { label: 'Absent', value: summary.absent, bg: 'rgba(255,255,255,0.10)', fg: 'rgba(255,255,255,0.55)' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: s.fg }}>{s.value}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: s.fg }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Filter pills */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        {[
          { label: 'All', value: null },
          { label: 'Present', value: true },
          { label: 'Absent', value: false },
        ].map(opt => {
          const isActive = filterPresent === opt.value;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => setFilterPresent(opt.value)}
              style={{
                paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
                backgroundColor: isActive ? '#059669' : '#f3f4f6',
                borderWidth: 1, borderColor: isActive ? '#059669' : '#e5e7eb',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#fff' : '#6b7280' }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Website referral notice */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginHorizontal: 16, marginTop: 12, marginBottom: 4,
        backgroundColor: '#FFF0F0', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#fecaca',
      }}>
        <Ionicons name="information-circle-outline" size={18} color="#F5486A" />
        <Text style={{ flex: 1, fontSize: 12, color: '#F5486A', lineHeight: 18 }}>
          To approve, flag, or manage records, use the{' '}
          <Text
            style={{ fontWeight: '800', textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL('https://educore.app/dashboard')}
          >
            website dashboard
          </Text>.
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#059669" size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="alert-circle-outline" size={28} color="#9ca3af" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center' }}>
            Could not load attendance
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            This feature requires the backend attendance module to be configured.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="people-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center' }}>
            {filterPresent === true ? 'No one has clocked in yet' : filterPresent === false ? 'All staff have clocked in' : 'No staff records found'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" colors={['#059669']} />}
        >
          <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
            {filtered.map(m => <StaffRow key={m.userId} member={m} />)}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
