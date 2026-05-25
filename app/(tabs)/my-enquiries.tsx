import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMyEnquiries } from '@/hooks/useEnquiry';
import { Enquiry } from '@/interface/enquiry.interface';

function statusConfig(status: Enquiry['status']) {
  switch (status) {
    case 'replied': return { label: 'Replied',  bg: '#dcfce7', color: '#16a34a', icon: 'checkmark-done-outline' as const };
    case 'closed':  return { label: 'Closed',   bg: '#f1f5f9', color: '#64748b', icon: 'lock-closed-outline' as const };
    default:        return { label: 'Pending',  bg: '#fef3c7', color: '#d97706', icon: 'time-outline' as const };
  }
}

function categoryLabel(cat?: string) {
  if (!cat) return null;
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function EnquiryCard({ item }: { item: Enquiry }) {
  const cfg = statusConfig(item.status);
  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: '#e5e7eb',
      shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={2}>
          {item.subject}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, flexShrink: 0 }}>
          <Ionicons name={cfg.icon} size={13} color={cfg.color} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 19 }} numberOfLines={2}>
        {item.message}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {item.category && (
          <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e' }}>{categoryLabel(item.category)}</Text>
          </View>
        )}
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#9ca3af' }}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MyEnquiriesScreen() {
  const router = useRouter();
  const { data: enquiries = [], isLoading } = useMyEnquiries();

  const pending  = enquiries.filter(e => e.status === 'pending').length;
  const replied  = enquiries.filter(e => e.status === 'replied').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#1c1200', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: enquiries.length > 0 ? 14 : 0 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Enquiries</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {isLoading ? 'Loading…' : `${enquiries.length} enquir${enquiries.length !== 1 ? 'ies' : 'y'}`}
            </Text>
          </View>
          <Ionicons name="chatbubble-outline" size={22} color="#fbbf24" />
        </View>

        {/* Stats strip */}
        {enquiries.length > 0 && !isLoading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Total',   value: enquiries.length, color: '#fbbf24' },
              { label: 'Pending', value: pending,          color: '#fb923c' },
              { label: 'Replied', value: replied,          color: '#4ade80' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: s.color, fontSize: 20, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#f59e0b" size="large" />
        </View>
      ) : enquiries.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
            No enquiries yet
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            When you send enquiries to schools, they'll appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        >
          {enquiries.map(item => <EnquiryCard key={item.id} item={item} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
