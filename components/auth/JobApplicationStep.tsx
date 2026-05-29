import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { toast } from '@/components/ui/Toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { jobApplicationSchema, JobApplicationFormData } from '@/schemas/onboarding.schema';
import { useBrowseJobs, useApplyForJob } from '@/hooks/useJob';
import { Job } from '@/interface/job.interface';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  onBack: () => void;
}

type SubStep = 'browse' | 'apply' | 'success';

export function JobApplicationStep({ onBack }: Props) {
  const [subStep, setSubStep] = useState<SubStep>('browse');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState('');
  const [resumeFile, setResumeFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  const { data: jobs = [], isLoading: loadingJobs } = useBrowseJobs({ search });
  const { mutate: apply, isPending: applying } = useApplyForJob(
    selectedJob?.school?.id ?? '',
    () => setSubStep('success')
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: { jobId: '', coverLetter: '', yearsOfExperience: 0, portfolioUrl: '' },
  });

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setResumeFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' });
    }
  };

  const onSubmit = (data: JobApplicationFormData) => {
    if (!selectedJob) return;
    apply(
      {
        jobId: data.jobId,
        coverLetter: data.coverLetter,
        yearsOfExperience: data.yearsOfExperience,
        portfolioUrl: data.portfolioUrl || undefined,
        resumeUri: resumeFile?.uri,
        resumeName: resumeFile?.name,
        resumeMimeType: resumeFile?.mimeType,
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
            Your application for {selectedJob?.title} has been submitted successfully.
          </Text>
        </View>
        <Button fullWidth onPress={() => router.replace('/(tabs)/' as never)}>
          Go to Dashboard
        </Button>
      </View>
    );
  }

  if (subStep === 'apply' && selectedJob) {
    return (
      <View className="gap-4">
        <View className="rounded-xl border border-gray-200 bg-gray-50 p-4 gap-1">
          <Text className="text-sm font-semibold text-gray-900">{selectedJob.title}</Text>
          <Text className="text-xs text-gray-500">{selectedJob.school.name} · {selectedJob.location ?? 'Remote'}</Text>
        </View>

        <Controller
          control={control}
          name="coverLetter"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Cover letter"
              placeholder="Tell us why you're the right fit (min. 20 characters)..."
              multiline
              numberOfLines={5}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.coverLetter?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="yearsOfExperience"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Years of experience"
              placeholder="0"
              keyboardType="numeric"
              value={String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.yearsOfExperience?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="portfolioUrl"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Portfolio URL (optional)"
              placeholder="https://yourportfolio.com"
              keyboardType="url"
              leftIcon="link-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.portfolioUrl?.message}
            />
          )}
        />

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-gray-700">Resume (optional)</Text>
          <Pressable
            onPress={pickResume}
            className="flex-row items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3"
          >
            <Ionicons name="document-attach-outline" size={20} color="#6b7280" />
            <Text className="text-sm text-gray-500 flex-1" numberOfLines={1}>
              {resumeFile ? resumeFile.name : 'Tap to attach PDF or Word document'}
            </Text>
            {resumeFile && (
              <Pressable onPress={() => setResumeFile(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </Pressable>
            )}
          </Pressable>
        </View>

        <Button fullWidth loading={applying} onPress={handleSubmit(onSubmit)} className="mt-2">
          Submit Application
        </Button>
        <Button fullWidth variant="outline" onPress={() => setSubStep('browse')}>
          Back
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Input
        placeholder="Search jobs by title or school..."
        leftIcon="search-outline"
        value={search}
        onChangeText={setSearch}
      />

      {loadingJobs ? (
        <Text className="text-center text-sm text-gray-400 py-8">Loading jobs...</Text>
      ) : jobs.length === 0 ? (
        <View className="items-center py-10 gap-2">
          <Ionicons name="briefcase-outline" size={40} color="#d1d5db" />
          <Text className="text-sm text-gray-400">No jobs found</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedJob(item);
                setValue('jobId', item.id);
                setSubStep('apply');
              }}
              className="rounded-xl border border-gray-200 bg-white p-4 gap-1"
            >
              <Text className="text-sm font-semibold text-gray-900">{item.title}</Text>
              <Text className="text-xs text-gray-500">{item.school.name}</Text>
              <View className="flex-row gap-2 mt-1">
                {item.employmentType && (
                  <View className="rounded-full bg-indigo-50 px-2 py-0.5">
                    <Text className="text-xs text-indigo-700">{item.employmentType}</Text>
                  </View>
                )}
                {item.location && (
                  <View className="flex-row items-center gap-0.5">
                    <Ionicons name="location-outline" size={12} color="#9ca3af" />
                    <Text className="text-xs text-gray-400">{item.location}</Text>
                  </View>
                )}
              </View>
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
