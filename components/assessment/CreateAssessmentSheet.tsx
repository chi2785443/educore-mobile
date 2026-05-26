import React, { useEffect } from 'react';
import {
  Modal, View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAssessmentSchema,
  CreateAssessmentFormValues,
} from '@/schemas/assessment.schema';
import { useCreateAssessment, useSubjects } from '@/hooks/useAssessment';
import { AssessmentType, QuestionType } from '@/interface/assessment.interface';
import { useAuthStore } from '@/store/authStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  classroomId: string;
  schoolId: string;
}

const TYPE_OPTIONS: { value: AssessmentType; label: string; color: string }[] = [
  { value: 'exam',       label: 'Exam',       color: '#e11d48' },
  { value: 'test',       label: 'Test',       color: '#7c3aed' },
  { value: 'quiz',       label: 'Quiz',       color: '#0ea5e9' },
  { value: 'assignment', label: 'Assignment', color: '#10b981' },
];

const QTYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'objective', label: 'Objective' },
  { value: 'theory',    label: 'Theory' },
  { value: 'mixed',     label: 'Mixed' },
];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{label}</Text>
      {children}
      {error && <Text style={{ fontSize: 12, color: '#dc2626' }}>{error}</Text>}
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#f8fafc',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 11,
  fontSize: 14,
  color: '#1e293b',
};

export default function CreateAssessmentSheet({ visible, onClose, classroomId, schoolId }: Props) {
  const user = useAuthStore(s => s.user);
  const { data: subjects = [] } = useSubjects(visible ? schoolId : undefined);
  const createMutation = useCreateAssessment(classroomId);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAssessmentFormValues>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: {
      type: 'exam',
      questionType: 'objective',
      totalMarks: 100,
      passingMarks: 50,
    },
  });

  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  const onSubmit = async (values: CreateAssessmentFormValues) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        classroomId,
        schoolId,
      });
      onClose();
      Alert.alert('Created', 'Assessment created as draft. Add questions and publish from this screen.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create assessment');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          {/* Handle bar */}
          <View style={{ width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', flex: 1 }}>New Assessment</Text>
            <Pressable onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}
          >
            {/* Title */}
            <Field label="Title *" error={errors.title?.message}>
              <Controller
                control={control}
                name="title"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. Mid-term Mathematics Exam"
                    placeholderTextColor="#9ca3af"
                    style={inputStyle}
                  />
                )}
              />
            </Field>

            {/* Type */}
            <Field label="Type *" error={errors.type?.message}>
              <Controller
                control={control}
                name="type"
                render={({ field: { value, onChange } }) => (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {TYPE_OPTIONS.map(opt => {
                      const isActive = value === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => onChange(opt.value)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: isActive ? opt.color : '#f3f4f6',
                            borderWidth: 1,
                            borderColor: isActive ? opt.color : '#e5e7eb',
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#fff' : '#6b7280' }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Field>

            {/* Question Type */}
            <Field label="Question Type *" error={errors.questionType?.message}>
              <Controller
                control={control}
                name="questionType"
                render={({ field: { value, onChange } }) => (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {QTYPE_OPTIONS.map(opt => {
                      const isActive = value === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => onChange(opt.value)}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 12,
                            backgroundColor: isActive ? '#6366f1' : '#f3f4f6',
                            borderWidth: 1,
                            borderColor: isActive ? '#6366f1' : '#e5e7eb',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : '#6b7280' }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Field>

            {/* Subject */}
            <Field label="Subject *" error={errors.subjectId?.message}>
              <Controller
                control={control}
                name="subjectId"
                render={({ field: { value, onChange } }) => (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
                      {subjects.length === 0 && (
                        <Text style={{ color: '#9ca3af', fontSize: 13, paddingVertical: 8 }}>
                          No subjects found
                        </Text>
                      )}
                      {subjects.map(sub => {
                        const isActive = value === sub.id;
                        return (
                          <Pressable
                            key={sub.id}
                            onPress={() => onChange(sub.id)}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 20,
                              backgroundColor: isActive ? (sub.color ?? '#6366f1') : '#f3f4f6',
                              borderWidth: 1,
                              borderColor: isActive ? (sub.color ?? '#6366f1') : '#e5e7eb',
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#fff' : '#6b7280' }}>
                              {sub.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              />
            </Field>

            {/* Total + Passing marks */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Total Marks *" error={errors.totalMarks?.message}>
                  <Controller
                    control={control}
                    name="totalMarks"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value?.toString()}
                        onChangeText={t => onChange(Number(t) || 0)}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        placeholder="100"
                        placeholderTextColor="#9ca3af"
                        style={inputStyle}
                      />
                    )}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Passing Marks *" error={errors.passingMarks?.message}>
                  <Controller
                    control={control}
                    name="passingMarks"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value?.toString()}
                        onChangeText={t => onChange(Number(t) || 0)}
                        onBlur={onBlur}
                        keyboardType="numeric"
                        placeholder="50"
                        placeholderTextColor="#9ca3af"
                        style={inputStyle}
                      />
                    )}
                  />
                </Field>
              </View>
            </View>

            {/* Duration */}
            <Field label="Duration (minutes)" error={errors.duration?.message}>
              <Controller
                control={control}
                name="duration"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    value={value?.toString() ?? ''}
                    onChangeText={t => onChange(t ? Number(t) : undefined)}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    placeholder="e.g. 60"
                    placeholderTextColor="#9ca3af"
                    style={inputStyle}
                  />
                )}
              />
            </Field>

            {/* Term + Academic Year */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Term *" error={errors.term?.message}>
                  <Controller
                    control={control}
                    name="term"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="e.g. First"
                        placeholderTextColor="#9ca3af"
                        style={inputStyle}
                      />
                    )}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Academic Year *" error={errors.academicYear?.message}>
                  <Controller
                    control={control}
                    name="academicYear"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="2025/2026"
                        placeholderTextColor="#9ca3af"
                        style={inputStyle}
                      />
                    )}
                  />
                </Field>
              </View>
            </View>

            {/* Scheduled date + times */}
            <Field label="Scheduled Date (YYYY-MM-DD)" error={errors.scheduledDate?.message}>
              <Controller
                control={control}
                name="scheduledDate"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. 2025-06-15"
                    placeholderTextColor="#9ca3af"
                    style={inputStyle}
                  />
                )}
              />
            </Field>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Start Time (HH:mm)" error={errors.startTime?.message}>
                  <Controller
                    control={control}
                    name="startTime"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="09:00"
                        placeholderTextColor="#9ca3af"
                        style={inputStyle}
                      />
                    )}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="End Time (HH:mm)" error={errors.endTime?.message}>
                  <Controller
                    control={control}
                    name="endTime"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="10:00"
                        placeholderTextColor="#9ca3af"
                        style={inputStyle}
                      />
                    )}
                  />
                </Field>
              </View>
            </View>

            {/* Instructions */}
            <Field label="Instructions" error={errors.instructions?.message}>
              <Controller
                control={control}
                name="instructions"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Any special instructions for students..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={[inputStyle, { minHeight: 90, paddingTop: 11 }]}
                  />
                )}
              />
            </Field>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
              style={({ pressed }) => ({ opacity: pressed || createMutation.isPending ? 0.8 : 1, marginTop: 4 })}
            >
              <View style={{
                backgroundColor: '#6366f1',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}>
                {createMutation.isPending && <ActivityIndicator color="#fff" size="small" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  {createMutation.isPending ? 'Creating…' : 'Create Assessment'}
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
