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
          {/* Purple wave hero */}
          <View style={{
            backgroundColor: '#4C3FC4',
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            paddingTop: 48,
            paddingBottom: 44,
            paddingHorizontal: 28,
            gap: 14,
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.07)' }} />

            <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </Pressable>

            <View style={{ gap: 6, marginTop: 8 }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>Forgot password?</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{"We'll send a reset link to your email"}</Text>
            </View>
          </View>

          {/* White form section */}
          <View style={{ paddingHorizontal: 24, paddingTop: 36, paddingBottom: 40 }}>
            <ForgotPasswordForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
