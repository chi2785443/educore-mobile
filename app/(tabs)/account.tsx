import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';

export default function AccountScreen() {
  const user = useAuthStore((s) => s.user);

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
    { icon: 'mail-outline', label: 'Email', value: user?.email ?? '—' },
    { icon: 'call-outline', label: 'Phone', value: user?.phoneNumber ?? 'Not set' },
    {
      icon: 'checkmark-circle-outline',
      label: 'Email verified',
      value: user?.emailVerified ? 'Yes' : 'No',
    },
    {
      icon: 'school-outline',
      label: 'Schools',
      value: user?.schools?.length ? `${user.schools.length} school(s)` : 'None',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8 gap-6">
          <Text className="text-2xl font-bold text-brand-dark">Account</Text>

          {/* Avatar card */}
          <View className="rounded-2xl bg-white border border-gray-100 p-6 items-center gap-3 shadow-sm">
            <View className="w-16 h-16 rounded-full bg-indigo-600 items-center justify-center">
              <Text className="text-white font-bold text-2xl">
                {user?.firstName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View className="items-center gap-0.5">
              <Text className="text-lg font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </Text>
              {user?.isAdmin && (
                <View className="rounded-full bg-indigo-100 px-3 py-0.5">
                  <Text className="text-xs font-semibold text-indigo-700">Platform Admin</Text>
                </View>
              )}
            </View>
          </View>

          {/* Info rows */}
          <View className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            {rows.map((row, i) => (
              <View
                key={row.label}
                className={`flex-row items-center gap-4 px-5 py-4 ${
                  i < rows.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center">
                  <Ionicons name={row.icon} size={16} color="#4338ca" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 font-medium">{row.label}</Text>
                  <Text className="text-sm text-gray-800 font-semibold mt-0.5">{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
