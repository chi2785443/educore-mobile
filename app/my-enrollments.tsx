import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Linking, Switch,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import {
  useMyEnrollments, useCreateEnrollment,
  useSchoolEnrollments, useUpdateEnrollmentStatus,
} from '@/hooks/useEnrollment';
import { useBrowseSchools } from '@/hooks/useSchool';
import { Enrollment, EnrollmentStatus } from '@/interface/enrollment.interface';
import { School } from '@/interface/school.interface';
import { apiClient } from '@/services/axios.service';

// ─── Shared helpers ────────────────────────────────────────────────────────────

function statusCfg(s: EnrollmentStatus) {
  switch (s) {
    case 'accepted':     return { label: 'Accepted',     bg: '#dcfce7', color: '#16a34a', dark: '#14532d', icon: 'checkmark-circle'  as const };
    case 'declined':     return { label: 'Declined',     bg: '#fee2e2', color: '#dc2626', dark: '#7f1d1d', icon: 'close-circle'      as const };
    case 'under_review': return { label: 'Under Review', bg: '#dbeafe', color: '#2563eb', dark: '#1e3a8a', icon: 'eye-outline'       as const };
    case 'waitlisted':   return { label: 'Waitlisted',   bg: '#fef3c7', color: '#d97706', dark: '#78350f', icon: 'hourglass-outline' as const };
    default:             return { label: 'Pending',      bg: '#f5f3ff', color: '#7c3aed', dark: '#3b0764', icon: 'time-outline'      as const };
  }
}

function fmtSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── STATUS FILTERS ────────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: EnrollmentStatus | 'all'; color: string }[] = [
  { label: 'All',      value: 'all',          color: '#6366f1' },
  { label: 'Pending',  value: 'pending',       color: '#7c3aed' },
  { label: 'Review',   value: 'under_review',  color: '#2563eb' },
  { label: 'Accepted', value: 'accepted',      color: '#16a34a' },
  { label: 'Declined', value: 'declined',      color: '#dc2626' },
  { label: 'Waitlist', value: 'waitlisted',    color: '#d97706' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN VIEW
// ─────────────────────────────────────────────────────────────────────────────

function AdminEnrollmentCard({ item, onPress }: { item: Enrollment; onPress: () => void }) {
  const cfg = statusCfg(item.status);
  const studentName = item.student
    ? `${item.student.firstName} ${item.student.lastName}`
    : 'Unknown Applicant';
  const ini = initials(studentName);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#0f172a',
        shadowOpacity: 0.07,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 2,
      }}>
        {/* Left accent bar */}
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: cfg.color }} />

        <View style={{ padding: 16, paddingLeft: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Avatar */}
            <View style={{
              width: 46, height: 46, borderRadius: 16,
              backgroundColor: cfg.bg,
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: cfg.color }}>{ini}</Text>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>{studentName}</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} numberOfLines={1}>{item.trainingInterest}</Text>
            </View>

            {/* Status badge */}
            <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, flexShrink: 0 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          {/* Meta row */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {item.gradeLevel && (
              <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="layers-outline" size={10} color="#94a3b8" />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b' }}>Grade {item.gradeLevel}</Text>
              </View>
            )}
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="calendar-outline" size={10} color="#94a3b8" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8' }}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            {item.student?.email && (
              <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="mail-outline" size={10} color="#94a3b8" />
                <Text style={{ fontSize: 11, color: '#94a3b8' }} numberOfLines={1}>{item.student.email}</Text>
              </View>
            )}
          </View>

          {/* CTA */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#6366f1', fontWeight: '700' }}>
              {item.status === 'pending' || item.status === 'under_review' ? 'Review Application' : 'View Details'}
            </Text>
            <Ionicons name="arrow-forward-circle" size={18} color="#6366f1" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Admin Detail + Decision View ─────────────────────────────────────────────

function AdminDetailView({
  enrollment, schoolId, onBack, onDone,
}: { enrollment: Enrollment; schoolId: string; onBack: () => void; onDone: () => void }) {
  const cfg = statusCfg(enrollment.status);
  const studentName = enrollment.student
    ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
    : 'Unknown Applicant';
  const ini = initials(studentName);

  const [responseMessage, setResponseMessage] = useState(enrollment.responseMessage ?? '');
  const [adminNotes, setAdminNotes] = useState(enrollment.adminNotes ?? '');
  const [deleteDocuments, setDeleteDocuments] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const { mutate: updateStatus, isPending } = useUpdateEnrollmentStatus(schoolId, () => {
    toast.success('Enrollment status updated');
    onDone();
  });

  const decide = (status: EnrollmentStatus) => {
    updateStatus({ id: enrollment.id, data: { status, responseMessage: responseMessage.trim() || undefined, adminNotes: adminNotes.trim() || undefined, deleteDocuments } });
  };

  const handleViewDoc = async (fileUrl: string) => {
    setViewingDoc(fileUrl);
    try {
      const res = await apiClient.get<{ url: string }>('/files/view-url', { params: { fileUrl } });
      const signed = res.data?.url ?? (res.data as unknown as string);
      await Linking.openURL(signed);
    } catch {
      toast.error('Could not open document. Please try again.');
    } finally {
      setViewingDoc(null);
    }
  };

  const docs = [enrollment.document1, enrollment.document2].filter(Boolean);
  const canDecide = enrollment.status !== 'accepted' && enrollment.status !== 'declined';

  const DECISION_ACTIONS: { label: string; status: EnrollmentStatus; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { label: 'Accept',      status: 'accepted',     bg: '#16a34a', icon: 'checkmark-circle-outline' },
    { label: 'Decline',     status: 'declined',     bg: '#dc2626', icon: 'close-circle-outline' },
    { label: 'Waitlist',    status: 'waitlisted',   bg: '#d97706', icon: 'hourglass-outline' },
    { label: 'Under Review',status: 'under_review', bg: '#2563eb', icon: 'eye-outline' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f1f5f9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ backgroundColor: '#0a1628', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', flex: 1 }}>Application Review</Text>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name={cfg.icon} size={13} color={cfg.color} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>

        {/* Applicant card inside header */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: cfg.color }}>{ini}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{studentName}</Text>
            {enrollment.student?.email && (
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{enrollment.student.email}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#a5b4fc', fontSize: 11, fontWeight: '700' }}>{enrollment.trainingInterest}</Text>
              </View>
              {enrollment.gradeLevel && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' }}>Grade {enrollment.gradeLevel}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>

        {/* Applied date */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Applied</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 2 }}>
                {new Date(enrollment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          {enrollment.reviewedAt && (
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Ionicons name="checkmark-done-outline" size={16} color="#94a3b8" />
              <View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Reviewed</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 2 }}>
                  {new Date(enrollment.reviewedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Personal statement */}
        {enrollment.personalStatement && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Personal Statement</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{enrollment.personalStatement}</Text>
          </View>
        )}

        {/* Previous school */}
        {enrollment.previousSchool && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ionicons name="business-outline" size={17} color="#6366f1" />
            </View>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 2 }}>Previous School</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{enrollment.previousSchool}</Text>
            </View>
          </View>
        )}

        {/* Documents */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Documents</Text>
          {enrollment.documentsDeleted ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12 }}>
              <Ionicons name="trash-outline" size={16} color="#94a3b8" />
              <Text style={{ fontSize: 13, color: '#94a3b8' }}>Documents removed after processing</Text>
            </View>
          ) : docs.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#94a3b8' }}>No documents attached</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {docs.map((doc, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderRadius: 14, padding: 12 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ionicons name="document-text-outline" size={19} color="#6366f1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{doc!.name}</Text>
                    {doc!.fileSize && <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{fmtSize(doc!.fileSize)}</Text>}
                  </View>
                  {doc!.url && (
                    <Pressable onPress={() => handleViewDoc(doc!.url)} disabled={viewingDoc === doc!.url} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
                        {viewingDoc === doc!.url
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Ionicons name="eye-outline" size={16} color="#fff" />}
                      </View>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Existing response */}
        {enrollment.responseMessage && !canDecide && (
          <View style={{
            borderRadius: 16, padding: 16, borderWidth: 1,
            backgroundColor: enrollment.status === 'accepted' ? '#f0fdf4' : '#fef2f2',
            borderColor: enrollment.status === 'accepted' ? '#bbf7d0' : '#fecaca',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name={enrollment.status === 'accepted' ? 'checkmark-circle' : 'close-circle'} size={16} color={cfg.color} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: cfg.dark }}>Response Sent to Applicant</Text>
            </View>
            <Text style={{ fontSize: 13, color: cfg.dark, lineHeight: 20 }}>{enrollment.responseMessage}</Text>
          </View>
        )}

        {/* Decision panel */}
        {canDecide && (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', gap: 14 }}>
            {/* Section label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#6366f1' }} />
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#0f172a' }}>Make a Decision</Text>
            </View>

            {/* Response message */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>
                Message to applicant <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(optional)</Text>
              </Text>
              <TextInput
                value={responseMessage}
                onChangeText={setResponseMessage}
                placeholder="e.g. We are pleased to inform you that your application has been accepted…"
                placeholderTextColor="#cbd5e1"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 14, color: '#0f172a', minHeight: 100 }}
              />
            </View>

            {/* Admin notes */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>
                Admin notes <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(internal only)</Text>
              </Text>
              <TextInput
                value={adminNotes}
                onChangeText={setAdminNotes}
                placeholder="Internal notes about this application…"
                placeholderTextColor="#cbd5e1"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 14, color: '#0f172a', minHeight: 72 }}
              />
            </View>

            {/* Delete docs toggle */}
            {docs.length > 0 && !enrollment.documentsDeleted && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fef9ec', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#fde68a' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400e' }}>Delete documents after decision</Text>
                  <Text style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Removes uploaded files from storage</Text>
                </View>
                <Switch
                  value={deleteDocuments}
                  onValueChange={setDeleteDocuments}
                  trackColor={{ true: '#d97706', false: '#e2e8f0' }}
                  thumbColor="#fff"
                />
              </View>
            )}

            {/* Action buttons 2×2 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {DECISION_ACTIONS.map(action => (
                <Pressable
                  key={action.status}
                  onPress={() => decide(action.status)}
                  disabled={isPending}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, width: '47%', flexGrow: 1 })}
                >
                  <View style={{ backgroundColor: action.bg, borderRadius: 14, paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
                    {isPending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name={action.icon} size={17} color="#fff" />}
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{action.label}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Reviewed by */}
        {enrollment.reviewedBy && (
          <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
            Last reviewed by {enrollment.reviewedBy.firstName} {enrollment.reviewedBy.lastName}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Admin list screen ─────────────────────────────────────────────────────────

type AdminScreen = { kind: 'list' } | { kind: 'detail'; enrollment: Enrollment };

function AdminEnrollmentsScreen({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<AdminScreen>({ kind: 'list' });
  const [activeFilter, setActiveFilter] = useState<EnrollmentStatus | 'all'>('all');

  const { data: enrollments = [], isLoading, refetch } = useSchoolEnrollments(
    schoolId,
    activeFilter === 'all' ? undefined : activeFilter,
  );

  if (screen.kind === 'detail') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <AdminDetailView
          enrollment={screen.enrollment}
          schoolId={schoolId}
          onBack={() => setScreen({ kind: 'list' })}
          onDone={() => { void refetch(); setScreen({ kind: 'list' }); }}
        />
      </SafeAreaView>
    );
  }

  const pending = enrollments.filter(e => e.status === 'pending').length;
  const underReview = enrollments.filter(e => e.status === 'under_review').length;
  const accepted = enrollments.filter(e => e.status === 'accepted').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#0a1628', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Enrollments</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{schoolName}</Text>
          </View>
          <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text-outline" size={19} color="#a5b4fc" />
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'Total',    value: enrollments.length, color: '#a5b4fc' },
            { label: 'Pending',  value: pending + underReview, color: '#fbbf24' },
            { label: 'Accepted', value: accepted,            color: '#4ade80' },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: s.color, fontSize: 22, fontWeight: '900' }}>{s.value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' }}>
          {STATUS_FILTERS.map(f => {
            const active = activeFilter === f.value;
            return (
              <Pressable key={f.value} onPress={() => setActiveFilter(f.value)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? f.color : '#f8fafc', borderWidth: 1.5, borderColor: active ? f.color : '#e2e8f0' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#64748b' }}>{f.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : enrollments.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text-outline" size={34} color="#6366f1" />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', textAlign: 'center' }}>No Applications</Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 }}>
            {activeFilter === 'all'
              ? 'No enrollment applications have been submitted for your school yet.'
              : `No ${activeFilter.replace('_', ' ')} applications.`}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          {enrollments.map(item => (
            <AdminEnrollmentCard
              key={item.id}
              item={item}
              onPress={() => setScreen({ kind: 'detail', enrollment: item })}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT / USER VIEW
// ─────────────────────────────────────────────────────────────────────────────

function UserEnrollmentCard({ item, onPress }: { item: Enrollment; onPress: () => void }) {
  const cfg = statusCfg(item.status);
  const schoolName = item.school?.name ?? item.schoolName ?? 'Unknown School';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={{
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
      }}>
        <View style={{ height: 4, backgroundColor: cfg.color }} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>{schoolName}</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 3 }} numberOfLines={1}>{item.trainingInterest}</Text>
            </View>
            <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {item.gradeLevel && (
              <View style={{ backgroundColor: '#f5f3ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed' }}>Grade {item.gradeLevel}</Text>
              </View>
            )}
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>

          {item.responseMessage && (item.status === 'accepted' || item.status === 'declined') && (
            <View style={{ marginTop: 10, borderRadius: 12, padding: 10, borderLeftWidth: 3, backgroundColor: item.status === 'accepted' ? '#f0fdf4' : '#fef2f2', borderLeftColor: item.status === 'accepted' ? '#16a34a' : '#dc2626' }}>
              <Text style={{ fontSize: 12, color: item.status === 'accepted' ? '#166534' : '#991b1b' }} numberOfLines={2}>{item.responseMessage}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 11, color: '#6366f1', fontWeight: '700' }}>View details</Text>
            <Ionicons name="chevron-forward" size={13} color="#6366f1" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function UserDetailView({ enrollment, onBack }: { enrollment: Enrollment; onBack: () => void }) {
  const cfg = statusCfg(enrollment.status);
  const schoolName = enrollment.school?.name ?? enrollment.schoolName ?? 'Unknown School';
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const handleViewDoc = async (fileUrl: string) => {
    setViewingDoc(fileUrl);
    try {
      const res = await apiClient.get<{ url: string }>('/files/view-url', { params: { fileUrl } });
      const signed = res.data?.url ?? (res.data as unknown as string);
      await Linking.openURL(signed);
    } catch {
      toast.error('Could not open document. Please try again.');
    } finally {
      setViewingDoc(null);
    }
  };

  const docs = [enrollment.document1, enrollment.document2].filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <View style={{ backgroundColor: '#0c2030', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={1}>{schoolName}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>Enrollment Application</Text>
          </View>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name={cfg.icon} size={13} color={cfg.color} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
              Applied {new Date(enrollment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          {enrollment.reviewedAt && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                Reviewed {new Date(enrollment.reviewedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {enrollment.responseMessage && (
          <View style={{ borderRadius: 16, padding: 16, borderWidth: 1, backgroundColor: enrollment.status === 'accepted' ? '#f0fdf4' : enrollment.status === 'declined' ? '#fef2f2' : '#fff7ed', borderColor: enrollment.status === 'accepted' ? '#bbf7d0' : enrollment.status === 'declined' ? '#fecaca' : '#fed7aa' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name={enrollment.status === 'accepted' ? 'checkmark-circle' : enrollment.status === 'declined' ? 'close-circle' : 'information-circle-outline'} size={18} color={cfg.color} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: cfg.dark }}>Message from School</Text>
            </View>
            <Text style={{ fontSize: 13, lineHeight: 20, color: cfg.dark }}>{enrollment.responseMessage}</Text>
          </View>
        )}

        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>Application Details</Text>
          <View style={{ gap: 12 }}>
            <DetailRowUser icon="school-outline" label="Program / Training" value={enrollment.trainingInterest} />
            {enrollment.gradeLevel && <DetailRowUser icon="layers-outline" label="Grade Level" value={enrollment.gradeLevel} />}
            {enrollment.previousSchool && <DetailRowUser icon="business-outline" label="Previous School" value={enrollment.previousSchool} />}
          </View>
        </View>

        {enrollment.personalStatement && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Personal Statement</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{enrollment.personalStatement}</Text>
          </View>
        )}

        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Documents</Text>
          {enrollment.documentsDeleted ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12 }}>
              <Ionicons name="trash-outline" size={16} color="#94a3b8" />
              <Text style={{ fontSize: 13, color: '#94a3b8' }}>Documents removed after processing</Text>
            </View>
          ) : docs.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#94a3b8' }}>No documents attached</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {docs.map((doc, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ionicons name="document-text-outline" size={18} color="#6366f1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{doc!.name}</Text>
                    {doc!.fileSize && <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{fmtSize(doc!.fileSize)}</Text>}
                  </View>
                  {doc!.url && (
                    <Pressable onPress={() => handleViewDoc(doc!.url)} disabled={viewingDoc === doc!.url} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
                        {viewingDoc === doc!.url ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="eye-outline" size={16} color="#fff" />}
                      </View>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {(enrollment.status === 'pending' || enrollment.status === 'under_review') && (
          <View style={{ backgroundColor: '#f5f3ff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e0e7ff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="information-circle-outline" size={18} color="#7c3aed" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#5b21b6' }}>What happens next?</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#6d28d9', lineHeight: 20 }}>
              The school is reviewing your application. You'll be notified when a decision has been made.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRowUser({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Ionicons name={icon} size={15} color="#7c3aed" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

// ─── School picker ─────────────────────────────────────────────────────────────

function SchoolPickerView({ onSelect, onBack }: { onSelect: (s: School) => void; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const { data: schools = [], isLoading } = useBrowseSchools(search ? { search } : undefined);

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <View style={{ backgroundColor: '#0c2030', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', flex: 1 }}>Choose a School</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }}>
          <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.4)" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search schools…" placeholderTextColor="rgba(255,255,255,0.3)" style={{ flex: 1, fontSize: 13, color: '#fff' }} />
          {search.length > 0 && <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.4)" /></Pressable>}
        </View>
      </View>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#14b8a6" size="large" /></View>
      ) : schools.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 }}>
          <Ionicons name="school-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#374151', textAlign: 'center' }}>{search ? 'No schools found' : 'No schools available'}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
          {schools.map(school => (
            <Pressable key={school.id} onPress={() => onSelect(school)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ionicons name="school-outline" size={20} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }} numberOfLines={1}>{school.name}</Text>
                  {(school.city || school.state) && <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }} numberOfLines={1}>{[school.city, school.state].filter(Boolean).join(', ')}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Apply form ────────────────────────────────────────────────────────────────

interface DocFile { uri: string; name: string; mimeType: string }

function ApplyFormView({ school, onBack, onDone }: { school: School; onBack: () => void; onDone: () => void }) {
  const [trainingInterest, setTrainingInterest] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [personalStatement, setPersonalStatement] = useState('');
  const [doc1, setDoc1] = useState<DocFile | null>(null);
  const [doc1Label, setDoc1Label] = useState('');
  const [doc2, setDoc2] = useState<DocFile | null>(null);
  const [doc2Label, setDoc2Label] = useState('');

  const { mutate: create, isPending } = useCreateEnrollment(() => {
    toast.success('Application submitted! Track its status on this page.');
    onDone();
  });

  const pickDoc = async (slot: 1 | 2) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const file = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' };
      if (slot === 1) setDoc1(file); else setDoc2(file);
    }
  };

  const handleSubmit = () => {
    if (!trainingInterest.trim()) { toast.error('Please enter the program you are applying for'); return; }
    if (!doc1) { toast.error('Please upload Document 1'); return; }
    if (!doc1Label.trim()) { toast.error('Please label Document 1'); return; }
    if (!doc2) { toast.error('Please upload Document 2'); return; }
    if (!doc2Label.trim()) { toast.error('Please label Document 2'); return; }
    create({ schoolId: school.id, trainingInterest: trainingInterest.trim(), gradeLevel: gradeLevel.trim() || undefined, previousSchool: previousSchool.trim() || undefined, personalStatement: personalStatement.trim() || undefined, document1Name: doc1Label.trim(), document2Name: doc2Label.trim(), document1Type: doc1.mimeType, document2Type: doc2.mimeType, document1Uri: doc1.uri, document1FileName: doc1.name, document1MimeType: doc1.mimeType, document2Uri: doc2.uri, document2FileName: doc2.name, document2MimeType: doc2.mimeType });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f1f5f9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: '#0c2030', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Apply for Enrollment</Text>
            <Text style={{ color: '#5eead4', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{school.name}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        {/* Program field */}
        <FormFieldUser label="Program / Training Interest" required>
          <TextInput value={trainingInterest} onChangeText={setTrainingInterest} placeholder="e.g. Senior Secondary Science…" placeholderTextColor="#cbd5e1" style={applyInputStyle} />
        </FormFieldUser>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormFieldUser label="Grade Level" hint="Optional">
              <TextInput value={gradeLevel} onChangeText={setGradeLevel} placeholder="e.g. SS2" placeholderTextColor="#cbd5e1" style={applyInputStyle} />
            </FormFieldUser>
          </View>
          <View style={{ flex: 1 }}>
            <FormFieldUser label="Previous School" hint="Optional">
              <TextInput value={previousSchool} onChangeText={setPreviousSchool} placeholder="Last school name" placeholderTextColor="#cbd5e1" style={applyInputStyle} />
            </FormFieldUser>
          </View>
        </View>
        <FormFieldUser label="Personal Statement" hint="Optional">
          <TextInput value={personalStatement} onChangeText={setPersonalStatement} placeholder="Tell the school about you and your goals…" placeholderTextColor="#cbd5e1" multiline numberOfLines={5} textAlignVertical="top" style={[applyInputStyle, { minHeight: 110 }]} />
        </FormFieldUser>

        <View style={{ backgroundColor: '#eef2ff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#c7d2fe', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Ionicons name="information-circle-outline" size={16} color="#6366f1" style={{ marginTop: 1 }} />
          <Text style={{ fontSize: 12, color: '#4338ca', lineHeight: 18, flex: 1 }}>Upload 2 supporting documents — results slip, birth certificate, or letter of recommendation (PDF, Word, or Image).</Text>
        </View>

        <FormFieldUser label="Document 1" required>
          <TextInput value={doc1Label} onChangeText={setDoc1Label} placeholder='Label (e.g. "BECE Result")' placeholderTextColor="#cbd5e1" style={[applyInputStyle, { marginBottom: 8 }]} />
          <DocUploadButtonUser file={doc1} onPick={() => pickDoc(1)} onRemove={() => setDoc1(null)} />
        </FormFieldUser>
        <FormFieldUser label="Document 2" required>
          <TextInput value={doc2Label} onChangeText={setDoc2Label} placeholder='Label (e.g. "Birth Certificate")' placeholderTextColor="#cbd5e1" style={[applyInputStyle, { marginBottom: 8 }]} />
          <DocUploadButtonUser file={doc2} onPick={() => pickDoc(2)} onRemove={() => setDoc2(null)} />
        </FormFieldUser>

        <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{ backgroundColor: isPending ? '#0d7266' : '#0d9488', borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            {isPending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{isPending ? 'Submitting…' : 'Submit Application'}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const applyInputStyle = { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 14, color: '#0f172a' };

function FormFieldUser({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{label}</Text>
        {required && <Text style={{ color: '#ef4444', fontSize: 13 }}>*</Text>}
        {hint && <Text style={{ fontSize: 12, color: '#94a3b8' }}>({hint})</Text>}
      </View>
      {children}
    </View>
  );
}

function DocUploadButtonUser({ file, onPick, onRemove }: { file: DocFile | null; onPick: () => void; onRemove: () => void }) {
  return (
    <Pressable onPress={onPick} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{ backgroundColor: file ? '#f0fdf4' : '#fff', borderWidth: 2, borderColor: file ? '#16a34a' : '#e2e8f0', borderStyle: file ? 'solid' : 'dashed', borderRadius: 14, padding: 14, alignItems: 'center', gap: 8 }}>
        <Ionicons name={file ? 'document-text' : 'cloud-upload-outline'} size={26} color={file ? '#16a34a' : '#94a3b8'} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: file ? '#15803d' : '#64748b', textAlign: 'center' }}>
          {file ? file.name : 'Tap to upload (PDF, Word, or Image)'}
        </Text>
        {file && <Pressable onPress={(e) => { e.stopPropagation?.(); onRemove(); }}><Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}>Remove</Text></Pressable>}
      </View>
    </Pressable>
  );
}

// ─── User list screen ──────────────────────────────────────────────────────────

type UserScreen = { kind: 'list' } | { kind: 'detail'; enrollment: Enrollment } | { kind: 'pick_school' } | { kind: 'apply_form'; school: School };

function UserEnrollmentsScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<UserScreen>({ kind: 'list' });
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  if (screen.kind === 'detail') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <UserDetailView enrollment={screen.enrollment} onBack={() => setScreen({ kind: 'list' })} />
      </SafeAreaView>
    );
  }
  if (screen.kind === 'pick_school') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <SchoolPickerView onSelect={s => setScreen({ kind: 'apply_form', school: s })} onBack={() => setScreen({ kind: 'list' })} />
      </SafeAreaView>
    );
  }
  if (screen.kind === 'apply_form') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ApplyFormView school={screen.school} onBack={() => setScreen({ kind: 'pick_school' })} onDone={() => setScreen({ kind: 'list' })} />
      </SafeAreaView>
    );
  }

  const pending = enrollments.filter(e => e.status === 'pending' || e.status === 'under_review').length;
  const accepted = enrollments.filter(e => e.status === 'accepted').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }} edges={['top']}>
      <View style={{ backgroundColor: '#0c2030', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: enrollments.length > 0 ? 14 : 0 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Enrollments</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {isLoading ? 'Loading…' : `${enrollments.length} application${enrollments.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <Pressable onPress={() => setScreen({ kind: 'pick_school' })} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ backgroundColor: '#0d9488', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Apply</Text>
            </View>
          </Pressable>
        </View>

        {enrollments.length > 0 && !isLoading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Total',   value: enrollments.length, color: '#5eead4' },
              { label: 'Pending', value: pending,            color: '#fbbf24' },
              { label: 'Accepted',value: accepted,           color: '#4ade80' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: s.color, fontSize: 20, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#14b8a6" size="large" /></View>
      ) : enrollments.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text-outline" size={36} color="#14b8a6" />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', textAlign: 'center' }}>No Applications Yet</Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 }}>Apply to enroll in a school and track your applications here.</Text>
          <Pressable onPress={() => setScreen({ kind: 'pick_school' })} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ backgroundColor: '#0d9488', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Apply to a School</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          {enrollments.map(item => (
            <UserEnrollmentCard key={item.id} item={item} onPress={() => setScreen({ kind: 'detail', enrollment: item })} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — role-based entry point
// ─────────────────────────────────────────────────────────────────────────────

export default function EnrollmentsScreen() {
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);

  const memberships = user?.schools ?? [];
  const membership = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const role = membership?.role ?? '';
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;

  if (isAdmin && membership?.schoolId) {
    return (
      <AdminEnrollmentsScreen
        schoolId={membership.schoolId}
        schoolName={membership.school?.name ?? 'Your School'}
      />
    );
  }

  return <UserEnrollmentsScreen />;
}
