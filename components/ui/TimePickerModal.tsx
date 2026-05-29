import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function TimePickerModal({ visible, value, label, onSelect, onClose }: {
  visible: boolean;
  value: string | undefined;
  label: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}) {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h)) setHour(h);
      if (!isNaN(m)) setMinute(m);
    }
  }, [value, visible]);

  const confirm = () => {
    onSelect(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation?.()}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 24 }}>{label}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
              <View style={{ alignItems: 'center', gap: 10 }}>
                <Pressable onPress={() => setHour(h => (h + 1) % 24)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-up" size={20} color="#374151" />
                </Pressable>
                <View style={{ width: 80, height: 64, borderRadius: 16, backgroundColor: '#4C3FC4', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>{String(hour).padStart(2, '0')}</Text>
                </View>
                <Pressable onPress={() => setHour(h => (h - 1 + 24) % 24)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-down" size={20} color="#374151" />
                </Pressable>
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>HOUR</Text>
              </View>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#d1d5db', marginBottom: 24 }}>:</Text>
              <View style={{ alignItems: 'center', gap: 10 }}>
                <Pressable onPress={() => setMinute(m => (m + 5) % 60)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-up" size={20} color="#374151" />
                </Pressable>
                <View style={{ width: 80, height: 64, borderRadius: 16, backgroundColor: '#4C3FC4', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>{String(minute).padStart(2, '0')}</Text>
                </View>
                <Pressable onPress={() => setMinute(m => (m - 5 + 60) % 60)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-down" size={20} color="#374151" />
                </Pressable>
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>MIN</Text>
              </View>
            </View>

            <Pressable onPress={confirm} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <View style={{ backgroundColor: '#4C3FC4', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  Confirm {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                </Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
