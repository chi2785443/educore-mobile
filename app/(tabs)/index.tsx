import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import MobileAdminDashboard from '@/components/dashboard/MobileAdminDashboard';
import MobileStaffDashboard from '@/components/dashboard/MobileStaffDashboard';
import MobileStudentDashboard from '@/components/dashboard/MobileStudentDashboard';
import MobileParentDashboard from '@/components/dashboard/MobileParentDashboard';
import { Ionicons } from '@expo/vector-icons';

function NoSchoolState({ firstName }: { firstName: string }) {
  const router = useRouter();

  const actions = [
    {
      icon: 'briefcase-outline' as const,
      label: 'Browse Job Openings',
      desc: 'Find positions at schools near you',
      from: '#4f46e5', to: '#7c3aed',
      route: '/(tabs)/my-jobs',
    },
    {
      icon: 'document-text-outline' as const,
      label: 'My Enrollments',
      desc: 'Track your school applications',
      from: '#0d9488', to: '#0891b2',
      route: '/(tabs)/my-enrollments',
    },
    {
      icon: 'chatbubble-ellipses-outline' as const,
      label: 'My Enquiries',
      desc: 'View replies from schools',
      from: '#d97706', to: '#ea580c',
      route: '/(tabs)/my-enquiries',
    },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Hero */}
      <View style={{
        backgroundColor: '#0B0F14', paddingHorizontal: 24,
        paddingTop: 32, paddingBottom: 36,
        alignItems: 'center', gap: 12,
      }}>
        <View style={{
          width: 72, height: 72, borderRadius: 24,
          backgroundColor: 'rgba(99,102,241,0.15)',
          borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="school-outline" size={32} color="#818cf8" />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
            Hello, {firstName}!
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 260 }}>
            You&apos;re not part of a school yet. Apply to enroll or find a job opening.
          </Text>
        </View>
      </View>

      {/* Action cards */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
          Get Started
        </Text>
        {actions.map(item => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as never)}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 14,
              backgroundColor: item.from,
              borderRadius: 18, padding: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <View style={{
                width: 46, height: 46, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Ionicons name={item.icon} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{item.label}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.5)" />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function DashboardTab() {
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
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
        {primaryMembership && (
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }} numberOfLines={1}>
              {primaryMembership.school?.name ?? ''}
            </Text>
          </View>
        )}
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
