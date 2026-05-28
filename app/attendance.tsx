import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTodayAttendance, useMyDailyAttendance } from '@/hooks/useAttendance';
import { DailyAttendanceSummary, DayStatus } from '@/interface/attendance.interface';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

const STATUS_CFG: Record<DayStatus, { dot: string; bg: string; text: string; label: string }> = {
  present: { dot: '#10b981', bg: '#d1fae5', text: '#065f46', label: 'Present' },
  partial: { dot: '#f59e0b', bg: '#fef3c7', text: '#92400e', label: 'Partial' },
  absent:  { dot: '#d1d5db', bg: '#f3f4f6', text: '#6b7280', label: 'Absent' },
};

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ day }: { day: DailyAttendanceSummary }) {
  const cfg = STATUS_CFG[day.status];
  const [y, m, d] = day.date.split('-').map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  const isWeekend = wd === 0 || wd === 6;

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: day.hasPendingReview ? '#fde68a' : day.isFlagged ? '#fca5a5' : '#f1f5f9',
      overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
    }}>
      {/* Flagged strip */}
      {day.hasPendingReview && (
        <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 14, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="warning-outline" size={12} color="#b45309" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309' }}>Pending review</Text>
        </View>
      )}

      <View style={{ padding: 14, gap: 10 }}>
        {/* Date row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cfg.dot }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1 }}>
            {fmtDate(day.date)}
            {isWeekend && <Text style={{ color: '#94a3b8', fontWeight: '500' }}> · Weekend</Text>}
          </Text>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.text }}>{cfg.label}</Text>
          </View>
        </View>

        {/* Clock in / out row */}
        {day.status !== 'absent' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Clock In */}
            <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 10, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="log-in-outline" size={13} color="#16a34a" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.5 }}>In</Text>
                {day.clockIn?.isFlagged && <Ionicons name="warning" size={11} color="#b45309" />}
              </View>
              {day.clockIn ? (
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#15803d' }}>
                  {fmtTime(day.clockIn.recordedAt)}
                </Text>
              ) : (
                <Text style={{ fontSize: 15, color: '#d1d5db', fontWeight: '600' }}>—</Text>
              )}
              {day.clockIn && (
                <Text style={{ fontSize: 10, color: '#86efac' }}>
                  {day.clockIn.method === 'qr_code' ? 'QR Code' : 'Manual'}
                </Text>
              )}
            </View>

            {/* Clock Out */}
            <View style={{ flex: 1, backgroundColor: day.clockOut ? '#eff6ff' : '#f8fafc', borderRadius: 12, padding: 10, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="log-out-outline" size={13} color={day.clockOut ? '#2563eb' : '#cbd5e1'} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: day.clockOut ? '#2563eb' : '#cbd5e1', textTransform: 'uppercase', letterSpacing: 0.5 }}>Out</Text>
                {day.clockOut?.isFlagged && <Ionicons name="warning" size={11} color="#b45309" />}
              </View>
              {day.clockOut ? (
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#1d4ed8' }}>
                  {fmtTime(day.clockOut.recordedAt)}
                </Text>
              ) : (
                <Text style={{ fontSize: 15, color: '#d1d5db', fontWeight: '600' }}>—</Text>
              )}
              {day.clockOut && (
                <Text style={{ fontSize: 10, color: '#93c5fd' }}>
                  {day.clockOut.method === 'qr_code' ? 'QR Code' : 'Manual'}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Hours + deduction row */}
        {(day.hoursWorked != null || day.payrollDeductionApplied) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {day.hoursWorked != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={13} color="#64748b" />
                <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                  {day.hoursWorked.toFixed(1)} hrs
                </Text>
              </View>
            )}
            {day.payrollDeductionApplied && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                <Ionicons name="card-outline" size={12} color="#dc2626" />
                <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '700' }}>Deducted</Text>
              </View>
            )}
          </View>
        )}

        {/* Approval notes */}
        {(day.clockIn?.approvalNote || day.clockOut?.approvalNote) && (
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: 8 }}>
            <Text style={{ fontSize: 11, color: '#64748b' }}>
              {day.clockIn?.approvalNote ?? day.clockOut?.approvalNote}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AttendanceScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: today, isLoading: loadingToday, refetch: refetchToday } = useTodayAttendance(schoolId);
  const { data: daily, isLoading: loadingDaily, refetch: refetchDaily } = useMyDailyAttendance(schoolId, month, year);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchToday(), refetchDaily()]);
    setRefreshing(false);
  }, [refetchToday, refetchDaily]);

  const days = daily?.days ?? [];
  const stats = daily?.stats;

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#0c2a24', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Attendance</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              Daily clock-in & clock-out records
            </Text>
          </View>
          <Ionicons name="time-outline" size={22} color="#10b981" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={['#10b981']} />}
      >
        {/* Today status card */}
        {loadingToday ? (
          <View style={{ margin: 16, backgroundColor: '#fff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
            <ActivityIndicator color="#059669" />
          </View>
        ) : today && (
          <View style={{ margin: 16, borderRadius: 20, padding: 18, backgroundColor: today.clockedIn ? '#0c2a24' : '#1e293b', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: today.clockedIn ? '#4ade80' : '#94a3b8' }} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                {today.clockedOut ? 'Done for Today' : today.clockedIn ? 'Currently Clocked In' : 'Not Clocked In Today'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Clock In</Text>
                <Text style={{ color: '#4ade80', fontSize: 18, fontWeight: '900' }}>
                  {today.clockInTime ? fmtTime(today.clockInTime) : '—'}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>Clock Out</Text>
                <Text style={{ color: today.clockedOut ? '#f87171' : 'rgba(255,255,255,0.3)', fontSize: 18, fontWeight: '900' }}>
                  {today.clockOutTime ? fmtTime(today.clockOutTime) : '—'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Month stats */}
        {stats && (
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
            {[
              { label: 'Present', value: stats.daysPresent, color: '#10b981', bg: '#d1fae5' },
              { label: 'Partial', value: stats.daysPartial, color: '#f59e0b', bg: '#fef3c7' },
              { label: 'Hours', value: `${stats.totalHours.toFixed(0)}h`, color: '#6366f1', bg: '#ede9fe' },
              { label: 'Flagged', value: stats.flaggedDays, color: '#ef4444', bg: '#fee2e2' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: s.color }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Month navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
          <Pressable
            onPress={prevMonth}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-back" size={18} color="#334155" />
            </View>
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: '#0f172a' }}>
            {monthLabel(month, year)}
          </Text>
          <Pressable
            onPress={nextMonth}
            disabled={isCurrentMonth}
            style={({ pressed }) => ({ opacity: isCurrentMonth ? 0.3 : pressed ? 0.6 : 1 })}
          >
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-forward" size={18} color="#334155" />
            </View>
          </Pressable>
        </View>

        {/* Day list */}
        {loadingDaily ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#059669" size="large" />
          </View>
        ) : days.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10, paddingHorizontal: 32 }}>
            <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No records</Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
              No attendance records for {monthLabel(month, year)}.
            </Text>
          </View>
        ) : (
          days.map(day => <DayCard key={day.date} day={day} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
