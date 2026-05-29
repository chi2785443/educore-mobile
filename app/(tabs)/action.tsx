import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, Modal, ScrollView, Animated,
  Dimensions, TextInput, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import {
  useTodayAttendance, useAttendanceSettings, useClockAttendance,
} from '@/hooks/useAttendance';
import { useMyTeacherClassrooms, useClassroomStudents, useClassroomsBySchool } from '@/hooks/useClassroom';
import { useSchoolById } from '@/hooks/useSchool';
import CreateAssessmentSheet from '@/components/assessment/CreateAssessmentSheet';
import { useCreateAnnouncement } from '@/hooks/useAnnouncements';
import { useCreateCalendarEvent } from '@/hooks/useCalendar';
import {
  useCreateReport, useSubmitReport,
  useSchoolReports, useApproveReport, useRejectReport,
} from '@/hooks/useReports';
import {
  AnnouncementType, Priority,
} from '@/interface/announcement.interface';
import { CalendarEventType } from '@/interface/calendar.interface';
import { ReportType, ReportTerm } from '@/interface/report.interface';

const { height: SCREEN_H } = Dimensions.get('window');

/* ── Geolocation ─────────────────────────────────────────────────── */
import * as Location from 'expo-location';

type LocationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: 'denied' | 'settings_required' | 'services_disabled' | 'error' };

async function getCurrentLocation(): Promise<LocationResult> {
  try {
    // Check if location services are enabled on the device
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      return { ok: false, reason: 'services_disabled' };
    }

    const existing = await Location.getForegroundPermissionsAsync();

    // If permanently denied (can no longer ask), user must go to Settings
    if (existing.status === 'denied' && !existing.canAskAgain) {
      return { ok: false, reason: 'settings_required' };
    }

    // Ask for permission if not granted yet
    if (existing.status !== 'granted') {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { ok: false, reason: canAskAgain ? 'denied' : 'settings_required' };
      }
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { ok: true, latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

function openAppSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

/* ── Inline form wrapper (renders inside the sheet, not a Modal) ── */
function FormSection({ onBack, title, children }: {
  onBack: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <>
      {/* Form header with back button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <Pressable onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', flex: 1 }}>{title}</Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        {children}
      </ScrollView>
    </>
  );
}


function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>
        {label}{required && <Text style={{ color: '#dc2626' }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb',
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  fontSize: 14, color: '#1e293b',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 16, gap: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</Text>
      {children}
    </View>
  );
}

/* ── Attendance Card — two-step flow matching frontend dialog ─────── */
function AttendanceCard({ schoolId, role }: { schoolId: string; role: string }) {
  const { data: today, isLoading: loadingToday } = useTodayAttendance(schoolId);
  const { data: settings } = useAttendanceSettings(schoolId);
  const clockMutation = useClockAttendance(schoolId);

  // Step states: idle → confirming (dialog open) → submitting
  const [confirming, setConfirming] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationResult, setLocationResult] = useState<LocationResult | null>(null);
  const [qrToken, setQrToken] = useState('');

  const location = locationResult?.ok ? locationResult : null;
  const locationError: { msg: string; canOpenSettings: boolean } | null = (() => {
    if (!locationResult || locationResult.ok) return null;
    switch (locationResult.reason) {
      case 'services_disabled':
        return { msg: 'Location services are disabled on your device. Enable them in Settings.', canOpenSettings: true };
      case 'settings_required':
        return { msg: 'Location permission was denied. Open Settings to allow it.', canOpenSettings: true };
      case 'denied':
        return { msg: 'Location permission denied. Please allow it when prompted.', canOpenSettings: false };
      default:
        return { msg: 'Could not get your location. Please try again.', canOpenSettings: false };
    }
  })();

  const isAdminRole = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN;
  const shouldTrack =
    isAdminRole ||
    !settings ||
    (settings.trackAttendance &&
      ((role === UserRole.STAFF && settings.trackStaff) ||
        (role === UserRole.STUDENT && settings.trackStudents)));

  if (!shouldTrack && settings) return null;

  const clockedIn = today?.clockedIn ?? false;
  const clockedOut = today?.clockedOut ?? false;
  const finished = clockedIn && clockedOut;
  const actionType = clockedIn && !clockedOut ? 'clock_out' : 'clock_in';
  const actionColor = actionType === 'clock_in' ? '#10b981' : '#e11d48';

  const getLocation = async () => {
    setLocating(true);
    setLocationResult(null);
    const result = await getCurrentLocation();
    setLocationResult(result);
    setLocating(false);
  };

  const handleOpenDialog = () => {
    setConfirming(true);
    setLocationResult(null);
    setQrToken('');
    getLocation();
  };

  const handleSubmit = async () => {
    try {
      await clockMutation.mutateAsync({
        type: actionType,
        method: settings?.useQRCode ? 'qr_code' : 'manual',
        latitude: locationResult?.ok ? locationResult.latitude : undefined,
        longitude: locationResult?.ok ? locationResult.longitude : undefined,
        qrToken: settings?.useQRCode ? qrToken.trim() || undefined : undefined,
      });
      setConfirming(false);
      setQrToken('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record attendance');
    }
  };

  const submitDisabled =
    clockMutation.isPending ||
    locating ||
    (settings?.useQRCode && !qrToken.trim());

  return (
    <View style={{
      backgroundColor: clockedIn ? '#059669' : '#4C3FC4',
      borderRadius: 20, padding: 16, gap: 14, marginBottom: 4,
      borderWidth: 1,
      borderColor: clockedIn ? '#10b981' + '40' : 'rgba(255,255,255,0.08)',
    }}>
      {/* Status row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: clockedIn ? '#4ade80' : '#94a3b8' }} />
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', flex: 1 }}>
          {finished ? 'Attendance complete' : clockedIn ? 'Clocked in' : 'Not clocked in'}
        </Text>
        {loadingToday && <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />}
      </View>

      {/* Times */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>In</Text>
          <Text style={{ color: today?.clockInTime ? '#4ade80' : 'rgba(255,255,255,0.2)', fontSize: 18, fontWeight: '900' }}>
            {today?.clockInTime ? format(new Date(today.clockInTime), 'HH:mm') : '—'}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>Out</Text>
          <Text style={{ color: today?.clockOutTime ? '#f87171' : 'rgba(255,255,255,0.2)', fontSize: 18, fontWeight: '900' }}>
            {today?.clockOutTime ? format(new Date(today.clockOutTime), 'HH:mm') : '—'}
          </Text>
        </View>
      </View>

      {finished ? (
        <View style={{ backgroundColor: '#064e3b', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
          <Text style={{ color: '#4ade80', fontSize: 13, fontWeight: '700' }}>Attendance recorded for today</Text>
        </View>
      ) : (
        <Pressable onPress={handleOpenDialog} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <View style={{
            backgroundColor: actionColor, borderRadius: 14, paddingVertical: 13,
            flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
            shadowColor: actionColor, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
          }}>
            <Ionicons name={actionType === 'clock_in' ? 'log-in-outline' : 'log-out-outline'} size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
              {actionType === 'clock_in' ? 'Clock In' : 'Clock Out'}
            </Text>
          </View>
        </Pressable>
      )}

      {/* ── Confirmation dialog (Modal inside card) ── */}
      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={() => setConfirming(false)}>
          <Pressable onPress={e => e.stopPropagation?.()}>
            <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, width: 320, gap: 16 }}>
              {/* Dialog title */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: actionColor + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={actionType === 'clock_in' ? 'log-in-outline' : 'log-out-outline'} size={18} color={actionColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>
                    {actionType === 'clock_in' ? 'Clock In' : 'Clock Out'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                    {actionType === 'clock_in' ? 'Record your arrival' : 'Record your departure'}
                  </Text>
                </View>
              </View>

              {/* Location status */}
              <View style={{
                borderRadius: 14, padding: 14, gap: 10,
                backgroundColor: locationError ? '#fff7ed' : locationResult?.ok ? '#f0fdf4' : '#f8fafc',
                borderWidth: 1,
                borderColor: locationError ? '#fed7aa' : locationResult?.ok ? '#bbf7d0' : '#e2e8f0',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name="location-outline" size={14}
                    color={locationError ? '#ea580c' : locationResult?.ok ? '#16a34a' : '#64748b'}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: locationError ? '#9a3412' : locationResult?.ok ? '#15803d' : '#374151' }}>
                    Location
                  </Text>
                </View>

                {/* Acquiring */}
                {locating && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#4C3FC4" />
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Detecting your location…</Text>
                  </View>
                )}

                {/* Success */}
                {!locating && locationResult?.ok && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                    <Text style={{ fontSize: 12, color: '#15803d', fontWeight: '700' }}>Location captured</Text>
                    <Text style={{ fontSize: 11, color: '#4ade80', marginLeft: 2 }}>
                      {locationResult.latitude.toFixed(4)}, {locationResult.longitude.toFixed(4)}
                    </Text>
                  </View>
                )}

                {/* Error states */}
                {!locating && locationError && (
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
                      <Ionicons name="warning-outline" size={15} color="#ea580c" style={{ marginTop: 1 }} />
                      <Text style={{ fontSize: 12, color: '#9a3412', flex: 1, lineHeight: 18 }}>
                        {locationError.msg}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        onPress={getLocation}
                        style={({ pressed }) => ({
                          flex: 1, paddingVertical: 8, borderRadius: 10,
                          backgroundColor: pressed ? '#e0e7ff' : '#eef2ff',
                          alignItems: 'center',
                        })}
                      >
                        <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '800' }}>Retry</Text>
                      </Pressable>
                      {locationError.canOpenSettings && (
                        <Pressable
                          onPress={openAppSettings}
                          style={({ pressed }) => ({
                            flex: 1, paddingVertical: 8, borderRadius: 10,
                            backgroundColor: pressed ? '#fed7aa' : '#fff7ed',
                            alignItems: 'center', flexDirection: 'row',
                            justifyContent: 'center', gap: 4,
                          })}
                        >
                          <Ionicons name="settings-outline" size={12} color="#ea580c" />
                          <Text style={{ fontSize: 12, color: '#ea580c', fontWeight: '800' }}>Open Settings</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}

                {/* Initial state before result comes back */}
                {!locating && !locationResult && !locationError && (
                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>Waiting for GPS…</Text>
                )}
              </View>

              {/* QR token (only if school requires it) */}
              {settings?.useQRCode && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="qr-code-outline" size={14} color="#64748b" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>QR Token</Text>
                  </View>
                  <TextInput
                    value={qrToken}
                    onChangeText={setQrToken}
                    placeholder="Paste the QR token here"
                    placeholderTextColor="#9ca3af"
                    style={{
                      backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb',
                      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                      fontSize: 13, color: '#1e293b',
                    }}
                  />
                  <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                    Scan the QR code displayed in your school and paste the token
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setConfirming(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#6b7280' }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSubmit} disabled={submitDisabled} style={{ flex: 1 }}>
                  <View style={{
                    backgroundColor: submitDisabled ? '#d1d5db' : actionColor,
                    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
                    flexDirection: 'row', justifyContent: 'center', gap: 6,
                  }}>
                    {clockMutation.isPending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Ionicons name={actionType === 'clock_in' ? 'log-in-outline' : 'log-out-outline'} size={15} color="#fff" />}
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
                      {clockMutation.isPending ? 'Submitting…' : actionType === 'clock_in' ? 'Clock In' : 'Clock Out'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ── Form content components — plain Views, no Modal wrapper ─────── */

function AnnouncementFormContent({ schoolId, onDone }: { schoolId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('school_wide');
  const [priority, setPriority] = useState<Priority>('normal');
  const createMutation = useCreateAnnouncement();

  const reset = () => { setTitle(''); setContent(''); setType('school_wide'); setPriority('normal'); };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return; }
    try {
      await createMutation.mutateAsync({ schoolId, title: title.trim(), content: content.trim(), type, priority });
      reset(); onDone();
      toast.success('Announcement published to the school');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to post announcement'); }
  };

  const TYPES: { value: AnnouncementType; label: string }[] = [
    { value: 'school_wide', label: 'School Wide' }, { value: 'teachers', label: 'Teachers' },
    { value: 'students', label: 'Students' }, { value: 'parents', label: 'Parents' },
    { value: 'urgent', label: 'Urgent' }, { value: 'general', label: 'General' },
  ];
  const PRIORITIES: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#6b7280' }, { value: 'normal', label: 'Normal', color: '#2563eb' },
    { value: 'high', label: 'High', color: '#d97706' }, { value: 'urgent', label: 'Urgent', color: '#dc2626' },
  ];

  return (
    <>
      <Field label="Title" required>
        <TextInput value={title} onChangeText={setTitle} placeholder="Announcement title..." placeholderTextColor="#9ca3af" style={inputStyle} />
      </Field>
      <Field label="Content" required>
        <TextInput value={content} onChangeText={setContent} placeholder="Write your announcement..." placeholderTextColor="#9ca3af" multiline numberOfLines={4} textAlignVertical="top" style={[inputStyle, { minHeight: 100 }]} />
      </Field>
      <Field label="Audience">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TYPES.map(t => {
            const active = type === t.value;
            return <Pressable key={t.value} onPress={() => setType(t.value)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? '#f59e0b' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#f59e0b' : '#e5e7eb' }}><Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{t.label}</Text></Pressable>;
          })}
        </View>
      </Field>
      <Field label="Priority">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PRIORITIES.map(p => {
            const active = priority === p.value;
            return <Pressable key={p.value} onPress={() => setPriority(p.value)} style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: active ? p.color : '#f3f4f6', borderWidth: 1, borderColor: active ? p.color : '#e5e7eb' }}><Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{p.label}</Text></Pressable>;
          })}
        </View>
      </Field>
      <Pressable onPress={handleCreate} disabled={createMutation.isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <View style={{ backgroundColor: createMutation.isPending ? '#d97706' : '#f59e0b', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {createMutation.isPending && <ActivityIndicator color="#fff" size="small" />}
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>{createMutation.isPending ? 'Posting…' : 'Post Announcement'}</Text>
        </View>
      </Pressable>
    </>
  );
}

function EventFormContent({ schoolId, onDone }: { schoolId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('academic');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const createMutation = useCreateCalendarEvent(schoolId);

  const reset = () => { setTitle(''); setStartDate(''); setEndDate(''); setEventType('academic'); setLocation(''); setMeetingLink(''); };

  const handleCreate = async () => {
    if (!title.trim() || !startDate.trim()) { toast.error('Title and start date are required'); return; }
    try {
      await createMutation.mutateAsync({ title: title.trim(), eventType, startDate: startDate.trim(), endDate: endDate.trim() || undefined, location: location.trim() || undefined, meetingLink: meetingLink.trim() || undefined, visibility: 'all' });
      reset(); onDone();
      toast.success('Calendar event created');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to create event'); }
  };

  const EVENT_TYPES: { value: CalendarEventType; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }[] = [
    { value: 'academic', label: 'Academic', icon: 'book-outline', color: '#2563eb' },
    { value: 'exam', label: 'Exam', icon: 'document-text-outline', color: '#dc2626' },
    { value: 'sports', label: 'Sports', icon: 'football-outline', color: '#16a34a' },
    { value: 'cultural', label: 'Cultural', icon: 'color-palette-outline', color: '#4C3FC4' },
    { value: 'meeting', label: 'Meeting', icon: 'people-outline', color: '#d97706' },
    { value: 'holiday', label: 'Holiday', icon: 'sunny-outline', color: '#f59e0b' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#64748b' },
  ];

  return (
    <>
      <Field label="Event Title" required>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Mid-term Examination" placeholderTextColor="#9ca3af" style={inputStyle} />
      </Field>
      <Field label="Event Type">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {EVENT_TYPES.map(et => {
              const active = eventType === et.value;
              return <Pressable key={et.value} onPress={() => setEventType(et.value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? et.color : '#f3f4f6', borderWidth: 1, borderColor: active ? et.color : '#e5e7eb' }}><Ionicons name={et.icon} size={13} color={active ? '#fff' : '#6b7280'} /><Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{et.label}</Text></Pressable>;
            })}
          </View>
        </ScrollView>
      </Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Start Date" required><TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9ca3af" style={inputStyle} /></Field></View>
        <View style={{ flex: 1 }}><Field label="End Date"><TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9ca3af" style={inputStyle} /></Field></View>
      </View>
      <Field label="Location (optional)"><TextInput value={location} onChangeText={setLocation} placeholder="School hall..." placeholderTextColor="#9ca3af" style={inputStyle} /></Field>
      <Field label="Meeting Link (optional)"><TextInput value={meetingLink} onChangeText={setMeetingLink} placeholder="https://..." placeholderTextColor="#9ca3af" style={inputStyle} autoCapitalize="none" /></Field>
      <Pressable onPress={handleCreate} disabled={createMutation.isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <View style={{ backgroundColor: createMutation.isPending ? '#3b32a0' : '#4C3FC4', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {createMutation.isPending && <ActivityIndicator color="#fff" size="small" />}
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>{createMutation.isPending ? 'Creating…' : 'Create Event'}</Text>
        </View>
      </Pressable>
    </>
  );
}

function ReportFormContent({ schoolId, onDone }: { schoolId: string; onDone: () => void }) {
  const [classroomId, setClassroomId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [weekNumber, setWeekNumber] = useState('');
  const [monthName, setMonthName] = useState('');
  const [term, setTerm] = useState<ReportTerm>('FIRST_TERM');
  const [title, setTitle] = useState('');
  const [remarks, setRemarks] = useState('');
  const [behaviorRating, setBehaviorRating] = useState(3);
  const [behaviorNotes, setBehaviorNotes] = useState('');
  const [characterNotes, setCharacterNotes] = useState('');
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [improvements, setImprovements] = useState<string[]>(['']);
  const [subjectEntries, setSubjectEntries] = useState<{ key: number; subjectName: string; performance: string; grade: string }[]>([]);
  const [showSubjects, setShowSubjects] = useState(false);

  const { data: classrooms = [] } = useMyTeacherClassrooms(schoolId);
  const { data: students = [] } = useClassroomStudents(classroomId || undefined);
  const { data: schoolData } = useSchoolById(schoolId);
  const createMutation = useCreateReport(schoolId);
  const submitMutation = useSubmitReport(schoolId);
  const isPending = createMutation.isPending || submitMutation.isPending;

  const rawClassrooms: { id: string; name: string }[] = Array.isArray(classrooms)
    ? classrooms : (classrooms as { data: typeof classrooms }).data ?? [];

  const showWeekNumber = reportType === 'weekly';
  const showMonth = reportType === 'monthly';
  const showTerm = reportType === 'term_end' || reportType === 'session_end';
  const showCharacterNotes = reportType === 'term_end' || reportType === 'session_end';

  const reset = () => {
    setClassroomId(''); setStudentId(''); setReportType('weekly');
    setWeekNumber(''); setMonthName(''); setTerm('FIRST_TERM'); setTitle('');
    setRemarks(''); setBehaviorRating(3); setBehaviorNotes(''); setCharacterNotes('');
    setStrengths(['']); setImprovements(['']); setSubjectEntries([]); setShowSubjects(false);
  };

  const handleSubmit = async () => {
    if (!classroomId || !studentId || !remarks.trim()) {
      toast.error('Select classroom, student and add remarks'); return;
    }
    try {
      const report = await createMutation.mutateAsync({
        classroomId,
        payload: {
          studentId, reportType,
          title: title.trim() || undefined,
          academicYear: schoolData?.currentSession || undefined,
          term: showTerm ? term : undefined,
          weekNumber: showWeekNumber && weekNumber ? parseInt(weekNumber, 10) : undefined,
          monthName: showMonth ? monthName || undefined : undefined,
          generalRemarks: remarks.trim(),
          behaviorRating,
          behaviorNotes: behaviorNotes.trim() || undefined,
          characterNotes: showCharacterNotes ? characterNotes.trim() || undefined : undefined,
          strengths: strengths.filter(Boolean),
          areasForImprovement: improvements.filter(Boolean),
          subjectEntries: subjectEntries
            .filter(e => e.subjectName.trim() && e.performance.trim())
            .map(e => ({ subjectName: e.subjectName.trim(), performance: e.performance.trim(), grade: e.grade.trim() || undefined })),
        },
      });
      await submitMutation.mutateAsync(report.id);
      reset(); onDone();
      toast.success('Report submitted for approval');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to submit report'); }
  };

  const REPORT_TYPES: { value: ReportType; label: string }[] = [
    { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' },
    { value: 'term_end', label: 'Term End' }, { value: 'session_end', label: 'Session End' },
    { value: 'baseline', label: 'Baseline' },
  ];
  const TERMS: { value: ReportTerm; label: string }[] = [
    { value: 'FIRST_TERM', label: '1st Term' }, { value: 'SECOND_TERM', label: '2nd Term' }, { value: 'THIRD_TERM', label: '3rd Term' },
  ];

  const addSubjectEntry = () => setSubjectEntries(prev => [...prev, { key: Date.now(), subjectName: '', performance: '', grade: '' }]);
  const updateEntry = (key: number, patch: Partial<{ subjectName: string; performance: string; grade: string }>) =>
    setSubjectEntries(prev => prev.map(e => e.key === key ? { ...e, ...patch } : e));
  const removeEntry = (key: number) => setSubjectEntries(prev => prev.filter(e => e.key !== key));

  return (
    <>
      {/* ── Report Info ── */}
      <SectionCard title="Report Info">
        <Field label="Classroom" required>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {rawClassrooms.map(c => {
                const active = classroomId === c.id;
                return (
                  <Pressable key={c.id} onPress={() => { setClassroomId(c.id); setStudentId(''); }}>
                    <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? '#4C3FC4' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#4C3FC4' : '#e5e7eb' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{c.name}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Field>

        {classroomId ? (
          <Field label="Student" required>
            <ScrollView style={{ maxHeight: 140 }} contentContainerStyle={{ gap: 6 }}>
              {(students as { id: string; firstName?: string; lastName?: string }[]).map(s => {
                const fn = s.firstName ?? ''; const ln = s.lastName ?? '';
                const active = studentId === s.id;
                return (
                  <Pressable key={s.id} onPress={() => setStudentId(s.id)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: active ? '#eff6ff' : '#f8fafc', borderWidth: 1, borderColor: active ? '#6366f1' : '#f1f5f9' }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: active ? '#6366f1' : '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#fff' : '#6b7280' }}>{fn[0] ?? ''}{ln[0] ?? ''}</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: active ? '#1e40af' : '#374151' }}>{fn} {ln}</Text>
                      {active && <Ionicons name="checkmark-circle" size={16} color="#6366f1" style={{ marginLeft: 'auto' }} />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Field>
        ) : (
          <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Select a classroom to see students</Text>
        )}

        <Field label="Report Type" required>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {REPORT_TYPES.map(rt => {
                const active = reportType === rt.value;
                return (
                  <Pressable key={rt.value} onPress={() => setReportType(rt.value)}>
                    <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? '#4C3FC4' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#4C3FC4' : '#e5e7eb' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{rt.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Field>

        {showWeekNumber && (
          <Field label="Week Number">
            <TextInput value={weekNumber} onChangeText={setWeekNumber} placeholder="e.g. 3" placeholderTextColor="#9ca3af" keyboardType="number-pad" style={inputStyle} />
          </Field>
        )}

        {showMonth && (
          <Field label="Month">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {MONTHS.map(m => {
                  const active = monthName === m;
                  return (
                    <Pressable key={m} onPress={() => setMonthName(m)}>
                      <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? '#0ea5e9' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#0ea5e9' : '#e5e7eb' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{m}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Field>
        )}

        {showTerm && (
          <Field label="Term">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TERMS.map(t => {
                const active = term === t.value;
                return (
                  <Pressable key={t.value} onPress={() => setTerm(t.value)} style={{ flex: 1 }}>
                    <View style={{ paddingVertical: 8, borderRadius: 10, backgroundColor: active ? '#0ea5e9' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#0ea5e9' : '#e5e7eb', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{t.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        )}

        {schoolData?.currentSession && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Ionicons name="information-circle-outline" size={14} color="#3b82f6" />
            <Text style={{ fontSize: 12, color: '#1d4ed8' }}>
              Academic year: <Text style={{ fontWeight: '700' }}>{schoolData.currentSession}</Text>
            </Text>
          </View>
        )}

        <Field label="Custom Title">
          <TextInput value={title} onChangeText={setTitle} placeholder="Auto-generated if left blank" placeholderTextColor="#9ca3af" style={inputStyle} />
        </Field>
      </SectionCard>

      {/* ── General Remarks ── */}
      <SectionCard title="General Remarks">
        <Field label="Overall Remarks" required>
          <TextInput value={remarks} onChangeText={setRemarks} placeholder="General overview of the student's progress, attitude, and performance…" placeholderTextColor="#9ca3af" multiline numberOfLines={4} textAlignVertical="top" style={[inputStyle, { minHeight: 90 }]} />
        </Field>

        <Field label="Behaviour Rating">
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            {[1,2,3,4,5].map(n => (
              <Pressable key={n} onPress={() => setBehaviorRating(n)}>
                <Ionicons name={n <= behaviorRating ? 'star' : 'star-outline'} size={28} color={n <= behaviorRating ? '#f59e0b' : '#d1d5db'} />
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Behaviour Notes">
          <TextInput value={behaviorNotes} onChangeText={setBehaviorNotes} placeholder="Additional notes on behaviour…" placeholderTextColor="#9ca3af" multiline numberOfLines={3} textAlignVertical="top" style={[inputStyle, { minHeight: 70 }]} />
        </Field>

        {showCharacterNotes && (
          <Field label="Character & Personal Development">
            <TextInput value={characterNotes} onChangeText={setCharacterNotes} placeholder="Observations on character, values, growth, social skills…" placeholderTextColor="#9ca3af" multiline numberOfLines={3} textAlignVertical="top" style={[inputStyle, { minHeight: 70 }]} />
          </Field>
        )}
      </SectionCard>

      {/* ── Strengths & Areas for Growth ── */}
      <SectionCard title="Strengths & Areas for Growth">
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>Strengths</Text>
          {strengths.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={s}
                onChangeText={v => setStrengths(prev => prev.map((x, idx) => idx === i ? v : x))}
                placeholder="e.g. Creative thinking"
                placeholderTextColor="#9ca3af"
                style={[inputStyle, { flex: 1 }]}
              />
              {strengths.length > 1 && (
                <Pressable onPress={() => setStrengths(prev => prev.filter((_, idx) => idx !== i))}>
                  <Ionicons name="close-circle" size={20} color="#dc2626" />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable onPress={() => setStrengths(p => [...p, ''])}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
              <Ionicons name="add-circle-outline" size={16} color="#059669" />
              <Text style={{ fontSize: 13, color: '#059669', fontWeight: '700' }}>Add strength</Text>
            </View>
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: '#f1f5f9' }} />

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#d97706' }}>Areas for Improvement</Text>
          {improvements.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={s}
                onChangeText={v => setImprovements(prev => prev.map((x, idx) => idx === i ? v : x))}
                placeholder="e.g. Time management"
                placeholderTextColor="#9ca3af"
                style={[inputStyle, { flex: 1 }]}
              />
              {improvements.length > 1 && (
                <Pressable onPress={() => setImprovements(prev => prev.filter((_, idx) => idx !== i))}>
                  <Ionicons name="close-circle" size={20} color="#dc2626" />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable onPress={() => setImprovements(p => [...p, ''])}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
              <Ionicons name="add-circle-outline" size={16} color="#d97706" />
              <Text style={{ fontSize: 13, color: '#d97706', fontWeight: '700' }}>Add area</Text>
            </View>
          </Pressable>
        </View>
      </SectionCard>

      {/* ── Subject Performance (collapsible) ── */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' }}>
        <Pressable onPress={() => setShowSubjects(v => !v)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Subject Performance</Text>
              <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>Optional</Text>
              </View>
            </View>
            <Ionicons name={showSubjects ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
          </View>
        </Pressable>
        {showSubjects && (
          <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
            {subjectEntries.length === 0 && (
              <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No subjects added yet.</Text>
            )}
            {subjectEntries.map(entry => (
              <View key={entry.key} style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Subject</Text>
                  <Pressable onPress={() => removeEntry(entry.key)}>
                    <Ionicons name="close-circle" size={18} color="#dc2626" />
                  </Pressable>
                </View>
                <TextInput value={entry.subjectName} onChangeText={v => updateEntry(entry.key, { subjectName: v })} placeholder="e.g. Mathematics" placeholderTextColor="#9ca3af" style={inputStyle} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Performance Note</Text>
                <TextInput value={entry.performance} onChangeText={v => updateEntry(entry.key, { performance: v })} placeholder="e.g. Excellent understanding" placeholderTextColor="#9ca3af" style={inputStyle} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Grade</Text>
                <TextInput value={entry.grade} onChangeText={v => updateEntry(entry.key, { grade: v })} placeholder="e.g. A" placeholderTextColor="#9ca3af" style={inputStyle} />
              </View>
            ))}
            <Pressable onPress={addSubjectEntry}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Ionicons name="add" size={16} color="#4C3FC4" />
                <Text style={{ fontSize: 13, color: '#4C3FC4', fontWeight: '700' }}>Add Subject</Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <View style={{ backgroundColor: isPending ? '#3b32a0' : '#4C3FC4', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {isPending && <ActivityIndicator color="#fff" size="small" />}
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>{isPending ? 'Submitting…' : 'Submit Report'}</Text>
        </View>
      </Pressable>
    </>
  );
}

function ApproveReportsContent({ schoolId }: { schoolId: string }) {
  const { data: reports = [], isLoading } = useSchoolReports(schoolId, 'submitted');
  const approveMutation = useApproveReport(schoolId);
  const rejectMutation = useRejectReport(schoolId);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <>
      {isLoading ? (
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <ActivityIndicator color="#6366f1" size="large" />
          <Text style={{ color: '#9ca3af', marginTop: 10 }}>Loading submitted reports…</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
          <Ionicons name="document-text-outline" size={40} color="#d1d5db" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No pending reports</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
            All submitted reports have been reviewed.
          </Text>
        </View>
      ) : (
        reports.map(report => (
          <View key={report.id} style={{ backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' }}>
            <View style={{ padding: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
                    {report.student ? `${report.student.firstName} ${report.student.lastName}` : 'Student'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {report.classroom?.name} · {report.reportType.replace('_', ' ')}
                  </Text>
                  {report.teacher && (
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      By {report.teacher.firstName} {report.teacher.lastName}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                  {format(new Date(report.createdAt), 'd MMM')}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }} numberOfLines={2}>
                {report.generalRemarks}
              </Text>
            </View>

            {/* Reject reason input */}
            {rejectingId === report.id && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                <TextInput
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="Reason for rejection (optional)..."
                  placeholderTextColor="#9ca3af"
                  style={[inputStyle, { fontSize: 13 }]}
                />
              </View>
            )}

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              {rejectingId === report.id ? (
                <>
                  <Pressable
                    onPress={() => { setRejectingId(null); setRejectReason(''); }}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#f1f5f9' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      try {
                        await rejectMutation.mutateAsync({ reportId: report.id, payload: { rejectionReason: rejectReason || undefined } });
                        setRejectingId(null); setRejectReason('');
                      } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to reject report'); }
                    }}
                    disabled={rejectMutation.isPending}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fee2e2' }}
                  >
                    {rejectMutation.isPending ? <ActivityIndicator size="small" color="#dc2626" /> : <Text style={{ fontSize: 13, fontWeight: '800', color: '#dc2626' }}>Confirm Reject</Text>}
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => setRejectingId(report.id)}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#f1f5f9' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>Reject</Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      try { await approveMutation.mutateAsync(report.id); }
                      catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to approve report'); }
                    }}
                    disabled={approveMutation.isPending}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f0fdf4' }}
                  >
                    {approveMutation.isPending ? <ActivityIndicator size="small" color="#16a34a" /> : <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a' }}>Approve</Text>}
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ))
      )}
    </>
  );
}

/* ── Action grid card — outer View owns width ───────────────────── */
function ActionCard({ icon, label, desc, color, bg, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; desc: string; color: string; bg: string;
  onPress: () => void;
}) {
  return (
    <View style={{ width: '48%' }}>
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}>
        {({ pressed }) => (
          <View style={{
            backgroundColor: pressed ? '#f0f0f5' : '#fff',
            borderRadius: 18,
            padding: 14,
            gap: 10,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 2,
          }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', lineHeight: 18 }}>{label}</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', lineHeight: 15 }}>{desc}</Text>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

/* ── Main Action Sheet ──────────────────────────────────────────── */
type ModalType = 'announcement' | 'event' | 'report' | 'approve' | null;

function ActionSheet({ visible, onClose, schoolId, role, isAdmin, isStaff, isStudent, isParent, onOpenAssessment }: {
  visible: boolean; onClose: () => void; schoolId: string; role: string;
  isAdmin: boolean; isStaff: boolean; isStudent: boolean; isParent: boolean;
  onOpenAssessment: () => void;
}) {
  const slideY = useRef(new Animated.Value(SCREEN_H)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const nav = useCallback((path: string) => {
    onClose();
    setTimeout(() => router.push(path as Parameters<typeof router.push>[0]), 320);
  }, [onClose]);

  const roleLabel = isAdmin ? 'Admin actions' : isStaff ? 'Staff actions' : isStudent ? 'Student actions' : 'Parent actions';

  const backToGrid = useCallback(() => setActiveModal(null), []);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', opacity }}>
        <Pressable style={{ flex: 1 }} onPress={activeModal ? backToGrid : onClose} />
      </Animated.View>

      {/* Sheet — single modal, content swaps between grid and forms */}
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        transform: [{ translateY: slideY }],
        shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: -6 }, shadowRadius: 20, elevation: 30,
        maxHeight: SCREEN_H * 0.92,
      }}>
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0' }} />
        </View>

        {/* ── ACTION GRID ── shown when no form is active */}
        {activeModal === null && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Quick Actions</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{roleLabel}</Text>
              </View>
              <Pressable onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={18} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 36, gap: 16 }}>
              {schoolId && <AttendanceCard schoolId={schoolId} role={role} />}

              {isAdmin && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <ActionCard icon="megaphone-outline" label="Post Announcement" desc="Broadcast school-wide" color="#d97706" bg="#fffbeb" onPress={() => setActiveModal('announcement')} />
                  <ActionCard icon="calendar-outline" label="Create Event" desc="Add a calendar event" color="#4C3FC4" bg="#F0EEFF" onPress={() => setActiveModal('event')} />
                  <ActionCard icon="checkmark-done-outline" label="Approve Reports" desc="Review submitted reports" color="#16a34a" bg="#f0fdf4" onPress={() => setActiveModal('approve')} />
                  <ActionCard icon="trophy-outline" label="Results Overview" desc="Term results & grades" color="#e11d48" bg="#fff1f2" onPress={() => nav('/admin-results')} />
                </View>
              )}
              {isStaff && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <ActionCard icon="create-outline" label="New Assessment" desc="Create a test or quiz" color="#4C3FC4" bg="#F0EEFF" onPress={onOpenAssessment} />
                  <ActionCard icon="document-text-outline" label="Write Report" desc="Submit progress report" color="#F5486A" bg="#FFF0F0" onPress={() => setActiveModal('report')} />
                </View>
              )}
              {isStudent && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <ActionCard icon="clipboard-outline" label="My Assessments" desc="View pending tests" color="#6366f1" bg="#eef2ff" onPress={() => nav('/my-assessments')} />
                  <ActionCard icon="trophy-outline" label="My Results" desc="Term report cards" color="#0ea5e9" bg="#f0f9ff" onPress={() => nav('/results')} />
                </View>
              )}
              {isParent && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <ActionCard icon="chatbubble-outline" label="Enquiries" desc="Questions sent to schools" color="#d97706" bg="#fef3c7" onPress={() => nav('/my-enquiries')} />
                </View>
              )}
            </ScrollView>
          </>
        )}

        {/* ── FORM VIEWS — rendered inside the same sheet ── */}
        {activeModal === 'announcement' && (
          <FormSection onBack={backToGrid} title="Post Announcement">
            <AnnouncementFormContent schoolId={schoolId} onDone={backToGrid} />
          </FormSection>
        )}
        {activeModal === 'event' && (
          <FormSection onBack={backToGrid} title="Create Event">
            <EventFormContent schoolId={schoolId} onDone={backToGrid} />
          </FormSection>
        )}
        {activeModal === 'report' && (
          <FormSection onBack={backToGrid} title="Write Report">
            <ReportFormContent schoolId={schoolId} onDone={backToGrid} />
          </FormSection>
        )}
        {activeModal === 'approve' && (
          <FormSection onBack={backToGrid} title="Approve Reports">
            <ApproveReportsContent schoolId={schoolId} />
          </FormSection>
        )}
      </Animated.View>
    </Modal>
  );
}

/* ── Tab entry point ────────────────────────────────────────────── */
export default function ActionTab() {
  const [open, setOpen] = React.useState(true);
  const [assessmentOpen, setAssessmentOpen] = React.useState(false);
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primaryMembership = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0] ?? null;
  const role = primaryMembership?.role ?? '';
  const schoolId = primaryMembership?.schoolId ?? '';

  const isAdmin  = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN;
  const isStaff  = role === UserRole.STAFF;
  const isStudent = role === UserRole.STUDENT;
  const isParent  = role === UserRole.PARENT;

  // Fetch classrooms for CreateAssessmentSheet
  const { data: adminClassroomsRaw } = useClassroomsBySchool(isAdmin ? schoolId : undefined);
  const { data: staffClassroomsRaw } = useMyTeacherClassrooms(isStaff ? schoolId : undefined);
  const classrooms = useMemo(() => {
    const d = isAdmin ? adminClassroomsRaw : staffClassroomsRaw;
    if (Array.isArray(d)) return d as { id: string; name: string; grade?: string; section?: string }[];
    if (d && typeof d === 'object' && 'data' in d)
      return ((d as { data: { id: string; name: string }[] }).data ?? []) as { id: string; name: string; grade?: string; section?: string }[];
    return [];
  }, [isAdmin, adminClassroomsRaw, staffClassroomsRaw]);

  useFocusEffect(React.useCallback(() => { setOpen(true); }, []));

  const handleClose = () => {
    setOpen(false);
    router.replace('/(tabs)/');
  };

  const handleOpenAssessment = () => {
    setOpen(false);
    setAssessmentOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ActionSheet
        visible={open}
        onClose={handleClose}
        schoolId={schoolId}
        role={role}
        isAdmin={isAdmin}
        isStaff={isStaff}
        isStudent={isStudent}
        isParent={isParent}
        onOpenAssessment={handleOpenAssessment}
      />
      <CreateAssessmentSheet
        visible={assessmentOpen}
        onClose={() => { setAssessmentOpen(false); router.replace('/(tabs)/'); }}
        classrooms={classrooms}
        schoolId={schoolId}
      />
    </View>
  );
}
