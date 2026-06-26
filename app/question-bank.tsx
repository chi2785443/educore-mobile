import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  Modal, TextInput, RefreshControl, Image, Alert, StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useQuestions, useCreateObjective, useCreateTheory } from '@/hooks/useQuestionBank';
import { useSubjects } from '@/hooks/useAssessment';
import { Question, QuestionType, Difficulty } from '@/interface/question.interface';
import { questionBankService } from '@/services/question-bank.service';

/* ── Difficulty config ──────────────────────────────────────────── */
const DIFF_CONFIG: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy:   { label: 'Easy',   color: '#16a34a', bg: '#dcfce7' },
  medium: { label: 'Medium', color: '#d97706', bg: '#fef3c7' },
  hard:   { label: 'Hard',   color: '#dc2626', bg: '#fee2e2' },
};

/* ── Question card ─────────────────────────────────────────────── */
function QuestionCard({ q }: { q: Question }) {
  const diff = DIFF_CONFIG[q.difficulty] ?? DIFF_CONFIG.medium;
  const subjectColor = q.subject?.color ?? '#6366f1';
  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: '#f1f5f9', gap: 10,
      shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {/* Type badge */}
        <View style={{ backgroundColor: q.type === 'objective' ? '#eff6ff' : '#f5f3ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: q.type === 'objective' ? '#2563eb' : '#7c3aed', textTransform: 'capitalize' }}>
            {q.type}
          </Text>
        </View>
        {/* Difficulty */}
        <View style={{ backgroundColor: diff.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: diff.color }}>{diff.label}</Text>
        </View>
        {/* Subject */}
        {q.subject && (
          <View style={{ backgroundColor: subjectColor + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: subjectColor }}>{q.subject.name}</Text>
          </View>
        )}
        {/* Verified */}
        {q.isVerified && <Ionicons name="checkmark-circle" size={16} color="#16a34a" />}
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', lineHeight: 20 }} numberOfLines={3}>
        {q.questionText}
      </Text>
      {q.options && q.options.length > 0 && (
        <View style={{ gap: 4 }}>
          {q.options.map((opt, i) => (
            <View key={i} style={{
              flexDirection: 'row', gap: 8, alignItems: 'flex-start',
              backgroundColor: opt === q.correctAnswer ? '#f0fdf4' : '#f8fafc',
              borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
              borderWidth: 1, borderColor: opt === q.correctAnswer ? '#bbf7d0' : '#f1f5f9',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: opt === q.correctAnswer ? '#16a34a' : '#64748b', width: 16 }}>
                {['A', 'B', 'C', 'D'][i] ?? String(i + 1)}
              </Text>
              <Text style={{ flex: 1, fontSize: 12, color: opt === q.correctAnswer ? '#15803d' : '#475569' }}>{opt}</Text>
              {opt === q.correctAnswer && <Ionicons name="checkmark" size={13} color="#16a34a" />}
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: '#9ca3af' }}>Used {q.usageCount} time{q.usageCount !== 1 ? 's' : ''}</Text>
        {q.category && <Text style={{ fontSize: 11, color: '#9ca3af' }}>#{q.category}</Text>}
      </View>
    </View>
  );
}

/* ── Input helper ─────────────────────────────────────────────────*/
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>
        {label}{required && <Text style={{ color: '#dc2626' }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}
const inputStyle = {
  backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb',
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  fontSize: 14, color: '#1e293b',
};

/* ── Create modal ─────────────────────────────────────────────────*/
function CreateModal({
  visible, onClose, type, schoolId,
}: { visible: boolean; onClose: () => void; type: QuestionType; schoolId: string }) {
  const { data: subjects = [] } = useSubjects(visible ? schoolId : undefined);
  const createObj = useCreateObjective(schoolId);
  const createThy = useCreateTheory(schoolId);
  const isPending = createObj.isPending || createThy.isPending;

  const [questionText, setQuestionText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const reset = () => {
    setQuestionText(''); setSelectedSubject(''); setDifficulty('medium');
    setOptions(['', '', '', '']); setCorrectIdx(0); setExplanation('');
    setCategory(''); setImageUri(null); setImageUrl(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to add a question image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setUploadingImage(true);
    try {
      const fileName = asset.fileName ?? `question-image-${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const url = await questionBankService.uploadImage(asset.uri, fileName, mimeType);
      setImageUrl(url);
    } catch {
      toast.error('Image upload failed');
      setImageUri(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    if (!questionText.trim() || !selectedSubject) {
      toast.error('Question text and subject are required');
      return;
    }
    if (type === 'objective') {
      const filled = options.filter(o => o.trim());
      if (filled.length < 2) { toast.error('Add at least 2 answer options'); return; }
      if (!options[correctIdx]?.trim()) { toast.error('Please select the correct answer'); return; }
      try {
        await createObj.mutateAsync({
          schoolId, subjectId: selectedSubject,
          questionText: questionText.trim(),
          options: options.filter(o => o.trim()),
          correctAnswer: options[correctIdx].trim(),
          difficulty, explanation: explanation.trim() || undefined,
          category: category.trim() || undefined,
          questionImage: imageUrl ?? undefined,
        });
        reset(); onClose();
      } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to create question'); }
    } else {
      try {
        await createThy.mutateAsync({
          schoolId, subjectId: selectedSubject,
          questionText: questionText.trim(), difficulty,
          explanation: explanation.trim() || undefined,
          category: category.trim() || undefined,
          questionImage: imageUrl ?? undefined,
        });
        reset(); onClose();
      } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to create question'); }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          <View style={{ width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', flex: 1 }}>
              New {type === 'objective' ? 'Objective' : 'Theory'} Question
            </Text>
            <Pressable onPress={() => { reset(); onClose(); }} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={16} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
            {/* Question text */}
            <Field label="Question" required>
              <TextInput value={questionText} onChangeText={setQuestionText} placeholder="Enter question text..." placeholderTextColor="#9ca3af" multiline numberOfLines={3} textAlignVertical="top" style={[inputStyle, { minHeight: 80 }]} />
            </Field>

            {/* Subject */}
            <Field label="Subject" required>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {subjects.map(s => {
                  const active = selectedSubject === s.id;
                  return (
                    <Pressable key={s.id} onPress={() => setSelectedSubject(s.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? (s.color ?? '#6366f1') : '#f3f4f6', borderWidth: 1, borderColor: active ? (s.color ?? '#6366f1') : '#e5e7eb' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{s.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Field>

            {/* Difficulty */}
            <Field label="Difficulty">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                  const cfg = DIFF_CONFIG[d];
                  const active = difficulty === d;
                  return (
                    <View key={d} style={{ flex: 1 }}>
                      <Pressable onPress={() => setDifficulty(d)} style={{ paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: active ? cfg.color : '#f3f4f6', borderWidth: 1, borderColor: active ? cfg.color : '#e5e7eb' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{cfg.label}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </Field>

            {/* Objective options */}
            {type === 'objective' && (
              <Field label="Options (mark correct answer)">
                <View style={{ gap: 8 }}>
                  {options.map((opt, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Pressable
                        onPress={() => setCorrectIdx(i)}
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: correctIdx === i ? '#6366f1' : '#f3f4f6', borderWidth: correctIdx === i ? 0 : 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        {correctIdx === i && <Ionicons name="checkmark" size={13} color="#fff" />}
                      </Pressable>
                      <TextInput
                        value={opt}
                        onChangeText={v => { const n = [...options]; n[i] = v; setOptions(n); }}
                        placeholder={`Option ${['A', 'B', 'C', 'D'][i]}`}
                        placeholderTextColor="#9ca3af"
                        style={[inputStyle, { flex: 1 }]}
                      />
                    </View>
                  ))}
                </View>
              </Field>
            )}

            {/* Question Image (optional) */}
            <Field label="Question Image (optional)">
              {imageUri ? (
                <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' }}>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                  {uploadingImage && (
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 12, marginTop: 6 }}>Uploading…</Text>
                    </View>
                  )}
                  {!uploadingImage && (
                    <Pressable
                      onPress={() => { setImageUri(null); setImageUrl(null); }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  )}
                </View>
              ) : (
                <Pressable onPress={pickImage} style={{ borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#d1d5db', paddingVertical: 20, alignItems: 'center', gap: 6, backgroundColor: '#f9fafb' }}>
                  <Ionicons name="image-outline" size={24} color="#9ca3af" />
                  <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>Tap to add image</Text>
                  <Text style={{ fontSize: 11, color: '#9ca3af' }}>JPEG, PNG, WebP · max 1 MB</Text>
                </Pressable>
              )}
            </Field>

            {/* Explanation */}
            <Field label="Explanation (optional)">
              <TextInput value={explanation} onChangeText={setExplanation} placeholder="Explain the answer..." placeholderTextColor="#9ca3af" multiline numberOfLines={2} textAlignVertical="top" style={[inputStyle, { minHeight: 60 }]} />
            </Field>

            {/* Category */}
            <Field label="Category (optional)">
              <TextInput value={category} onChangeText={setCategory} placeholder="e.g. Algebra, Grammar..." placeholderTextColor="#9ca3af" style={inputStyle} />
            </Field>

            {/* Submit */}
            <Pressable onPress={handleCreate} disabled={isPending || uploadingImage} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <View style={{ backgroundColor: isPending || uploadingImage ? '#a5b4fc' : '#6366f1', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                {isPending && <ActivityIndicator color="#fff" size="small" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  {isPending ? 'Creating…' : uploadingImage ? 'Uploading image…' : 'Create Question'}
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ── Type picker modal ──────────────────────────────────────────── */
function TypePickerModal({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (t: QuestionType) => void }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={onClose}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }}>
          <View style={{ width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 8 }} />
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 4 }}>Question Type</Text>
          {(['objective', 'theory'] as QuestionType[]).map(t => (
            <Pressable key={t} onPress={() => onSelect(t)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t === 'objective' ? '#eff6ff' : '#f5f3ff', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={t === 'objective' ? 'list-outline' : 'create-outline'} size={22} color={t === 'objective' ? '#2563eb' : '#7c3aed'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', textTransform: 'capitalize' }}>{t}</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {t === 'objective' ? 'Multiple choice with correct answer' : 'Open-ended written response'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </View>
            </Pressable>
          ))}
          <View style={{ height: 8 }} />
        </View>
      </Pressable>
    </Modal>
  );
}

/* ── Main screen ────────────────────────────────────────────────── */
export default function QuestionBankScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';

  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<QuestionType | undefined>();
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | undefined>();
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [createType, setCreateType] = useState<QuestionType>('objective');
  const [showCreate, setShowCreate] = useState(false);

  const { data: subjects = [] } = useSubjects(schoolId);
  const { data: questions = [], isLoading, refetch } = useQuestions(schoolId, {
    subjectId: selectedSubject,
    type: selectedType,
    difficulty: selectedDiff,
  });
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#1a0c1c', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Question Bank</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowTypePicker(true)}
            style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: '#e11d48', alignItems: 'center', justifyContent: 'center', shadowColor: '#e11d48', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6 }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Subject filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row' }}>
          <Pressable onPress={() => setSelectedSubject(undefined)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: !selectedSubject ? '#e11d48' : 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: !selectedSubject ? '#e11d48' : 'rgba(255,255,255,0.1)' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>All</Text>
          </Pressable>
          {subjects.map(s => {
            const active = selectedSubject === s.id;
            return (
              <Pressable key={s.id} onPress={() => setSelectedSubject(active ? undefined : s.id)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? (s.color ?? '#6366f1') : 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: active ? (s.color ?? '#6366f1') : 'rgba(255,255,255,0.1)' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{s.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Type + difficulty row */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', gap: 8 }}>
        {/* Type toggle */}
        {([undefined, 'objective', 'theory'] as (QuestionType | undefined)[]).map(t => (
          <Pressable key={t ?? 'all'} onPress={() => setSelectedType(t)} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: selectedType === t ? '#1a0c1c' : '#f3f4f6', borderWidth: 1, borderColor: selectedType === t ? '#1a0c1c' : '#e5e7eb' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: selectedType === t ? '#fff' : '#6b7280', textTransform: 'capitalize' }}>{t ?? 'All'}</Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        {/* Difficulty */}
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
          const cfg = DIFF_CONFIG[d];
          const active = selectedDiff === d;
          return (
            <Pressable key={d} onPress={() => setSelectedDiff(active ? undefined : d)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: active ? cfg.color : '#f3f4f6', borderWidth: 1, borderColor: active ? cfg.color : '#e5e7eb' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{cfg.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#e11d48" size="large" />
        </View>
      ) : questions.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="help-circle-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No questions yet</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Tap the + button to create your first question.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
          {questions.map(q => <QuestionCard key={q.id} q={q} />)}
        </ScrollView>
      )}

      {/* Type picker → then create modal */}
      <TypePickerModal
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        onSelect={t => { setCreateType(t); setShowTypePicker(false); setShowCreate(true); }}
      />
      <CreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        type={createType}
        schoolId={schoolId}
      />
    </SafeAreaView>
  );
}
