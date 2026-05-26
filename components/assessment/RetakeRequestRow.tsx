import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RetakeRequest } from '@/interface/attempt.interface';
import { useRespondToRetake } from '@/hooks/useRetakeRequest';

interface Props {
  request: RetakeRequest;
  assessmentId: string;
}

const STATUS_STYLE: Record<RetakeRequest['status'], { bg: string; text: string; label: string }> = {
  pending:  { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
  approved: { bg: '#dcfce7', text: '#16a34a', label: 'Approved' },
  denied:   { bg: '#fee2e2', text: '#dc2626', label: 'Denied' },
};

export default function RetakeRequestRow({ request, assessmentId }: Props) {
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const respondMutation = useRespondToRetake(assessmentId);

  const studentName = request.student
    ? `${request.student.firstName} ${request.student.lastName}`
    : 'Student';
  const statusStyle = STATUS_STYLE[request.status];

  const handleRespond = async (status: 'approved' | 'denied') => {
    await respondMutation.mutateAsync({
      id: request.id,
      payload: { status, responseNote: noteText.trim() || undefined },
    });
    setShowNote(false);
    setNoteText('');
  };

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#f1f5f9',
      marginBottom: 10,
      padding: 14,
      gap: 10,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    }}>
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b' }}>{studentName}</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
            {new Date(request.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={{ backgroundColor: statusStyle.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: statusStyle.text }}>{statusStyle.label}</Text>
        </View>
      </View>

      {/* Reason */}
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 3 }}>Reason</Text>
        <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18 }}>{request.reason}</Text>
      </View>

      {/* Response note if already responded */}
      {request.responseNote && (
        <View style={{ backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bbf7d0' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a', marginBottom: 3 }}>Your Response</Text>
          <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18 }}>{request.responseNote}</Text>
        </View>
      )}

      {/* Actions (pending only) */}
      {request.status === 'pending' && (
        <View style={{ gap: 8 }}>
          {showNote && (
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add a note (optional)..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 10,
                padding: 10,
                fontSize: 13,
                color: '#1e293b',
                minHeight: 70,
              }}
            />
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setShowNote(v => !v)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc' }}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#6b7280" />
            </Pressable>

            <Pressable
              onPress={() => handleRespond('denied')}
              disabled={respondMutation.isPending}
              style={({ pressed }) => ({ flex: 1, opacity: pressed || respondMutation.isPending ? 0.7 : 1 })}
            >
              <View style={{ paddingVertical: 8, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center' }}>
                {respondMutation.isPending ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>Deny</Text>
                )}
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleRespond('approved')}
              disabled={respondMutation.isPending}
              style={({ pressed }) => ({ flex: 1, opacity: pressed || respondMutation.isPending ? 0.7 : 1 })}
            >
              <View style={{ paddingVertical: 8, borderRadius: 10, backgroundColor: '#dcfce7', alignItems: 'center' }}>
                {respondMutation.isPending ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a' }}>Approve</Text>
                )}
              </View>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
