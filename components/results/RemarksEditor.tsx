import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ReportCard } from '@/interface/result.interface';
import { useUpdateRemarks } from '@/hooks/useResults';

const BRAND = '#4C3FC4';

const inputStyle = {
  borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#fff',
  paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#111827',
} as const;

/**
 * Staff-only remarks form under the report card. Every box is optional: an
 * empty one is not shown on the report card. Students see remarks once the
 * results are published.
 */
export default function RemarksEditor({ rc, isAdminLevel }: { rc: ReportCard; isAdminLevel: boolean }) {
  const { termResult, subjectResults } = rc;
  const { mutate, isPending } = useUpdateRemarks(termResult.id);

  const [teacher, setTeacher] = useState(termResult.teacherRemarks ?? '');
  const [principal, setPrincipal] = useState(termResult.principalRemarks ?? '');
  const [subjects, setSubjects] = useState<Record<string, string>>(() =>
    Object.fromEntries(subjectResults.map(s => [s.subjectId, s.remarks ?? ''])),
  );

  const save = () => {
    mutate(
      {
        teacherRemarks: teacher,
        ...(isAdminLevel ? { principalRemarks: principal } : {}),
        subjectRemarks: subjectResults.map(s => ({ subjectId: s.subjectId, remarks: subjects[s.subjectId] ?? '' })),
      },
      {
        onSuccess: () => Alert.alert('Saved', 'Remarks saved.'),
        onError: (err: Error) => Alert.alert('Could not save', err.message),
      },
    );
  };

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, gap: 14 }}>
      <View>
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Remarks</Text>
        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Optional. Anything left empty is not shown on the report card.</Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{"Class teacher's remark"}</Text>
        <TextInput
          value={teacher} onChangeText={setTeacher} multiline maxLength={1000}
          placeholder="e.g. A hardworking student who participates well in class."
          placeholderTextColor="#9ca3af" style={[inputStyle, { minHeight: 76, textAlignVertical: 'top' }]}
        />
      </View>

      {isAdminLevel && (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{"Principal's remark"}</Text>
          <TextInput
            value={principal} onChangeText={setPrincipal} multiline maxLength={1000}
            placeholder="Optional" placeholderTextColor="#9ca3af"
            style={[inputStyle, { minHeight: 76, textAlignVertical: 'top' }]}
          />
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Subject remarks</Text>
        {subjectResults.map(s => (
          <View key={s.subjectId} style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: '#4b5563' }}>{s.subject?.name ?? 'Subject'}</Text>
            <TextInput
              value={subjects[s.subjectId] ?? ''} maxLength={500}
              onChangeText={t => setSubjects(prev => ({ ...prev, [s.subjectId]: t }))}
              placeholder="Optional" placeholderTextColor="#9ca3af" style={inputStyle}
            />
          </View>
        ))}
      </View>

      <Pressable onPress={save} disabled={isPending} style={({ pressed }) => ({ opacity: pressed || isPending ? 0.7 : 1 })}>
        <View style={{ backgroundColor: BRAND, borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {isPending && <ActivityIndicator size="small" color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Save remarks</Text>
        </View>
      </Pressable>
    </View>
  );
}
