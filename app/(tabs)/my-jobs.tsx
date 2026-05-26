import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  useBrowseJobs, useMyApplications, useMyInterviews,
  useApplyForJob, useWithdrawApplication, useConfirmInterview,
} from '@/hooks/useJob';
import { Job, MyApplication, MyInterview } from '@/interface/job.interface';

// ─── Constants ─────────────────────────────────────────────────────────────

const HEADER_COLOR = '#1e1b4b';

function isJobOpen(job: Job): boolean {
  const statusOk = !job.status || job.status === 'open' || job.status === 'active';
  const deadlineOk = !job.deadline || new Date(job.deadline) >= new Date();
  return statusOk && deadlineOk;
}

function appStatusConfig(status: string) {
  switch (status) {
    case 'submitted':           return { label: 'Submitted',     bg: '#dbeafe', color: '#2563eb' };
    case 'under_review':        return { label: 'Under Review',  bg: '#e0e7ff', color: '#4338ca' };
    case 'shortlisted':         return { label: 'Shortlisted',   bg: '#d1fae5', color: '#059669' };
    case 'interview_scheduled': return { label: 'Interview',     bg: '#fef3c7', color: '#d97706' };
    case 'interviewed':         return { label: 'Interviewed',   bg: '#f5f3ff', color: '#7c3aed' };
    case 'offered':             return { label: 'Offered!',      bg: '#d1fae5', color: '#059669' };
    case 'accepted':            return { label: 'Accepted',      bg: '#dcfce7', color: '#16a34a' };
    case 'rejected':            return { label: 'Rejected',      bg: '#fee2e2', color: '#dc2626' };
    case 'withdrawn':           return { label: 'Withdrawn',     bg: '#f1f5f9', color: '#64748b' };
    default:                    return { label: status,          bg: '#f1f5f9', color: '#64748b' };
  }
}

function interviewStatusConfig(status: string) {
  switch (status) {
    case 'confirmed':   return { label: 'Confirmed',   bg: '#dcfce7', color: '#16a34a' };
    case 'completed':   return { label: 'Completed',   bg: '#f5f3ff', color: '#7c3aed' };
    case 'cancelled':   return { label: 'Cancelled',   bg: '#fee2e2', color: '#dc2626' };
    case 'rescheduled': return { label: 'Rescheduled', bg: '#fef3c7', color: '#d97706' };
    default:            return { label: 'Scheduled',   bg: '#dbeafe', color: '#2563eb' };
  }
}

function interviewTypeIcon(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'phone':     return 'call-outline';
    case 'video':     return 'videocam-outline';
    case 'technical': return 'code-slash-outline';
    case 'panel':     return 'people-outline';
    default:          return 'person-outline';
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const open = isJobOpen(job);
  const deadlinePassed = !!job.deadline && new Date(job.deadline) < new Date();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{
        backgroundColor: '#fff', borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: open ? '#e5e7eb' : '#fca5a5',
        shadowColor: '#000', shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            backgroundColor: open ? '#e0e7ff' : '#fee2e2',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="briefcase-outline" size={20} color={open ? '#6366f1' : '#ef4444'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={2}>{job.title}</Text>
            <Text style={{ fontSize: 13, color: open ? '#6366f1' : '#9ca3af', fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
              {job.school?.name ?? 'School'}
            </Text>
          </View>
          {!open ? (
            <View style={{ backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc2626' }}>
                {deadlinePassed ? 'Expired' : 'Closed'}
              </Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {job.employmentType && (
            <View style={{ backgroundColor: '#f0f9ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284c7' }}>
                {job.employmentType.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          )}
          {job.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Ionicons name="location-outline" size={11} color="#6b7280" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#6b7280' }}>{job.location}</Text>
            </View>
          )}
          {job.deadline && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
              backgroundColor: deadlinePassed ? '#fee2e2' : '#fff7ed',
            }}>
              <Ionicons name="calendar-outline" size={11} color={deadlinePassed ? '#dc2626' : '#d97706'} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: deadlinePassed ? '#dc2626' : '#d97706' }}>
                {deadlinePassed ? 'Closed ' : 'Closes '}{new Date(job.deadline).toLocaleDateString()}
              </Text>
            </View>
          )}
          {job.salary && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Ionicons name="cash-outline" size={11} color="#16a34a" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#16a34a' }}>{job.salary}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function ApplicationCard({
  item, onWithdraw,
}: {
  item: MyApplication;
  onWithdraw: () => void;
}) {
  const cfg = appStatusConfig(item.status);
  const canWithdraw = ['submitted', 'under_review', 'shortlisted'].includes(item.status);

  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: '#e5e7eb',
      shadowColor: '#000', shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={1}>
            {item.jobPosting?.title ?? 'General Application'}
          </Text>
          <Text style={{ fontSize: 13, color: '#6366f1', fontWeight: '600', marginTop: 2 }}>
            {item.school?.name ?? 'School'}
          </Text>
        </View>
        <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>
            {item.yearsOfExperience} yr{item.yearsOfExperience !== 1 ? 's' : ''} exp
          </Text>
        </View>
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>
            {new Date(item.submittedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {(item.status === 'rejected') && item.rejectionFeedback && (
        <View style={{ marginTop: 10, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#dc2626' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#b91c1c', marginBottom: 4 }}>Feedback</Text>
          <Text style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 18 }}>{item.rejectionFeedback}</Text>
        </View>
      )}

      {item.status === 'offered' && (
        <View style={{ marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#16a34a' }}>
          <Text style={{ fontSize: 12, color: '#166534', fontWeight: '700' }}>🎉 You received a job offer! Check your email for details.</Text>
        </View>
      )}

      {canWithdraw && (
        <Pressable onPress={onWithdraw} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View style={{
            marginTop: 12, borderRadius: 10, backgroundColor: '#fff5f5',
            borderWidth: 1, borderColor: '#fecaca', paddingVertical: 8, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>Withdraw Application</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

function InterviewCard({
  item, onConfirm, isConfirming,
}: {
  item: MyInterview;
  onConfirm: () => void;
  isConfirming: boolean;
}) {
  const cfg = interviewStatusConfig(item.status);
  const typeIcon = interviewTypeIcon(item.interviewType);
  const date = new Date(item.scheduledDate);
  const needsConfirm = item.status === 'scheduled' && !item.candidateConfirmed;

  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
      borderWidth: 1, borderColor: '#e5e7eb',
      shadowColor: '#000', shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    }}>
      {/* Colored top bar */}
      <View style={{ backgroundColor: HEADER_COLOR, padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={typeIcon} size={16} color="#a5b4fc" />
            </View>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{item.title}</Text>
          </View>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 14, gap: 10 }}>
        {/* School / Job */}
        {item.application && (
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>
            {item.application.jobPosting?.title ?? 'General Application'}{' '}
            <Text style={{ color: '#6366f1' }}>@ {item.application.school?.name}</Text>
          </Text>
        )}

        {/* Date/time/duration */}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0f9ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="calendar-outline" size={13} color="#0284c7" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
              {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0f9ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="time-outline" size={13} color="#0284c7" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
              {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {item.durationMinutes} min
            </Text>
          </View>
        </View>

        {/* Location / meeting link */}
        {item.location && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={{ fontSize: 13, color: '#6b7280' }} numberOfLines={1}>{item.location}</Text>
          </View>
        )}
        {item.meetingLink && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', borderRadius: 10, padding: 10 }}>
            <Ionicons name="link-outline" size={14} color="#7c3aed" />
            <Text style={{ fontSize: 12, color: '#7c3aed', fontWeight: '600', flex: 1 }} numberOfLines={1}>{item.meetingLink}</Text>
          </View>
        )}

        {/* Confirm button */}
        {needsConfirm && (
          <Pressable onPress={onConfirm} disabled={isConfirming} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{
              borderRadius: 12, backgroundColor: '#6366f1',
              paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
            }}>
              {isConfirming
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                {isConfirming ? 'Confirming…' : 'Confirm Attendance'}
              </Text>
            </View>
          </Pressable>
        )}
        {item.candidateConfirmed && item.status !== 'completed' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10 }}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text style={{ fontSize: 12, color: '#166534', fontWeight: '700' }}>You confirmed attendance</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Job Detail view ────────────────────────────────────────────────────────

function JobDetailView({ job, onBack, onApply }: { job: Job; onBack: () => void; onApply: () => void }) {
  const open = isJobOpen(job);
  const deadlinePassed = !!job.deadline && new Date(job.deadline) < new Date();

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={2}>{job.title}</Text>
            <Text style={{ color: '#a5b4fc', fontSize: 12, marginTop: 2 }}>{job.school?.name}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {job.employmentType && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#c7d2fe' }}>{job.employmentType.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          )}
          {job.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Ionicons name="location-outline" size={11} color="#c7d2fe" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#c7d2fe' }}>{job.location}</Text>
            </View>
          )}
          {job.salary && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Ionicons name="cash-outline" size={11} color="#86efac" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#86efac' }}>{job.salary}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}>
        {job.description && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>About the Role</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{job.description}</Text>
          </View>
        )}
        {job.requirements && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Requirements</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{job.requirements}</Text>
          </View>
        )}
        {job.responsibilities && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Responsibilities</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{job.responsibilities}</Text>
          </View>
        )}
        {job.deadline && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1,
            backgroundColor: deadlinePassed ? '#fef2f2' : '#fff7ed',
            borderColor: deadlinePassed ? '#fca5a5' : '#fed7aa',
          }}>
            <Ionicons name="alert-circle-outline" size={18} color={deadlinePassed ? '#dc2626' : '#d97706'} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: deadlinePassed ? '#991b1b' : '#92400e', flex: 1 }}>
              {deadlinePassed
                ? `Applications closed on ${new Date(job.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`
                : `Applications close ${new Date(job.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
            </Text>
          </View>
        )}

        {!open && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fca5a5' }}>
            <Ionicons name="lock-closed-outline" size={20} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#b91c1c' }}>Not Accepting Applications</Text>
              <Text style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>
                {deadlinePassed ? 'The application deadline for this position has passed.' : 'This position is no longer open for applications.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Apply button — only visible when job is still open */}
      <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', padding: 16 }}>
        {open ? (
          <Pressable onPress={onApply} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{
              backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            }}>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Apply for this Position</Text>
            </View>
          </Pressable>
        ) : (
          <View style={{
            backgroundColor: '#f3f4f6', borderRadius: 14, paddingVertical: 16,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
            <Text style={{ color: '#9ca3af', fontSize: 16, fontWeight: '900' }}>Applications Closed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Apply Form ─────────────────────────────────────────────────────────────

function ApplyFormView({
  job, onBack, onDone,
}: {
  job: Job;
  onBack: () => void;
  onDone: () => void;
}) {
  const [coverLetter, setCoverLetter] = useState('');
  const [years, setYears] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [education, setEducation] = useState('');
  const [resume, setResume] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  const { mutate: apply, isPending } = useApplyForJob(() => {
    toast.success('Application submitted! Track it in the Applications tab.');
    onDone();
  });

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setResume({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' });
    }
  };

  const handleSubmit = () => {
    if (!coverLetter.trim()) { toast.error('Please write a cover letter'); return; }
    if (!years.trim() || isNaN(Number(years))) { toast.error('Please enter years of experience'); return; }
    if (!resume) { toast.error('Please attach your resume'); return; }

    apply({
      schoolId: job.school.id,
      jobPostingId: job.id,
      coverLetter: coverLetter.trim(),
      yearsOfExperience: Number(years),
      portfolioUrl: portfolio.trim() || undefined,
      education: education.trim() || undefined,
      resumeUri: resume.uri,
      resumeName: resume.name,
      resumeMimeType: resume.mimeType,
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Apply Now</Text>
            <Text style={{ color: '#a5b4fc', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{job.title} · {job.school?.name}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        {/* Cover Letter */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
            Cover Letter <Text style={{ color: '#dc2626' }}>*</Text>
          </Text>
          <TextInput
            value={coverLetter}
            onChangeText={setCoverLetter}
            placeholder="Tell them why you're the right fit for this role…"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={{
              backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
              borderRadius: 14, padding: 14, fontSize: 14, color: '#111827',
              minHeight: 130,
            }}
          />
        </View>

        {/* Years of experience */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
            Years of Experience <Text style={{ color: '#dc2626' }}>*</Text>
          </Text>
          <TextInput
            value={years}
            onChangeText={setYears}
            placeholder="e.g. 3"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            style={{
              backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
              borderRadius: 14, padding: 14, fontSize: 14, color: '#111827',
            }}
          />
        </View>

        {/* Resume upload */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
            Resume <Text style={{ color: '#dc2626' }}>*</Text>
          </Text>
          <Pressable onPress={pickResume} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View style={{
              backgroundColor: resume ? '#f0fdf4' : '#fff',
              borderWidth: 2, borderColor: resume ? '#16a34a' : '#e5e7eb',
              borderStyle: resume ? 'solid' : 'dashed',
              borderRadius: 14, padding: 16, alignItems: 'center', gap: 8,
            }}>
            <Ionicons name={resume ? 'document-text' : 'cloud-upload-outline'} size={28} color={resume ? '#16a34a' : '#9ca3af'} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: resume ? '#15803d' : '#6b7280', textAlign: 'center' }}>
              {resume ? resume.name : 'Tap to upload resume (PDF or Word)'}
            </Text>
            {resume && (
              <Pressable onPress={() => setResume(null)}>
                <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}>Remove</Text>
              </Pressable>
            )}
            </View>
          </Pressable>
        </View>

        {/* Portfolio URL (optional) */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Portfolio URL <Text style={{ color: '#9ca3af' }}>(optional)</Text></Text>
          <TextInput
            value={portfolio}
            onChangeText={setPortfolio}
            placeholder="https://yourportfolio.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="url"
            style={{
              backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
              borderRadius: 14, padding: 14, fontSize: 14, color: '#111827',
            }}
          />
        </View>

        {/* Education (optional) */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Education <Text style={{ color: '#9ca3af' }}>(optional)</Text></Text>
          <TextInput
            value={education}
            onChangeText={setEducation}
            placeholder="e.g. B.Ed Mathematics, University of Lagos"
            placeholderTextColor="#9ca3af"
            style={{
              backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
              borderRadius: 14, padding: 14, fontSize: 14, color: '#111827',
            }}
          />
        </View>

        {/* Submit */}
        <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{
            backgroundColor: isPending ? '#a5b4fc' : '#6366f1',
            borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4,
          }}>
            {isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
              {isPending ? 'Submitting…' : 'Submit Application'}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Screen = { kind: 'list' } | { kind: 'detail'; job: Job } | { kind: 'apply'; job: Job };
type Tab = 'browse' | 'applications' | 'interviews';

export default function MyJobsScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>({ kind: 'list' });
  const [tab, setTab] = useState<Tab>('browse');
  const [search, setSearch] = useState('');

  const searchParams = search.trim() ? { search: search.trim() } : undefined;
  const { data: jobs = [], isLoading: loadingJobs } = useBrowseJobs(searchParams);
  const { data: applications = [], isLoading: loadingApps } = useMyApplications();
  const { data: interviews = [], isLoading: loadingInterviews } = useMyInterviews();

  const { mutate: withdraw } = useWithdrawApplication();
  const { mutate: confirmInterview, isPending: confirming } = useConfirmInterview();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleWithdraw = (id: string) => {
    Alert.alert('Withdraw Application', 'Are you sure you want to withdraw this application?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: () => withdraw(id) },
    ]);
  };

  const handleConfirm = (id: string) => {
    setConfirmingId(id);
    confirmInterview(id, { onSettled: () => setConfirmingId(null) });
  };

  // Nested screen: detail or apply
  if (screen.kind === 'detail') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <JobDetailView
          job={screen.job}
          onBack={() => setScreen({ kind: 'list' })}
          onApply={() => setScreen({ kind: 'apply', job: screen.job })}
        />
      </SafeAreaView>
    );
  }

  if (screen.kind === 'apply') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ApplyFormView
          job={screen.job}
          onBack={() => setScreen({ kind: 'detail', job: screen.job })}
          onDone={() => { setScreen({ kind: 'list' }); setTab('applications'); }}
        />
      </SafeAreaView>
    );
  }

  // Main list screen
  const pendingInterviews = interviews.filter(i => i.status === 'scheduled' && !i.candidateConfirmed).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Jobs</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>Browse openings · track applications</Text>
          </View>
          <Ionicons name="briefcase-outline" size={22} color="#a5b4fc" />
        </View>

        {/* Tab pills */}
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 3, gap: 2 }}>
          {([
            { id: 'browse', label: 'Browse' },
            { id: 'applications', label: `Applied (${applications.length})` },
            { id: 'interviews', label: `Interviews${pendingInterviews > 0 ? ` (${pendingInterviews})` : ''}` },
          ] as { id: Tab; label: string }[]).map(t => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                backgroundColor: tab === t.id ? '#fff' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: tab === t.id ? HEADER_COLOR : 'rgba(255,255,255,0.5)' }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search bar — only on browse tab */}
        {tab === 'browse' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 }}>
            <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.4)" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search jobs or schools…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={{ flex: 1, fontSize: 13, color: '#fff' }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.4)" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {tab === 'browse' && (
        loadingJobs ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#6366f1" size="large" />
          </View>
        ) : jobs.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
            <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
              {search ? 'No matching jobs' : 'No openings right now'}
            </Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
              {search ? 'Try a different search term.' : 'Check back later for new opportunities.'}
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {jobs.map(job => (
              <JobCard key={job.id} job={job} onPress={() => setScreen({ kind: 'detail', job })} />
            ))}
          </ScrollView>
        )
      )}

      {tab === 'applications' && (
        loadingApps ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#6366f1" size="large" />
          </View>
        ) : applications.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No applications yet</Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
              Apply to a job from the Browse tab and it'll appear here.
            </Text>
            <Pressable onPress={() => setTab('browse')} style={{ backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Browse Jobs</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {applications.map(app => (
              <ApplicationCard
                key={app.id}
                item={app}
                onWithdraw={() => handleWithdraw(app.id)}
              />
            ))}
          </ScrollView>
        )
      )}

      {tab === 'interviews' && (
        loadingInterviews ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#6366f1" size="large" />
          </View>
        ) : interviews.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No interviews scheduled</Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
              When a school schedules an interview with you, it'll appear here.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {interviews.map(interview => (
              <InterviewCard
                key={interview.id}
                item={interview}
                onConfirm={() => handleConfirm(interview.id)}
                isConfirming={confirmingId === interview.id && confirming}
              />
            ))}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}
