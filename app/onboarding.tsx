import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, Dimensions, FlatList,
  StatusBar, ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withTiming, withDelay, Easing,
  FadeIn, FadeInUp, FadeInDown,
} from 'react-native-reanimated';
import Svg, {
  Circle, Path, Rect, G, Ellipse, Polygon, Line,
  Defs, LinearGradient as SvgLinearGradient, Stop, ClipPath,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

/* ─── Slide definitions ──────────────────────────────────────────── */
const SLIDES = [
  {
    id: '0',
    bg: '#FEF0E6',
    accent: '#4C3FC4',
    tag: 'WELCOME',
    title: 'Education,\nreimagined.',
    body: 'EduCore brings schools, students, staff and parents together in one beautiful place.',
  },
  {
    id: '1',
    bg: '#E8F4FF',
    accent: '#0284c7',
    tag: 'FOR SCHOOLS',
    title: 'Manage your\nschool with ease.',
    body: 'Enrollment, attendance, payroll and results — all in one powerful dashboard.',
  },
  {
    id: '2',
    bg: '#E8F5EE',
    accent: '#059669',
    tag: 'FOR LEARNERS',
    title: 'Learn, grow,\nand excel.',
    body: 'Track assessments, view scores, follow your timetable and celebrate every win.',
  },
  {
    id: '3',
    bg: '#F0EEFF',
    accent: '#6366f1',
    tag: 'STAY CONNECTED',
    title: "Your child's\njourney, in\nyour hands.",
    body: "Parents get real-time updates and a direct line to the school — always.",
  },
] as const;

const FLOAT = { duration: 2200, easing: Easing.inOut(Easing.quad) };

/* ─── Slide 0 — Floating graduation cap ─────────────────────────── */
function WelcomeIllustration() {
  const floatY = useSharedValue(0);
  const s1Y = useSharedValue(0);
  const s2Y = useSharedValue(0);
  const s3Y = useSharedValue(0);
  const rotPencil = useSharedValue(-8);

  useEffect(() => {
    floatY.value   = withRepeat(withTiming(-18, FLOAT), -1, true);
    s1Y.value      = withRepeat(withDelay(0,   withTiming(-14, { duration: 2000 })), -1, true);
    s2Y.value      = withRepeat(withDelay(400, withTiming(-10, { duration: 1700 })), -1, true);
    s3Y.value      = withRepeat(withDelay(700, withTiming(-16, { duration: 2400 })), -1, true);
    rotPencil.value = withRepeat(withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);

  const capSt    = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const s1St     = useAnimatedStyle(() => ({ transform: [{ translateY: s1Y.value }] }));
  const s2St     = useAnimatedStyle(() => ({ transform: [{ translateY: s2Y.value }] }));
  const s3St     = useAnimatedStyle(() => ({ transform: [{ translateY: s3Y.value }] }));
  const pencilSt = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotPencil.value}deg` }] }));

  return (
    <View style={{ width: W, height: H * 0.52, alignItems: 'center', justifyContent: 'center' }}>
      {/* Soft blob behind cap */}
      <View style={{
        position: 'absolute', width: 260, height: 260, borderRadius: 130,
        backgroundColor: 'rgba(76,63,196,0.07)',
      }} />

      {/* Cap */}
      <Animated.View style={[capSt, { alignItems: 'center' }]}>
        <Svg width={220} height={180} viewBox="0 0 220 180">
          <Defs>
            <SvgLinearGradient id="capG" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#7c6ef0" />
              <Stop offset="100%" stopColor="#4C3FC4" />
            </SvgLinearGradient>
          </Defs>
          {/* Shadow */}
          <Ellipse cx="110" cy="166" rx="70" ry="10" fill="rgba(76,63,196,0.12)" />
          {/* Board */}
          <Path d="M110 30 L195 72 L110 90 L25 72 Z" fill="url(#capG)" />
          <Path d="M110 30 L195 72 L185 76 L110 38 Z" fill="rgba(255,255,255,0.2)" />
          {/* Cap body */}
          <Rect x="84" y="72" width="52" height="42" rx="6" fill="#3730a3" />
          <Rect x="84" y="68" width="52" height="12" rx="4" fill="#4C3FC4" />
          {/* Tassel string */}
          <Line x1="192" y1="72" x2="186" y2="118" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          {/* Tassel bob */}
          <Circle cx="186" cy="126" r="12" fill="#fbbf24" />
          <Circle cx="186" cy="126" r="7" fill="#f59e0b" />
          {/* Book stack */}
          <Rect x="20" y="116" width="50" height="12" rx="4" fill="#fb923c" />
          <Rect x="22" y="104" width="46" height="12" rx="4" fill="#fbbf24" />
          <Rect x="24" y="92"  width="42" height="12" rx="4" fill="#4C3FC4" />
          {/* Diploma */}
          <Rect x="148" y="104" width="38" height="28" rx="6" fill="#fff" />
          <Line x1="154" y1="112" x2="180" y2="112" stroke="#e5e7eb" strokeWidth="2" />
          <Line x1="154" y1="118" x2="180" y2="118" stroke="#e5e7eb" strokeWidth="2" />
          <Line x1="154" y1="124" x2="172" y2="124" stroke="#e5e7eb" strokeWidth="2" />
          <Circle cx="162" cy="128" r="6" fill="#fbbf24" />
        </Svg>
      </Animated.View>

      {/* Stars */}
      <Animated.View style={[s1St, { position: 'absolute', top: H * 0.04, right: W * 0.14 }]}>
        <Svg width={36} height={36} viewBox="0 0 36 36">
          <Polygon points="18,2 22,13 34,13 24,20 28,32 18,24 8,32 12,20 2,13 14,13" fill="#fbbf24" />
        </Svg>
      </Animated.View>
      <Animated.View style={[s2St, { position: 'absolute', top: H * 0.06, left: W * 0.1 }]}>
        <Svg width={26} height={26} viewBox="0 0 26 26">
          <Polygon points="13,2 15.5,9 23,9 17,13.5 19.5,21 13,17 6.5,21 9,13.5 3,9 10.5,9" fill="#a78bfa" />
        </Svg>
      </Animated.View>
      <Animated.View style={[s3St, { position: 'absolute', bottom: H * 0.08, left: W * 0.08 }]}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fbbf24' }} />
      </Animated.View>

      {/* Pencil */}
      <Animated.View style={[pencilSt, { position: 'absolute', bottom: H * 0.05, right: W * 0.1 }]}>
        <Svg width={22} height={70} viewBox="0 0 22 70">
          <Rect x="5" y="5"  width="12" height="50" rx="3" fill="#fbbf24" />
          <Path d="M5 55 L11 70 L17 55 Z" fill="#f87171" />
          <Rect x="5" y="5"  width="12" height="10" rx="3" fill="#d1d5db" />
          <Line x1="11" y1="15" x2="11" y2="55" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ─── Slide 1 — School + floating charts ─────────────────────────── */
function SchoolIllustration() {
  const floatY  = useSharedValue(0);
  const barS    = useSharedValue(0.5);
  const cloudY  = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(withTiming(-14, FLOAT), -1, true);
    barS.value   = withRepeat(withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
    cloudY.value = withRepeat(withDelay(300, withTiming(-10, { duration: 2500 })), -1, true);
  }, []);

  const buildSt = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const barSt   = useAnimatedStyle(() => ({ transform: [{ scaleY: barS.value }], transformOrigin: 'bottom' }));
  const cloudSt = useAnimatedStyle(() => ({ transform: [{ translateY: cloudY.value }] }));

  return (
    <View style={{ width: W, height: H * 0.52, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: 260, height: 260, borderRadius: 130,
        backgroundColor: 'rgba(2,132,199,0.06)',
      }} />

      <Animated.View style={buildSt}>
        <Svg width={230} height={195} viewBox="0 0 230 195">
          <Defs>
            <SvgLinearGradient id="buildG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#38bdf8" />
              <Stop offset="100%" stopColor="#0284c7" />
            </SvgLinearGradient>
          </Defs>
          {/* Shadow */}
          <Ellipse cx="115" cy="188" rx="82" ry="8" fill="rgba(2,132,199,0.1)" />
          {/* Main body */}
          <Rect x="28" y="82" width="174" height="100" rx="6" fill="url(#buildG)" />
          {/* Roof */}
          <Path d="M18 86 L115 26 L212 86 Z" fill="#0ea5e9" />
          <Path d="M18 86 L115 26 L128 30 L35 86 Z" fill="rgba(255,255,255,0.18)" />
          {/* Windows row 1 */}
          {[52, 98, 144].map(x => (
            <Rect key={x} x={x} y="96" width="28" height="24" rx="4" fill="#e0f2fe" />
          ))}
          {/* Windows glow */}
          {[52, 144].map(x => (
            <Rect key={x} x={x+4} y="100" width="20" height="16" rx="3" fill="#fef08a" opacity="0.6" />
          ))}
          {/* Door */}
          <Rect x="96" y="128" width="38" height="54" rx="6" fill="#075985" />
          <Circle cx="130" cy="156" r="3" fill="#fbbf24" />
          {/* Steps */}
          <Rect x="82" y="180" width="66" height="8" rx="2" fill="#0369a1" />
          {/* Flagpole */}
          <Line x1="115" y1="26" x2="115" y2="2" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
          <Path d="M115 2 L138 10 L115 18 Z" fill="#fb923c" />
        </Svg>
      </Animated.View>

      {/* Floating bar chart */}
      <Animated.View style={[barSt, { position: 'absolute', right: W * 0.07, top: H * 0.08 }]}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 10, gap: 4,
          shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 }}>
          {[{ h: 28, c: '#0284c7' }, { h: 40, c: '#38bdf8' }, { h: 22, c: '#0284c7' }].map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <View style={{ width: 10, height: b.h, borderRadius: 3, backgroundColor: b.c, opacity: 0.85 }} />
            </View>
          ))}
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#0284c7', marginTop: 2 }}>Stats</Text>
        </View>
      </Animated.View>

      {/* Floating cloud badge */}
      <Animated.View style={[cloudSt, { position: 'absolute', left: W * 0.06, top: H * 0.1 }]}>
        <View style={{ backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
          shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
          flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="people-outline" size={13} color="#0284c7" />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#0f172a' }}>248 Students</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/* ─── Slide 2 — Student on books (inspired by reference) ─────────── */
function LearnersIllustration() {
  const floatY = useSharedValue(0);
  const iconY1 = useSharedValue(0);
  const iconY2 = useSharedValue(0);
  const iconY3 = useSharedValue(0);
  const iconY4 = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(withTiming(-16, FLOAT), -1, true);
    iconY1.value = withRepeat(withDelay(0,    withTiming(-12, { duration: 2100 })), -1, true);
    iconY2.value = withRepeat(withDelay(350,  withTiming(-10, { duration: 1800 })), -1, true);
    iconY3.value = withRepeat(withDelay(650,  withTiming(-14, { duration: 2300 })), -1, true);
    iconY4.value = withRepeat(withDelay(900,  withTiming(-8,  { duration: 1600 })), -1, true);
  }, []);

  const figSt = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const i1St  = useAnimatedStyle(() => ({ transform: [{ translateY: iconY1.value }] }));
  const i2St  = useAnimatedStyle(() => ({ transform: [{ translateY: iconY2.value }] }));
  const i3St  = useAnimatedStyle(() => ({ transform: [{ translateY: iconY3.value }] }));
  const i4St  = useAnimatedStyle(() => ({ transform: [{ translateY: iconY4.value }] }));

  return (
    <View style={{ width: W, height: H * 0.52, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: 280, height: 280, borderRadius: 140,
        backgroundColor: 'rgba(5,150,105,0.06)',
      }} />

      <Animated.View style={figSt}>
        <Svg width={240} height={210} viewBox="0 0 240 210">
          <Defs>
            <SvgLinearGradient id="skinG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fcd9b6" />
              <Stop offset="100%" stopColor="#f6b98e" />
            </SvgLinearGradient>
            <SvgLinearGradient id="shirtG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#6ee7b7" />
              <Stop offset="100%" stopColor="#059669" />
            </SvgLinearGradient>
          </Defs>

          {/* Shadow */}
          <Ellipse cx="120" cy="202" rx="90" ry="9" fill="rgba(5,150,105,0.12)" />

          {/* Book stack (bottom) */}
          <Rect x="30"  y="155" width="180" height="18" rx="6" fill="#f97316" />
          <Rect x="36"  y="137" width="168" height="18" rx="6" fill="#fbbf24" />
          <Rect x="42"  y="120" width="156" height="18" rx="6" fill="#4C3FC4" />
          <Rect x="48"  y="103" width="144" height="18" rx="6" fill="#059669" />

          {/* Bookmark on books */}
          <Rect x="96" y="100" width="8" height="22" rx="2" fill="#f87171" />

          {/* Legs / sitting */}
          <Path d="M88 98 L68 140 L90 140 L102 98 Z" fill="#2563eb" />
          <Path d="M152 98 L160 140 L180 140 L168 98 Z" fill="#2563eb" />
          {/* Shoes */}
          <Ellipse cx="80"  cy="142" rx="14" ry="7" fill="#1e293b" />
          <Ellipse cx="170" cy="142" rx="14" ry="7" fill="#1e293b" />

          {/* Body / shirt */}
          <Path d="M88 52 Q120 44 152 52 L160 98 L80 98 Z" fill="url(#shirtG)" />

          {/* Arms */}
          <Path d="M88 58 Q62 72 68 90 Q74 98 84 94 Q80 80 92 68 Z" fill="url(#skinG)" />
          <Path d="M152 58 Q178 72 172 90 Q166 98 156 94 Q160 80 148 68 Z" fill="url(#skinG)" />

          {/* Laptop */}
          <Rect x="80"  y="80" width="80" height="52" rx="6" fill="#1e293b" />
          <Rect x="84"  y="84" width="72" height="44" rx="4" fill="#3b82f6" />
          {/* Screen content */}
          <Rect x="88"  y="88" width="50" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
          <Rect x="88"  y="98" width="36" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
          <Rect x="88"  y="106" width="44" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
          <Rect x="88"  y="114" width="28" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
          {/* Laptop base */}
          <Rect x="72"  y="132" width="96" height="6"  rx="3" fill="#334155" />

          {/* Neck */}
          <Rect x="112" y="34" width="16" height="18" rx="4" fill="url(#skinG)" />

          {/* Head */}
          <Ellipse cx="120" cy="24" rx="24" ry="22" fill="url(#skinG)" />

          {/* Hair */}
          <Path d="M96 22 Q96 0 120 2 Q144 0 144 22 Q136 8 120 8 Q104 8 96 22 Z" fill="#1e293b" />
          <Path d="M96 22 Q90 10 100 6 Q96 14 96 22 Z" fill="#1e293b" />

          {/* Eyes */}
          <Ellipse cx="113" cy="22" rx="3" ry="3.5" fill="#1e293b" />
          <Ellipse cx="127" cy="22" rx="3" ry="3.5" fill="#1e293b" />
          <Circle cx="114" cy="21" r="1" fill="#fff" />
          <Circle cx="128" cy="21" r="1" fill="#fff" />

          {/* Smile */}
          <Path d="M113 30 Q120 36 127 30" stroke="#c2855a" strokeWidth="2" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>

      {/* Floating icons */}
      <Animated.View style={[i1St, { position: 'absolute', top: H * 0.03, right: W * 0.1 }]}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 }}>
          <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
        </View>
      </Animated.View>

      <Animated.View style={[i2St, { position: 'absolute', top: H * 0.06, left: W * 0.07 }]}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 }}>
          <Ionicons name="book-outline" size={18} color="#059669" />
        </View>
      </Animated.View>

      <Animated.View style={[i3St, { position: 'absolute', bottom: H * 0.1, right: W * 0.08 }]}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
          flexDirection: 'row', alignItems: 'center', gap: 4,
          shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 }}>
          <Text style={{ fontSize: 14 }}>⭐</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0f172a' }}>A+</Text>
        </View>
      </Animated.View>

      <Animated.View style={[i4St, { position: 'absolute', bottom: H * 0.12, left: W * 0.06 }]}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#fef3c7',
          alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>💡</Text>
        </View>
      </Animated.View>

      {/* Cap badge top */}
      <Animated.View style={[i1St, { position: 'absolute', top: H * 0.02, left: W * 0.22 }]}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#E0EEFF',
          alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="school-outline" size={18} color="#0284c7" />
        </View>
      </Animated.View>
    </View>
  );
}

/* ─── Slide 3 — Phone + connection bubbles ─────────────────────── */
function ConnectedIllustration() {
  const floatY = useSharedValue(0);
  const b1Y    = useSharedValue(0);
  const b2Y    = useSharedValue(0);
  const heartS = useSharedValue(1);
  const ringS  = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(withTiming(-14, FLOAT), -1, true);
    b1Y.value    = withRepeat(withDelay(0,   withTiming(-12, { duration: 2000 })), -1, true);
    b2Y.value    = withRepeat(withDelay(500, withTiming(-10, { duration: 2300 })), -1, true);
    heartS.value = withRepeat(withTiming(1.3, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    ringS.value  = withRepeat(withTiming(1.6, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, []);

  const phoneSt = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const b1St    = useAnimatedStyle(() => ({ transform: [{ translateY: b1Y.value }] }));
  const b2St    = useAnimatedStyle(() => ({ transform: [{ translateY: b2Y.value }] }));
  const heartSt = useAnimatedStyle(() => ({ transform: [{ scale: heartS.value }] }));
  const ringSt  = useAnimatedStyle(() => ({ transform: [{ scale: ringS.value }], opacity: (2 - ringS.value) * 0.25 }));

  return (
    <View style={{ width: W, height: H * 0.52, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: 260, height: 260, borderRadius: 130,
        backgroundColor: 'rgba(99,102,241,0.06)',
      }} />

      {/* Pulse ring */}
      <Animated.View style={[ringSt, {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        borderWidth: 2, borderColor: 'rgba(99,102,241,0.5)',
      }]} />

      {/* Phone */}
      <Animated.View style={[phoneSt, { alignItems: 'center' }]}>
        <Svg width={150} height={220} viewBox="0 0 150 220">
          <Defs>
            <SvgLinearGradient id="phoneG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#312e81" />
              <Stop offset="100%" stopColor="#1e1b4b" />
            </SvgLinearGradient>
            <SvgLinearGradient id="screenG" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#4f46e5" />
              <Stop offset="100%" stopColor="#312e81" />
            </SvgLinearGradient>
          </Defs>
          {/* Shadow */}
          <Ellipse cx="75" cy="214" rx="46" ry="7" fill="rgba(99,102,241,0.15)" />
          {/* Body */}
          <Rect x="12" y="8" width="126" height="200" rx="22" fill="url(#phoneG)" />
          {/* Screen */}
          <Rect x="18" y="22" width="114" height="172" rx="16" fill="url(#screenG)" />
          {/* Notch */}
          <Rect x="54" y="10" width="42" height="12" rx="6" fill="#0f0e1f" />
          {/* Home bar */}
          <Rect x="52" y="202" width="46" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
          {/* Status bar */}
          <Rect x="26" y="30" width="40" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
          <Circle cx="112" cy="32" r="3" fill="rgba(255,255,255,0.25)" />
          {/* App header */}
          <Rect x="24" y="44" width="102" height="28" rx="8" fill="rgba(255,255,255,0.1)" />
          <Circle cx="38" cy="58" r="8" fill="rgba(255,255,255,0.2)" />
          <Rect x="52" y="52" width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.3)" />
          <Rect x="52" y="61" width="34" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
          {/* Chat bubbles on screen */}
          <Rect x="24" y="82" width="72" height="26" rx="10" fill="rgba(255,255,255,0.18)" />
          <Path d="M24 104 L18 112 L36 104 Z" fill="rgba(255,255,255,0.18)" />
          <Rect x="30" y="88" width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.4)" />
          <Rect x="30" y="97" width="36" height="4" rx="2" fill="rgba(255,255,255,0.25)" />

          <Rect x="54" y="118" width="68" height="24" rx="10" fill="rgba(167,139,250,0.55)" />
          <Path d="M122 138 L128 146 L110 138 Z" fill="rgba(167,139,250,0.55)" />
          <Rect x="60" y="124" width="44" height="5" rx="2.5" fill="rgba(255,255,255,0.7)" />
          <Rect x="60" y="133" width="30" height="4" rx="2" fill="rgba(255,255,255,0.4)" />

          {/* Notification badge */}
          <Rect x="24" y="152" width="102" height="30" rx="8" fill="rgba(255,255,255,0.08)" />
          <Circle cx="36" cy="167" r="7" fill="rgba(251,191,36,0.7)" />
          <Rect x="48" y="162" width="56" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
          <Rect x="48" y="170" width="38" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        </Svg>
      </Animated.View>

      {/* Floating chat bubble left */}
      <Animated.View style={[b1St, { position: 'absolute', left: W * 0.05, top: H * 0.1 }]}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
          shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
          maxWidth: 130 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#0f172a' }}>📢 New announcement!</Text>
          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>School notice</Text>
        </View>
      </Animated.View>

      {/* Floating badge right */}
      <Animated.View style={[b2St, { position: 'absolute', right: W * 0.05, bottom: H * 0.1 }]}>
        <View style={{ backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
          shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
          flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark-done" size={14} color="#059669" />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#0f172a' }}>Result published</Text>
        </View>
      </Animated.View>

      {/* Floating heart */}
      <Animated.View style={[heartSt, { position: 'absolute', top: H * 0.04, right: W * 0.12 }]}>
        <Svg width={32} height={30} viewBox="0 0 32 30">
          <Path d="M16 28 C16 28 2 18 2 10 C2 5.5 5.5 2 10 2 C12.8 2 14.8 3.5 16 5.5 C17.2 3.5 19.2 2 22 2 C26.5 2 30 5.5 30 10 C30 18 16 28 16 28 Z" fill="#f87171" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const ILLUSTRATIONS = [
  WelcomeIllustration,
  SchoolIllustration,
  LearnersIllustration,
  ConnectedIllustration,
];

/* ─── Dot indicator ──────────────────────────────────────────────── */
function Dot({ active, accent }: { active: boolean; accent: string }) {
  return (
    <View style={{
      height: 7, borderRadius: 3.5,
      width: active ? 26 : 7,
      backgroundColor: active ? accent : '#e2e8f0',
      marginHorizontal: 3,
    }} />
  );
}

/* ─── Main screen ────────────────────────────────────────────────── */
export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const completeOnboarding = useAuthStore(s => s.completeOnboarding);
  const isAuthenticated    = useAuthStore(s => s.isAuthenticated);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const slide = SLIDES[activeIndex];
  const IllustrationComponent = ILLUSTRATIONS[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSpring(0.88, {}, () => { btnScale.value = withSpring(1); });
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      completeOnboarding();
      router.replace(isAuthenticated ? '/(tabs)/' : '/(auth)/sign-in');
    }
  }, [activeIndex, isAuthenticated]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
    router.replace(isAuthenticated ? '/(tabs)/' : '/(auth)/sign-in');
  }, [isAuthenticated]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: slide.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={slide.bg} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Skip button */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 4 }}>
          {!isLast ? (
            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '600' }}>Skip</Text>
            </Pressable>
          ) : <View style={{ height: 20 }} />}
        </View>

        {/* Illustration area */}
        <Animated.View
          key={`ill-${activeIndex}`}
          entering={FadeIn.duration(400)}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <IllustrationComponent />
        </Animated.View>

        {/* Text content (swipeable) */}
        <FlatList
          ref={flatRef}
          data={SLIDES as unknown as typeof SLIDES[]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
          style={{ flexGrow: 0 }}
          renderItem={({ item, index }) => (
            <View style={{ width: W, paddingHorizontal: 32 }}>
              {index === activeIndex && (
                <>
                  <Animated.Text
                    entering={FadeInDown.delay(40).duration(350)}
                    style={{ fontSize: 11, fontWeight: '800', color: item.accent,
                      letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}
                  >
                    {item.tag}
                  </Animated.Text>
                  <Animated.Text
                    entering={FadeInDown.delay(90).springify().damping(16)}
                    style={{ fontSize: 34, fontWeight: '900', color: '#0f172a',
                      lineHeight: 40, letterSpacing: -0.5, marginBottom: 12 }}
                  >
                    {item.title}
                  </Animated.Text>
                  <Animated.Text
                    entering={FadeInDown.delay(160).duration(400)}
                    style={{ fontSize: 14, color: '#64748b', lineHeight: 22, fontWeight: '400' }}
                  >
                    {item.body}
                  </Animated.Text>
                </>
              )}
            </View>
          )}
        />

        {/* Bottom controls */}
        <View style={{ paddingHorizontal: 32, paddingBottom: 20, paddingTop: 24 }}>
          {/* Dots + circular next button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Dots */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {SLIDES.map((_, i) => (
                <Dot key={i} active={i === activeIndex} accent={slide.accent} />
              ))}
            </View>

            {/* Circular next button */}
            <Animated.View style={btnStyle}>
              <Pressable onPress={handleNext}>
                <View style={{
                  width: 62, height: 62, borderRadius: 31,
                  backgroundColor: slide.accent,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: slide.accent, shadowOpacity: 0.45,
                  shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 10,
                }}>
                  <Ionicons
                    name={isLast ? 'rocket-outline' : 'arrow-forward'}
                    size={24}
                    color="#fff"
                  />
                </View>
              </Pressable>
            </Animated.View>
          </View>

          {/* Sign in link on last slide */}
          {isLast && (
            <Animated.View entering={FadeInUp.delay(200).springify()} style={{ alignItems: 'center', marginTop: 20 }}>
              <Pressable onPress={() => { completeOnboarding(); router.replace('/(auth)/sign-in'); }}>
                <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500' }}>
                  Already have an account?{' '}
                  <Text style={{ color: slide.accent, fontWeight: '700' }}>Sign in</Text>
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}
