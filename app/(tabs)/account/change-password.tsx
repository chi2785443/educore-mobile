import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChangePassword } from '@/hooks/useUser';

function PasswordField({
  label, value, onChangeText, placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? '••••••••'}
          placeholderTextColor="#9ca3af"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: '#f8fafc',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 14,
            paddingRight: 48,
            fontSize: 15,
            color: '#111827',
          }}
        />
        <Pressable
          onPress={() => setVisible(p => !p)}
          style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={19} color="#9ca3af" />
        </Pressable>
      </View>
    </View>
  );
}

function StrengthBar({ password }: { password: string }) {
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [len >= 8, hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;

  if (!password) return null;

  const levels = [
    { min: 0, label: 'Too weak',  color: '#ef4444' },
    { min: 2, label: 'Weak',      color: '#f97316' },
    { min: 3, label: 'Fair',      color: '#eab308' },
    { min: 4, label: 'Good',      color: '#22c55e' },
    { min: 5, label: 'Strong',    color: '#16a34a' },
  ];
  const level = [...levels].reverse().find(l => score >= l.min) ?? levels[0];

  return (
    <View style={{ gap: 6, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= score ? level.color : '#e5e7eb' }} />
        ))}
      </View>
      <Text style={{ fontSize: 11, color: level.color, fontWeight: '700' }}>{level.label}</Text>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { mutate: changePassword, isPending } = useChangePassword(() => {
    toast.success('Password updated successfully');
    router.back();
  });

  const handleSubmit = () => {
    if (!currentPassword) { toast.error('Please enter your current password'); return; }
    if (!newPassword) { toast.error('Please enter a new password'); return; }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword === currentPassword) { toast.error('New password must be different from your current password'); return; }
    if (newPassword !== confirmPassword) { toast.error('New password and confirmation do not match'); return; }
    changePassword({ currentPassword, newPassword });
  };

  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Hero header ── */}
        <View style={{
          backgroundColor: '#d97706',
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 28,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}>
          {/* Decorative orbs */}
          <View style={{
            position: 'absolute', top: -20, right: -20,
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: 'rgba(255,255,255,0.07)',
          }} />
          <View style={{
            position: 'absolute', bottom: -30, left: 60,
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }} />

          {/* Top row: back + title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="arrow-back" size={18} color="#fff" />
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
                Change Password
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
                Update your account password
              </Text>
            </View>
          </View>

        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Current password card ── */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            borderWidth: 1, borderColor: '#f1f5f9',
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.04,
            shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{
              paddingHorizontal: 16, paddingVertical: 10,
              backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Current Password
              </Text>
            </View>
            <View style={{ padding: 16 }}>
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
              />
            </View>
          </View>

          {/* ── New password card ── */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            borderWidth: 1, borderColor: '#f1f5f9',
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.04,
            shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{
              paddingHorizontal: 16, paddingVertical: 10,
              backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                New Password
              </Text>
            </View>
            <View style={{ padding: 16, gap: 18 }}>
              <View style={{ gap: 8 }}>
                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                />
                <StrengthBar password={newPassword} />
              </View>

              <View style={{ height: 1, backgroundColor: '#f1f5f9' }} />

              <View style={{ gap: 8 }}>
                <PasswordField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your new password"
                />
                {confirmPassword.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                      size={15}
                      color={newPassword === confirmPassword ? '#16a34a' : '#dc2626'}
                    />
                    <Text style={{
                      fontSize: 12, fontWeight: '700',
                      color: newPassword === confirmPassword ? '#16a34a' : '#dc2626',
                    }}>
                      {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Tips card ── */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            borderWidth: 1, borderColor: '#f1f5f9',
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.04,
            shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{
              paddingHorizontal: 16, paddingVertical: 10,
              backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}>
              <Ionicons name="bulb-outline" size={13} color="#7c3aed" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Password Tips
              </Text>
            </View>
            <View style={{ padding: 16, gap: 10 }}>
              {[
                { icon: 'checkmark-circle-outline' as const, tip: 'Use at least 8 characters' },
                { icon: 'checkmark-circle-outline' as const, tip: 'Mix uppercase and lowercase letters' },
                { icon: 'checkmark-circle-outline' as const, tip: 'Include at least one number' },
                { icon: 'checkmark-circle-outline' as const, tip: 'Add a special character (!@#$%)' },
              ].map(({ icon, tip }) => (
                <View key={tip} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 9,
                    backgroundColor: '#f5f3ff',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Ionicons name={icon} size={14} color="#7c3aed" />
                  </View>
                  <Text style={{ fontSize: 13, color: '#475569', flex: 1 }}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Submit button ── */}
          <Pressable
            onPress={handleSubmit}
            disabled={isPending || !canSubmit}
            style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
          >
            <View style={{
              backgroundColor: canSubmit ? '#d97706' : '#e5e7eb',
              borderRadius: 16,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: canSubmit ? '#d97706' : 'transparent',
              shadowOpacity: 0.35,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: canSubmit ? 4 : 0,
            }}>
              {isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="lock-closed-outline" size={18} color={canSubmit ? '#fff' : '#9ca3af'} />}
              <Text style={{ fontSize: 16, fontWeight: '900', color: canSubmit ? '#fff' : '#9ca3af' }}>
                {isPending ? 'Updating…' : 'Update Password'}
              </Text>
            </View>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
