import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { toast } from '@/components/ui/Toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { signInSchema, SignInFormData } from '@/schemas/auth.schema';
import { useLogin } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function SignInForm() {
  const { mutate: login, isPending } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: SignInFormData) => {
    login(data, {
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <View className="gap-5">
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
        name="password"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            leftIcon="lock-closed-outline"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      <Link href="/(auth)/forgot-password" asChild>
        <Pressable className="self-end">
          <Text className="text-sm text-[#4C3FC4] font-medium">Forgot password?</Text>
        </Pressable>
      </Link>

      <Button fullWidth loading={isPending} onPress={handleSubmit(onSubmit)}>
        Sign In
      </Button>

      <View className="flex-row justify-center items-center gap-1">
        <Text className="text-sm text-gray-500">{"Don't have an account?"}</Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text className="text-sm text-[#4C3FC4] font-semibold">Sign Up</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
