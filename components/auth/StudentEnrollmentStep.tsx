import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { toast } from '@/components/ui/Toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { studentEnrollmentSchema, StudentEnrollmentFormData } from '@/schemas/onboarding.schema';
import { useCreateEnrollment } from '@/hooks/useEnrollment';
import { useBrowseSchools } from '@/hooks/useSchool';
import { School } from '@/interface/school.interface';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DocumentType, GradeLevel } from '@/types';

const DOCUMENT_TYPES: { label: string; value: DocumentType }[] = [
  { label: 'Previous School Result', value: 'previous_school_result' },
  { label: 'Birth Certificate', value: 'birth_certificate' },
  { label: 'Medical Certificate', value: 'medical_certificate' },
  { label: 'School Leaving Certificate', value: 'school_leaving_certificate' },
  { label: 'National ID', value: 'national_id' },
  { label: 'Passport', value: 'passport' },
  { label: 'Recommendation Letter', value: 'recommendation_letter' },
  { label: 'Portfolio', value: 'portfolio' },
  { label: 'BECE Result', value: 'bece_result' },
  { label: 'WAEC Result', value: 'waec_result' },
];

const GRADE_LEVELS: { label: string; value: GradeLevel }[] = [
  { label: 'Pre-school', value: 'pre_school' },
  { label: 'Nursery 1', value: 'nursery_1' },
  { label: 'Nursery 2', value: 'nursery_2' },
  { label: 'KG 1', value: 'kg_1' },
  { label: 'KG 2', value: 'kg_2' },
  { label: 'Primary 1', value: 'primary_1' },
  { label: 'Primary 2', value: 'primary_2' },
  { label: 'Primary 3', value: 'primary_3' },
  { label: 'Primary 4', value: 'primary_4' },
  { label: 'Primary 5', value: 'primary_5' },
  { label: 'Primary 6', value: 'primary_6' },
  { label: 'JSS 1', value: 'jss_1' },
  { label: 'JSS 2', value: 'jss_2' },
  { label: 'JSS 3', value: 'jss_3' },
  { label: 'SSS 1', value: 'sss_1' },
  { label: 'SSS 2', value: 'sss_2' },
  { label: 'SSS 3', value: 'sss_3' },
  { label: 'Undergraduate', value: 'undergraduate' },
  { label: 'Postgraduate', value: 'postgraduate' },
];

type SubStep = 'school' | 'form' | 'success';

interface DocFile {
  uri: string;
  name: string;
  mimeType: string;
}

interface Props {
  onBack: () => void;
}

export function StudentEnrollmentStep({ onBack }: Props) {
  const [subStep, setSubStep] = useState<SubStep>('school');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [search, setSearch] = useState('');
  const [doc1, setDoc1] = useState<DocFile | null>(null);
  const [doc2, setDoc2] = useState<DocFile | null>(null);

  const { data: schools = [], isLoading: loadingSchools } = useBrowseSchools({ search });
  const { mutate: createEnrollment, isPending } = useCreateEnrollment(() => setSubStep('success'));

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StudentEnrollmentFormData>({
    resolver: zodResolver(studentEnrollmentSchema),
    defaultValues: {
      schoolId: '',
      trainingInterest: '',
      gradeLevel: '',
      previousSchool: '',
      personalStatement: '',
      document1Type: '',
      document2Type: '',
    },
  });

  const pickDocument = async (slot: 1 | 2) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const file = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' };
      if (slot === 1) setDoc1(file);
      else setDoc2(file);
    }
  };

  const onSubmit = (data: StudentEnrollmentFormData) => {
    if (!doc1 || !doc2) {
      toast.error('Please attach both required documents.');
      return;
    }
    createEnrollment(
      {
        schoolId: data.schoolId,
        trainingInterest: data.trainingInterest,
        gradeLevel: data.gradeLevel || undefined,
        previousSchool: data.previousSchool || undefined,
        personalStatement: data.personalStatement || undefined,
        document1Type: data.document1Type,
        document2Type: data.document2Type,
        document1Uri: doc1.uri,
        document1Name: doc1.name,
        document1MimeType: doc1.mimeType,
        document2Uri: doc2.uri,
        document2Name: doc2.name,
        document2MimeType: doc2.mimeType,
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
          <Text className="text-xl font-bold text-gray-900">Application Submitted!</Text>
          <Text className="text-sm text-gray-500 text-center">
            Your enrollment application has been submitted to {selectedSchool?.name}. {"You'll be notified of updates."}
          </Text>
        </View>
        <Button fullWidth onPress={() => router.replace('/(tabs)/' as never)}>
          Go to Dashboard
        </Button>
      </View>
    );
  }

  if (subStep === 'form' && selectedSchool) {
    return (
      <View className="gap-4">
        <View className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex-row items-center gap-3">
          <Ionicons name="business-outline" size={18} color="#6b7280" />
          <Text className="text-sm font-semibold text-gray-800 flex-1" numberOfLines={1}>
            {selectedSchool.name}
          </Text>
        </View>

        <Controller
          control={control}
          name="trainingInterest"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Training interest *"
              placeholder="e.g. Science, Arts, Commerce..."
              autoCapitalize="sentences"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.trainingInterest?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="gradeLevel"
          render={({ field: { onChange, value } }) => (
            <Select
              label="Grade level (optional)"
              placeholder="Select grade..."
              options={GRADE_LEVELS}
              value={value}
              onChange={onChange}
              error={errors.gradeLevel?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="previousSchool"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Previous school (optional)"
              placeholder="Name of last school attended"
              autoCapitalize="words"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.previousSchool?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="personalStatement"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Personal statement (optional)"
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.personalStatement?.message}
            />
          )}
        />

        {([1, 2] as const).map((slot) => {
          const file = slot === 1 ? doc1 : doc2;
          return (
            <View key={slot} className="gap-3">
              <Controller
                control={control}
                name={slot === 1 ? 'document1Type' : 'document2Type'}
                render={({ field: { onChange, value } }) => (
                  <Select
                    label={`Document ${slot} type *`}
                    placeholder="Select document type..."
                    options={DOCUMENT_TYPES}
                    value={value}
                    onChange={onChange}
                    error={slot === 1 ? errors.document1Type?.message : errors.document2Type?.message}
                  />
                )}
              />
              <Pressable
                onPress={() => pickDocument(slot)}
                className="flex-row items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3"
              >
                <Ionicons name="attach-outline" size={18} color="#6b7280" />
                <Text className="text-sm text-gray-500 flex-1" numberOfLines={1}>
                  {file ? file.name : `Tap to attach document ${slot}`}
                </Text>
                {file && (
                  <Pressable
                    onPress={() => slot === 1 ? setDoc1(null) : setDoc2(null)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                  </Pressable>
                )}
              </Pressable>
            </View>
          );
        })}

        <Button fullWidth loading={isPending} onPress={handleSubmit(onSubmit)} className="mt-2">
          Submit Enrollment
        </Button>
        <Button fullWidth variant="outline" onPress={() => setSubStep('school')}>
          Back
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Input
        placeholder="Search schools by name or city..."
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

      <Button fullWidth variant="ghost" onPress={() => router.replace('/(tabs)/' as never)}>
        Skip for now
      </Button>
      <Button fullWidth variant="outline" onPress={onBack}>
        Back
      </Button>
    </View>
  );
}
