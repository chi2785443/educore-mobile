import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import { useSchoolEnquiries, useReplyEnquiry, useCloseEnquiry } from '@/hooks/useEnquiry';
import { Enquiry, EnquiryStatus, EnquiryCategory } from '@/interface/enquiry.interface';

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_BG = '#1e1b4b';
const ACCENT = '#6366f1';

const CATEGORY_LABELS: Record<EnquiryCategory, string> = {
  admission: 'Admission',
  school_fees: 'School Fees',
  curriculum: 'Curriculum',
  facilities: 'Facilities',
  transport: 'Transport',
  uniform: 'Uniform',
  extra_curricular: 'Extra-Curricular',
  academic_calendar: 'Academic Calendar',
  general: 'General',
};

function statusConfig(status: EnquiryStatus) {
  switch (status) {
    case 'replied':      return { label: 'Replied',     bg: '#dcfce7', color: '#16a34a', icon: 'checkmark-done-outline' as const };
    case 'in_progress':  return { label: 'In Progress', bg: '#dbeafe', color: '#2563eb', icon: 'refresh-outline'        as const };
    case 'closed':       return { label: 'Closed',      bg: '#f1f5f9', color: '#64748b', icon: 'lock-closed-outline'    as const };
    default:             return { label: 'Pending',     bg: '#fef3c7', color: '#d97706', icon: 'time-outline'           as const };
  }
}

const STATUS_FILTERS: { label: string; value: EnquiryStatus | 'all' }[] = [
  { label: 'All',         value: 'all' },
  { label: 'Pending',     value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Replied',     value: 'replied' },
  { label: 'Closed',      value: 'closed' },
];

// ─── Enquiry Card ─────────────────────────────────────────────────────────────

function EnquiryCard({ item, onPress }: { item: Enquiry; onPress: () => void }) {
  const cfg = statusConfig(item.status);
  const parentName = item.parent
    ? `${item.parent.firstName} ${item.parent.lastName}`
    : 'Unknown Parent';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={{
        backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
        borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
      }}>
        <View style={{ height: 3, backgroundColor: cfg.color }} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={2}>{item.subject}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Ionicons name="person-outline" size={11} color="#9ca3af" />
                <Text style={{ fontSize: 12, color: '#6b7280' }} numberOfLines={1}>{parentName}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, flexShrink: 0 }}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8, lineHeight: 19 }} numberOfLines={2}>{item.message}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {item.category && (
              <View style={{ backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#4f46e5' }}>{CATEGORY_LABELS[item.category]}</Text>
              </View>
            )}
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9ca3af' }}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            {item.reply && (
              <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>Replied</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, color: ACCENT, fontWeight: '700' }}>View & Respond</Text>
              <Ionicons name="chevron-forward" size={13} color={ACCENT} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Detail + Reply View ──────────────────────────────────────────────────────

function DetailView({
  enquiry,
  schoolId,
  onBack,
  onDone,
}: {
  enquiry: Enquiry;
  schoolId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const cfg = statusConfig(enquiry.status);
  const parentName = enquiry.parent
    ? `${enquiry.parent.firstName} ${enquiry.parent.lastName}`
    : 'Unknown Parent';

  const [replyText, setReplyText] = useState('');
  const [infoKey, setInfoKey] = useState('');
  const [infoVal, setInfoVal] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<Record<string, string>>({});

  const { mutate: sendReply, isPending: replying } = useReplyEnquiry(schoolId, () => {
    toast.success('Reply sent successfully');
    onDone();
  });

  const { mutate: closeEnquiry, isPending: closing } = useCloseEnquiry(schoolId, () => {
    toast.success('Enquiry closed');
    onDone();
  });

  const addInfoRow = () => {
    const k = infoKey.trim();
    const v = infoVal.trim();
    if (!k || !v) return;
    setSchoolInfo(prev => ({ ...prev, [k]: v }));
    setInfoKey('');
    setInfoVal('');
  };

  const removeInfoRow = (key: string) => {
    setSchoolInfo(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleReply = () => {
    if (!replyText.trim()) { toast.error('Please write a reply message'); return; }
    sendReply({
      id: enquiry.id,
      data: {
        reply: replyText.trim(),
        schoolInfo: Object.keys(schoolInfo).length > 0 ? schoolInfo : undefined,
        status: 'replied',
      },
    });
  };

  const alreadyReplied = !!enquiry.reply;
  const isClosed = enquiry.status === 'closed';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ backgroundColor: HEADER_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={2}>{enquiry.subject}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{parentName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0 }}>
            <Ionicons name={cfg.icon} size={13} color={cfg.color} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
              Received {new Date(enquiry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          {enquiry.category && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: '#a5b4fc', fontWeight: '700' }}>{CATEGORY_LABELS[enquiry.category]}</Text>
            </View>
          )}
          {enquiry.parent?.email && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{enquiry.parent.email}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>

        {/* Parent's message */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Parent's Message
          </Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{enquiry.message}</Text>
        </View>

        {/* Specific questions */}
        {enquiry.specificQuestions && enquiry.specificQuestions.length > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
              Specific Questions
            </Text>
            <View style={{ gap: 10 }}>
              {enquiry.specificQuestions.map((q, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ width: 22, height: 22, borderRadius: 8, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#4f46e5' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 }}>{q}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Child info */}
        {(enquiry.childName || enquiry.childAge || enquiry.childCurrentGrade) && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
              Child Information
            </Text>
            <View style={{ gap: 10 }}>
              {enquiry.childName && <InfoRow icon="person-outline" label="Name" value={enquiry.childName} />}
              {enquiry.childAge != null && <InfoRow icon="calendar-outline" label="Age" value={`${enquiry.childAge} years old`} />}
              {enquiry.childCurrentGrade && <InfoRow icon="layers-outline" label="Current Grade" value={enquiry.childCurrentGrade} />}
            </View>
          </View>
        )}

        {/* Existing reply */}
        {alreadyReplied && (
          <View style={{ backgroundColor: '#f0fdf4', borderRadius: 16, borderWidth: 1, borderColor: '#bbf7d0', padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#16a34a' }} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#15803d' }}>Your Reply</Text>
              {enquiry.repliedAt && (
                <Text style={{ fontSize: 12, color: '#4ade80', marginLeft: 4 }}>
                  · {new Date(enquiry.repliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 14, color: '#166534', lineHeight: 22 }}>{enquiry.reply}</Text>
            {enquiry.schoolInfo && Object.keys(enquiry.schoolInfo).length > 0 && (
              <View style={{ borderTopWidth: 1, borderTopColor: '#bbf7d0', paddingTop: 10, gap: 8 }}>
                {Object.entries(enquiry.schoolInfo).map(([k, v]) => (
                  <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#4ade80', textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 }}>{k.replace(/_/g, ' ')}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803d', flex: 1, textAlign: 'right' }}>{v}</Text>
                  </View>
                ))}
              </View>
            )}
            {enquiry.repliedBy && (
              <Text style={{ fontSize: 12, color: '#4ade80' }}>
                — {enquiry.repliedBy.firstName} {enquiry.repliedBy.lastName}
              </Text>
            )}
          </View>
        )}

        {/* Closed notice */}
        {isClosed && (
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" />
            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>This enquiry is closed.</Text>
          </View>
        )}

        {/* Reply form — shown if not closed */}
        {!isClosed && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
              {alreadyReplied ? 'Update Reply' : 'Write a Reply'}
            </Text>

            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write your response to the parent…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{
                backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb',
                borderRadius: 14, padding: 14, fontSize: 14, color: '#111827', minHeight: 120,
              }}
            />

            {/* School info key/value rows */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280' }}>
                Additional Info <Text style={{ fontWeight: '400' }}>(optional — fees, dates, etc.)</Text>
              </Text>

              {Object.entries(schoolInfo).map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</Text>
                    <Text style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{v}</Text>
                  </View>
                  <Pressable onPress={() => removeInfoRow(k)} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                    <Ionicons name="close-circle" size={18} color="#f87171" />
                  </Pressable>
                </View>
              ))}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={infoKey}
                  onChangeText={setInfoKey}
                  placeholder="Label (e.g. Term Fees)"
                  placeholderTextColor="#9ca3af"
                  style={{ flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#111827' }}
                />
                <TextInput
                  value={infoVal}
                  onChangeText={setInfoVal}
                  placeholder="Value"
                  placeholderTextColor="#9ca3af"
                  style={{ flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#111827' }}
                  onSubmitEditing={addInfoRow}
                  returnKeyType="done"
                />
                <Pressable onPress={addInfoRow} disabled={!infoKey.trim() || !infoVal.trim()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: infoKey.trim() && infoVal.trim() ? ACCENT : '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="add" size={20} color={infoKey.trim() && infoVal.trim() ? '#fff' : '#9ca3af'} />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Send reply */}
            <Pressable onPress={handleReply} disabled={replying} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <View style={{ backgroundColor: replying ? '#818cf8' : ACCENT, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {replying
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="send-outline" size={17} color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>
                  {replying ? 'Sending…' : alreadyReplied ? 'Update Reply' : 'Send Reply'}
                </Text>
              </View>
            </Pressable>

            {/* Close enquiry */}
            {!isClosed && (
              <Pressable onPress={() => closeEnquiry(enquiry.id)} disabled={closing} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {closing
                    ? <ActivityIndicator size="small" color="#94a3b8" />
                    : <Ionicons name="lock-closed-outline" size={16} color="#64748b" />}
                  <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '700' }}>
                    {closing ? 'Closing…' : 'Close Enquiry'}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Ionicons name={icon} size={15} color="#4f46e5" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Screen = { kind: 'list' } | { kind: 'detail'; enquiry: Enquiry };

export default function SchoolEnquiriesScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);

  const memberships = user?.schools ?? [];
  const membership = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const role = membership?.role ?? '';
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;

  const schoolId = membership?.schoolId ?? '';
  const schoolName = membership?.school?.name ?? 'Your School';

  const [screen, setScreen] = useState<Screen>({ kind: 'list' });
  const [activeFilter, setActiveFilter] = useState<EnquiryStatus | 'all'>('all');

  const { data: enquiries = [], isLoading, refetch } = useSchoolEnquiries(
    schoolId,
    activeFilter === 'all' ? undefined : activeFilter,
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="lock-closed-outline" size={30} color="#dc2626" />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#111827', textAlign: 'center' }}>Access Restricted</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Only school admins and super admins can view school enquiries.
          </Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ backgroundColor: ACCENT, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Go Back</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (screen.kind === 'detail') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <DetailView
          enquiry={screen.enquiry}
          schoolId={schoolId}
          onBack={() => setScreen({ kind: 'list' })}
          onDone={() => { void refetch(); setScreen({ kind: 'list' }); }}
        />
      </SafeAreaView>
    );
  }

  const pending = enquiries.filter(e => e.status === 'pending').length;
  const inProgress = enquiries.filter(e => e.status === 'in_progress').length;
  const replied = enquiries.filter(e => e.status === 'replied').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: HEADER_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: enquiries.length > 0 && !isLoading ? 14 : 0 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>School Enquiries</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              {isLoading ? 'Loading…' : schoolName}
            </Text>
          </View>
          <Ionicons name="chatbubbles-outline" size={22} color={ACCENT} />
        </View>

        {enquiries.length > 0 && !isLoading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Total',       value: enquiries.length,  color: '#a5b4fc' },
              { label: 'Pending',     value: pending + inProgress, color: '#fbbf24' },
              { label: 'Replied',     value: replied,           color: '#4ade80' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: s.color, fontSize: 20, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Status filter tabs */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' }}>
          {STATUS_FILTERS.map(f => {
            const active = activeFilter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setActiveFilter(f.value)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{
                  paddingHorizontal: 14, paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: active ? ACCENT : '#f1f5f9',
                  borderWidth: 1.5,
                  borderColor: active ? ACCENT : '#e5e7eb',
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{f.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : enquiries.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={36} color={ACCENT} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#111827', textAlign: 'center' }}>No Enquiries</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {activeFilter === 'all'
              ? 'No parents have sent enquiries to your school yet.'
              : `No ${activeFilter.replace('_', ' ')} enquiries at the moment.`}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          {enquiries.map(item => (
            <EnquiryCard
              key={item.id}
              item={item}
              onPress={() => setScreen({ kind: 'detail', enquiry: item })}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
