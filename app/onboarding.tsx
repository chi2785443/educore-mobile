import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, Pressable, Dimensions, FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeIn, FadeInDown, SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

/* ── Slide data ─────────────────────────────────────────────────── */
const ILLUSTRATIONS = [
  require('@/assets/images/onboard-welcome.svg'),
  require('@/assets/images/onboard-schools.svg'),
  require('@/assets/images/onboard-learners.svg'),
  require('@/assets/images/onboard-connected.svg'),
];

const SLIDES = [
  {
    id: '0',
    bg: '#0B0F14',
    accent: '#6366f1',
    accentSoft: 'rgba(99,102,241,0.15)',
    tag: 'WELCOME',
    title: 'Education,\nreimagined.',
    body: 'EduCore brings schools, students, staff and parents together in one beautiful platform.',
    icon: 'school' as const,
    shapes: [
      { x: -40, y: -60, size: 220, color: 'rgba(99,102,241,0.08)', delay: 0 },
      { x: W - 100, y: H * 0.25, size: 160, color: 'rgba(124,58,237,0.07)', delay: 200 },
      { x: W * 0.3, y: H * 0.55, size: 100, color: 'rgba(99,102,241,0.05)', delay: 400 },
    ],
    features: [],
  },
  {
    id: '1',
    bg: '#0d1b2e',
    accent: '#6366f1',
    accentSoft: 'rgba(99,102,241,0.12)',
    tag: 'FOR SCHOOLS',
    title: 'Manage your\nschool with ease.',
    body: 'From student enrollment to payroll, attendance to results — everything in one place.',
    icon: 'briefcase' as const,
    shapes: [
      { x: W - 80, y: -40, size: 200, color: 'rgba(99,102,241,0.1)', delay: 0 },
      { x: -60, y: H * 0.4, size: 180, color: 'rgba(79,70,229,0.08)', delay: 300 },
    ],
    features: [
      { icon: 'people-outline' as const, label: 'Staff & Student Management' },
      { icon: 'cash-outline' as const, label: 'Finance & Payroll' },
      { icon: 'bar-chart-outline' as const, label: 'Results & Reports' },
    ],
  },
  {
    id: '2',
    bg: '#0a1f1e',
    accent: '#14b8a6',
    accentSoft: 'rgba(20,184,166,0.12)',
    tag: 'FOR LEARNERS',
    title: 'Learn, grow,\nand excel.',
    body: 'Track assessments, view scores, follow your timetable, and celebrate every achievement.',
    icon: 'school-outline' as const,
    shapes: [
      { x: -50, y: -30, size: 190, color: 'rgba(20,184,166,0.1)', delay: 0 },
      { x: W - 60, y: H * 0.35, size: 150, color: 'rgba(13,148,136,0.08)', delay: 250 },
    ],
    features: [
      { icon: 'clipboard-outline' as const, label: 'Assessments & Quizzes' },
      { icon: 'trophy-outline' as const, label: 'Scores & Results' },
      { icon: 'calendar-outline' as const, label: 'Timetable & Attendance' },
    ],
  },
  {
    id: '3',
    bg: '#1a0a10',
    accent: '#e11d48',
    accentSoft: 'rgba(225,29,72,0.12)',
    tag: 'STAY CONNECTED',
    title: 'Your child\'s\njourney, in\nyour hands.',
    body: 'Parents get real-time updates, announcements, and a direct line to the school — always.',
    icon: 'heart-outline' as const,
    shapes: [
      { x: W - 100, y: -50, size: 210, color: 'rgba(225,29,72,0.09)', delay: 0 },
      { x: -40, y: H * 0.3, size: 170, color: 'rgba(190,18,60,0.07)', delay: 200 },
    ],
    features: [
      { icon: 'chatbubbles-outline' as const, label: 'Messages & Enquiries' },
      { icon: 'megaphone-outline' as const, label: 'School Announcements' },
      { icon: 'notifications-outline' as const, label: 'Real-time Notifications' },
    ],
  },
] as const;

/* ── Floating shape (decorative) ────────────────────────────────── */
function FloatingShape({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <Animated.View
      entering={FadeIn.duration(800)}
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

/* ── Feature pill ───────────────────────────────────────────────── */
function FeaturePill({ icon, label, accent, index }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; accent: string; index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 100).springify().damping(14)}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
        marginBottom: 8,
      }}
    >
      <View style={{
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: `${accent}25`,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={15} color={accent} />
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
    </Animated.View>
  );
}

/* ── Dot indicator ──────────────────────────────────────────────── */
function Dot({ index, activeIndex, accent }: { index: number; activeIndex: number; accent: string }) {
  const isActive = index === activeIndex;
  return (
    <Animated.View style={{
      height: 6, borderRadius: 3,
      width: isActive ? 24 : 6,
      backgroundColor: isActive ? accent : 'rgba(255,255,255,0.2)',
      marginHorizontal: 3,
    }} />
  );
}

/* ── Slide content ──────────────────────────────────────────────── */
function SlideContent({ slide, isActive }: { slide: typeof SLIDES[number]; isActive: boolean }) {
  if (!isActive) return null;
  const isFirst = slide.id === '0';

  return (
    <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 24, justifyContent: 'flex-end', paddingBottom: 20 }}>
      {/* Tag */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Text style={{
          color: slide.accent, fontSize: 11, fontWeight: '800',
          letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12,
        }}>
          {slide.tag}
        </Text>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={FadeInDown.delay(120).springify().damping(14)}
        style={{
          color: '#fff', fontSize: isFirst ? 44 : 38,
          fontWeight: '900', lineHeight: isFirst ? 50 : 44,
          letterSpacing: -1, marginBottom: 16,
        }}
      >
        {slide.title}
      </Animated.Text>

      {/* Body */}
      <Animated.Text
        entering={FadeInDown.delay(200).duration(500)}
        style={{
          color: 'rgba(255,255,255,0.5)', fontSize: 15,
          lineHeight: 23, fontWeight: '400', marginBottom: 28,
        }}
      >
        {slide.body}
      </Animated.Text>

      {/* Features */}
      {slide.features.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          {slide.features.map((f, i) => (
            <FeaturePill key={f.label} icon={f.icon} label={f.label} accent={slide.accent} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ── Illustration image ─────────────────────────────────────────── */
function SlideIllustration({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeIn.delay(80).duration(550)}
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <Image
        source={ILLUSTRATIONS[index]}
        style={{ width: W * 0.88, height: H * 0.31 }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

/* ── Main Onboarding ────────────────────────────────────────────── */
export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const completeOnboarding = useAuthStore(s => s.completeOnboarding);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const activePalette = SLIDES[activeIndex];

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSpring(0.93, {}, () => { btnScale.value = withSpring(1); });
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      completeOnboarding();
      if (isAuthenticated) router.replace('/(tabs)/');
      else router.replace('/(auth)/sign-in');
    }
  }, [activeIndex, isAuthenticated]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
    if (isAuthenticated) router.replace('/(tabs)/');
    else router.replace('/(auth)/sign-in');
  }, [isAuthenticated]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }).current;

  const isLast = activeIndex === SLIDES.length - 1;
  const slide = SLIDES[activeIndex];

  return (
    <View style={{ flex: 1, backgroundColor: slide.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={slide.bg} />

      {/* Floating background shapes */}
      {slide.shapes.map((s, i) => (
        <FloatingShape key={i} x={s.x} y={s.y} size={s.size} color={s.color} />
      ))}

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Skip */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 }}>
          {!isLast && (
            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: '600' }}>Skip</Text>
            </Pressable>
          )}
        </View>

        {/* Illustration area */}
        <View style={{ height: H * 0.34, alignItems: 'center', justifyContent: 'center' }}>
          <SlideIllustration index={activeIndex} key={`ill-${activeIndex}`} />
        </View>

        {/* Horizontal pager (invisible — we drive it programmatically too) */}
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
              <SlideContent slide={item} isActive={index === activeIndex} key={`content-${activeIndex}-${item.id}`} />
            </View>
          )}
        />

        {/* Bottom bar */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 12, gap: 20 }}>
          {/* Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            {SLIDES.map((_, i) => (
              <Dot key={i} index={i} activeIndex={activeIndex} accent={slide.accent} />
            ))}
          </View>

          {/* CTA button */}
          <Animated.View style={btnStyle}>
            <Pressable
              onPress={handleNext}
              style={{
                height: 56, borderRadius: 18,
                backgroundColor: slide.accent,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                shadowColor: slide.accent, shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 10,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 }}>
                {isLast ? 'Get Started' : 'Continue'}
              </Text>
              <Ionicons
                name={isLast ? 'rocket-outline' : 'arrow-forward'}
                size={18} color="#fff"
              />
            </Pressable>
          </Animated.View>

          {/* Sign in link on last slide */}
          {isLast && (
            <Animated.View entering={SlideInDown.delay(200).springify()} style={{ alignItems: 'center' }}>
              <Pressable onPress={() => { completeOnboarding(); router.replace('/(auth)/sign-in'); }}>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '500' }}>
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
