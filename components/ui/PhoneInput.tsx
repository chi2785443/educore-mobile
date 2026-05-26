import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { countryCode } from '@/lib/countryCodes';

type Country = (typeof countryCode)[number];

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  optional?: boolean;
}

export function PhoneInput({ label, value, onChange, error, optional }: PhoneInputProps) {
  const initial = countryCode.find((c) => value?.startsWith(c.dial)) ?? countryCode[0];
  const [country, setCountry] = useState<Country>(initial);
  const [pickerOpen, setPickerOpen] = useState(false);

  const rawNumber = value?.startsWith(country.dial)
    ? value.slice(country.dial.length)
    : value?.replace(/^\+\d+/, '') ?? '';

  function handleCountrySelect(c: Country) {
    const raw = value?.startsWith(country.dial)
      ? value.slice(country.dial.length)
      : value?.replace(/^\+\d+/, '') ?? '';
    setCountry(c);
    onChange(`${c.dial}${raw}`);
    setPickerOpen(false);
  }

  function handleNumberChange(text: string) {
    const digits = text.replace(/\D/g, '');
    onChange(`${country.dial}${digits}`);
  }

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-gray-700">
          {label}
          {optional && <Text className="text-gray-400"> (optional)</Text>}
        </Text>
      )}

      <View className="flex-row">
        {/* Country selector button */}
        <Pressable
          onPress={() => setPickerOpen(true)}
          className={`flex-row items-center gap-1.5 rounded-l-xl border border-r-0 bg-white px-3 ${
            error ? 'border-red-400' : 'border-gray-200'
          }`}
          style={{ minWidth: 90 }}
        >
          <Text style={{ fontSize: 18 }}>{country.flag}</Text>
          <Text className="text-sm font-medium text-gray-700">{country.dial}</Text>
          <Ionicons name="chevron-down" size={14} color="#9ca3af" />
        </Pressable>

        {/* Number input */}
        <View
          className={`flex-1 flex-row items-center rounded-r-xl border bg-white px-3 ${
            error ? 'border-red-400' : 'border-gray-200'
          }`}
        >
          <TextInput
            className="flex-1 py-3 text-base text-gray-900"
            placeholder="8012345678"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={rawNumber}
            onChangeText={handleNumberChange}
            autoCapitalize="none"
          />
        </View>
      </View>

      {error && <Text className="text-xs text-red-500">{error}</Text>}

      {/* Country picker modal */}
      <Modal visible={pickerOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">Select Country</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={countryCode}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleCountrySelect(item)}
                className={`flex-row items-center gap-3 px-4 py-3.5 border-b border-gray-50 ${
                  item.code === country.code ? 'bg-indigo-50' : ''
                }`}
              >
                <Text style={{ fontSize: 24 }}>{item.flag}</Text>
                <Text className="flex-1 text-sm text-gray-800">{item.name}</Text>
                <Text className="text-sm text-gray-500">{item.dial}</Text>
                {item.code === country.code && (
                  <Ionicons name="checkmark" size={18} color="#6366f1" />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
