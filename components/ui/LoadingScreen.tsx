import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  message?: string;
  /** accent color for the spinner ring — defaults to indigo */
  color?: string;
}

export default function LoadingScreen({ message = 'Loading...', color = '#6366f1' }: Props) {
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous rotation
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Subtle pulse on the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.92, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{
      flex: 1, backgroundColor: '#0B0F14',
      alignItems: 'center', justifyContent: 'center', gap: 32,
    }}>
      {/* Background decoration */}
      <View style={{ position: 'absolute', top: '20%', left: '10%', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(99,102,241,0.06)' }} />
      <View style={{ position: 'absolute', bottom: '15%', right: '5%', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(124,58,237,0.05)' }} />

      {/* Logo + spinner stack */}
      <View style={{ alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
        {/* Outer spinner ring */}
        <Animated.View style={{
          position: 'absolute',
          width: 96, height: 96, borderRadius: 48,
          borderWidth: 2.5,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: `${color}55`,
          transform: [{ rotate: spin }],
        }} />

        {/* Inner subtle ring */}
        <View style={{
          position: 'absolute',
          width: 78, height: 78, borderRadius: 39,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        }} />

        {/* Logo */}
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Image
            source={require('@/assets/images/educore_icon_dark.svg')}
            style={{ width: 48, height: 48 }}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      {/* Brand name */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Image
          source={require('@/assets/images/educore_logo_dark.svg')}
          style={{ width: 130, height: 37 }}
          contentFit="contain"
        />
        <Text style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: 12, fontWeight: '500', letterSpacing: 0.5,
        }}>
          {message}
        </Text>
      </View>

      {/* Dot trail indicator */}
      <DotTrail color={color} />
    </View>
  );
}

function DotTrail({ color }: { color: string }) {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay((dots.length - i - 1) * 180),
        ]),
      ),
    );
    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: color,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}
