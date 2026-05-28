import React from 'react';
import { View, Text, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { otpSchema, OtpFormData } from '@/schemas/auth.schema';
import { useSendOtp, useVerifyOtp } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export function OtpStep({ onSuccess, onBack }: Props) {
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? '';
  const { mutate: sendOtp, isPending: isSending } = useSendOtp();
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp(onSuccess);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  // No auto-send on mount — the backend already sends the OTP during registration.
  // The "Resend code" button below handles cases where the user needs a fresh code.

  const onSubmit = (data: OtpFormData) => {
    verifyOtp({ email, otp: data.otp }, {
      onError: (err) => Alert.alert('Verification Failed', err.message),
    });
  };

  return (
    <View className="gap-5">
      <View className="rounded-xl bg-[#F0EEFF] border border-[#4C3FC4]/20 p-4 gap-1">
        <Text className="text-sm font-semibold text-[#4C3FC4]">Check your email</Text>
        <Text className="text-sm text-[#4C3FC4]/80">
          We sent a verification code to{' '}
          <Text className="font-semibold">{user?.email}</Text>
        </Text>
      </View>

      <Controller
        control={control}
        name="otp"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="Verification code"
            placeholder="Enter 4-digit OTP"
            keyboardType="number-pad"
            leftIcon="shield-checkmark-outline"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.otp?.message}
          />
        )}
      />

      <Button fullWidth loading={isVerifying} onPress={handleSubmit(onSubmit)}>
        Verify Email
      </Button>

      <Button
        fullWidth
        variant="ghost"
        loading={isSending}
        onPress={() => sendOtp(email)}
      >
        Resend code
      </Button>

      <Button fullWidth variant="outline" onPress={onBack}>
        Back
      </Button>
    </View>
  );
}
