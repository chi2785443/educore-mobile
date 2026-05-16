import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import MobileAdminDashboard from '@/components/dashboard/MobileAdminDashboard';
import MobileStaffDashboard from '@/components/dashboard/MobileStaffDashboard';
import MobileStudentDashboard from '@/components/dashboard/MobileStudentDashboard';
import MobileParentDashboard from '@/components/dashboard/MobileParentDashboard';
import { Ionicons } from '@expo/vector-icons';

function NoSchoolState({ firstName }: { firstName: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-6">
      <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="school-outline" size={34} color="#7c3aed" />
      </View>
      <View className="items-center gap-2">
        <Text className="text-xl font-bold text-gray-900 text-center">Welcome, {firstName}!</Text>
        <Text className="text-sm text-gray-500 text-center leading-relaxed">
          You're not enrolled in any school yet. Browse schools to get started.
        </Text>
      </View>
      <View className="gap-3 w-full">
        {[
          { icon: 'briefcase-outline' as const, label: 'Browse Job Openings', color: '#6366f1', bg: '#e0e7ff' },
          { icon: 'document-text-outline' as const, label: 'My Enrollment', color: '#14b8a6', bg: '#d1fae5' },
          { icon: 'chatbubble-outline' as const, label: 'My Enquiries', color: '#f59e0b', bg: '#fef3c7' },
        ].map(item => (
          <View key={item.label} style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: '#fff', borderRadius: 16, padding: 14,
            borderWidth: 1, borderColor: '#f3f4f6',
          }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" style={{ marginLeft: 'auto' }} />
          </View>
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
