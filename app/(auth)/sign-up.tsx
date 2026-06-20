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
  2: 'How will you be using Cakale EDU?',
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
          {/* Purple wave hero */}
          <View style={{
            backgroundColor: '#4C3FC4',
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            paddingTop: 48,
            paddingBottom: 36,
            paddingHorizontal: 28,
            gap: 16,
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <View style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(245,72,106,0.09)' }} />

            {/* Progress dots */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([0, 1, 2, 3] as SignUpStep[]).map((s) => (
                <View
                  key={s}
                  style={{
                    height: 4, flex: 1, borderRadius: 2,
                    backgroundColor: s <= step ? '#ffffff' : 'rgba(255,255,255,0.30)',
                  }}
                />
              ))}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12 }}>Step {step + 1} of 4</Text>

            <View style={{ gap: 4 }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>{STEP_TITLES[step]}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{STEP_SUBTITLES[step]}</Text>
            </View>
          </View>

          {/* White form section */}
          <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, gap: 24 }}>
            {renderStep()}

            {step === 0 && (
              <View className="flex-row justify-center items-center gap-1 pb-4">
                <Text className="text-sm text-gray-500">Already have an account?</Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable>
                    <Text className="text-sm text-[#4C3FC4] font-semibold">Sign In</Text>
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
