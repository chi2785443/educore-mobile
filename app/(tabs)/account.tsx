import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { UserSchoolMembership, UserRole } from '@/interface/user.interface';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  staff: 'Staff',
  student: 'Student',
  parent: 'Parent',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  super_admin: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  school_admin: { bg: 'bg-violet-100', text: 'text-violet-700' },
  staff: { bg: 'bg-blue-100', text: 'text-blue-700' },
  student: { bg: 'bg-teal-100', text: 'text-teal-700' },
  parent: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

function SchoolRow({
  membership,
  isSelected,
  onSelect,
}: {
  membership: UserSchoolMembership;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const roleColors = ROLE_COLORS[membership.role] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-3 px-4 py-3.5 ${isSelected ? 'bg-indigo-50' : 'bg-white'}`}
    >
      {/* School initial avatar */}
      <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center shrink-0">
        <Text className="text-indigo-700 font-bold text-base">
          {membership.school.name[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>

      {/* School info */}
      <View className="flex-1 min-w-0">
        <Text
          className={`text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}
          numberOfLines={1}
        >
          {membership.school.name}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <View className={`rounded-full px-2 py-0.5 ${roleColors.bg}`}>
            <Text className={`text-xs font-semibold ${roleColors.text}`}>
              {ROLE_LABELS[membership.role] ?? membership.role}
            </Text>
          </View>
          {membership.isPrimary && (
            <View className="rounded-full px-2 py-0.5 bg-gray-100">
              <Text className="text-xs font-medium text-gray-500">Primary</Text>
            </View>
          )}
        </View>
      </View>

      {/* Selection indicator */}
      {isSelected ? (
        <View className="w-6 h-6 rounded-full bg-indigo-600 items-center justify-center">
          <Ionicons name="checkmark" size={14} color="#ffffff" />
        </View>
      ) : (
        <View className="w-6 h-6 rounded-full border-2 border-gray-200" />
      )}
    </Pressable>
  );
}

export default function AccountScreen() {
  const user = useAuthStore((s) => s.user);
  const selectedSchoolId = useAuthStore((s) => s.selectedSchoolId);
  const setSelectedSchool = useAuthStore((s) => s.setSelectedSchool);
  const logout = useLogout();

  const memberships: UserSchoolMembership[] = user?.schools ?? [];

  const infoRows: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
  }[] = [
    { icon: 'mail-outline', label: 'Email', value: user?.email ?? '—' },
    { icon: 'call-outline', label: 'Phone', value: user?.phoneNumber ?? 'Not set' },
    {
      icon: 'checkmark-circle-outline',
      label: 'Email verified',
      value: user?.emailVerified ? 'Yes' : 'No',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-7 gap-6">
          <Text className="text-2xl font-bold text-gray-900">Account</Text>

          {/* Avatar card */}
          <View className="rounded-2xl bg-white border border-gray-100 p-6 items-center gap-3 shadow-sm">
            <View className="w-16 h-16 rounded-full bg-indigo-600 items-center justify-center">
              <Text className="text-white font-bold text-2xl">
                {user?.firstName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-lg font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </Text>
              {user?.isAdmin && (
                <View className="rounded-full bg-indigo-100 px-3 py-0.5">
                  <Text className="text-xs font-semibold text-indigo-700">
                    Platform Admin
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Info rows */}
          <View className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            {infoRows.map((row, i) => (
              <View
                key={row.label}
                className={`flex-row items-center gap-4 px-5 py-4 ${
                  i < infoRows.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center">
                  <Ionicons name={row.icon} size={16} color="#4338ca" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 font-medium">{row.label}</Text>
                  <Text className="text-sm text-gray-800 font-semibold mt-0.5">
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* School switcher */}
          {memberships.length > 0 && (
            <View className="gap-2">
              <View className="flex-row items-center gap-2 px-1">
                <Ionicons name="school-outline" size={15} color="#6b7280" />
                <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  My Schools
                </Text>
              </View>

              <View className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                {memberships.map((m, i) => (
                  <View key={m.schoolId}>
                    <SchoolRow
                      membership={m}
                      isSelected={selectedSchoolId === m.schoolId}
                      onSelect={() => setSelectedSchool(m.schoolId)}
                    />
                    {i < memberships.length - 1 && (
                      <View className="h-px bg-gray-50 ml-16" />
                    )}
                  </View>
                ))}
              </View>

              {memberships.length > 1 && (
                <Text className="text-xs text-gray-400 text-center px-4">
                  Tap a school to switch your active dashboard.
                </Text>
              )}
            </View>
          )}

          {/* Sign out */}
          <Pressable
            onPress={logout}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3.5"
          >
            <Ionicons name="log-out-outline" size={18} color="#dc2626" />
            <Text className="text-sm font-semibold text-red-600">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
