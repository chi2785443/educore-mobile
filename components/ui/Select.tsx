import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function Select({ label, placeholder = 'Select...', options, value, onChange, error }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1.5">
      {label && <Text className="text-sm font-medium text-gray-700">{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between rounded-xl border bg-white px-3 py-3.5 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        <Text className={`text-base ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9ca3af" />
      </Pressable>
      {error && <Text className="text-xs text-red-500">{error}</Text>}

      <Modal visible={open} animationType="slide" transparent>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <SafeAreaView className="bg-white rounded-t-2xl">
          <View className="px-4 pb-2 pt-4 flex-row items-center justify-between border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">{label ?? 'Select option'}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => (
              <Pressable
                className={`flex-row items-center justify-between px-4 py-3.5 border-b border-gray-50 ${
                  item.value === value ? 'bg-indigo-50' : ''
                }`}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Text className={`text-base ${item.value === value ? 'text-indigo-700 font-semibold' : 'text-gray-800'}`}>
                  {item.label}
                </Text>
                {item.value === value && (
                  <Ionicons name="checkmark" size={18} color="#4338ca" />
                )}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
