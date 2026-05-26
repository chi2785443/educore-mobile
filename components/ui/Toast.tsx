import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMsg {
  message: string;
  type: ToastType;
}

// Module-level so toast() can be called from anywhere
let _show: ((msg: string, type: ToastType) => void) | null = null;

/* ── Public API ──────────────────────────────────────────────────── */
export const toast = {
  success: (msg: string) => _show?.(msg, 'success'),
  error:   (msg: string) => _show?.(msg, 'error'),
  info:    (msg: string) => _show?.(msg, 'info'),
};

/* ── Provider — add once to app root layout ──────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ToastMsg>({ message: '', type: 'info' });
  const opacity  = useRef(new Animated.Value(0)).current;
  const slideY   = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent({ message, type });
    setVisible(true);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0,  damping: 18, stiffness: 200, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideY,  { toValue: -16, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setVisible(false);
        slideY.setValue(-20);
      });
    }, 2800);
  }, [opacity, slideY]);

  useEffect(() => {
    _show = show;
    return () => { _show = null; };
  }, [show]);

  const CONFIG: Record<ToastType, { bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
    success: { bg: '#16a34a', icon: 'checkmark-circle' },
    error:   { bg: '#dc2626', icon: 'close-circle' },
    info:    { bg: '#0284c7', icon: 'information-circle' },
  };

  const cfg = CONFIG[current.type];

  return (
    <>
      {children}
      {visible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 56,
            left: 16,
            right: 16,
            zIndex: 9999,
            opacity,
            transform: [{ translateY: slideY }],
          }}
          pointerEvents="none"
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: cfg.bg,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 13,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 10,
            elevation: 12,
          }}>
            <Ionicons name={cfg.icon} size={20} color="#fff" />
            <Text style={{ flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
              {current.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </>
  );
}
