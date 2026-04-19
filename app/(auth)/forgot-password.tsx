import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordScreen() {
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
          <View className="flex-1 px-6 py-8 gap-8">
            <Pressable onPress={() => router.back()} className="flex-row items-center gap-2 self-start">
              <Ionicons name="arrow-back" size={20} color="#140626" />
              <Text className="text-sm font-medium text-brand-dark">Back</Text>
            </Pressable>

            <View className="gap-1">
              <Text className="text-2xl font-bold text-brand-dark">Forgot password?</Text>
              <Text className="text-sm text-gray-500">We'll send a reset link to your email</Text>
            </View>

            <ForgotPasswordForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
