import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { toast } from '@/components/ui/Toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/schemas/auth.schema';
import { useForgotPassword } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data, {
      onSuccess: () => setSent(true),
      onError: (err) => toast.error(err.message),
    });
  };

  if (sent) {
    return (
      <View className="gap-5 items-center py-4">
        <View className="w-16 h-16 rounded-full bg-[#F0EEFF] items-center justify-center">
          <Ionicons name="mail-open-outline" size={36} color="#4C3FC4" />
        </View>
        <View className="items-center gap-1">
          <Text className="text-xl font-bold text-gray-900">Check your email</Text>
          <Text className="text-sm text-gray-500 text-center">
            If <Text className="font-semibold">{getValues('email')}</Text> is registered, a
            password reset link has been sent.
          </Text>
        </View>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <Text className="text-sm text-[#4C3FC4] font-semibold">Back to Sign In</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View className="gap-5">
      <View className="rounded-xl bg-amber-50 border border-amber-100 p-4">
        <Text className="text-sm text-amber-700">
          {"Enter the email address linked to your account and we'll send you a reset link."}
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="Email address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            leftIcon="mail-outline"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <Button fullWidth loading={isPending} onPress={handleSubmit(onSubmit)}>
        Send Reset Link
      </Button>

      <Link href="/(auth)/sign-in" asChild>
        <Pressable className="self-center">
          <Text className="text-sm text-gray-500">
            Remember it?{' '}
            <Text className="text-[#4C3FC4] font-semibold">Sign In</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
