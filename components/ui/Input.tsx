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
  const [focused, setFocused] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-[15px] font-semibold text-gray-700">{label}</Text>
      )}
      <View
        className={`flex-row items-center rounded-2xl border bg-white px-4 ${
          error ? 'border-red-400' : focused ? 'border-[#4C3FC4]' : 'border-gray-200'
        }`}
      >
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={focused ? '#4C3FC4' : '#9ca3af'} style={{ marginRight: 10 }} />
        )}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          className="flex-1 py-4 text-[15px] text-gray-900"
          placeholderTextColor="#9ca3af"
          autoCapitalize={props.autoCapitalize ?? 'none'}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
        {isPassword ? (
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9ca3af"
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <Ionicons name={rightIcon} size={20} color="#9ca3af" />
          </Pressable>
        ) : null}
      </View>
      {error && <Text className="text-xs text-red-500">{error}</Text>}
      {hint && !error && <Text className="text-xs text-gray-400">{hint}</Text>}
    </View>
  );
}
