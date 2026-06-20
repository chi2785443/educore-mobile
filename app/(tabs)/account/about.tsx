import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const APP_VERSION = '1.0.0';

const FEATURES = [
  { icon: 'people-outline' as const,        color: '#4C3FC4', bg: '#F0EEFF', label: 'Multi-role Access',    desc: 'Admins, staff, students and parents each get a tailored experience.' },
  { icon: 'book-outline' as const,          color: '#0ea5e9', bg: '#e0f2fe', label: 'Classroom Management', desc: 'Manage classes, timetables, assessments and scores in one place.' },
  { icon: 'bar-chart-outline' as const,     color: '#7c3aed', bg: '#f5f3ff', label: 'Results & Reports',    desc: 'Publish term results and detailed student report cards instantly.' },
  { icon: 'document-text-outline' as const, color: '#d97706', bg: '#fef3c7', label: 'Document Hub',         desc: 'Store and share school documents securely with role-based visibility.' },
  { icon: 'chatbubbles-outline' as const,   color: '#059669', bg: '#d1fae5', label: 'Messaging',            desc: 'Real-time chat between staff, students and school groups.' },
  { icon: 'school-outline' as const,        color: '#F5486A', bg: '#fff1f2', label: 'Multi-school',         desc: 'Switch between multiple schools without logging out.' },
];

const LINKS = [
  { icon: 'globe-outline' as const,           label: 'Website',        url: 'https://cakale-edu.app' },
  { icon: 'shield-checkmark-outline' as const, label: 'Privacy Policy', url: 'https://cakale-edu.app/privacy' },
  { icon: 'document-outline' as const,         label: 'Terms of Use',   url: 'https://cakale-edu.app/terms' },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>

      {/* ── Hero header ── */}
      <View style={{
        backgroundColor: '#0f172a',
        paddingHorizontal: 16, paddingTop: 18, paddingBottom: 36,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        alignItems: 'center',
      }}>
        {/* Decorative orbs */}
        <View style={{
          position: 'absolute', top: -30, right: -30,
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: 'rgba(76,63,196,0.15)',
        }} />
        <View style={{
          position: 'absolute', bottom: -20, left: -20,
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: 'rgba(245,72,106,0.10)',
        }} />

        {/* Back button */}
        <View style={{ width: '100%', flexDirection: 'row', marginBottom: 24 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
        </View>

        {/* Logo */}
        <View style={{
          width: 80, height: 80, borderRadius: 26,
          backgroundColor: '#fff',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
          shadowColor: '#4C3FC4', shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 8 }, shadowRadius: 20,
          elevation: 12,
        }}>
          <Image
            source={require('@/assets/images/cakale_edu_icon.svg')}
            style={{ width: 54, height: 54 }}
            contentFit="contain"
          />
        </View>

        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
          Cakale EDU
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>
          School Management System
        </Text>

        {/* Version badge */}
        <View style={{
          marginTop: 14,
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>
            Version {APP_VERSION}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>

        {/* ── Mission ── */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 20,
          borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden',
          shadowColor: '#000', shadowOpacity: 0.04,
          shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
        }}>
          <View style={{
            paddingHorizontal: 16, paddingVertical: 10,
            backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Our Mission
            </Text>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>
              Cakale EDU is a modern educational management platform built to connect schools, teachers, students and parents in one seamless experience.
            </Text>
            <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 10 }}>
              We believe every school deserves powerful, easy-to-use tools — from attendance and assessments to results and communication — all in one place.
            </Text>
          </View>
        </View>

        {/* ── Key features ── */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 20,
          borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden',
          shadowColor: '#000', shadowOpacity: 0.04,
          shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
        }}>
          <View style={{
            paddingHorizontal: 16, paddingVertical: 10,
            backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Key Features
            </Text>
          </View>
          <View style={{ padding: 16, gap: 14 }}>
            {FEATURES.map(f => (
              <View key={f.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: f.bg,
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Ionicons name={f.icon} size={17} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{f.label}</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 18, marginTop: 2 }}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Legal & links ── */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 20,
          borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden',
          shadowColor: '#000', shadowOpacity: 0.04,
          shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
        }}>
          <View style={{
            paddingHorizontal: 16, paddingVertical: 10,
            backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Legal & Info
            </Text>
          </View>
          {LINKS.map((l, i) => (
            <Pressable
              key={l.label}
              onPress={() => Linking.openURL(l.url)}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: i < LINKS.length - 1 ? 1 : 0,
                borderColor: '#f1f5f9',
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 11,
                  backgroundColor: '#f1f5f9',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Ionicons name={l.icon} size={16} color="#64748b" />
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{l.label}</Text>
                <Ionicons name="chevron-forward" size={15} color="#cbd5e1" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            © {new Date().getFullYear()} Cakale EDU. All rights reserved.
          </Text>
          <Text style={{ fontSize: 11, color: '#cbd5e1' }}>
            Made with ❤️ for schools everywhere
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
