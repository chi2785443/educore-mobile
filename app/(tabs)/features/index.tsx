import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';

/* ── Feature card ───────────────────────────────────────────────── */
interface FeatureCard {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  route: string;
}

function FeatureCardItem({ icon, iconColor, iconBg, title, subtitle, route }: FeatureCard) {
  const router = useRouter();
  return (
    <View style={{ width: '48%' }}>
      <Pressable
        onPress={() => router.push(route as never)}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      >
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#f1f5f9',
          padding: 10,
          gap: 7,
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 2,
        }}>
          <View style={{
            width: 34, height: 34, borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name={icon} size={17} color={iconColor} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{title}</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8', lineHeight: 14 }} numberOfLines={1}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={12} color="#cbd5e1" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

/* ── Main screen ────────────────────────────────────────────────── */
export default function FeaturesTab() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];

  const primary =
    memberships.find(m => m.schoolId === selectedSchoolId) ??
    memberships.find(m => m.isPrimary) ??
    memberships[0] ?? null;

  const role = primary?.role ?? '';
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;
  const isStaff = role === UserRole.STAFF;
  const isStudent = role === UserRole.STUDENT;
  const isParent = role === UserRole.PARENT;
  const isSuperAdmin = role === UserRole.SUPER_ADMIN || !!user?.isAdmin;

  const classLabel = isAdmin ? 'All Classrooms' : isStaff ? 'My Classrooms' : 'My Classes';
  const classSubtitle = isAdmin
    ? 'Manage all school classrooms'
    : isStaff
      ? 'Classes you teach'
      : isStudent
        ? 'Your enrolled classes'
        : 'View school classrooms';

  const features: FeatureCard[] = [
    {
      icon: 'wallet-outline', iconColor: '#6366f1', iconBg: '#eef2ff',
      title: 'My Finances',
      subtitle: isStudent ? 'Fee balance & payments' : 'Salary & advances',
      route: '/finances',
    },
    {
      icon: 'time-outline', iconColor: '#059669', iconBg: '#f0fdf4',
      title: 'Attendance', subtitle: 'Clock records & logs',
      route: '/attendance',
    },
    {
      icon: 'library-outline', iconColor: '#7c3aed', iconBg: '#f5f3ff',
      title: 'Library', subtitle: 'School resources',
      route: '/library',
    },
    {
      icon: 'document-text-outline', iconColor: '#d97706', iconBg: '#fffbeb',
      title: 'My Documents', subtitle: 'Personal files',
      route: '/documents',
    },
    ...(isStudent ? [
      {
        icon: 'trophy-outline' as const, iconColor: '#0ea5e9', iconBg: '#f0f9ff',
        title: 'My Results', subtitle: 'Term results & grades',
        route: '/results',
      },
      {
        icon: 'clipboard-outline' as const, iconColor: '#6366f1', iconBg: '#eef2ff',
        title: 'My Assessments', subtitle: 'Tests & quizzes assigned',
        route: '/my-assessments',
      },
    ] : []),
    ...((isStaff || isAdmin) ? [
      {
        icon: 'clipboard-outline' as const, iconColor: '#6366f1', iconBg: '#eef2ff',
        title: 'Assessments', subtitle: 'Manage tests & quizzes',
        route: '/assessments',
      },
      {
        icon: 'help-circle-outline' as const, iconColor: '#e11d48', iconBg: '#fff1f2',
        title: 'Question Bank', subtitle: 'Browse & create questions',
        route: '/question-bank',
      },
    ] : []),
    ...(isSuperAdmin ? [{
      icon: 'card-outline' as const, iconColor: '#0f172a', iconBg: '#f1f5f9',
      title: 'Subscription', subtitle: 'Plan status & usage',
      route: '/subscription',
    }] : []),
    ...(!isStudent && !isParent ? [{
      icon: 'briefcase-outline' as const, iconColor: '#0284c7', iconBg: '#e0f2fe',
      title: isAdmin ? 'Manage Jobs' : 'My Jobs',
      subtitle: isAdmin ? 'Post jobs & review candidates' : 'Browse & track applications',
      route: '/my-jobs',
    }] : []),
    {
      icon: 'school-outline' as const, iconColor: '#059669', iconBg: '#d1fae5',
      title: 'Enrollments', subtitle: 'School enrollment applications',
      route: '/my-enrollments',
    },
    ...(isAdmin ? [{
      icon: 'chatbubbles-outline' as const, iconColor: '#4f46e5', iconBg: '#eef2ff',
      title: 'Enquiries', subtitle: 'View & respond to parent enquiries',
      route: '/school-enquiries',
    }] : []),
    ...(isParent ? [{
      icon: 'chatbubble-outline' as const, iconColor: '#d97706', iconBg: '#fef3c7',
      title: 'Enquiries', subtitle: 'Questions sent to schools',
      route: '/my-enquiries',
    }] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>

      {/* ── Dark header ──────────────────────────────────────────── */}
      <View style={{ backgroundColor: '#0B0F14', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
              Features
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
              All your tools in one place
            </Text>
          </View>
          <View style={{
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="apps-outline" size={18} color="rgba(255,255,255,0.6)" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── My Classes hero card ──────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 }}>
          <Pressable
            onPress={() => router.push('/features/list' as never)}
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          >
            <View style={{
              borderRadius: 22,
              overflow: 'hidden',
              shadowColor: '#4f46e5',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 16,
              elevation: 8,
            }}>
              {/* Gradient background */}
              <View style={{
                backgroundColor: '#4f46e5',
                paddingHorizontal: 20,
                paddingVertical: 20,
              }}>
                {/* Decorative orb */}
                <View style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 120, height: 120, borderRadius: 60,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                }} />
                <View style={{
                  position: 'absolute', bottom: -30, left: 80,
                  width: 90, height: 90, borderRadius: 45,
                  backgroundColor: 'rgba(139,92,246,0.3)',
                }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  {/* Icon */}
                  <View style={{
                    width: 52, height: 52, borderRadius: 17,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
                  }}>
                    <Ionicons name="book" size={26} color="#fff" />
                  </View>

                  {/* Text */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>
                      {classLabel}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 }}>
                      {classSubtitle}
                    </Text>
                  </View>

                  {/* Arrow */}
                  <View style={{
                    width: 36, height: 36, borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* ── Feature grid ─────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={{
            fontSize: 11, fontWeight: '700', color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14,
          }}>
            My Features
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {features.map(f => (
              <FeatureCardItem key={f.title} {...f} />
            ))}
            {features.length % 2 !== 0 && <View style={{ width: '48%' }} />}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
