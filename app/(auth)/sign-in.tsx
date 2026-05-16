import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInScreen() {
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
            <View className="gap-4">
              <Image
                source={require('@/assets/images/educore_logo.svg')}
                style={{ width: 140, height: 40 }}
                contentFit="contain"
              />
              <View className="gap-1">
                <Text className="text-3xl font-bold text-brand-dark">Welcome back</Text>
                <Text className="text-base text-gray-500">Sign in to your account</Text>
              </View>
            </View>

            <SignInForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
