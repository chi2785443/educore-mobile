import React from 'react';
import { View, Text } from 'react-native';
import { toast } from '@/components/ui/Toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordFormData } from '@/schemas/auth.schema';
import { useResetPassword } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  token: string;
}

export function ResetPasswordForm({ token }: Props) {
  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', repeatPassword: '' },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      return;
    }
    resetPassword(
      { token, newPassword: data.password },
      { onError: (err) => toast.error(err.message) }
    );
  };

  return (
    <View className="gap-5">
      <View className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
        <Text className="text-sm text-indigo-700">
          Choose a strong password with at least 8 characters, including uppercase, lowercase, and a number or symbol.
        </Text>
      </View>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="New password"
            placeholder="Min. 8 characters"
            secureTextEntry
            leftIcon="lock-closed-outline"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="repeatPassword"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="Confirm new password"
            placeholder="Re-enter password"
            secureTextEntry
            leftIcon="lock-closed-outline"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.repeatPassword?.message}
          />
        )}
      />

      <Button fullWidth loading={isPending} onPress={handleSubmit(onSubmit)}>
        Reset Password
      </Button>
    </View>
  );
}
