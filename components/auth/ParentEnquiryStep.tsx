import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { toast } from '@/components/ui/Toast';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { parentEnquirySchema, ParentEnquiryFormData } from '@/schemas/onboarding.schema';
import { useCreateEnquiry } from '@/hooks/useEnquiry';
import { useBrowseSchools } from '@/hooks/useSchool';
import { School } from '@/interface/school.interface';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EnquiryCategory } from '@/types';

const CATEGORIES: { label: string; value: EnquiryCategory }[] = [
  { label: 'School Fees', value: 'school_fees' },
  { label: 'Admission', value: 'admission' },
  { label: 'Curriculum', value: 'curriculum' },
  { label: 'Facilities', value: 'facilities' },
  { label: 'Transport', value: 'transport' },
  { label: 'Uniform', value: 'uniform' },
  { label: 'Extra Curricular', value: 'extra_curricular' },
  { label: 'Academic Calendar', value: 'academic_calendar' },
  { label: 'General', value: 'general' },
];

const GRADES = [
  'Pre-school', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2',
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3',
].map((g) => ({ label: g, value: g.toLowerCase().replace(/\s/g, '_') }));

type SubStep = 'school' | 'form' | 'success';

interface Props {
  onBack: () => void;
}

export function ParentEnquiryStep({ onBack }: Props) {
  const [subStep, setSubStep] = useState<SubStep>('school');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [search, setSearch] = useState('');

  const { data: schools = [], isLoading: loadingSchools } = useBrowseSchools({ search });
  const { mutate: createEnquiry, isPending } = useCreateEnquiry(() => setSubStep('success'));

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ParentEnquiryFormData>({
    resolver: zodResolver(parentEnquirySchema),
    defaultValues: {
      schoolId: undefined,
      subject: '',
      category: '',
      childName: '',
      childGrade: '',
      message: '',
      specificQuestions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'specificQuestions' as never,
  });

  const onSubmit = (data: ParentEnquiryFormData) => {
    createEnquiry(
      {
        schoolId: data.schoolId || undefined,
        subject: data.subject,
        category: data.category || undefined,
        childName: data.childName || undefined,
        childAge: data.childAge,
        childGrade: data.childGrade || undefined,
        message: data.message,
        specificQuestions: (data.specificQuestions ?? []).filter(Boolean),
      },
      { onError: (err) => toast.error(err.message) }
    );
  };

  if (subStep === 'success') {
    return (
      <View className="gap-5 items-center py-4">
        <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center">
          <Ionicons name="checkmark-circle" size={40} color="#059669" />
        </View>
        <View className="items-center gap-1">
          <Text className="text-xl font-bold text-gray-900">Enquiry Sent!</Text>
          <Text className="text-sm text-gray-500 text-center">
            {selectedSchool
              ? `Your enquiry has been sent to ${selectedSchool.name}.`
              : 'Your enquiry has been submitted.'}
            {' '}You'll be notified when they respond.
          </Text>
        </View>
        <Button fullWidth onPress={() => router.replace('/(tabs)/' as never)}>
          Go to Dashboard
        </Button>
      </View>
    );
  }

  if (subStep === 'form') {
    return (
      <View className="gap-4">
        {selectedSchool && (
          <View className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex-row items-center gap-3">
            <Ionicons name="business-outline" size={18} color="#6b7280" />
            <Text className="text-sm font-semibold text-gray-800 flex-1" numberOfLines={1}>
              {selectedSchool.name}
            </Text>
          </View>
        )}

        <Controller
          control={control}
          name="subject"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Subject *"
              placeholder="What is this enquiry about?"
              autoCapitalize="sentences"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.subject?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <Select
              label="Category (optional)"
              placeholder="Select a category..."
              options={CATEGORIES}
              value={value}
              onChange={onChange}
            />
          )}
        />

        <View className="rounded-xl border border-gray-100 bg-gray-50 p-4 gap-3">
          <Text className="text-sm font-semibold text-gray-700">Child information (optional)</Text>

          <Controller
            control={control}
            name="childName"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Child's name"
                placeholder="Full name"
                autoCapitalize="words"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="childAge"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Age"
                    placeholder="e.g. 10"
                    keyboardType="numeric"
                    value={value !== undefined ? String(value) : ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.childAge?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="childGrade"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Current grade"
                    placeholder="Grade..."
                    options={GRADES}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </View>
          </View>
        </View>

        <Controller
          control={control}
          name="message"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Message *"
              placeholder="Describe your enquiry in detail..."
              multiline
              numberOfLines={5}
              autoCapitalize="sentences"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.message?.message}
            />
          )}
        />

        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-700">Specific questions (optional)</Text>
          {fields.map((field, index) => (
            <View key={field.id} className="flex-row items-center gap-2">
              <View className="flex-1">
                <Controller
                  control={control}
                  name={`specificQuestions.${index}` as never}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <Input
                      placeholder={`Question ${index + 1}...`}
                      value={value as string}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>
              <Pressable onPress={() => remove(index)} hitSlop={8} className="mt-1">
                <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
              </Pressable>
            </View>
          ))}
          <Button variant="outline" size="sm" onPress={() => append('')}>
            + Add question
          </Button>
        </View>

        <Button fullWidth loading={isPending} onPress={handleSubmit(onSubmit)} className="mt-2">
          Send Enquiry
        </Button>
        <Button fullWidth variant="outline" onPress={() => setSubStep('school')}>
          Back
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="text-sm text-gray-500">
        Select a school to send your enquiry to, or skip to send a general enquiry.
      </Text>

      <Input
        placeholder="Search schools..."
        leftIcon="search-outline"
        value={search}
        onChangeText={setSearch}
      />

      {loadingSchools ? (
        <Text className="text-center text-sm text-gray-400 py-8">Loading schools...</Text>
      ) : schools.length === 0 ? (
        <View className="items-center py-10 gap-2">
          <Ionicons name="business-outline" size={40} color="#d1d5db" />
          <Text className="text-sm text-gray-400">No schools found</Text>
        </View>
      ) : (
        <FlatList
          data={schools}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedSchool(item);
                setValue('schoolId', item.id);
                setSubStep('form');
              }}
              className="rounded-xl border border-gray-200 bg-white p-4 gap-0.5"
            >
              <Text className="text-sm font-semibold text-gray-900">{item.name}</Text>
              {item.city && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="location-outline" size={12} color="#9ca3af" />
                  <Text className="text-xs text-gray-400">{item.city}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}

      <Button
        fullWidth
        variant="ghost"
        onPress={() => {
          setSelectedSchool(null);
          setValue('schoolId', undefined);
          setSubStep('form');
        }}
      >
        Skip school selection
      </Button>
      <Button fullWidth variant="outline" onPress={onBack}>
        Back
      </Button>
    </View>
  );
}
