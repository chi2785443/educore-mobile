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
import { useConversations } from '@/hooks/useMessages';

interface TabConfig {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
}

const TABS: TabConfig[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'features', label: 'Features', icon: 'apps-outline', iconActive: 'apps' },
  { name: 'action', label: '', icon: 'add', iconActive: 'add' },
  { name: 'chat', label: 'Chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'account', label: 'Account', icon: 'person-outline', iconActive: 'person' },
];

const ACTIVE = '#4C3FC4';       // school purple
const INACTIVE = '#9CA3AF';     // gray-400
const BAR_BG = '#FFFFFF';       // white
const FAB_FROM = '#F5486A';     // coral/pink
const FAB_TO = '#E03058';       // deep coral

function TabButton({
  config,
  focused,
  onPress,
  onLongPress,
  isAction,
  badge,
}: {
  config: TabConfig;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isAction: boolean;
  badge?: number;
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
        <View style={{ position: 'relative' }}>
          <Ionicons
            name={focused ? config.iconActive : config.icon}
            size={22}
            color={focused ? ACTIVE : INACTIVE}
          />
          {!!badge && badge > 0 && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -6,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#F5486A',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
              borderWidth: 1.5,
              borderColor: '#FFFFFF',
            }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', lineHeight: 12 }}>
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}
        </View>
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
  const { data: conversations } = useConversations();
  const totalUnread = (conversations ?? []).reduce(
    (sum, c) => sum + (c.unreadCount ?? 0),
    0,
  );

  // Only render the 5 visible tabs — hidden screens (href: null) must not appear
  const visibleRoutes = state.routes.filter(r => TAB_NAMES.has(r.name));

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: BAR_BG,
      height: 60 + insets.bottom,
      paddingBottom: insets.bottom,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#4C3FC4',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.10,
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
            badge={route.name === 'chat' ? totalUnread : undefined}
          />
        );
      })}
    </View>
  );
}
