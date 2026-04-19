import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingRole } from '@/types';
import { Button } from '@/components/ui/Button';

interface RoleOption {
  role: OnboardingRole;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ROLES: RoleOption[] = [
  {
    role: 'super_admin',
    label: 'School Owner / Admin',
    description: 'Register and manage your school on Eduflow',
    icon: 'business-outline',
  },
  {
    role: 'staff',
    label: 'Staff / Teacher',
    description: 'Apply for a teaching or staff position at a school',
    icon: 'people-outline',
  },
  {
    role: 'student',
    label: 'Student',
    description: 'Enroll in a school and track your academic progress',
    icon: 'school-outline',
  },
  {
    role: 'parent',
    label: 'Parent / Guardian',
    description: 'Send enquiries and monitor your child's education',
    icon: 'heart-outline',
  },
];

interface Props {
  onSelect: (role: OnboardingRole) => void;
  onBack: () => void;
}

export function RoleSelectionStep({ onSelect, onBack }: Props) {
  const [selected, setSelected] = useState<OnboardingRole | null>(null);

  return (
    <View className="gap-5">
      <View className="gap-3">
        {ROLES.map((item) => {
          const isSelected = selected === item.role;
          return (
            <Pressable
              key={item.role}
              onPress={() => setSelected(item.role)}
              className={`flex-row items-center gap-4 rounded-xl border p-4 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View
                className={`w-11 h-11 rounded-xl items-center justify-center ${
                  isSelected ? 'bg-indigo-600' : 'bg-gray-100'
                }`}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={isSelected ? '#fff' : '#6b7280'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-indigo-700' : 'text-gray-900'
                  }`}
                >
                  {item.label}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">{item.description}</Text>
              </View>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                }`}
              >
                {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        fullWidth
        disabled={!selected}
        onPress={() => selected && onSelect(selected)}
      >
        Continue
      </Button>

      <Button fullWidth variant="outline" onPress={onBack}>
        Back
      </Button>
    </View>
  );
}
