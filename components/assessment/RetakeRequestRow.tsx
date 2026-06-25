import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
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
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    }}>
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: request.status === 'pending' ? 10 : 14 }}>
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
      <View style={{ backgroundColor: '#f8fafc', marginHorizontal: 14, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 3 }}>Reason</Text>
        <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18 }}>{request.reason}</Text>
      </View>

      {/* Response note if already responded */}
      {request.responseNote && (
        <View style={{ backgroundColor: '#f0fdf4', marginHorizontal: 14, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 14 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a', marginBottom: 3 }}>Your Response</Text>
          <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18 }}>{request.responseNote}</Text>
        </View>
      )}

      {/* Actions (pending only) */}
      {request.status === 'pending' && (
        <View>
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
                borderTopWidth: 1,
                borderColor: '#e5e7eb',
                padding: 12,
                fontSize: 13,
                color: '#1e293b',
                minHeight: 70,
              }}
            />
          )}

          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
            <TouchableOpacity
              onPress={() => setShowNote(v => !v)}
              activeOpacity={0.7}
              style={{
                width: 48, paddingVertical: 13,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: showNote ? '#f1f5f9' : '#fff',
                borderRightWidth: 1, borderRightColor: '#f1f5f9',
              }}
            >
              <Ionicons name={showNote ? 'chatbubble' : 'chatbubble-outline'} size={16} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRespond('denied')}
              disabled={respondMutation.isPending}
              activeOpacity={0.7}
              style={{
                flex: 1, paddingVertical: 13,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                backgroundColor: '#fff5f5',
                borderRightWidth: 1, borderRightColor: '#f1f5f9',
              }}
            >
              {respondMutation.isPending ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={15} color="#dc2626" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#dc2626' }}>Deny</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRespond('approved')}
              disabled={respondMutation.isPending}
              activeOpacity={0.7}
              style={{
                flex: 1, paddingVertical: 13,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                backgroundColor: '#f0fdf4',
              }}
            >
              {respondMutation.isPending ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a' }}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
