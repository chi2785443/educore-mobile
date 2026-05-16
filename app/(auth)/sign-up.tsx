import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { BasicInfoStep } from '@/components/auth/BasicInfoStep';
import { OtpStep } from '@/components/auth/OtpStep';
import { RoleSelectionStep } from '@/components/auth/RoleSelectionStep';
import { SchoolRegistrationStep } from '@/components/auth/SchoolRegistrationStep';
import { JobApplicationStep } from '@/components/auth/JobApplicationStep';
import { StudentEnrollmentStep } from '@/components/auth/StudentEnrollmentStep';
import { ParentEnquiryStep } from '@/components/auth/ParentEnquiryStep';
import { OnboardingRole, SignUpStep } from '@/types';

const STEP_TITLES: Record<SignUpStep, string> = {
  0: 'Create account',
  1: 'Verify email',
  2: 'Choose your role',
  3: 'Get started',
};

const STEP_SUBTITLES: Record<SignUpStep, string> = {
  0: 'Fill in your details to get started',
  1: 'Enter the code we sent to your email',
  2: 'How will you be using EduCore?',
  3: 'Complete your profile setup',
};

export default function SignUpScreen() {
  const [step, setStep] = useState<SignUpStep>(0);
  const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null);

  const handleRoleSelect = (role: OnboardingRole) => {
    setSelectedRole(role);
    setStep(3);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <BasicInfoStep onSuccess={() => setStep(1)} />;
      case 1:
        return (
          <OtpStep
            onSuccess={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        );
      case 2:
        return (
          <RoleSelectionStep
            onSelect={handleRoleSelect}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        if (selectedRole === 'super_admin') return <SchoolRegistrationStep onBack={() => setStep(2)} />;
        if (selectedRole === 'staff') return <JobApplicationStep onBack={() => setStep(2)} />;
        if (selectedRole === 'student') return <StudentEnrollmentStep onBack={() => setStep(2)} />;
        if (selectedRole === 'parent') return <ParentEnquiryStep onBack={() => setStep(2)} />;
        return null;
    }
  };

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
            {/* Logo */}
            <Image
              source={require('@/assets/images/educore_logo.svg')}
              style={{ width: 130, height: 37 }}
              contentFit="contain"
            />

            {/* Progress bar */}
            <View className="gap-3">
              <View className="flex-row gap-1.5">
                {([0, 1, 2, 3] as SignUpStep[]).map((s) => (
                  <View
                    key={s}
                    className={`h-1 flex-1 rounded-full ${
                      s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </View>
              <Text className="text-xs text-gray-400">Step {step + 1} of 4</Text>
            </View>

            {/* Header */}
            <View className="gap-1">
              <Text className="text-2xl font-bold text-brand-dark">{STEP_TITLES[step]}</Text>
              <Text className="text-sm text-gray-500">{STEP_SUBTITLES[step]}</Text>
            </View>

            {/* Step content */}
            {renderStep()}

            {/* Sign in link — only on step 0 */}
            {step === 0 && (
              <View className="flex-row justify-center items-center gap-1 pb-4">
                <Text className="text-sm text-gray-500">Already have an account?</Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable>
                    <Text className="text-sm text-indigo-600 font-semibold">Sign In</Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
