import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, Dimensions, FlatList,
  StatusBar, ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withTiming, withDelay, Easing,
  FadeIn, FadeInDown, SlideInDown,
} from 'react-native-reanimated';
import Svg, {
  Circle, Path, Rect, G, Ellipse, Polygon,
  Line, Defs, RadialGradient, Stop, ClipPath,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');
const SMOOTH = { duration: 2000, easing: Easing.inOut(Easing.quad) };

/* ─────────────────────────────────────────────────────────────────
   Slide definitions
───────────────────────────────────────────────────────────────── */
const SLIDES = [
  {
    id: '0',
    gradient: ['#0f0326', '#3b0764', '#6d28d9'] as const,
    accent: '#a78bfa',
    accentBtn: '#7c3aed',
    accentSoft: 'rgba(167,139,250,0.15)',
    tag: 'WELCOME',
    title: 'Education,\nreimagined.',
    body: 'EduCore brings schools, students, staff and parents together in one beautiful platform.',
    features: [],
  },
  {
    id: '1',
    gradient: ['#050d1f', '#1e3a8a', '#2563eb'] as const,
    accent: '#60a5fa',
    accentBtn: '#2563eb',
    accentSoft: 'rgba(96,165,250,0.15)',
    tag: 'FOR SCHOOLS',
    title: 'Manage your\nschool with ease.',
    body: 'Enrollment, payroll, attendance and results — all under one roof.',
    features: [
      { icon: 'people-outline' as const, label: 'Staff & Student Management' },
      { icon: 'cash-outline' as const, label: 'Finance & Payroll' },
      { icon: 'bar-chart-outline' as const, label: 'Results & Reports' },
    ],
  },
  {
    id: '2',
    gradient: ['#021510', '#064e3b', '#059669'] as const,
    accent: '#34d399',
    accentBtn: '#059669',
    accentSoft: 'rgba(52,211,153,0.15)',
    tag: 'FOR LEARNERS',
    title: 'Learn, grow,\nand excel.',
    body: 'Track assessments, view scores, follow your timetable, and celebrate every win.',
    features: [
      { icon: 'clipboard-outline' as const, label: 'Assessments & Quizzes' },
      { icon: 'trophy-outline' as const, label: 'Scores & Results' },
      { icon: 'calendar-outline' as const, label: 'Timetable & Attendance' },
    ],
  },
  {
    id: '3',
    gradient: ['#1a0500', '#7c2d12', '#ea580c'] as const,
    accent: '#fb923c',
    accentBtn: '#ea580c',
    accentSoft: 'rgba(251,146,60,0.15)',
    tag: 'STAY CONNECTED',
    title: "Your child's\njourney, in\nyour hands.",
    body: "Parents get real-time updates, announcements, and a direct line to the school — always.",
    features: [
      { icon: 'chatbubbles-outline' as const, label: 'Messages & Enquiries' },
      { icon: 'megaphone-outline' as const, label: 'School Announcements' },
      { icon: 'notifications-outline' as const, label: 'Real-time Notifications' },
    ],
  },
] as const;

/* ─────────────────────────────────────────────────────────────────
   Illustration 0 — Graduation cap + orbiting stars
───────────────────────────────────────────────────────────────── */
function WelcomeIllustration() {
  const floatY   = useSharedValue(0);
  const pulseS   = useSharedValue(1);
  const star1Y   = useSharedValue(0);
  const star2Y   = useSharedValue(0);
  const star3Y   = useSharedValue(0);
  const sparkleO = useSharedValue(0.3);

  useEffect(() => {
    floatY.value   = withRepeat(withTiming(-16, SMOOTH), -1, true);
    pulseS.value   = withRepeat(withTiming(1.25, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
    star1Y.value   = withRepeat(withDelay(0,   withTiming(-12, { duration: 1900 })), -1, true);
    star2Y.value   = withRepeat(withDelay(350, withTiming(-9,  { duration: 2200 })), -1, true);
    star3Y.value   = withRepeat(withDelay(650, withTiming(-14, { duration: 1700 })), -1, true);
    sparkleO.value = withRepeat(withTiming(1,  { duration: 1400 }), -1, true);
  }, []);

  const capStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const glowStyle   = useAnimatedStyle(() => ({ transform: [{ scale: pulseS.value }], opacity: 0.12 + (pulseS.value - 1) * 0.25 }));
  const s1Style     = useAnimatedStyle(() => ({ transform: [{ translateY: star1Y.value }] }));
  const s2Style     = useAnimatedStyle(() => ({ transform: [{ translateY: star2Y.value }] }));
  const s3Style     = useAnimatedStyle(() => ({ transform: [{ translateY: star3Y.value }] }));
  const sparkStyle  = useAnimatedStyle(() => ({ opacity: sparkleO.value }));

  return (
    <View style={{ width: W * 0.85, height: H * 0.30, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow blob */}
      <Animated.View style={[glowStyle, {
        position: 'absolute', width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(139,92,246,0.35)',
      }]} />

      {/* Main cap */}
      <Animated.View style={[capStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <Svg width={170} height={145} viewBox="0 0 170 145">
          <Defs>
            <RadialGradient id="capGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#c4b5fd" stopOpacity="1" />
              <Stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          {/* Glow under cap */}
          <Ellipse cx="85" cy="110" rx="55" ry="10" fill="rgba(139,92,246,0.3)" />
          {/* Board */}
          <Path d="M85 18 L158 56 L85 72 L12 56 Z" fill="url(#capGlow)" />
          {/* Board shine */}
          <Path d="M85 18 L158 56 L152 60 L85 24 Z" fill="rgba(255,255,255,0.22)" />
          {/* Cap body */}
          <Rect x="64" y="56" width="42" height="32" rx="5" fill="#5b21b6" />
          {/* Cap top flat */}
          <Rect x="64" y="52" width="42" height="10" rx="3" fill="#7c3aed" />
          {/* Tassel line */}
          <Line x1="155" y1="56" x2="150" y2="96" stroke="#fcd34d" strokeWidth="3.5" strokeLinecap="round" />
          {/* Tassel bob */}
          <Circle cx="150" cy="102" r="9" fill="#fcd34d" />
          <Circle cx="150" cy="102" r="5" fill="#f59e0b" />
          {/* Diploma scroll */}
          <Rect x="30" y="88" width="28" height="20" rx="4" fill="rgba(255,255,255,0.15)" />
          <Line x1="34" y1="95" x2="54" y2="95" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <Line x1="34" y1="100" x2="50" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        </Svg>
      </Animated.View>

      {/* Star top-right */}
      <Animated.View style={[s1Style, { position: 'absolute', top: 10, right: 28 }]}>
        <Svg width={30} height={30} viewBox="0 0 30 30">
          <Polygon points="15,2 18,11 28,11 20,17 23,26 15,20 7,26 10,17 2,11 12,11" fill="#fcd34d" />
        </Svg>
      </Animated.View>

      {/* Star left */}
      <Animated.View style={[s2Style, { position: 'absolute', left: 22, top: H * 0.07 }]}>
        <Svg width={22} height={22} viewBox="0 0 22 22">
          <Polygon points="11,1 13,8 21,8 15,12 17,20 11,15 5,20 7,12 1,8 9,8" fill="#a78bfa" />
        </Svg>
      </Animated.View>

      {/* Sparkle dot */}
      <Animated.View style={[s3Style, sparkStyle, { position: 'absolute', right: 55, bottom: 28 }]}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Circle cx="7" cy="7" r="6" fill="#fcd34d" />
        </Svg>
      </Animated.View>

      {/* Small orbit dot */}
      <Animated.View style={[s2Style, { position: 'absolute', right: 30, bottom: 55 }]}>
        <Svg width={10} height={10} viewBox="0 0 10 10">
          <Circle cx="5" cy="5" r="4" fill="rgba(167,139,250,0.7)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Illustration 1 — School building + animated elements
───────────────────────────────────────────────────────────────── */
function SchoolIllustration() {
  const floatY   = useSharedValue(0);
  const winA     = useSharedValue(0.4);
  const winB     = useSharedValue(0.8);
  const flagRot  = useSharedValue(0);
  const chartBar = useSharedValue(0.6);

  useEffect(() => {
    floatY.value   = withRepeat(withTiming(-12, SMOOTH), -1, true);
    winA.value     = withRepeat(withTiming(1,   { duration: 1600 }), -1, true);
    winB.value     = withRepeat(withTiming(0.4, { duration: 2100 }), -1, true);
    flagRot.value  = withRepeat(withTiming(8,   { duration: 1200, easing: Easing.inOut(Easing.quad) }), -1, true);
    chartBar.value = withRepeat(withTiming(1,   { duration: 1800 }), -1, true);
  }, []);

  const buildStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const winAStyle   = useAnimatedStyle(() => ({ opacity: winA.value }));
  const winBStyle   = useAnimatedStyle(() => ({ opacity: winB.value }));
  const flagStyle   = useAnimatedStyle(() => ({ transform: [{ rotate: `${flagRot.value}deg` }] }));
  const barStyle    = useAnimatedStyle(() => ({ transform: [{ scaleY: chartBar.value }], opacity: chartBar.value }));

  return (
    <View style={{ width: W * 0.85, height: H * 0.30, alignItems: 'center', justifyContent: 'center' }}>
      {/* Ground glow */}
      <Animated.View style={[buildStyle]}>
        <Svg width={200} height={155} viewBox="0 0 200 155">
          <Defs>
            <RadialGradient id="blueGlow" cx="50%" cy="100%" r="60%">
              <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="100" cy="148" rx="80" ry="10" fill="rgba(96,165,250,0.25)" />

          {/* Main building body */}
          <Rect x="30" y="65" width="140" height="80" rx="4" fill="#1e3a8a" />
          {/* Roof */}
          <Path d="M20 68 L100 20 L180 68 Z" fill="#1d4ed8" />
          {/* Roof shine */}
          <Path d="M20 68 L100 20 L110 22 L30 68 Z" fill="rgba(255,255,255,0.15)" />

          {/* Windows row 1 */}
          <Rect x="48" y="78" width="24" height="20" rx="3" fill="#bfdbfe" />
          <Rect x="88" y="78" width="24" height="20" rx="3" fill="#93c5fd" />
          <Rect x="128" y="78" width="24" height="20" rx="3" fill="#bfdbfe" />
          {/* Windows row 2 */}
          <Rect x="48" y="106" width="24" height="20" rx="3" fill="#93c5fd" />
          <Rect x="128" y="106" width="24" height="20" rx="3" fill="#bfdbfe" />

          {/* Door */}
          <Rect x="82" y="108" width="36" height="37" rx="4" fill="#1e40af" />
          <Rect x="82" y="108" width="36" height="37" rx="4" fill="rgba(0,0,0,0.2)" />
          <Circle cx="115" cy="127" r="2.5" fill="#fbbf24" />

          {/* Flagpole */}
          <Line x1="100" y1="20" x2="100" y2="0" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />

          {/* Steps */}
          <Rect x="74" y="143" width="52" height="7" rx="2" fill="#1d4ed8" />
          <Rect x="68" y="148" width="64" height="6" rx="2" fill="#2563eb" />
        </Svg>
      </Animated.View>

      {/* Animated window glows */}
      <Animated.View style={[winAStyle, { position: 'absolute', left: W * 0.15, top: H * 0.045 }]}>
        <Svg width={26} height={22} viewBox="0 0 26 22">
          <Rect x="0" y="0" width="26" height="22" rx="3" fill="#fef08a" />
        </Svg>
      </Animated.View>
      <Animated.View style={[winBStyle, { position: 'absolute', right: W * 0.15, top: H * 0.045 }]}>
        <Svg width={26} height={22} viewBox="0 0 26 22">
          <Rect x="0" y="0" width="26" height="22" rx="3" fill="#fef08a" />
        </Svg>
      </Animated.View>

      {/* Flag */}
      <Animated.View style={[flagStyle, { position: 'absolute', top: 2, left: W * 0.46 }]}>
        <Svg width={24} height={18} viewBox="0 0 24 18">
          <Path d="M0 0 L24 6 L0 12 Z" fill="#fb923c" />
        </Svg>
      </Animated.View>

      {/* Floating chart bars - top right */}
      <Animated.View style={[barStyle, { position: 'absolute', right: 18, top: 20 }]}>
        <Svg width={40} height={36} viewBox="0 0 40 36">
          <Rect x="2"  y="20" width="8"  height="16" rx="2" fill="rgba(96,165,250,0.8)" />
          <Rect x="14" y="12" width="8"  height="24" rx="2" fill="rgba(147,197,253,0.9)" />
          <Rect x="26" y="6"  width="8"  height="30" rx="2" fill="rgba(96,165,250,1)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Illustration 2 — Open book + floating letters
───────────────────────────────────────────────────────────────── */
function LearnersIllustration() {
  const floatY  = useSharedValue(0);
  const letter1 = useSharedValue(0);
  const letter2 = useSharedValue(0);
  const letter3 = useSharedValue(0);
  const pencilR = useSharedValue(-12);
  const glowP   = useSharedValue(1);

  useEffect(() => {
    floatY.value  = withRepeat(withTiming(-14, SMOOTH), -1, true);
    letter1.value = withRepeat(withDelay(0,   withTiming(-18, { duration: 2000 })), -1, true);
    letter2.value = withRepeat(withDelay(500, withTiming(-14, { duration: 1700 })), -1, true);
    letter3.value = withRepeat(withDelay(900, withTiming(-20, { duration: 2300 })), -1, true);
    pencilR.value = withRepeat(withTiming(12, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, true);
    glowP.value   = withRepeat(withTiming(1.3, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);

  const bookStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const l1Style      = useAnimatedStyle(() => ({ transform: [{ translateY: letter1.value }] }));
  const l2Style      = useAnimatedStyle(() => ({ transform: [{ translateY: letter2.value }] }));
  const l3Style      = useAnimatedStyle(() => ({ transform: [{ translateY: letter3.value }] }));
  const pencilStyle  = useAnimatedStyle(() => ({ transform: [{ rotate: `${pencilR.value}deg` }] }));
  const glowStyle    = useAnimatedStyle(() => ({ transform: [{ scale: glowP.value }], opacity: 0.18 }));

  return (
    <View style={{ width: W * 0.85, height: H * 0.30, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[glowStyle, {
        position: 'absolute', width: 200, height: 180, borderRadius: 100,
        backgroundColor: 'rgba(52,211,153,0.35)',
      }]} />

      <Animated.View style={bookStyle}>
        <Svg width={190} height={140} viewBox="0 0 190 140">
          <Defs>
            <RadialGradient id="bookGlow" cx="50%" cy="80%" r="60%">
              <Stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#065f46" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {/* Shadow */}
          <Ellipse cx="95" cy="132" rx="65" ry="9" fill="rgba(52,211,153,0.2)" />

          {/* Left page */}
          <Path d="M95 28 L20 40 L20 118 L95 110 Z" fill="#065f46" />
          <Path d="M95 28 L22 40 L22 115 L95 107 Z" fill="#047857" />
          {/* Left page lines */}
          <Line x1="32" y1="56" x2="88" y2="52" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
          <Line x1="32" y1="66" x2="88" y2="62" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
          <Line x1="32" y1="76" x2="88" y2="72" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
          <Line x1="32" y1="86" x2="88" y2="82" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
          <Line x1="32" y1="96" x2="88" y2="92" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />

          {/* Right page */}
          <Path d="M95 28 L170 40 L170 118 L95 110 Z" fill="#065f46" />
          <Path d="M95 28 L168 40 L168 115 L95 107 Z" fill="#047857" />
          {/* Right page lines */}
          <Line x1="102" y1="52" x2="158" y2="56" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
          <Line x1="102" y1="62" x2="158" y2="66" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
          <Line x1="102" y1="72" x2="158" y2="76" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
          <Line x1="102" y1="82" x2="158" y2="86" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />

          {/* Spine */}
          <Rect x="92" y="25" width="6" height="88" rx="3" fill="#34d399" />

          {/* Star on book */}
          <Polygon points="50,62 52,68 58,68 53,72 55,78 50,74 45,78 47,72 42,68 48,68" fill="#fcd34d" />
        </Svg>
      </Animated.View>

      {/* Floating A */}
      <Animated.View style={[l1Style, { position: 'absolute', left: 25, top: H * 0.02 }]}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(52,211,153,0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#34d399', fontSize: 16, fontWeight: '900' }}>A</Text>
        </View>
      </Animated.View>

      {/* Floating + */}
      <Animated.View style={[l2Style, { position: 'absolute', right: 22, top: H * 0.03 }]}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(251,191,36,0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fbbf24', fontSize: 18, fontWeight: '900' }}>+</Text>
        </View>
      </Animated.View>

      {/* Floating π */}
      <Animated.View style={[l3Style, { position: 'absolute', right: 50, bottom: 20 }]}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(52,211,153,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#6ee7b7', fontSize: 14, fontWeight: '900' }}>π</Text>
        </View>
      </Animated.View>

      {/* Pencil */}
      <Animated.View style={[pencilStyle, { position: 'absolute', right: 14, bottom: 50 }]}>
        <Svg width={18} height={60} viewBox="0 0 18 60">
          <Rect x="4" y="4" width="10" height="44" rx="2" fill="#fbbf24" />
          <Path d="M4 48 L9 60 L14 48 Z" fill="#f87171" />
          <Rect x="4" y="4" width="10" height="8" rx="2" fill="#d1d5db" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Illustration 3 — Phone + chat bubbles
───────────────────────────────────────────────────────────────── */
function ConnectedIllustration() {
  const floatY  = useSharedValue(0);
  const bub1Y   = useSharedValue(0);
  const bub2Y   = useSharedValue(0);
  const bub3Y   = useSharedValue(0);
  const ringS   = useSharedValue(1);
  const heartS  = useSharedValue(1);
  const bub1O   = useSharedValue(1);
  const bub2O   = useSharedValue(0.7);
  const bub3O   = useSharedValue(0.5);

  useEffect(() => {
    floatY.value = withRepeat(withTiming(-12, SMOOTH), -1, true);
    bub1Y.value  = withRepeat(withTiming(-55, { duration: 2200 }), -1, false);
    bub2Y.value  = withRepeat(withDelay(600, withTiming(-50, { duration: 2000 })), -1, false);
    bub3Y.value  = withRepeat(withDelay(1100, withTiming(-45, { duration: 1900 })), -1, false);
    bub1O.value  = withRepeat(withTiming(0, { duration: 2200 }), -1, false);
    bub2O.value  = withRepeat(withDelay(600, withTiming(0, { duration: 2000 })), -1, false);
    bub3O.value  = withRepeat(withDelay(1100, withTiming(0, { duration: 1900 })), -1, false);
    ringS.value  = withRepeat(withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.quad) }), -1, false);
    heartS.value = withRepeat(withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);

  const phoneStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const b1Style    = useAnimatedStyle(() => ({ transform: [{ translateY: bub1Y.value }], opacity: bub1O.value }));
  const b2Style    = useAnimatedStyle(() => ({ transform: [{ translateY: bub2Y.value }], opacity: bub2O.value }));
  const b3Style    = useAnimatedStyle(() => ({ transform: [{ translateY: bub3Y.value }], opacity: bub3O.value }));
  const ringStyle  = useAnimatedStyle(() => ({ transform: [{ scale: ringS.value }], opacity: (2 - ringS.value) * 0.4 }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartS.value }] }));

  return (
    <View style={{ width: W * 0.85, height: H * 0.30, alignItems: 'center', justifyContent: 'center' }}>
      {/* Ping ring */}
      <Animated.View style={[ringStyle, {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        borderWidth: 2, borderColor: 'rgba(251,146,60,0.6)',
      }]} />

      {/* Phone */}
      <Animated.View style={[phoneStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <Svg width={110} height={160} viewBox="0 0 110 160">
          <Defs>
            <RadialGradient id="screenGlow" cx="50%" cy="40%" r="50%">
              <Stop offset="0%" stopColor="#fed7aa" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {/* Shadow */}
          <Ellipse cx="55" cy="154" rx="36" ry="7" fill="rgba(251,146,60,0.2)" />
          {/* Phone body */}
          <Rect x="10" y="8" width="90" height="140" rx="18" fill="#1c0a00" />
          <Rect x="10" y="8" width="90" height="140" rx="18" fill="url(#screenGlow)" />
          {/* Screen */}
          <Rect x="16" y="20" width="78" height="112" rx="12" fill="#7c2d12" />
          {/* Screen content */}
          <Rect x="22" y="30" width="66" height="8" rx="4" fill="rgba(251,146,60,0.5)" />
          <Rect x="22" y="44" width="50" height="6" rx="3" fill="rgba(255,255,255,0.15)" />
          {/* Notch */}
          <Rect x="40" y="10" width="30" height="8" rx="4" fill="#0d0500" />
          {/* Home bar */}
          <Rect x="38" y="142" width="34" height="4" rx="2" fill="rgba(255,255,255,0.2)" />

          {/* Chat bubble on screen */}
          <Rect x="24" y="56" width="44" height="22" rx="8" fill="rgba(251,146,60,0.6)" />
          <Path d="M24 74 L20 80 L32 74 Z" fill="rgba(251,146,60,0.6)" />
          <Rect x="40" y="62" width="36" height="20" rx="8" fill="rgba(255,255,255,0.2)" />
          <Path d="M76 78 L80 84 L68 78 Z" fill="rgba(255,255,255,0.2)" />

          {/* Stars on screen */}
          <Circle cx="32" cy="97" r="4" fill="#fb923c" />
          <Circle cx="42" cy="97" r="4" fill="#fb923c" />
          <Circle cx="52" cy="97" r="4" fill="#fb923c" />
          <Circle cx="62" cy="97" r="3" fill="rgba(251,146,60,0.4)" />
          <Circle cx="70" cy="97" r="3" fill="rgba(251,146,60,0.4)" />
        </Svg>
      </Animated.View>

      {/* Floating bubbles */}
      <Animated.View style={[b1Style, { position: 'absolute', left: W * 0.08, bottom: H * 0.06 }]}>
        <Svg width={52} height={34} viewBox="0 0 52 34">
          <Rect x="0" y="0" width="52" height="28" rx="14" fill="rgba(251,146,60,0.75)" />
          <Path d="M8 26 L4 34 L18 26 Z" fill="rgba(251,146,60,0.75)" />
          <Rect x="8" y="8" width="20" height="5" rx="2.5" fill="rgba(255,255,255,0.6)" />
          <Rect x="8" y="16" width="32" height="5" rx="2.5" fill="rgba(255,255,255,0.4)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[b2Style, { position: 'absolute', right: W * 0.07, bottom: H * 0.05 }]}>
        <Svg width={44} height={30} viewBox="0 0 44 30">
          <Rect x="0" y="0" width="44" height="24" rx="12" fill="rgba(255,255,255,0.18)" />
          <Path d="M36 22 L40 30 L26 22 Z" fill="rgba(255,255,255,0.18)" />
          <Rect x="8" y="7" width="28" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
          <Rect x="8" y="14" width="18" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[b3Style, { position: 'absolute', left: W * 0.2, bottom: H * 0.07 }]}>
        <Svg width={32} height={22} viewBox="0 0 32 22">
          <Rect x="0" y="0" width="32" height="18" rx="9" fill="rgba(253,186,116,0.6)" />
          <Path d="M4 16 L0 22 L12 16 Z" fill="rgba(253,186,116,0.6)" />
        </Svg>
      </Animated.View>

      {/* Heart */}
      <Animated.View style={[heartStyle, { position: 'absolute', top: 12, right: 28 }]}>
        <Svg width={26} height={24} viewBox="0 0 26 24">
          <Path d="M13 22 C13 22 2 15 2 8 C2 4.5 4.5 2 8 2 C10.5 2 12 3.5 13 5 C14 3.5 15.5 2 18 2 C21.5 2 24 4.5 24 8 C24 15 13 22 13 22 Z" fill="#f87171" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Illustrations map
───────────────────────────────────────────────────────────────── */
const ILLUSTRATION_COMPONENTS = [
  WelcomeIllustration,
  SchoolIllustration,
  LearnersIllustration,
  ConnectedIllustration,
];

/* ─────────────────────────────────────────────────────────────────
   Feature pill
───────────────────────────────────────────────────────────────── */
function FeaturePill({ icon, label, accent, index }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; accent: string; index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 90).springify().damping(14)}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6,
      }}
    >
      <View style={{
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: `${accent}28`,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={14} color={accent} />
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Progress dot
───────────────────────────────────────────────────────────────── */
function Dot({ active, accent }: { active: boolean; accent: string }) {
  return (
    <Animated.View style={{
      height: 6, borderRadius: 3,
      width: active ? 24 : 6,
      backgroundColor: active ? accent : 'rgba(255,255,255,0.2)',
      marginHorizontal: 3,
    }} />
  );
}

/* ─────────────────────────────────────────────────────────────────
   Slide content
───────────────────────────────────────────────────────────────── */
function SlideContent({ slide, isActive }: { slide: typeof SLIDES[number]; isActive: boolean }) {
  if (!isActive) return null;
  const isFirst = slide.id === '0';

  return (
    <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 8 }}>
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Text style={{
          color: slide.accent, fontSize: 11, fontWeight: '800',
          letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8,
        }}>
          {slide.tag}
        </Text>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(110).springify().damping(14)}
        style={{
          color: '#fff', fontSize: isFirst ? 42 : 34,
          fontWeight: '900', lineHeight: isFirst ? 48 : 40,
          letterSpacing: -0.8, marginBottom: 12,
        }}
      >
        {slide.title}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(190).duration(500)}
        style={{
          color: 'rgba(255,255,255,0.55)', fontSize: 14,
          lineHeight: 21, fontWeight: '400', marginBottom: 16,
        }}
      >
        {slide.body}
      </Animated.Text>

      {slide.features.length > 0 && (
        <View>
          {slide.features.map((f, i) => (
            <FeaturePill key={f.label} icon={f.icon} label={f.label} accent={slide.accent} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main screen
───────────────────────────────────────────────────────────────── */
export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const completeOnboarding = useAuthStore(s => s.completeOnboarding);
  const isAuthenticated    = useAuthStore(s => s.isAuthenticated);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const slide = SLIDES[activeIndex];
  const IllustrationComponent = ILLUSTRATION_COMPONENTS[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSpring(0.93, {}, () => { btnScale.value = withSpring(1); });
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
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen gradient background */}
      <LinearGradient
        colors={[...slide.gradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Soft radial overlay */}
      <View style={{
        position: 'absolute', top: -80, left: -60,
        width: W * 1.2, height: W * 1.2, borderRadius: W * 0.6,
        backgroundColor: 'rgba(255,255,255,0.04)',
      }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Skip */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 22, paddingTop: 6 }}>
          {!isLast && (
            <Pressable onPress={handleSkip} hitSlop={14}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' }}>Skip</Text>
            </Pressable>
          )}
        </View>

        {/* Illustration */}
        <Animated.View
          key={`ill-${activeIndex}`}
          entering={FadeIn.duration(500)}
          style={{ height: H * 0.33, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        >
          <IllustrationComponent />
        </Animated.View>

        {/* Swipeable text content */}
        <FlatList
          ref={flatRef}
          data={SLIDES as unknown as typeof SLIDES[]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled
          keyExtractor={item => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
          style={{ flex: 1 }}
          renderItem={({ item, index }) => (
            <View style={{ width: W }}>
              <SlideContent
                slide={item}
                isActive={index === activeIndex}
                key={`c-${activeIndex}-${item.id}`}
              />
            </View>
          )}
        />

        {/* Bottom controls */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 14, gap: 18 }}>
          {/* Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            {SLIDES.map((_, i) => (
              <Dot key={i} active={i === activeIndex} accent={slide.accent} />
            ))}
          </View>

          {/* CTA */}
          <Animated.View style={btnStyle}>
            <Pressable
              onPress={handleNext}
              style={{
                height: 56, borderRadius: 18,
                backgroundColor: slide.accentBtn,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
                shadowColor: slide.accentBtn, shadowOpacity: 0.55,
                shadowOffset: { width: 0, height: 10 }, shadowRadius: 22, elevation: 12,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 }}>
                {isLast ? 'Get Started' : 'Continue'}
              </Text>
              <Ionicons name={isLast ? 'rocket-outline' : 'arrow-forward'} size={18} color="#fff" />
            </Pressable>
          </Animated.View>

          {isLast && (
            <Animated.View entering={SlideInDown.delay(200).springify()} style={{ alignItems: 'center' }}>
              <Pressable onPress={() => { completeOnboarding(); router.replace('/(auth)/sign-in'); }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '500' }}>
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
