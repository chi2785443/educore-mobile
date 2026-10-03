import React from 'react';
import { View, Text } from 'react-native';
import { SubjectResult } from '@/interface/result.interface';

/** Teacher remarks per subject. Renders nothing when no subject has one. */
export default function SubjectRemarksCard({ subjects }: { subjects: SubjectResult[] }) {
  const withRemarks = subjects.filter(s => !!s.remarks);
  if (withRemarks.length === 0) return null;
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, gap: 10 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject Remarks</Text>
      {withRemarks.map(s => (
        <View key={s.id}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{s.subject?.name ?? 'Subject'}</Text>
          <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 19, marginTop: 1 }}>{s.remarks}</Text>
        </View>
      ))}
    </View>
  );
}
