import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Linking, Modal,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import ClassroomDetailTabs from '@/components/classroom/ClassroomDetailTabs';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import {
  useBrowseJobs, useMyApplications, useMyInterviews,
  useApplyForJob, useWithdrawApplication, useConfirmInterview,
  useSchoolPostings, useCreatePosting, useUpdatePosting, useDeletePosting,
  useSchoolApplications, useUpdateApplication,
  useSchoolInterviews, useScheduleInterview,
} from '@/hooks/useJob';
import {
  Job, MyApplication, MyInterview,
  JobPosting, JobApplication, JobInterview,
  ApplyJobPayload, CreateJobPosting, UpdateApplicationStatus, ScheduleInterviewPayload,
  JobStatus, ApplicationStatus, EmploymentType, ExperienceLevel, SchoolJobRole, InterviewType,
} from '@/interface/job.interface';

// ─── Shared config / helpers ───────────────────────────────────────────────────

const ADMIN_BG = '#0a1628';
const STAFF_BG = '#0c1a40';

function jobStatusCfg(s: JobStatus) {
  switch (s) {
    case 'active':  return { label: 'Active',  color: '#16a34a', bg: '#dcfce7' };
    case 'draft':   return { label: 'Draft',   color: '#64748b', bg: '#f1f5f9' };
    case 'paused':  return { label: 'Paused',  color: '#d97706', bg: '#fef3c7' };
    case 'closed':  return { label: 'Closed',  color: '#dc2626', bg: '#fee2e2' };
    case 'filled':  return { label: 'Filled',  color: '#7c3aed', bg: '#f5f3ff' };
    default:        return { label: s,          color: '#64748b', bg: '#f1f5f9' };
  }
}

function appStatusCfg(s: string) {
  switch (s) {
    case 'submitted':           return { label: 'Submitted',     color: '#2563eb', bg: '#dbeafe' };
    case 'under_review':        return { label: 'Under Review',  color: '#4338ca', bg: '#e0e7ff' };
    case 'shortlisted':         return { label: 'Shortlisted',   color: '#059669', bg: '#d1fae5' };
    case 'interview_scheduled': return { label: 'Interview',     color: '#d97706', bg: '#fef3c7' };
    case 'interviewed':         return { label: 'Interviewed',   color: '#7c3aed', bg: '#f5f3ff' };
    case 'offered':             return { label: 'Offered',       color: '#059669', bg: '#d1fae5' };
    case 'accepted':            return { label: 'Accepted',      color: '#16a34a', bg: '#dcfce7' };
    case 'rejected':            return { label: 'Rejected',      color: '#dc2626', bg: '#fee2e2' };
    case 'withdrawn':           return { label: 'Withdrawn',     color: '#64748b', bg: '#f1f5f9' };
    default:                    return { label: s,                color: '#64748b', bg: '#f1f5f9' };
  }
}

function interviewStatusCfg(s: string) {
  switch (s) {
    case 'confirmed':   return { label: 'Confirmed',   color: '#16a34a', bg: '#dcfce7' };
    case 'completed':   return { label: 'Completed',   color: '#7c3aed', bg: '#f5f3ff' };
    case 'cancelled':   return { label: 'Cancelled',   color: '#dc2626', bg: '#fee2e2' };
    case 'rescheduled': return { label: 'Rescheduled', color: '#d97706', bg: '#fef3c7' };
    case 'no_show':     return { label: 'No Show',     color: '#dc2626', bg: '#fee2e2' };
    default:            return { label: 'Scheduled',   color: '#2563eb', bg: '#dbeafe' };
  }
}

function interviewTypeIcon(t: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (t) {
    case 'phone':     return 'call-outline';
    case 'video':     return 'videocam-outline';
    case 'technical': return 'code-slash-outline';
    case 'panel':     return 'people-outline';
    case 'final':     return 'flag-outline';
    default:          return 'person-outline';
  }
}

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString(undefined, opts ?? { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${fmtDate(iso, { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function initials(first?: string, last?: string) {
  return `${(first?.[0] ?? '').toUpperCase()}${(last?.[0] ?? '').toUpperCase()}`;
}

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher', assistant_teacher: 'Asst. Teacher', head_teacher: 'Head Teacher',
  principal: 'Principal', vice_principal: 'Vice Principal', counselor: 'Counselor',
  librarian: 'Librarian', lab_technician: 'Lab Tech', admin_staff: 'Admin Staff',
  accountant: 'Accountant', security: 'Security', janitor: 'Janitor',
  driver: 'Driver', nurse: 'Nurse', it_support: 'IT Support', other: 'Other',
};
const EMP_LABELS: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship',
};
const EXP_LABELS: Record<string, string> = {
  entry: 'Entry', intermediate: 'Intermediate', senior: 'Senior', expert: 'Expert',
};
const IV_TYPE_LABELS: Record<string, string> = {
  phone: 'Phone', video: 'Video', in_person: 'In Person',
  technical: 'Technical', panel: 'Panel', final: 'Final',
};

function Chip({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? color : '#f8fafc', borderWidth: 1.5, borderColor: active ? color : '#e2e8f0' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#64748b' }}>{label}</Text>
      </View>
    </Pressable>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 }}>
      {label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}
    </Text>
  );
}

const inputStyle = {
  backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  borderRadius: 14, padding: 14, fontSize: 14, color: '#0f172a',
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN VIEW
// ─────────────────────────────────────────────────────────────────────────────

// ─── Admin cards ──────────────────────────────────────────────────────────────

function AdminPostingCard({ item, appCount, onPress, onStatusChange, onDelete }: {
  item: JobPosting;
  appCount: number;
  onPress: () => void;
  onStatusChange: (status: JobStatus) => void;
  onDelete: () => void;
}) {
  const cfg = jobStatusCfg(item.status);
  const deadline = item.applicationDeadline ? new Date(item.applicationDeadline) : null;
  const expired = deadline ? deadline < new Date() : false;

  const openActions = () => Alert.alert(
    item.title,
    'Choose an action',
    [
      { text: 'Set Active',  onPress: () => onStatusChange('active') },
      { text: 'Pause',       onPress: () => onStatusChange('paused') },
      { text: 'Close',       onPress: () => onStatusChange('closed') },
      { text: 'Mark Filled', onPress: () => onStatusChange('filled') },
      { text: 'Delete',      style: 'destructive', onPress: onDelete },
      { text: 'Cancel',      style: 'cancel' },
    ],
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <View style={{
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
        marginBottom: 2,
      }}>
        <View style={{ height: 3, backgroundColor: cfg.color }} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>{item.title}</Text>
              {item.department && <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{item.department}</Text>}
            </View>
            <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
            </View>
            <Pressable onPress={openActions} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Ionicons name="ellipsis-vertical" size={18} color="#94a3b8" />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            <View style={{ backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366f1' }}>{ROLE_LABELS[item.role] ?? item.role}</Text>
            </View>
            <View style={{ backgroundColor: '#f0f9ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#0284c7' }}>{EMP_LABELS[item.employmentType] ?? item.employmentType}</Text>
            </View>
            {item.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Ionicons name="location-outline" size={10} color="#94a3b8" />
                <Text style={{ fontSize: 11, color: '#64748b' }}>{item.location}</Text>
              </View>
            )}
            {deadline && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: expired ? '#fee2e2' : '#fff7ed', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Ionicons name="calendar-outline" size={10} color={expired ? '#dc2626' : '#d97706'} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: expired ? '#dc2626' : '#d97706' }}>
                  {expired ? 'Closed ' : 'Closes '}{fmtDate(item.applicationDeadline!)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f5f3ff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Ionicons name="people-outline" size={13} color="#7c3aed" />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#7c3aed' }}>
                {appCount} applicant{appCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366f1' }}>View Applicants</Text>
              <Ionicons name="arrow-forward-circle" size={16} color="#6366f1" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function AdminApplicationCard({ item, onPress }: { item: JobApplication; onPress: () => void }) {
  const cfg = appStatusCfg(item.status);
  const fullName = `${item.applicant?.firstName ?? ''} ${item.applicant?.lastName ?? ''}`.trim();
  const name = fullName || item.applicant?.email || `Applicant #${item.id.slice(-4)}`;
  const ini = initials(item.applicant?.firstName, item.applicant?.lastName) || item.applicant?.email?.[0]?.toUpperCase() || '?';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <View style={{
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#0f172a', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
      }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: cfg.color }} />
        <View style={{ padding: 16, paddingLeft: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {item.applicant?.profilePicture ? (
              <Image
                source={{ uri: item.applicant.profilePicture }}
                style={{ width: 44, height: 44, borderRadius: 15, flexShrink: 0 }}
                contentFit="cover"
              />
            ) : (
              <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: cfg.color }}>{ini}</Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>{name}</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }} numberOfLines={1}>{item.jobPosting?.title ?? 'General Application'}</Text>
            </View>
            <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, flexShrink: 0 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>{item.yearsOfExperience} yr exp</Text>
            </View>
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{fmtDate(item.submittedAt)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function AdminInterviewCard({ item }: { item: JobInterview }) {
  const cfg = interviewStatusCfg(item.status);
  const typeIcon = interviewTypeIcon(item.interviewType);
  const name = item.application?.applicant
    ? `${item.application.applicant.firstName} ${item.application.applicant.lastName}`
    : 'Candidate';

  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: '#f1f5f9',
      shadowColor: '#0f172a', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
    }}>
      <View style={{ backgroundColor: ADMIN_BG, padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ionicons name={typeIcon} size={15} color="#a5b4fc" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                {IV_TYPE_LABELS[item.interviewType] ?? item.interviewType} · {name}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>
      </View>
      <View style={{ padding: 14, gap: 8 }}>
        {item.application?.jobPosting?.title && (
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }} numberOfLines={1}>
            {item.application.jobPosting.title}
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="calendar-outline" size={12} color="#3b82f6" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#3b82f6' }}>{fmtDateTime(item.scheduledDate)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="time-outline" size={12} color="#64748b" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>{item.durationMinutes} min</Text>
          </View>
        </View>
        {(item.location || item.meetingLink) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name={item.meetingLink ? 'link-outline' : 'location-outline'} size={13} color="#7c3aed" />
            <Text style={{ fontSize: 12, color: '#7c3aed', fontWeight: '600', flex: 1 }} numberOfLines={1}>
              {item.meetingLink ?? item.location}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Admin application detail ─────────────────────────────────────────────────

function AdminApplicationDetailView({ application, schoolId, onBack, onRefresh, onScheduleInterview }: {
  application: JobApplication;
  schoolId: string;
  onBack: () => void;
  onRefresh: () => void;
  onScheduleInterview: () => void;
}) {
  const cfg = appStatusCfg(application.status);
  const name = `${application.applicant?.firstName ?? ''} ${application.applicant?.lastName ?? ''}`.trim() || 'Applicant';
  const ini = initials(application.applicant?.firstName, application.applicant?.lastName) || '?';

  const [notes, setNotes] = useState(application.notes ?? '');
  const [rejReason, setRejReason] = useState(application.rejectionReason ?? '');
  const [rejFeedback, setRejFeedback] = useState(application.rejectionFeedback ?? '');
  const [showReject, setShowReject] = useState(false);

  const { mutate: update, isPending } = useUpdateApplication(schoolId, () => {
    toast.success('Application updated');
    onRefresh();
    onBack();
  });

  const doUpdate = (status: ApplicationStatus, extra?: Partial<UpdateApplicationStatus>) => {
    update({ id: application.id, data: { status, notes: notes.trim() || undefined, ...extra } });
  };

  const ACTIONS: { label: string; status: ApplicationStatus; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { label: 'Under Review',  status: 'under_review',  color: '#4338ca', icon: 'eye-outline' },
    { label: 'Shortlist',     status: 'shortlisted',   color: '#059669', icon: 'checkmark-circle-outline' },
    { label: 'Offer',         status: 'offered',       color: '#16a34a', icon: 'gift-outline' },
  ];

  const canSchedule = ['shortlisted', 'under_review', 'interview_scheduled', 'interviewed'].includes(application.status);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f1f5f9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ backgroundColor: ADMIN_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', flex: 1 }}>Application Review</Text>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: cfg.color }}>{ini}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{name}</Text>
            {application.applicant?.email && (
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 }}>{application.applicant.email}</Text>
            )}
            {application.jobPosting?.title && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#a5b4fc', fontSize: 11, fontWeight: '700' }}>{application.jobPosting.title}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>

        {/* Meta chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="briefcase-outline" size={13} color="#64748b" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{application.yearsOfExperience} yrs experience</Text>
          </View>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={13} color="#64748b" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Applied {fmtDate(application.submittedAt)}</Text>
          </View>
          {application.expectedSalary && (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="cash-outline" size={13} color="#64748b" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Expects ₦{application.expectedSalary.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Cover letter */}
        {application.coverLetter && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Cover Letter</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{application.coverLetter}</Text>
          </View>
        )}

        {/* Education / Portfolio */}
        {(application.education || application.portfolioUrl || application.certifications) && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>Background</Text>
            {application.education && (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Ionicons name="school-outline" size={16} color="#6366f1" style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 }}>{application.education}</Text>
              </View>
            )}
            {application.certifications && (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Ionicons name="ribbon-outline" size={16} color="#059669" style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 }}>{application.certifications}</Text>
              </View>
            )}
            {application.portfolioUrl && (
              <Pressable onPress={() => Linking.openURL(application.portfolioUrl!)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#f5f3ff', borderRadius: 10, padding: 10 }}>
                  <Ionicons name="link-outline" size={16} color="#7c3aed" />
                  <Text style={{ flex: 1, fontSize: 13, color: '#7c3aed', fontWeight: '600' }} numberOfLines={1}>{application.portfolioUrl}</Text>
                  <Ionicons name="open-outline" size={13} color="#7c3aed" />
                </View>
              </Pressable>
            )}
          </View>
        )}

        {/* Resume */}
        {application.resume?.url && (
          <Pressable onPress={() => Linking.openURL(application.resume!.url)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ionicons name="document-text-outline" size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{application.resume.name ?? 'Resume'}</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Tap to open</Text>
              </View>
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="eye-outline" size={16} color="#fff" />
              </View>
            </View>
          </Pressable>
        )}

        {/* Admin notes */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>Internal Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add internal notes about this applicant…"
            placeholderTextColor="#cbd5e1"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[inputStyle, { minHeight: 80 }]}
          />
        </View>

        {/* Action buttons */}
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#6366f1' }} />
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#0f172a' }}>Update Status</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ACTIONS.map(a => {
              const isActive = application.status === a.status;
              return (
                <Pressable
                  key={a.status}
                  onPress={() => doUpdate(a.status)}
                  disabled={isPending || isActive}
                  style={{ flex: 1, opacity: isActive ? 0.4 : 1 }}
                >
                  <View style={{ backgroundColor: a.color, borderRadius: 14, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
                    <Ionicons name={a.icon} size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{a.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Reject toggle */}
          {!showReject ? (
            <Pressable onPress={() => setShowReject(true)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={{ borderRadius: 14, borderWidth: 1.5, borderColor: '#fca5a5', paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="close-circle-outline" size={15} color="#dc2626" />
                <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '800' }}>Reject Application</Text>
              </View>
            </Pressable>
          ) : (
            <View style={{ gap: 10, padding: 14, backgroundColor: '#fef2f2', borderRadius: 16, borderWidth: 1, borderColor: '#fecaca' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#b91c1c' }}>Rejection Details</Text>
              <TextInput value={rejReason} onChangeText={setRejReason} placeholder="Reason (e.g. Underqualified)" placeholderTextColor="#fca5a5" style={inputStyle} />
              <TextInput value={rejFeedback} onChangeText={setRejFeedback} placeholder="Feedback for candidate (optional)" placeholderTextColor="#fca5a5" multiline numberOfLines={3} textAlignVertical="top" style={[inputStyle, { minHeight: 72 }]} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setShowReject(false)} style={{ flex: 1 }}>
                  <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 11, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>Cancel</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => doUpdate('rejected', { rejectionReason: rejReason.trim() || undefined, rejectionFeedback: rejFeedback.trim() || undefined })} disabled={isPending} style={{ flex: 1 }}>
                  <View style={{ borderRadius: 14, backgroundColor: '#dc2626', paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    {isPending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="close-circle" size={15} color="#fff" />}
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Confirm Reject</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {/* Schedule interview */}
          {canSchedule && (
            <Pressable onPress={onScheduleInterview} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <View style={{ borderRadius: 14, backgroundColor: '#0a1628', paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="calendar-outline" size={17} color="#a5b4fc" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Schedule Interview</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Existing interviews */}
        {(application.interviews ?? []).length > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Interviews</Text>
            <View style={{ gap: 8 }}>
              {(application.interviews ?? []).map((iv) => {
                const ivcfg = interviewStatusCfg(iv.status);
                return (
                  <View key={iv.id} style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name={interviewTypeIcon(iv.interviewType)} size={16} color="#6366f1" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{iv.title}</Text>
                      <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{fmtDateTime(iv.scheduledDate)}</Text>
                    </View>
                    <View style={{ backgroundColor: ivcfg.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: ivcfg.color }}>{ivcfg.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Schedule interview form ───────────────────────────────────────────────────

const IV_TYPES: InterviewType[] = ['in_person', 'phone', 'video', 'technical', 'panel', 'final'];

function ScheduleInterviewForm({ application, schoolId, onBack, onDone }: {
  application: JobApplication;
  schoolId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [ivType, setIvType] = useState<InterviewType>('in_person');
  const [title, setTitle] = useState('First Round Interview');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const { mutate: schedule, isPending } = useScheduleInterview(schoolId, () => {
    toast.success('Interview scheduled');
    onDone();
  });

  const handleSubmit = () => {
    if (!title.trim()) { toast.error('Enter interview title'); return; }
    if (!dateStr.trim() || !timeStr.trim()) { toast.error('Enter date and time'); return; }
    const iso = new Date(`${dateStr.trim()}T${timeStr.trim()}:00`).toISOString();
    if (isNaN(new Date(iso).getTime())) { toast.error('Invalid date/time format'); return; }
    schedule({
      applicationId: application.id,
      interviewType: ivType,
      title: title.trim(),
      scheduledDate: iso,
      durationMinutes: Number(duration) || 60,
      location: location.trim() || undefined,
      meetingLink: meetingLink.trim() || undefined,
    });
  };

  const name = application.applicant
    ? `${application.applicant.firstName} ${application.applicant.lastName}`
    : 'Applicant';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f1f5f9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: ADMIN_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>Schedule Interview</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{name}</Text>
          </View>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>

        <View>
          <FieldLabel label="Interview Type" required />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {IV_TYPES.map(t => (
              <Chip key={t} label={IV_TYPE_LABELS[t] ?? t} active={ivType === t} color="#6366f1" onPress={() => setIvType(t)} />
            ))}
          </ScrollView>
        </View>

        <View>
          <FieldLabel label="Title" required />
          <TextInput value={title} onChangeText={setTitle} style={inputStyle} placeholderTextColor="#cbd5e1" placeholder="e.g. First Round Interview" />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Date" required />
            <TextInput value={dateStr} onChangeText={setDateStr} placeholder="YYYY-MM-DD" placeholderTextColor="#cbd5e1" style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Time (24h)" required />
            <TextInput value={timeStr} onChangeText={setTimeStr} placeholder="14:30" placeholderTextColor="#cbd5e1" style={inputStyle} />
          </View>
        </View>

        <View>
          <FieldLabel label="Duration (minutes)" />
          <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" style={inputStyle} placeholderTextColor="#cbd5e1" placeholder="60" />
        </View>

        {(ivType === 'in_person' || ivType === 'panel' || ivType === 'technical') && (
          <View>
            <FieldLabel label="Location" />
            <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Room 204, Main Block" placeholderTextColor="#cbd5e1" style={inputStyle} />
          </View>
        )}

        {(ivType === 'video' || ivType === 'phone') && (
          <View>
            <FieldLabel label="Meeting Link" />
            <TextInput value={meetingLink} onChangeText={setMeetingLink} placeholder="https://meet.google.com/…" placeholderTextColor="#cbd5e1" autoCapitalize="none" keyboardType="url" style={inputStyle} />
          </View>
        )}

        <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, marginTop: 4 })}>
          <View style={{ backgroundColor: isPending ? '#818cf8' : '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {isPending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="calendar-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{isPending ? 'Scheduling…' : 'Schedule Interview'}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Create / edit job form ────────────────────────────────────────────────────

const ROLES: SchoolJobRole[] = ['teacher','assistant_teacher','head_teacher','principal','vice_principal','counselor','librarian','lab_technician','admin_staff','accountant','security','janitor','driver','nurse','it_support','other'];
const EMP_TYPES: EmploymentType[] = ['full_time','part_time','contract','temporary','internship'];
const EXP_LEVELS: ExperienceLevel[] = ['entry','intermediate','senior','expert'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function DatePickerModal({ visible, value, onSelect, onClose }: {
  visible: boolean;
  value: string | undefined;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setYear(d.getFullYear()); setMonth(d.getMonth()); setSelected(d.getDate());
      }
    }
  }, [value, visible]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleSelect = (day: number) => {
    setSelected(day);
    const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelect(s);
    onClose();
  };

  const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation?.()}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
              <Pressable onPress={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={18} color="#374151" />
              </Pressable>
              <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable onPress={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-forward" size={18} color="#374151" />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 }}>
              {DAY_NAMES.map(d => (
                <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9ca3af' }}>{d}</Text>
              ))}
            </View>
            <View style={{ paddingHorizontal: 12 }}>
              {Array.from({ length: cells.length / 7 }, (_, row) => (
                <View key={row} style={{ flexDirection: 'row', marginBottom: 4 }}>
                  {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                    const cellStr = day ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
                    const isToday = cellStr === todayStr;
                    const isSelected = day === selected;
                    return (
                      <Pressable
                        key={col}
                        onPress={() => day && handleSelect(day)}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 38 }}
                      >
                        {day ? (
                          <View style={{
                            width: 34, height: 34, borderRadius: 17,
                            backgroundColor: isSelected ? '#4C3FC4' : isToday ? '#F0EEFF' : 'transparent',
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: isToday && !isSelected ? 1.5 : 0,
                            borderColor: '#4C3FC4',
                          }}>
                            <Text style={{ fontSize: 14, fontWeight: isSelected || isToday ? '800' : '500', color: isSelected ? '#fff' : isToday ? '#4C3FC4' : '#1e293b' }}>
                              {day}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CreateJobForm({ schoolId, editing, onBack, onDone }: {
  schoolId: string;
  editing?: JobPosting;
  onBack: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [role, setRole] = useState<SchoolJobRole>(editing?.role ?? 'teacher');
  const [empType, setEmpType] = useState<EmploymentType>(editing?.employmentType ?? 'full_time');
  const [expLevel, setExpLevel] = useState<ExperienceLevel>(editing?.experienceLevel ?? 'intermediate');
  const [desc, setDesc] = useState(editing?.description ?? '');
  const [responsibilities, setResponsibilities] = useState(editing?.responsibilities ?? '');
  const [requirements, setRequirements] = useState(editing?.requirements ?? '');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [department, setDepartment] = useState(editing?.department ?? '');
  const [salaryMin, setSalaryMin] = useState(editing?.salaryMin?.toString() ?? '');
  const [salaryMax, setSalaryMax] = useState(editing?.salaryMax?.toString() ?? '');
  const [deadline, setDeadline] = useState(editing?.applicationDeadline?.slice(0, 10) ?? '');
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [positions, setPositions] = useState(editing?.positionsAvailable?.toString() ?? '');
  const [publishNow, setPublishNow] = useState(editing?.status === 'active');

  const { mutate: create, isPending: creating } = useCreatePosting(schoolId, onDone);
  const { mutate: update, isPending: updating } = useUpdatePosting(schoolId, onDone);
  const isPending = creating || updating;

  const handleSubmit = () => {
    if (!title.trim()) { toast.error('Enter job title'); return; }
    if (!desc.trim()) { toast.error('Enter job description'); return; }
    if (!responsibilities.trim()) { toast.error('Enter responsibilities'); return; }
    if (!requirements.trim()) { toast.error('Enter requirements'); return; }
    if (!location.trim()) { toast.error('Enter location'); return; }

    const payload: CreateJobPosting = {
      title: title.trim(),
      role,
      employmentType: empType,
      experienceLevel: expLevel,
      description: desc.trim(),
      responsibilities: responsibilities.trim(),
      requirements: requirements.trim(),
      location: location.trim(),
      department: department.trim() || undefined,
      salaryMin: salaryMin.trim() ? Number(salaryMin) : undefined,
      salaryMax: salaryMax.trim() ? Number(salaryMax) : undefined,
      applicationDeadline: deadline.trim() ? new Date(`${deadline.trim()}T23:59:59Z`).toISOString() : undefined,
      positionsAvailable: positions.trim() ? Number(positions) : undefined,
      status: publishNow ? 'active' : 'draft',
    };

    if (editing) {
      update({ id: editing.id, data: payload });
    } else {
      create(payload);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f1f5f9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: ADMIN_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>{editing ? 'Edit Job Posting' : 'Post a Job'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>Fill in the details below</Text>
          </View>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>

        <View>
          <FieldLabel label="Job Title" required />
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Mathematics Teacher" placeholderTextColor="#cbd5e1" style={inputStyle} />
        </View>

        <View>
          <FieldLabel label="Role" required />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ROLES.map(r => (
              <Chip key={r} label={ROLE_LABELS[r] ?? r} active={role === r} color="#6366f1" onPress={() => setRole(r)} />
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Employment Type" required />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {EMP_TYPES.map(e => (
                <Chip key={e} label={EMP_LABELS[e] ?? e} active={empType === e} color="#0284c7" onPress={() => setEmpType(e)} />
              ))}
            </ScrollView>
          </View>
        </View>

        <View>
          <FieldLabel label="Experience Level" required />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {EXP_LEVELS.map(l => (
              <Chip key={l} label={EXP_LABELS[l] ?? l} active={expLevel === l} color="#7c3aed" onPress={() => setExpLevel(l)} />
            ))}
          </View>
        </View>

        <View>
          <FieldLabel label="Location" required />
          <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Lagos, Nigeria" placeholderTextColor="#cbd5e1" style={inputStyle} />
        </View>

        <View>
          <FieldLabel label="Department" />
          <TextInput value={department} onChangeText={setDepartment} placeholder="e.g. Science Department" placeholderTextColor="#cbd5e1" style={inputStyle} />
        </View>

        <View>
          <FieldLabel label="Description" required />
          <TextInput value={desc} onChangeText={setDesc} placeholder="Describe the role and what the school is looking for…" placeholderTextColor="#cbd5e1" multiline numberOfLines={5} textAlignVertical="top" style={[inputStyle, { minHeight: 110 }]} />
        </View>

        <View>
          <FieldLabel label="Responsibilities" required />
          <TextInput value={responsibilities} onChangeText={setResponsibilities} placeholder="List the key responsibilities…" placeholderTextColor="#cbd5e1" multiline numberOfLines={4} textAlignVertical="top" style={[inputStyle, { minHeight: 90 }]} />
        </View>

        <View>
          <FieldLabel label="Requirements" required />
          <TextInput value={requirements} onChangeText={setRequirements} placeholder="Qualifications, skills, and experience required…" placeholderTextColor="#cbd5e1" multiline numberOfLines={4} textAlignVertical="top" style={[inputStyle, { minHeight: 90 }]} />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Min Salary" />
            <TextInput value={salaryMin} onChangeText={setSalaryMin} placeholder="150000" placeholderTextColor="#cbd5e1" keyboardType="numeric" style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Max Salary" />
            <TextInput value={salaryMax} onChangeText={setSalaryMax} placeholder="300000" placeholderTextColor="#cbd5e1" keyboardType="numeric" style={inputStyle} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Deadline" />
            <Pressable onPress={() => setShowDeadlinePicker(true)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={{ fontSize: 14, color: deadline ? '#1e293b' : '#cbd5e1', flex: 1 }}>
                  {deadline || 'Select date…'}
                </Text>
                {deadline ? (
                  <Pressable onPress={() => setDeadline('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                  </Pressable>
                ) : (
                  <Ionicons name="calendar-outline" size={16} color={deadline ? '#4C3FC4' : '#94a3b8'} />
                )}
              </View>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Positions" />
            <TextInput value={positions} onChangeText={setPositions} placeholder="1" placeholderTextColor="#cbd5e1" keyboardType="numeric" style={inputStyle} />
          </View>
        </View>

        <DatePickerModal
          visible={showDeadlinePicker}
          value={deadline || undefined}
          onSelect={setDeadline}
          onClose={() => setShowDeadlinePicker(false)}
        />

        {/* Publish toggle */}
        <Pressable onPress={() => setPublishNow(!publishNow)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{ backgroundColor: publishNow ? '#dcfce7' : '#f8fafc', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: publishNow ? '#86efac' : '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: publishNow ? '#16a34a' : '#94a3b8', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ionicons name={publishNow ? 'radio-button-on' : 'radio-button-off'} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: publishNow ? '#15803d' : '#334155' }}>
                {publishNow ? 'Publish Now (Active)' : 'Save as Draft'}
              </Text>
              <Text style={{ fontSize: 12, color: publishNow ? '#16a34a' : '#94a3b8', marginTop: 2 }}>
                {publishNow ? 'Applicants can see and apply immediately' : 'Only visible to admins until published'}
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, marginTop: 4 })}>
          <View style={{ backgroundColor: isPending ? '#818cf8' : '#6366f1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {isPending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{isPending ? 'Saving…' : editing ? 'Save Changes' : 'Post Job'}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Admin main screen ────────────────────────────────────────────────────────

type AdminTab = 'postings' | 'applications' | 'interviews';
type AdminScreen =
  | { kind: 'list' }
  | { kind: 'create_job' }
  | { kind: 'edit_job'; posting: JobPosting }
  | { kind: 'app_detail'; application: JobApplication }
  | { kind: 'schedule'; application: JobApplication };

const POSTING_STATUS_FILTERS: { label: string; value: JobStatus | 'all'; color: string }[] = [
  { label: 'All',    value: 'all',    color: '#6366f1' },
  { label: 'Active', value: 'active', color: '#16a34a' },
  { label: 'Draft',  value: 'draft',  color: '#64748b' },
  { label: 'Paused', value: 'paused', color: '#d97706' },
  { label: 'Closed', value: 'closed', color: '#dc2626' },
  { label: 'Filled', value: 'filled', color: '#7c3aed' },
];

const APP_STATUS_FILTERS: { label: string; value: ApplicationStatus | 'all'; color: string }[] = [
  { label: 'All',        value: 'all',                color: '#6366f1' },
  { label: 'Submitted',  value: 'submitted',           color: '#2563eb' },
  { label: 'Review',     value: 'under_review',        color: '#4338ca' },
  { label: 'Shortlist',  value: 'shortlisted',         color: '#059669' },
  { label: 'Interview',  value: 'interview_scheduled', color: '#d97706' },
  { label: 'Offered',    value: 'offered',             color: '#16a34a' },
  { label: 'Rejected',   value: 'rejected',            color: '#dc2626' },
];

function AdminJobsScreen({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<AdminScreen>({ kind: 'list' });
  const [adminTab, setAdminTab] = useState<AdminTab>('postings');
  const [postingFilter, setPostingFilter] = useState<JobStatus | 'all'>('all');
  const [appFilter, setAppFilter] = useState<ApplicationStatus | 'all'>('all');

  const { data: postings = [], isLoading: loadingPostings, refetch: refetchPostings } = useSchoolPostings(
    schoolId, postingFilter === 'all' ? undefined : postingFilter,
  );
  const { data: allApplications = [] } = useSchoolApplications(schoolId);
  const { data: applications = [], isLoading: loadingApps, refetch: refetchApps } = useSchoolApplications(
    schoolId, appFilter === 'all' ? undefined : appFilter,
  );
  const { data: interviews = [], isLoading: loadingInterviews } = useSchoolInterviews(schoolId);

  const { mutate: updatePosting } = useUpdatePosting(schoolId, () => { toast.success('Job updated'); void refetchPostings(); });
  const { mutate: deletePosting } = useDeletePosting(schoolId, () => { toast.success('Job deleted'); void refetchPostings(); });

  const handleDeletePosting = (id: string, title: string) => {
    Alert.alert('Delete Job', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePosting(id) },
    ]);
  };

  // Nested screens
  if (screen.kind === 'create_job') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <CreateJobForm schoolId={schoolId} onBack={() => setScreen({ kind: 'list' })} onDone={() => { void refetchPostings(); setScreen({ kind: 'list' }); }} />
      </SafeAreaView>
    );
  }
  if (screen.kind === 'edit_job') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <CreateJobForm schoolId={schoolId} editing={screen.posting} onBack={() => setScreen({ kind: 'list' })} onDone={() => { void refetchPostings(); setScreen({ kind: 'list' }); }} />
      </SafeAreaView>
    );
  }
  if (screen.kind === 'app_detail') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <AdminApplicationDetailView
          application={screen.application}
          schoolId={schoolId}
          onBack={() => setScreen({ kind: 'list' })}
          onRefresh={() => void refetchApps()}
          onScheduleInterview={() => setScreen({ kind: 'schedule', application: screen.application })}
        />
      </SafeAreaView>
    );
  }
  if (screen.kind === 'schedule') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScheduleInterviewForm
          application={screen.application}
          schoolId={schoolId}
          onBack={() => setScreen({ kind: 'app_detail', application: screen.application })}
          onDone={() => { void refetchApps(); setScreen({ kind: 'list' }); setAdminTab('interviews'); }}
        />
      </SafeAreaView>
    );
  }

  const appCountByPosting = (postingId: string) => {
    const fromLoaded = allApplications.filter(a => a.jobPosting?.id === postingId).length;
    return fromLoaded || (postings.find(p => p.id === postingId)?.applicationsCount ?? 0);
  };

  const activePostings = postings.filter(p => p.status === 'active').length;
  const upcomingIvs = interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: ADMIN_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Manage Jobs</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{schoolName}</Text>
          </View>
          <Pressable onPress={() => setScreen({ kind: 'create_job' })} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Post Job</Text>
            </View>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'Total Jobs',    value: postings.length,  color: '#a5b4fc' },
            { label: 'Active',        value: activePostings,   color: '#4ade80' },
            { label: 'Applicants',    value: allApplications.length, color: '#fbbf24' },
            { label: 'Interviews',    value: upcomingIvs,      color: '#67e8f9' },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 10, alignItems: 'center' }}>
              <Text style={{ color: s.color, fontSize: 18, fontWeight: '900' }}>{s.value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ClassroomDetailTabs
        tabs={[
          { key: 'postings',     label: `Jobs${postings.length > 0 ? ` (${postings.length})` : ''}` },
          { key: 'applications', label: `Applicants${applications.length > 0 ? ` (${applications.length})` : ''}` },
          { key: 'interviews',   label: `Interviews${upcomingIvs > 0 ? ` (${upcomingIvs})` : ''}` },
        ] as { key: AdminTab; label: string }[]}
        activeTab={adminTab}
        onTabChange={setAdminTab}
        accentColor="#6366f1"
      />

      {/* Status filter bar */}
      {adminTab === 'postings' && (
        <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
            {POSTING_STATUS_FILTERS.map(f => (
              <Chip key={f.value} label={f.label} active={postingFilter === f.value} color={f.color} onPress={() => setPostingFilter(f.value)} />
            ))}
          </ScrollView>
        </View>
      )}
      {adminTab === 'applications' && (
        <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
            {APP_STATUS_FILTERS.map(f => (
              <Chip key={f.value} label={f.label} active={appFilter === f.value} color={f.color} onPress={() => setAppFilter(f.value)} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {adminTab === 'postings' && (
        loadingPostings ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#6366f1" size="large" /></View>
        ) : postings.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="briefcase-outline" size={34} color="#6366f1" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', textAlign: 'center' }}>No job postings yet</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 }}>
              {postingFilter !== 'all' ? `No ${postingFilter} jobs.` : 'Post your first job to start receiving applications.'}
            </Text>
            {postingFilter === 'all' && (
              <Pressable onPress={() => setScreen({ kind: 'create_job' })} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <View style={{ backgroundColor: '#6366f1', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Post a Job</Text>
                </View>
              </Pressable>
            )}
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {postings.map(p => (
              <AdminPostingCard
                key={p.id}
                item={p}
                appCount={appCountByPosting(p.id)}
                onPress={() => { setAdminTab('applications'); }}
                onStatusChange={(status) => updatePosting({ id: p.id, data: { status } as Partial<CreateJobPosting> })}
                onDelete={() => handleDeletePosting(p.id, p.title)}
              />
            ))}
          </ScrollView>
        )
      )}

      {adminTab === 'applications' && (
        loadingApps ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#6366f1" size="large" /></View>
        ) : applications.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="people-outline" size={34} color="#6366f1" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', textAlign: 'center' }}>No applications</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 }}>
              {appFilter !== 'all' ? `No ${appFilter.replace('_', ' ')} applications.` : 'Applications will appear here once candidates apply.'}
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {(() => {
              const grouped = applications.reduce<Record<string, typeof applications>>((acc, a) => {
                const key = a.jobPosting?.role ?? a.jobPosting?.title ?? 'General';
                (acc[key] = acc[key] ?? []).push(a);
                return acc;
              }, {});
              return Object.entries(grouped).map(([roleKey, items]) => (
                <View key={roleKey} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a', textTransform: 'capitalize' }}>
                      {ROLE_LABELS[roleKey] ?? roleKey.replace(/_/g, ' ')}
                    </Text>
                    <View style={{ backgroundColor: '#eef2ff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366f1' }}>{items.length}</Text>
                    </View>
                  </View>
                  <View style={{ gap: 10 }}>
                    {items.map(a => (
                      <AdminApplicationCard key={a.id} item={a} onPress={() => setScreen({ kind: 'app_detail', application: a })} />
                    ))}
                  </View>
                </View>
              ));
            })()}
          </ScrollView>
        )
      )}

      {adminTab === 'interviews' && (
        loadingInterviews ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#6366f1" size="large" /></View>
        ) : interviews.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar-outline" size={34} color="#6366f1" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', textAlign: 'center' }}>No interviews scheduled</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 }}>
              Schedule interviews from the Applications tab after shortlisting candidates.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {interviews.map(iv => <AdminInterviewCard key={iv.id} item={iv} />)}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF VIEW — "My Jobs"
// ─────────────────────────────────────────────────────────────────────────────

function StaffJobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const now = new Date();
  const deadlineDate = job.deadline ? new Date(job.deadline) : null;
  const deadlinePassed = !!deadlineDate && deadlineDate < now;
  const statusClosed = !!job.status && !['open', 'active'].includes(job.status);
  const isOpen = !statusClosed && !deadlinePassed;

  // Days remaining until deadline
  const daysLeft = deadlineDate && !deadlinePassed
    ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const badge = statusClosed
    ? { label: job.status === 'filled' ? 'Filled' : 'Closed', bg: '#fee2e2', text: '#dc2626' }
    : deadlinePassed
      ? { label: 'Deadline passed', bg: '#fef3c7', text: '#b45309' }
      : { label: 'Open', bg: '#dcfce7', text: '#15803d' };

  const barColor = statusClosed ? '#ef4444' : deadlinePassed ? '#f59e0b' : '#0ea5e9';
  const iconBg   = statusClosed ? '#fee2e2' : deadlinePassed ? '#fef3c7' : '#e0f2fe';
  const iconColor = statusClosed ? '#ef4444' : deadlinePassed ? '#d97706' : '#0284c7';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={{
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: isOpen ? '#f1f5f9' : deadlinePassed ? '#fef3c7' : '#fecaca',
        shadowColor: '#0f172a', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
      }}>
        <View style={{ height: 3, backgroundColor: barColor }} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ionicons name="briefcase-outline" size={20} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>{job.title}</Text>
              <Text style={{ fontSize: 13, color: '#0ea5e9', fontWeight: '600', marginTop: 2 }} numberOfLines={1}>{job.school?.name}</Text>
            </View>
            <View style={{ backgroundColor: badge.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: badge.text }}>{badge.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {job.employmentType && (
              <View style={{ backgroundColor: '#e0f2fe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284c7' }}>{job.employmentType.replace(/_/g, ' ').toUpperCase()}</Text>
              </View>
            )}
            {job.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Ionicons name="location-outline" size={10} color="#64748b" />
                <Text style={{ fontSize: 11, color: '#64748b' }}>{job.location}</Text>
              </View>
            )}
            {job.salary && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Ionicons name="cash-outline" size={10} color="#16a34a" />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#16a34a' }}>{job.salary}</Text>
              </View>
            )}
            {/* Deadline indicator */}
            {deadlineDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: deadlinePassed ? '#fef3c7' : daysLeft !== null && daysLeft <= 7 ? '#fff7ed' : '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Ionicons name="time-outline" size={10} color={deadlinePassed ? '#b45309' : daysLeft !== null && daysLeft <= 7 ? '#ea580c' : '#64748b'} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: deadlinePassed ? '#b45309' : daysLeft !== null && daysLeft <= 7 ? '#ea580c' : '#64748b' }}>
                  {deadlinePassed
                    ? `Closed ${fmtDate(job.deadline!)}`
                    : daysLeft === 0 ? 'Closes today'
                    : daysLeft === 1 ? 'Closes tomorrow'
                    : daysLeft !== null && daysLeft <= 7 ? `Closes in ${daysLeft} days`
                    : `Closes ${fmtDate(job.deadline!)}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function StaffApplicationCard({ item, onWithdraw }: { item: MyApplication; onWithdraw: () => void }) {
  const cfg = appStatusCfg(item.status);
  const canWithdraw = ['submitted', 'under_review', 'shortlisted'].includes(item.status);

  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: '#f1f5f9',
      shadowColor: '#0f172a', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
    }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: cfg.color }} />
      <View style={{ padding: 16, paddingLeft: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>{item.jobPosting?.title ?? 'General Application'}</Text>
            <Text style={{ fontSize: 12, color: '#0ea5e9', fontWeight: '600', marginTop: 2 }}>{item.school?.name}</Text>
          </View>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, flexShrink: 0 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>{item.yearsOfExperience} yr exp</Text>
          </View>
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{fmtDate(item.submittedAt)}</Text>
          </View>
        </View>
        {item.status === 'offered' && (
          <View style={{ marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#16a34a' }}>
            <Text style={{ fontSize: 12, color: '#166534', fontWeight: '700' }}>You received a job offer! Check your email for details.</Text>
          </View>
        )}
        {item.status === 'rejected' && item.rejectionFeedback && (
          <View style={{ marginTop: 10, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#dc2626' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#b91c1c', marginBottom: 4 }}>Feedback</Text>
            <Text style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 18 }}>{item.rejectionFeedback}</Text>
          </View>
        )}
        {canWithdraw && (
          <Pressable onPress={onWithdraw} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ marginTop: 12, borderRadius: 10, backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>Withdraw Application</Text>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function StaffInterviewCard({ item, onConfirm, isConfirming }: { item: MyInterview; onConfirm: () => void; isConfirming: boolean }) {
  const cfg = interviewStatusCfg(item.status);
  const typeIcon = interviewTypeIcon(item.interviewType);
  const date = new Date(item.scheduledDate);
  const needsConfirm = item.status === 'scheduled' && !item.candidateConfirmed;

  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: '#f1f5f9',
      shadowColor: '#0f172a', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
    }}>
      <View style={{ backgroundColor: STAFF_BG, padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={typeIcon} size={15} color="#7dd3fc" />
            </View>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', flex: 1 }} numberOfLines={1}>{item.title}</Text>
          </View>
          <View style={{ backgroundColor: cfg.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>
      </View>
      <View style={{ padding: 14, gap: 8 }}>
        {item.application && (
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }} numberOfLines={1}>
            {item.application.jobPosting?.title ?? 'Application'} <Text style={{ color: '#0ea5e9' }}>@ {item.application.school?.name}</Text>
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e0f2fe', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="calendar-outline" size={12} color="#0284c7" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
              {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e0f2fe', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="time-outline" size={12} color="#0284c7" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
              {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {item.durationMinutes} min
            </Text>
          </View>
        </View>
        {item.location && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={13} color="#64748b" />
            <Text style={{ fontSize: 12, color: '#64748b' }} numberOfLines={1}>{item.location}</Text>
          </View>
        )}
        {item.meetingLink && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff', borderRadius: 10, padding: 10 }}>
            <Ionicons name="link-outline" size={13} color="#0284c7" />
            <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '600', flex: 1 }} numberOfLines={1}>{item.meetingLink}</Text>
          </View>
        )}
        {needsConfirm && (
          <Pressable onPress={onConfirm} disabled={isConfirming} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ borderRadius: 12, backgroundColor: '#0ea5e9', paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {isConfirming ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{isConfirming ? 'Confirming…' : 'Confirm Attendance'}</Text>
            </View>
          </Pressable>
        )}
        {item.candidateConfirmed && item.status !== 'completed' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10 }}>
            <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
            <Text style={{ fontSize: 12, color: '#166534', fontWeight: '700' }}>Attendance confirmed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Staff job detail + apply form (same as before, re-styled for staff)

function StaffJobDetailView({ job, onBack, onApply }: { job: Job; onBack: () => void; onApply: () => void }) {
  const open = !job.status || job.status === 'open' || job.status === 'active';
  const expired = !!job.deadline && new Date(job.deadline) < new Date();

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: STAFF_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={2}>{job.title}</Text>
            <Text style={{ color: '#7dd3fc', fontSize: 12, marginTop: 2 }}>{job.school?.name}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {job.employmentType && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#bae6fd' }}>{job.employmentType.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          )}
          {job.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Ionicons name="location-outline" size={11} color="#bae6fd" />
              <Text style={{ fontSize: 11, color: '#bae6fd' }}>{job.location}</Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}>
        {job.description && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>About the Role</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{job.description}</Text>
          </View>
        )}
        {job.requirements && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Requirements</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{job.requirements}</Text>
          </View>
        )}
        {job.responsibilities && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Responsibilities</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{job.responsibilities}</Text>
          </View>
        )}
        {job.deadline && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1, backgroundColor: expired ? '#fef2f2' : '#fff7ed', borderColor: expired ? '#fca5a5' : '#fed7aa' }}>
            <Ionicons name="alert-circle-outline" size={16} color={expired ? '#dc2626' : '#d97706'} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: expired ? '#991b1b' : '#92400e', flex: 1 }}>
              {expired ? `Closed on ${fmtDate(job.deadline)}` : `Closes ${fmtDate(job.deadline, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', padding: 16 }}>
        {open ? (
          <Pressable onPress={onApply} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ backgroundColor: '#0ea5e9', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Apply for this Position</Text>
            </View>
          </Pressable>
        ) : (
          <View style={{ backgroundColor: '#f3f4f6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
            <Text style={{ color: '#9ca3af', fontSize: 16, fontWeight: '900' }}>Applications Closed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function StaffApplyFormView({ job, onBack, onDone }: { job: Job; onBack: () => void; onDone: () => void }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [years, setYears] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [education, setEducation] = useState('');
  const [resume, setResume] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  const { mutate: apply, isPending } = useApplyForJob(() => {
    toast.success('Application submitted! Track it in the Applied tab.');
    onDone();
  });

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      setResume({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf' });
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
      <View style={{ backgroundColor: STAFF_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Apply Now</Text>
            <Text style={{ color: '#7dd3fc', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{job.title} · {job.school?.name}</Text>
          </View>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <View>
          <FieldLabel label="Cover Letter" required />
          <TextInput value={coverLetter} onChangeText={setCoverLetter} placeholder="Tell them why you're the right fit…" placeholderTextColor="#9ca3af" multiline numberOfLines={6} textAlignVertical="top" style={[inputStyle, { minHeight: 130 }]} />
        </View>
        <View>
          <FieldLabel label="Years of Experience" required />
          <TextInput value={years} onChangeText={setYears} placeholder="e.g. 3" placeholderTextColor="#9ca3af" keyboardType="numeric" style={inputStyle} />
        </View>
        <View>
          <FieldLabel label="Resume" required />
          <Pressable onPress={pickResume} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ backgroundColor: resume ? '#f0fdf4' : '#fff', borderWidth: 2, borderColor: resume ? '#16a34a' : '#e2e8f0', borderStyle: resume ? 'solid' : 'dashed', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8 }}>
              <Ionicons name={resume ? 'document-text' : 'cloud-upload-outline'} size={26} color={resume ? '#16a34a' : '#94a3b8'} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: resume ? '#15803d' : '#64748b', textAlign: 'center' }}>
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
        <View>
          <FieldLabel label="Portfolio URL" />
          <TextInput value={portfolio} onChangeText={setPortfolio} placeholder="https://yourportfolio.com" placeholderTextColor="#9ca3af" autoCapitalize="none" keyboardType="url" style={inputStyle} />
        </View>
        <View>
          <FieldLabel label="Education" />
          <TextInput value={education} onChangeText={setEducation} placeholder="e.g. B.Ed Mathematics, University of Lagos" placeholderTextColor="#9ca3af" style={inputStyle} />
        </View>
        <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{ backgroundColor: isPending ? '#38bdf8' : '#0ea5e9', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            {isPending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{isPending ? 'Submitting…' : 'Submit Application'}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type StaffScreen = { kind: 'list' } | { kind: 'detail'; job: Job } | { kind: 'apply'; job: Job };
type StaffTab = 'browse' | 'applied' | 'interviews';

function StaffJobsScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<StaffScreen>({ kind: 'list' });
  const [tab, setTab] = useState<StaffTab>('browse');
  const [search, setSearch] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data: jobs = [], isLoading: loadingJobs } = useBrowseJobs(search.trim() ? { search: search.trim() } : undefined);
  const { data: applications = [], isLoading: loadingApps } = useMyApplications();
  const { data: interviews = [], isLoading: loadingIvs } = useMyInterviews();
  const { mutate: withdraw } = useWithdrawApplication();
  const { mutate: confirm, isPending: confirming } = useConfirmInterview();

  const handleWithdraw = (id: string) => {
    Alert.alert('Withdraw', 'Withdraw this application?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: () => withdraw(id) },
    ]);
  };

  if (screen.kind === 'detail') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StaffJobDetailView job={screen.job} onBack={() => setScreen({ kind: 'list' })} onApply={() => setScreen({ kind: 'apply', job: screen.job })} />
      </SafeAreaView>
    );
  }
  if (screen.kind === 'apply') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StaffApplyFormView job={screen.job} onBack={() => setScreen({ kind: 'detail', job: screen.job })} onDone={() => { setScreen({ kind: 'list' }); setTab('applied'); }} />
      </SafeAreaView>
    );
  }

  const pendingIvs = interviews.filter(i => i.status === 'scheduled' && !i.candidateConfirmed).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header — title only */}
      <View style={{ backgroundColor: STAFF_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Jobs</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>Browse openings · track applications</Text>
          </View>
          <Ionicons name="briefcase-outline" size={22} color="#7dd3fc" />
        </View>
      </View>

      {/* Underline tabs */}
      <ClassroomDetailTabs
        tabs={[
          { key: 'browse',     label: 'Browse' },
          { key: 'applied',    label: applications.length > 0 ? `Applied (${applications.length})` : 'Applied' },
          { key: 'interviews', label: pendingIvs > 0 ? `Interviews (${pendingIvs})` : 'Interviews' },
        ] as { key: StaffTab; label: string }[]}
        activeTab={tab}
        onTabChange={setTab}
        accentColor="#0ea5e9"
      />

      {/* Search bar — browse tab only */}
      {tab === 'browse' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10 }}>
          <Ionicons name="search-outline" size={15} color="#94a3b8" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search jobs or schools…" placeholderTextColor="#cbd5e1" style={{ flex: 1, fontSize: 13, color: '#0f172a' }} />
          {search.length > 0 && <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={15} color="#94a3b8" /></Pressable>}
        </View>
      )}

      {tab === 'browse' && (
        loadingJobs ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#0ea5e9" size="large" /></View>
        ) : jobs.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
            <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>{search ? 'No matching jobs' : 'No openings right now'}</Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>{search ? 'Try a different search.' : 'Check back later for opportunities.'}</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {jobs.map(j => <StaffJobCard key={j.id} job={j} onPress={() => setScreen({ kind: 'detail', job: j })} />)}
          </ScrollView>
        )
      )}

      {tab === 'applied' && (
        loadingApps ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#0ea5e9" size="large" /></View>
        ) : applications.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No applications yet</Text>
            <Pressable onPress={() => setTab('browse')} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <View style={{ backgroundColor: '#0ea5e9', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Browse Jobs</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {applications.map(a => (
              <StaffApplicationCard key={a.id} item={a} onWithdraw={() => handleWithdraw(a.id)} />
            ))}
          </ScrollView>
        )
      )}

      {tab === 'interviews' && (
        loadingIvs ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#0ea5e9" size="large" /></View>
        ) : interviews.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No interviews scheduled</Text>
            <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>When a school schedules an interview, it'll appear here.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {interviews.map(iv => (
              <StaffInterviewCard
                key={iv.id}
                item={iv}
                onConfirm={() => { setConfirmingId(iv.id); confirm(iv.id, { onSettled: () => setConfirmingId(null) }); }}
                isConfirming={confirmingId === iv.id && confirming}
              />
            ))}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — role-based entry point
// ─────────────────────────────────────────────────────────────────────────────

export default function JobsScreen() {
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const membership = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const role = membership?.role ?? '';
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;
  const isStaff = role === UserRole.STAFF;

  if (isAdmin && membership?.schoolId) {
    return (
      <AdminJobsScreen
        schoolId={membership.schoolId}
        schoolName={membership.school?.name ?? 'Your School'}
      />
    );
  }

  // Staff OR users with no school (browsing for a job to join a school)
  return <StaffJobsScreen />;
}
