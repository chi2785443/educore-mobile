import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import MobileAdminDashboard from '@/components/dashboard/MobileAdminDashboard';
import MobileStaffDashboard from '@/components/dashboard/MobileStaffDashboard';
import MobileStudentDashboard from '@/components/dashboard/MobileStudentDashboard';
import MobileParentDashboard from '@/components/dashboard/MobileParentDashboard';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadCount } from '@/hooks/useNotifications';

const ACTIONS = [
  {
    icon: 'school-outline' as const,
    label: 'Apply to Enroll',
    subtitle: 'Submit enrollment docs and join a school',
    tag: 'Students',
    tagBg: '#0c2a24',
    tagColor: '#34d399',
    iconBg: '#0d9488',
    glowColor: 'rgba(13,148,136,0.15)',
    route: '/(tabs)/my-enrollments',
  },
  {
    icon: 'briefcase-outline' as const,
    label: 'Browse Job Openings',
    subtitle: 'Find staff positions at schools near you',
    tag: 'Staff',
    tagBg: '#1e1b4b',
    tagColor: '#a5b4fc',
    iconBg: '#4f46e5',
    glowColor: 'rgba(79,70,229,0.15)',
    route: '/(tabs)/my-jobs',
  },
  {
    icon: 'chatbubble-ellipses-outline' as const,
    label: 'Send an Enquiry',
    subtitle: 'Ask questions and get replies from schools',
    tag: 'Parents',
    tagBg: '#3b0a1e',
    tagColor: '#fda4af',
    iconBg: '#e11d48',
    glowColor: 'rgba(225,29,72,0.12)',
    route: '/(tabs)/my-enquiries',
  },
] as const;

const FEATURES = [
  { icon: 'calendar-outline' as const,    label: 'Attendance',  color: '#6366f1', bg: '#eef2ff' },
  { icon: 'clipboard-outline' as const,   label: 'Assessments', color: '#0891b2', bg: '#e0f2fe' },
  { icon: 'chatbubbles-outline' as const, label: 'Messages',    color: '#059669', bg: '#d1fae5' },
  { icon: 'library-outline' as const,     label: 'Library',     color: '#d97706', bg: '#fef3c7' },
  { icon: 'bar-chart-outline' as const,   label: 'Results',     color: '#db2777', bg: '#fce7f3' },
  { icon: 'cash-outline' as const,        label: 'Finance',     color: '#7c3aed', bg: '#ede9fe' },
];

const STEPS = [
  { num: '1', label: 'Apply',    active: true },
  { num: '2', label: 'Accept',   active: false },
  { num: '3', label: 'Explore',  active: false },
];

function SectionDivider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
    </View>
  );
}

function NoSchoolState({ firstName }: { firstName: string }) {
  const router = useRouter();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: '#f1f5f9' }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Dark hero ─────────────────────────────────────────────── */}
      <View style={{ backgroundColor: '#080d18', overflow: 'hidden' }}>
        {/* Background orbs */}
        <View style={{
          position: 'absolute', top: -50, right: -30,
          width: 220, height: 220, borderRadius: 110,
          backgroundColor: 'rgba(99,102,241,0.07)',
        }} />
        <View style={{
          position: 'absolute', bottom: -20, left: -50,
          width: 180, height: 180, borderRadius: 90,
          backgroundColor: 'rgba(139,92,246,0.06)',
        }} />
        <View style={{
          position: 'absolute', top: 60, left: '40%',
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: 'rgba(16,185,129,0.04)',
        }} />

        <View style={{ alignItems: 'center', paddingTop: 44, paddingHorizontal: 28, paddingBottom: 36, gap: 0 }}>
          {/* Nested glow rings + icon */}
          <View style={{
            width: 108, height: 108, borderRadius: 38,
            backgroundColor: 'rgba(99,102,241,0.1)',
            borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 22,
          }}>
            <View style={{
              width: 78, height: 78, borderRadius: 26,
              backgroundColor: 'rgba(99,102,241,0.18)',
              borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.45)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="school" size={36} color="#818cf8" />
            </View>
          </View>

          {/* Greeting */}
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
            Hello, {firstName}!
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.45)', fontSize: 14,
            textAlign: 'center', marginTop: 8, lineHeight: 22, maxWidth: 290,
          }}>
            You&apos;re not part of a school yet.{'\n'}Apply to get the full EduCore experience.
          </Text>

          {/* 3-step journey */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 32, gap: 0 }}>
            {STEPS.map((step, i) => (
              <React.Fragment key={step.num}>
                <View style={{ alignItems: 'center', gap: 7, minWidth: 64 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: step.active ? '#6366f1' : 'rgba(99,102,241,0.15)',
                    borderWidth: 1.5,
                    borderColor: step.active ? '#818cf8' : 'rgba(99,102,241,0.28)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {step.active ? (
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>{step.num}</Text>
                    ) : (
                      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '700' }}>{step.num}</Text>
                    )}
                  </View>
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: step.active ? '#a5b4fc' : 'rgba(255,255,255,0.28)',
                  }}>
                    {step.label}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={{
                    height: 1.5, width: 36, marginTop: 17, marginHorizontal: 4,
                    backgroundColor: 'rgba(99,102,241,0.22)',
                  }} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Curved bottom */}
        <View style={{ height: 28, backgroundColor: '#f1f5f9', borderTopLeftRadius: 28, borderTopRightRadius: 28 }} />
      </View>

      {/* ── Action cards ─────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 6, gap: 11 }}>
        <SectionDivider label="Get Started" />

        {ACTIONS.map(item => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as never)}
            style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
          >
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 14,
              backgroundColor: '#fff',
              borderRadius: 20, padding: 16,
              borderWidth: 1, borderColor: '#e8edf5',
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.07,
              shadowRadius: 10,
              elevation: 3,
            }}>
              {/* Coloured icon */}
              <View style={{
                width: 52, height: 52, borderRadius: 17,
                backgroundColor: item.iconBg,
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                shadowColor: item.iconBg,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }}>
                <Ionicons name={item.icon} size={24} color="#fff" />
              </View>

              {/* Text */}
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '800' }}>{item.label}</Text>
                  <View style={{ backgroundColor: item.tagBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ color: item.tagColor, fontSize: 10, fontWeight: '700' }}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={{ color: '#64748b', fontSize: 12, lineHeight: 17 }}>{item.subtitle}</Text>
              </View>

              {/* Arrow */}
              <View style={{
                width: 34, height: 34, borderRadius: 11,
                backgroundColor: '#f1f5f9',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ionicons name="arrow-forward" size={16} color="#64748b" />
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* ── Feature unlock grid ───────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 28 }}>
        <SectionDivider label="Unlocks when you join" />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {FEATURES.map(f => (
            <View key={f.label} style={{ width: '30.5%', flexGrow: 1 }}>
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 16, padding: 14,
                alignItems: 'center', gap: 9,
                borderWidth: 1, borderColor: '#e8edf5',
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
                position: 'relative',
              }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 13,
                  backgroundColor: f.bg,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={f.icon} size={20} color={f.color} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', textAlign: 'center' }}>
                  {f.label}
                </Text>
                {/* Lock badge */}
                <View style={{
                  position: 'absolute', top: 9, right: 9,
                  width: 18, height: 18, borderRadius: 9,
                  backgroundColor: '#f1f5f9',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="lock-closed" size={9} color="#94a3b8" />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom note */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: '#fff',
          borderRadius: 14, padding: 14, marginTop: 16,
          borderWidth: 1, borderColor: '#e8edf5',
        }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: '#eef2ff',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ionicons name="information-circle" size={18} color="#6366f1" />
          </View>
          <Text style={{ color: '#475569', fontSize: 12, lineHeight: 18, flex: 1 }}>
            Once accepted by a school, your full dashboard unlocks automatically.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function DashboardTab() {
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const { data: unreadCount = 0 } = useUnreadCount();
  const memberships = user?.schools ?? [];

  const primaryMembership =
    memberships.find(m => m.schoolId === selectedSchoolId) ??
    memberships.find(m => m.isPrimary) ??
    memberships[0] ??
    null;

  const sharedProps = {
    schoolId: primaryMembership?.schoolId ?? '',
    schoolName: primaryMembership?.school?.name ?? '',
    firstName: user?.firstName ?? 'there',
  };

  const role = primaryMembership?.role;
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN;
  const isStaff = role === UserRole.STAFF;
  const isStudent = role === UserRole.STUDENT;
  const isParent = role === UserRole.PARENT;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Top bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
      }}>
        <Image
          source={require('@/assets/images/educore_logo.svg')}
          style={{ width: 100, height: 28 }}
          contentFit="contain"
        />
        <Pressable
          onPress={() => router.push('/notifications')}
          style={{ padding: 4, position: 'relative' }}
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={24} color="#0f172a" />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute', top: 2, right: 2,
              minWidth: 16, height: 16, borderRadius: 8,
              backgroundColor: '#ef4444',
              alignItems: 'center', justifyContent: 'center',
              paddingHorizontal: 3,
            }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Content */}
      {!primaryMembership ? (
        <NoSchoolState firstName={user?.firstName ?? 'there'} />
      ) : isAdmin ? (
        <MobileAdminDashboard {...sharedProps} />
      ) : isStaff ? (
        <MobileStaffDashboard {...sharedProps} />
      ) : isStudent ? (
        <MobileStudentDashboard {...sharedProps} />
      ) : isParent ? (
        <MobileParentDashboard {...sharedProps} />
      ) : (
        <NoSchoolState firstName={user?.firstName ?? 'there'} />
      )}
    </SafeAreaView>
  );
}
