import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabConfig {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
}

const TABS: TabConfig[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'classroom', label: 'Classes', icon: 'book-outline', iconActive: 'book' },
  { name: 'action', label: '', icon: 'add', iconActive: 'add' },
  { name: 'chat', label: 'Chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'account', label: 'Account', icon: 'person-outline', iconActive: 'person' },
];

const ACTIVE = '#818cf8';       // indigo-400
const INACTIVE = '#64748b';     // slate-500
const BAR_BG = '#0B0F14';       // brand-dark
const FAB_FROM = '#6366f1';     // indigo-500
const FAB_TO = '#7c3aed';       // violet-600

function TabButton({
  config,
  focused,
  onPress,
  onLongPress,
  isAction,
}: {
  config: TabConfig;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isAction: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (isAction) {
    return (
      <Pressable onPress={handlePress} onLongPress={onLongPress} style={{ flex: 1, alignItems: 'center' }}>
        <Animated.View
          style={{
            transform: [{ scale }],
            width: 56,
            height: 56,
            borderRadius: 18,
            marginTop: -20,
            alignItems: 'center',
            justifyContent: 'center',
            // Gradient simulation with shadow
            backgroundColor: FAB_FROM,
            shadowColor: FAB_FROM,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.45,
            shadowRadius: 12,
            elevation: 14,
          }}
        >
          {/* Inner gradient effect */}
          <View style={{
            position: 'absolute', inset: 0, borderRadius: 18,
            backgroundColor: FAB_TO, opacity: 0.4,
          }} />
          <Ionicons name="add" size={28} color="#ffffff" />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 4 }}>
        {focused && (
          <View style={{
            position: 'absolute', top: -6, width: 24, height: 3,
            backgroundColor: ACTIVE, borderRadius: 2,
          }} />
        )}
        <Ionicons
          name={focused ? config.iconActive : config.icon}
          size={22}
          color={focused ? ACTIVE : INACTIVE}
        />
        <Text style={{
          fontSize: 10, fontWeight: '600',
          color: focused ? ACTIVE : INACTIVE,
          letterSpacing: 0.3,
        }}>
          {config.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const TAB_NAMES = new Set(TABS.map(t => t.name));

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Only render the 5 visible tabs — hidden screens (href: null) must not appear
  const visibleRoutes = state.routes.filter(r => TAB_NAMES.has(r.name));

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: BAR_BG,
      height: 60 + insets.bottom,
      paddingBottom: insets.bottom,
      borderTopWidth: 1,
      borderTopColor: '#1e2433',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 20,
    }}>
      {visibleRoutes.map((route) => {
        const focused = state.routes[state.index]?.name === route.name;
        const config = TABS.find(t => t.name === route.name) ?? TABS[0];
        const isAction = route.name === 'action';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TabButton
            key={route.key}
            config={config}
            focused={focused}
            onPress={onPress}
            onLongPress={onLongPress}
            isAction={isAction}
          />
        );
      })}
    </View>
  );
}
