import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  error?: string;
  label?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function Input({
  error,
  label,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}
      <View
        className={`flex-row items-center rounded-xl border bg-white px-3 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        )}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          className="flex-1 py-3 text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          autoCapitalize={props.autoCapitalize ?? 'none'}
        />
        {isPassword ? (
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#9ca3af"
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <Ionicons name={rightIcon} size={18} color="#9ca3af" />
          </Pressable>
        ) : null}
      </View>
      {error && <Text className="text-xs text-red-500">{error}</Text>}
      {hint && !error && <Text className="text-xs text-gray-400">{hint}</Text>}
    </View>
  );
}
