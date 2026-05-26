import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

interface Tab<T extends string> {
  key: T;
  label: string;
}

interface ClassroomDetailTabsProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  accentColor?: string;
}

// Underline tab bar — looks like a proper nav tab, not pill chips
export default function ClassroomDetailTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  accentColor = '#6366f1',
}: ClassroomDetailTabsProps<T>) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          paddingHorizontal: 4,
        }}
      >
        {tabs.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? accentColor : '#9ca3af',
                letterSpacing: 0.1,
              }}>
                {tab.label}
              </Text>
              {/* Underline indicator */}
              {isActive && (
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 10,
                  right: 10,
                  height: 2.5,
                  borderRadius: 2,
                  backgroundColor: accentColor,
                }} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
