import React, { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOnline } from '@/hooks/useIsOnline';

/** Clearance above the bottom tab bar so the pill never covers a tab. */
const TAB_BAR_CLEARANCE = 84;

/**
 * App-wide connectivity pill. Shown while offline ("showing saved data") and
 * briefly on reconnect, so users know why a screen is not refreshing and
 * that their queued work is being sent.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(isOnline ? 0 : 1));
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);
  // Adjust during render (not in an effect) when connectivity flips.
  if (prevOnline !== isOnline) {
    setPrevOnline(isOnline);
    setShowBackOnline(isOnline);
  }

  useEffect(() => {
    if (!isOnline) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      return;
    }
    if (!showBackOnline) return;
    const hideTimer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
        setShowBackOnline(false),
      );
    }, 2500);
    return () => clearTimeout(hideTimer);
  }, [isOnline, showBackOnline, opacity]);

  if (isOnline && !showBackOnline) return null;

  const offline = !isOnline;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + TAB_BAR_CLEARANCE,
        alignItems: 'center',
        opacity,
        zIndex: 1000,
      }}
    >
      <View
        className="flex-row items-center rounded-full px-4 py-2"
        style={{
          gap: 8,
          backgroundColor: offline ? '#1F2937' : '#047857',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Ionicons name={offline ? 'cloud-offline-outline' : 'cloud-done-outline'} size={15} color="#fff" />
        <Text className="font-semibold text-xs text-white">
          {offline ? "You're offline · showing saved data" : 'Back online · syncing'}
        </Text>
      </View>
    </Animated.View>
  );
}
