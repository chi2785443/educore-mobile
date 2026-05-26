import React, { useState, useRef } from 'react';
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  sending?: boolean;
}

export default function MessageInput({ onSend, disabled, sending }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !disabled && !sending;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 6,
    }}>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder="Message..."
        placeholderTextColor="#9ca3af"
        multiline
        maxLength={2000}
        style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: 14,
          color: '#1e293b',
          maxHeight: 100,
          lineHeight: 20,
        }}
      />

      {/* Outer View owns the fixed size — Pressable is touch-only */}
      <View style={{ width: 40, height: 40, flexShrink: 0 }}>
        <Pressable onPress={handleSend} disabled={!canSend} style={{ flex: 1 }}>
          {({ pressed }) => (
            <View style={{
              flex: 1,
              borderRadius: 20,
              backgroundColor: canSend
                ? (pressed ? '#4f46e5' : '#6366f1')
                : '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {sending ? (
                <ActivityIndicator size="small" color={canSend ? '#fff' : '#9ca3af'} />
              ) : (
                <Ionicons
                  name="send"
                  size={16}
                  color={canSend ? '#fff' : '#9ca3af'}
                  style={{ marginLeft: 2 }}
                />
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
