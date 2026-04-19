import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-10 gap-8 justify-center">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-brand-dark">Reset password</Text>
              <Text className="text-sm text-gray-500">Choose a new secure password for your account</Text>
            </View>

            <ResetPasswordForm token={token ?? ''} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
