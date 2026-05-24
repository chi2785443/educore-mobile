import React from 'react';
import { View, Text, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { schoolRegistrationSchema, SchoolRegistrationFormData } from '@/schemas/onboarding.schema';
import { useCreateSchool } from '@/hooks/useSchool';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';

interface Props {
  onBack: () => void;
}

export function SchoolRegistrationStep({ onBack }: Props) {
  const { mutate: createSchool, isPending } = useCreateSchool(() => {
    router.replace('/(tabs)/' as never);
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolRegistrationFormData>({
    resolver: zodResolver(schoolRegistrationSchema),
    defaultValues: { name: '', code: '', email: '', phone: '', address: '', city: '' },
  });

  const onSubmit = (data: SchoolRegistrationFormData) => {
    createSchool(
      { ...data, email: data.email || undefined },
      { onError: (err) => Alert.alert('Error', err.message) }
    );
  };

  return (
    <View className="gap-4">
      <View className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
        <Text className="text-sm font-semibold text-emerald-700">Register your school</Text>
        <Text className="text-xs text-emerald-600 mt-0.5">
          Create your school profile to start managing staff, students and academics.
        </Text>
      </View>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="School name"
            placeholder="e.g. Greenfield Academy"
            autoCapitalize="words"
            leftIcon="business-outline"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="School code"
            placeholder="e.g. GFA-001"
            hint="Unique identifier — letters, numbers, hyphens, underscores"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.code?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label="School email (optional)"
            placeholder="info@school.com"
            keyboardType="email-address"
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
        name="phone"
        render={({ field: { onChange, value } }) => (
          <PhoneInput
            label="Phone"
            optional
            value={value ?? ''}
            onChange={onChange}
            error={errors.phone?.message}
          />
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="City (optional)"
                placeholder="Lagos"
                autoCapitalize="words"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.city?.message}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Address (optional)"
                placeholder="12 Main St"
                autoCapitalize="sentences"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.address?.message}
              />
            )}
          />
        </View>
      </View>

      <Button fullWidth loading={isPending} onPress={handleSubmit(onSubmit)} className="mt-2">
        Create School
      </Button>

      <Button fullWidth variant="outline" onPress={onBack}>
        Back
      </Button>
    </View>
  );
}
