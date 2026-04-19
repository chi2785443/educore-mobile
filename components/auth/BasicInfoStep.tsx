import React from 'react';
import { View, Text, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpFormData } from '@/schemas/auth.schema';
import { useRegister } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  onSuccess: () => void;
}

export function BasicInfoStep({ onSuccess }: Props) {
  const { mutate: register, isPending } = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      repeatPassword: '',
    },
  });

  const onSubmit = (data: SignUpFormData) => {
    register(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber || undefined,
      },
      {
        onSuccess: () => onSuccess(),
        onError: (err) => Alert.alert('Registration Failed', err.message),
      }
    );
  };

  return (
    <View className="gap-4">
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="First name"
                placeholder="John"
                autoCapitalize="words"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.firstName?.message}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Last name"
                placeholder="Doe"
                autoCapitalize="words"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.lastName?.message}
              />
            )}
          />
        </View>
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

      <Controller
        control={control}
        name="phoneNumber"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="Phone number (optional)"
            placeholder="+234 800 000 0000"
            keyboardType="phone-pad"
            leftIcon="call-outline"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phoneNumber?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="Password"
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
            label="Confirm password"
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

      <Button fullWidth loading={isPending} onPress={handleSubmit(onSubmit)} className="mt-2">
        Continue
      </Button>
    </View>
  );
}
