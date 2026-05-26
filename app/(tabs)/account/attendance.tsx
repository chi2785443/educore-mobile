import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useTodayAttendance, useMyAttendance } from '@/hooks/useAttendance';
import { AttendanceRecord } from '@/interface/attendance.interface';

type Filter = 'all' | 'clock_in' | 'clock_out' | 'flagged';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All', clock_in: 'Clock In', clock_out: 'Clock Out', flagged: 'Flagged',
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  approved: { bg: '#dcfce7', text: '#16a34a', label: 'Approved' },
  pending:  { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
  rejected: { bg: '#fee2e2', text: '#dc2626', label: 'Rejected' },
};

function RecordRow({ record }: { record: AttendanceRecord }) {
  const isIn = record.type === 'clock_in';
  const statusSt = STATUS_STYLE[record.approvalStatus] ?? STATUS_STYLE.pending;

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 14, marginHorizontal: 16, marginBottom: 8,
      borderWidth: 1, borderColor: '#f1f5f9',
      overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
    }}>
      {/* Flagged amber strip */}
      {record.isFlagged && (
        <View style={{ backgroundColor: '#fef9c3', paddingHorizontal: 14, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="warning-outline" size={13} color="#b45309" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309' }}>
            Flagged — {record.approvalNote ?? 'Outside allowed area'}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }}>
        {/* Type indicator */}
        <View style={{
          width: 40, height: 40, borderRadius: 13,
          backgroundColor: isIn ? '#f0fdf4' : '#fef2f2',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Ionicons
            name={isIn ? 'log-in-outline' : 'log-out-outline'}
            size={20}
            color={isIn ? '#16a34a' : '#dc2626'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
            {isIn ? 'Clocked In' : 'Clocked Out'}
          </Text>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {format(new Date(record.recordedAt), 'EEE, d MMM yyyy · HH:mm')}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          {/* Method badge */}
          <View style={{ backgroundColor: record.method === 'qr_code' ? '#ede9fe' : '#f1f5f9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: record.method === 'qr_code' ? '#7c3aed' : '#64748b' }}>
              {record.method === 'qr_code' ? 'QR' : 'Manual'}
            </Text>
          </View>
          {/* Status */}
          <View style={{ backgroundColor: statusSt.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: statusSt.text }}>{statusSt.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function AttendanceScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';

  const [filter, setFilter] = useState<Filter>('all');

  const { data: today, isLoading: loadingToday, refetch: refetchToday } = useTodayAttendance(schoolId);
  const { data: attendance, isLoading: loadingList, refetch: refetchList } = useMyAttendance(schoolId);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchToday(), refetchList()]);
    setRefreshing(false);
  }, [refetchToday, refetchList]);

  const records = attendance?.records ?? [];
  const filtered = filter === 'all' ? records
    : filter === 'flagged' ? records.filter(r => r.isFlagged)
    : records.filter(r => r.type === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#0c2a24', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Attendance</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {attendance?.total ?? 0} records total
            </Text>
          </View>
          <Ionicons name="time-outline" size={22} color="#10b981" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={['#10b981']} />}>
        {/* Today status card */}
        {loadingToday ? (
          <View style={{ margin: 16, backgroundColor: '#fff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
            <ActivityIndicator color="#059669" />
          </View>
        ) : today && (
          <View style={{
            margin: 16, borderRadius: 20, padding: 18,
            backgroundColor: today.clockedIn ? '#0c2a24' : '#1e293b',
            gap: 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: today.clockedIn ? '#4ade80' : '#94a3b8' }} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                {today.clockedIn ? 'Currently Clocked In' : 'Not Clocked In Today'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Clock In</Text>
                <Text style={{ color: '#4ade80', fontSize: 18, fontWeight: '900' }}>
                  {today.clockInTime ? format(new Date(today.clockInTime), 'HH:mm') : '—'}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Clock Out</Text>
                <Text style={{ color: today.clockedOut ? '#f87171' : 'rgba(255,255,255,0.35)', fontSize: 18, fontWeight: '900' }}>
                  {today.clockOutTime ? format(new Date(today.clockOutTime), 'HH:mm') : '—'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' }}>
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: filter === f ? '#059669' : '#f3f4f6',
                borderWidth: 1, borderColor: filter === f ? '#059669' : '#e5e7eb',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: filter === f ? '#fff' : '#6b7280' }}>
                {FILTER_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Records */}
        <View style={{ paddingTop: 12 }}>
          {loadingList ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#059669" size="large" />
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10, paddingHorizontal: 32 }}>
              <Ionicons name="time-outline" size={40} color="#d1d5db" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No records</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
                {filter === 'all' ? 'Your attendance records will appear here.' : `No ${FILTER_LABELS[filter].toLowerCase()} records found.`}
              </Text>
            </View>
          ) : (
            filtered.map(r => <RecordRow key={r.id} record={r} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
