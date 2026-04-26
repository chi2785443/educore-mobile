import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import {
  useSchoolStudents,
  useSchoolStaff,
  useSchoolAnnouncements,
  useUpcomingEvents,
} from '@/hooks/useDashboard';
import { UserRole, UserSchoolMembership } from '@/interface/user.interface';
import { Announcement, CalendarEvent } from '@/services/dashboard.service';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function eventDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#fb923c',
  normal: '#60a5fa',
  low: '#9ca3af',
};

const EVENT_TYPE_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  exam: { bg: 'bg-red-50', text: 'text-red-600', dot: '#ef4444' },
  holiday: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: '#10b981' },
  academic: { bg: 'bg-blue-50', text: 'text-blue-600', dot: '#3b82f6' },
  sports: { bg: 'bg-orange-50', text: 'text-orange-600', dot: '#f97316' },
  cultural: { bg: 'bg-violet-50', text: 'text-violet-600', dot: '#8b5cf6' },
  meeting: { bg: 'bg-slate-50', text: 'text-slate-600', dot: '#64748b' },
  other: { bg: 'bg-gray-50', text: 'text-gray-500', dot: '#9ca3af' },
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SectionCard({
  title,
  icon,
  iconColor,
  iconBg,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100">
        <View
          className={`w-6 h-6 rounded-lg items-center justify-center ${iconBg}`}
        >
          <Ionicons name={icon} size={13} color={iconColor} />
        </View>
        <Text className="text-sm font-bold text-gray-800">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconName,
  bg,
  iconBg,
  iconColor,
  valColor,
  loading,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  bg: string;
  iconBg: string;
  iconColor: string;
  valColor: string;
  loading?: boolean;
}) {
  return (
    <View className={`flex-1 rounded-2xl p-4 ${bg}`}>
      <View
        className={`w-8 h-8 rounded-xl items-center justify-center mb-3 ${iconBg}`}
      >
        <Ionicons name={iconName} size={15} color={iconColor} />
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Text className={`text-2xl font-bold ${valColor}`}>{value}</Text>
      )}
      <Text className="text-xs text-gray-400 mt-0.5 font-medium">{label}</Text>
    </View>
  );
}

function AnnouncementRow({ ann }: { ann: Announcement }) {
  const dotColor = PRIORITY_COLORS[ann.priority] ?? PRIORITY_COLORS.normal;
  return (
    <View className="flex-row items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <View
        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <View className="flex-1 min-w-0">
        <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>
          {ann.title}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
          {ann.content}
        </Text>
      </View>
      <Text className="text-xs text-gray-400 shrink-0">
        {new Date(ann.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </Text>
    </View>
  );
}

function EventRow({ evt }: { evt: CalendarEvent }) {
  const colors =
    EVENT_TYPE_COLORS[evt.eventType] ?? EVENT_TYPE_COLORS.other;
  return (
    <View
      className={`flex-row items-center gap-3 p-3 rounded-xl mb-1.5 ${colors.bg}`}
    >
      <View
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: colors.dot }}
      />
      <View className="flex-1 min-w-0">
        <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>
          {evt.title}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {eventDateLabel(evt.startDate)}
          {evt.location ? ` · ${evt.location}` : ''}
        </Text>
      </View>
      <Text className={`text-xs font-bold capitalize ${colors.text}`}>
        {evt.eventType}
      </Text>
    </View>
  );
}

function QuickTile({
  label,
  iconName,
  bg,
  iconBg,
  iconColor,
  textColor,
}: {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  bg: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
}) {
  return (
    <View className={`flex-1 flex-row items-center gap-3 p-4 rounded-2xl ${bg}`}>
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center shrink-0 ${iconBg}`}
      >
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <Text
        className={`text-sm font-bold flex-1 ${textColor}`}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

/* ─── No-School screen ───────────────────────────────────────────────────── */

function NoSchoolScreen({ firstName }: { firstName: string }) {
  const tiles = [
    {
      label: 'Browse Jobs',
      desc: 'Find open positions at schools and apply for a role.',
      iconName: 'briefcase-outline' as const,
      iconBg: 'bg-indigo-100',
      iconColor: '#4338ca',
      bg: 'bg-indigo-50',
    },
    {
      label: 'My Enrollment',
      desc: 'Track your enrollment application status.',
      iconName: 'school-outline' as const,
      iconBg: 'bg-violet-100',
      iconColor: '#7c3aed',
      bg: 'bg-violet-50',
    },
    {
      label: 'My Enquiries',
      desc: 'View replies to your school enquiries.',
      iconName: 'chatbubble-outline' as const,
      iconBg: 'bg-teal-100',
      iconColor: '#0d9488',
      bg: 'bg-teal-50',
    },
  ];

  return (
    <View className="gap-5">
      {/* Greeting */}
      <View className="flex-row items-center gap-4">
        <View className="w-11 h-11 rounded-2xl bg-indigo-600 items-center justify-center">
          <Ionicons name="sparkles-outline" size={20} color="#ffffff" />
        </View>
        <View>
          <Text className="text-xl font-bold text-gray-900">
            {greeting()}, {firstName} 👋
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            Here's what you can do to get started.
          </Text>
        </View>
      </View>

      {/* Action tiles */}
      {tiles.map((t) => (
        <View
          key={t.label}
          className={`rounded-2xl p-5 gap-4 ${t.bg} border border-gray-100`}
        >
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center ${t.iconBg}`}
          >
            <Ionicons name={t.iconName} size={20} color={t.iconColor} />
          </View>
          <View>
            <Text className="text-sm font-bold text-gray-900">{t.label}</Text>
            <Text className="text-xs text-gray-400 mt-1 leading-5">{t.desc}</Text>
          </View>
        </View>
      ))}

      {/* Tip banner */}
      <View className="bg-white rounded-2xl border border-indigo-100 p-4 flex-row items-start gap-3">
        <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center shrink-0">
          <Ionicons name="notifications-outline" size={16} color="#6366f1" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-800">
            Waiting for school access?
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5 leading-5">
            Once a school accepts your application or enrollment, you'll
            automatically gain access to the school dashboard.
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Admin Dashboard ────────────────────────────────────────────────────── */

function AdminDashboard({
  membership,
  firstName,
}: {
  membership: UserSchoolMembership;
  firstName: string;
}) {
  const schoolId = membership.schoolId;
  const { data: students = [], isLoading: studentsLoading } =
    useSchoolStudents(schoolId);
  const { data: staff = [], isLoading: staffLoading } =
    useSchoolStaff(schoolId);
  const { data: announcements = [], isLoading: annsLoading } =
    useSchoolAnnouncements(schoolId);
  const { data: events = [], isLoading: eventsLoading } =
    useUpcomingEvents(schoolId);

  const recentAnns = (announcements as Announcement[]).slice(0, 5);
  const upcomingEvts = (events as CalendarEvent[]).slice(0, 5);

  return (
    <View className="gap-4">
      {/* Header */}
      <View className="flex-row items-center gap-4">
        <View className="w-11 h-11 rounded-2xl bg-indigo-600 items-center justify-center">
          <Ionicons name="sparkles-outline" size={20} color="#ffffff" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">
            {greeting()}, {firstName} 👋
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
            {membership.school.name}
          </Text>
        </View>
        <View className="bg-indigo-50 rounded-xl px-3 py-1.5">
          <Text className="text-xs font-bold text-indigo-700 capitalize">
            {membership.role.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Stat tiles */}
      <View className="flex-row gap-3">
        <StatCard
          label="Students"
          iconName="people-outline"
          value={students.length}
          bg="bg-indigo-50"
          iconBg="bg-indigo-100"
          iconColor="#4338ca"
          valColor="text-indigo-700"
          loading={studentsLoading}
        />
        <StatCard
          label="Staff Members"
          iconName="person-outline"
          value={staff.length}
          bg="bg-violet-50"
          iconBg="bg-violet-100"
          iconColor="#7c3aed"
          valColor="text-violet-700"
          loading={staffLoading}
        />
      </View>

      {/* Announcements */}
      <SectionCard
        title="Announcements"
        icon="megaphone-outline"
        iconColor="#d97706"
        iconBg="bg-amber-50"
      >
        <View className="px-4 py-2">
          {annsLoading ? (
            <ActivityIndicator size="small" color="#d97706" className="py-6" />
          ) : recentAnns.length === 0 ? (
            <View className="items-center py-8 gap-2">
              <Ionicons name="megaphone-outline" size={28} color="#d1d5db" />
              <Text className="text-xs text-gray-400">No announcements yet</Text>
            </View>
          ) : (
            recentAnns.map((ann) => <AnnouncementRow key={ann.id} ann={ann} />)
          )}
        </View>
      </SectionCard>

      {/* Upcoming events */}
      <SectionCard
        title="Upcoming Events"
        icon="calendar-outline"
        iconColor="#7c3aed"
        iconBg="bg-violet-50"
      >
        <View className="p-3">
          {eventsLoading ? (
            <ActivityIndicator size="small" color="#7c3aed" className="py-6" />
          ) : upcomingEvts.length === 0 ? (
            <View className="items-center py-8 gap-2">
              <Ionicons name="calendar-outline" size={28} color="#d1d5db" />
              <Text className="text-xs text-gray-400">No upcoming events</Text>
            </View>
          ) : (
            upcomingEvts.map((evt) => <EventRow key={evt.id} evt={evt} />)
          )}
        </View>
      </SectionCard>
    </View>
  );
}

/* ─── Member Dashboard (staff / student / parent) ───────────────────────── */

function MemberDashboard({
  membership,
  firstName,
}: {
  membership: UserSchoolMembership;
  firstName: string;
}) {
  const schoolId = membership.schoolId;
  const role = membership.role;

  const { data: announcements = [], isLoading: annsLoading } =
    useSchoolAnnouncements(schoolId);
  const { data: events = [], isLoading: eventsLoading } =
    useUpcomingEvents(schoolId);

  const recentAnns = (announcements as Announcement[]).slice(0, 5);
  const upcomingEvts = (events as CalendarEvent[]).slice(0, 5);

  const isStudent = role === UserRole.STUDENT;
  const isStaff = role === UserRole.STAFF;

  const quickLinks =
    isStudent
      ? [
          { label: 'My Classrooms', iconName: 'grid-outline' as const, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconColor: '#4338ca', textColor: 'text-indigo-700' },
          { label: 'My Assessments', iconName: 'clipboard-outline' as const, bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconColor: '#7c3aed', textColor: 'text-violet-700' },
          { label: 'My Scores', iconName: 'star-outline' as const, bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: '#d97706', textColor: 'text-amber-700' },
          { label: 'Library', iconName: 'book-outline' as const, bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: '#0d9488', textColor: 'text-teal-700' },
        ]
      : isStaff
      ? [
          { label: 'Classrooms', iconName: 'grid-outline' as const, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconColor: '#4338ca', textColor: 'text-indigo-700' },
          { label: 'Assessments', iconName: 'clipboard-outline' as const, bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconColor: '#7c3aed', textColor: 'text-violet-700' },
          { label: 'Timetable', iconName: 'calendar-outline' as const, bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: '#d97706', textColor: 'text-amber-700' },
          { label: 'Reports', iconName: 'bar-chart-outline' as const, bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: '#0d9488', textColor: 'text-teal-700' },
        ]
      : /* parent */ [
          { label: 'Communications', iconName: 'megaphone-outline' as const, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconColor: '#4338ca', textColor: 'text-indigo-700' },
          { label: 'My Enquiries', iconName: 'chatbubble-outline' as const, bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconColor: '#7c3aed', textColor: 'text-violet-700' },
          { label: 'Library', iconName: 'book-outline' as const, bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: '#d97706', textColor: 'text-amber-700' },
          { label: 'Documents', iconName: 'document-outline' as const, bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: '#0d9488', textColor: 'text-teal-700' },
        ];

  const roleDesc = isStaff
    ? "Here's an overview of your activities today."
    : isStudent
    ? 'Check your schedule and stay on top of assessments.'
    : "Stay connected with your child's learning journey.";

  return (
    <View className="gap-4">
      {/* Hero banner */}
      <View className="bg-indigo-600 rounded-2xl p-5 overflow-hidden">
        <View className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/4" />
        <View className="absolute bottom-0 right-16 w-20 h-20 rounded-full bg-white opacity-5 translate-y-1/2" />
        <Text className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
          {membership.school.name}
        </Text>
        <Text className="text-2xl font-bold text-white leading-tight">
          {greeting()}, {firstName}! 👋
        </Text>
        <Text className="text-white/60 text-sm mt-1">{roleDesc}</Text>

        {/* Shortcut pills */}
        <View className="flex-row gap-2 mt-4 flex-wrap">
          {quickLinks.slice(0, 3).map((l) => (
            <View
              key={l.label}
              className="flex-row items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5"
            >
              <Ionicons name={l.iconName} size={13} color="#ffffff" />
              <Text className="text-white text-xs font-semibold">{l.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick-access grid (2 columns) */}
      <View className="gap-3">
        <View className="flex-row gap-3">
          <QuickTile {...quickLinks[0]} />
          <QuickTile {...quickLinks[1]} />
        </View>
        <View className="flex-row gap-3">
          <QuickTile {...quickLinks[2]} />
          <QuickTile {...quickLinks[3]} />
        </View>
      </View>

      {/* Upcoming events */}
      <SectionCard
        title="Upcoming Events"
        icon="flash-outline"
        iconColor="#d97706"
        iconBg="bg-amber-50"
      >
        <View className="p-3">
          {eventsLoading ? (
            <ActivityIndicator size="small" color="#d97706" className="py-6" />
          ) : upcomingEvts.length === 0 ? (
            <View className="items-center py-8 gap-2">
              <Ionicons name="calendar-outline" size={28} color="#d1d5db" />
              <Text className="text-xs text-gray-400">No upcoming events</Text>
            </View>
          ) : (
            upcomingEvts.map((evt) => <EventRow key={evt.id} evt={evt} />)
          )}
        </View>
      </SectionCard>

      {/* Announcements (for staff and parent; students get My Classes instead) */}
      {isStudent ? (
        <SectionCard
          title="My Classes"
          icon="grid-outline"
          iconColor="#0d9488"
          iconBg="bg-teal-50"
        >
          <View className="p-5">
            <View className="bg-teal-50 rounded-2xl p-5 items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-teal-100 items-center justify-center">
                <Ionicons name="grid-outline" size={24} color="#0d9488" />
              </View>
              <Text className="text-sm font-bold text-teal-800">
                Your Enrolled Classrooms
              </Text>
              <Text className="text-xs text-teal-500 text-center">
                See subjects, schedules and timetables
              </Text>
            </View>
          </View>
        </SectionCard>
      ) : (
        <SectionCard
          title="Announcements"
          icon="megaphone-outline"
          iconColor="#d97706"
          iconBg="bg-amber-50"
        >
          <View className="px-4 py-2">
            {annsLoading ? (
              <ActivityIndicator
                size="small"
                color="#d97706"
                className="py-6"
              />
            ) : recentAnns.length === 0 ? (
              <View className="items-center py-8 gap-2">
                <Ionicons name="megaphone-outline" size={28} color="#d1d5db" />
                <Text className="text-xs text-gray-400">No announcements</Text>
              </View>
            ) : (
              recentAnns.map((ann) => (
                <AnnouncementRow key={ann.id} ann={ann} />
              ))
            )}
          </View>
        </SectionCard>
      )}
    </View>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const firstName = user?.firstName ?? 'there';
  const memberships = user?.schools ?? [];
  const selectedSchoolId = useAuthStore((s) => s.selectedSchoolId);

  const primaryMembership =
    memberships.find((m) => m.schoolId === selectedSchoolId) ??
    memberships.find((m) => m.isPrimary) ??
    memberships[0] ??
    null;

  const isAdminRole =
    primaryMembership?.role === UserRole.SUPER_ADMIN ||
    primaryMembership?.role === UserRole.SCHOOL_ADMIN;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Dashboard content */}
        {!primaryMembership ? (
          <NoSchoolScreen firstName={firstName} />
        ) : isAdminRole ? (
          <AdminDashboard membership={primaryMembership} firstName={firstName} />
        ) : (
          <MemberDashboard membership={primaryMembership} firstName={firstName} />
        )}

        {/* Sign out */}
        <Pressable
          onPress={logout}
          className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3.5 mt-6"
        >
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text className="text-sm font-semibold text-red-600">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
