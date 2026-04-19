import React, { useEffect } from 'react';
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

  useEffect(() => {
    sendOtp();
  }, []);

  const onSubmit = (data: OtpFormData) => {
    verifyOtp(data.otp, {
      onError: (err) => Alert.alert('Verification Failed', err.message),
    });
  };

  return (
    <View className="gap-5">
      <View className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 gap-1">
        <Text className="text-sm font-semibold text-indigo-700">Check your email</Text>
        <Text className="text-sm text-indigo-600">
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
        onPress={() => sendOtp()}
      >
        Resend code
      </Button>

      <Button fullWidth variant="outline" onPress={onBack}>
        Back
      </Button>
    </View>
  );
}
