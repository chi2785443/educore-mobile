import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FAQS = [
  {
    q: 'How do I switch between schools?',
    a: 'Go to Account → tap the Active School card. If you belong to multiple schools, you will see a "Switch" button that opens a school picker.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Go to Account → Change Password. Enter your current password, then choose and confirm a new one.',
  },
  {
    q: "Why can't I see my child's results?",
    a: "Results are only visible once published by the school. If the school has not yet released results for the current term, they will appear empty.",
  },
  {
    q: 'How do I link my child to my parent account?',
    a: "Contact your school administrator and ask them to link your account to your child's student profile. Once linked, your child will appear under My Children.",
  },
  {
    q: 'How do I update my profile picture?',
    a: 'Go to Account → Edit Profile. Tap the camera icon or the "Upload Photo" button to pick an image from your gallery.',
  },
  {
    q: 'Why are some features locked?',
    a: 'Certain features are role-specific. For example, attendance clocking is for staff, while results and reports are for students and parents. Make sure you are logged in with the correct role.',
  },
  {
    q: 'How do I send an enquiry to a school?',
    a: 'Go to Features → Enquiries. Tap "New Enquiry", pick a school, fill in your question and submit. The school will reply directly in the app.',
  },
  {
    q: 'Who can see my documents?',
    a: 'Documents marked "Public" are visible to school administrators. Documents marked "Private" are only visible to you and admins who uploaded them.',
  },
];

const CONTACT = [
  {
    icon: 'mail-outline' as const,
    label: 'Email Support',
    value: 'support@cakale-edu.app',
    color: '#4C3FC4',
    bg: '#F0EEFF',
    action: () => Linking.openURL('mailto:support@cakale-edu.app'),
  },
  {
    icon: 'logo-whatsapp' as const,
    label: 'WhatsApp',
    value: 'Chat with us',
    color: '#16a34a',
    bg: '#dcfce7',
    action: () => Linking.openURL('https://wa.me/message/cakale-edu'),
  },
  {
    icon: 'globe-outline' as const,
    label: 'Help Centre',
    value: 'cakale-edu.app/help',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    action: () => Linking.openURL('https://cakale-edu.app/help'),
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen(p => !p)}>
      <View style={{
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderColor: '#f1f5f9',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', lineHeight: 20 }}>{q}</Text>
            {open && (
              <Text style={{
                fontSize: 13, color: '#64748b', lineHeight: 20, marginTop: 8,
              }}>
                {a}
              </Text>
            )}
          </View>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#94a3b8"
            style={{ marginTop: 2, flexShrink: 0 }}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>

      {/* ── Hero header ── */}
      <View style={{
        backgroundColor: '#4C3FC4',
        paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <View style={{
          position: 'absolute', top: -20, right: -20,
          width: 130, height: 130, borderRadius: 65,
          backgroundColor: 'rgba(255,255,255,0.06)',
        }} />
        <View style={{
          position: 'absolute', bottom: -30, left: 40,
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: 'rgba(245,72,106,0.12)',
        }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
              Help & Support
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>
              FAQs and contact options
            </Text>
          </View>
          <View style={{
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="help-circle-outline" size={20} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>

        {/* ── Contact options ── */}
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
              Contact Us
            </Text>
          </View>
          {CONTACT.map((c, i) => (
            <Pressable
              key={c.label}
              onPress={c.action}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: i < CONTACT.length - 1 ? 1 : 0,
                borderColor: '#f1f5f9',
              }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 13,
                  backgroundColor: c.bg,
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Ionicons name={c.icon} size={18} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{c.label}</Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{c.value}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color="#cbd5e1" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Response time note ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          backgroundColor: '#fffbeb', borderRadius: 16,
          padding: 14, borderWidth: 1, borderColor: '#fef3c7',
        }}>
          <View style={{
            width: 36, height: 36, borderRadius: 11,
            backgroundColor: '#fef3c7',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ionicons name="time-outline" size={18} color="#d97706" />
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: '#92400e', lineHeight: 19 }}>
            We typically respond within <Text style={{ fontWeight: '700' }}>24 hours</Text> on weekdays.
          </Text>
        </View>

        {/* ── FAQ ── */}
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
              Frequently Asked Questions
            </Text>
          </View>
          {FAQS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
