import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="gap-0.5">
              <Text className="text-sm text-gray-500">Welcome back,</Text>
              <Text className="text-xl font-bold text-brand-dark">
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-indigo-600 items-center justify-center">
              <Text className="text-white font-bold text-base">
                {user?.firstName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          </View>

          {/* Placeholder content */}
          <View className="rounded-2xl bg-white border border-gray-100 p-6 items-center gap-3 shadow-sm">
            <View className="w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center">
              <Ionicons name="school-outline" size={28} color="#4338ca" />
            </View>
            <Text className="text-base font-semibold text-gray-900 text-center">
              Eduflow Dashboard
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              More features are on the way. Your account is set up and ready.
            </Text>
          </View>

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
