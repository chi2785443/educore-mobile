import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMyEnrollments } from '@/hooks/useEnrollment';
import { Enrollment } from '@/interface/enrollment.interface';

function statusConfig(status: Enrollment['status']) {
  switch (status) {
    case 'accepted':   return { label: 'Accepted',     bg: '#dcfce7', color: '#16a34a', icon: 'checkmark-circle' as const };
    case 'rejected':   return { label: 'Rejected',     bg: '#fee2e2', color: '#dc2626', icon: 'close-circle' as const };
    case 'under_review': return { label: 'Under Review', bg: '#dbeafe', color: '#2563eb', icon: 'eye-outline' as const };
    default:           return { label: 'Pending',      bg: '#fef3c7', color: '#d97706', icon: 'time-outline' as const };
  }
}

function EnrollmentCard({ item }: { item: Enrollment }) {
  const cfg = statusConfig(item.status);
  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: '#e5e7eb',
      shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={1}>
            {item.school?.name ?? 'School Application'}
          </Text>
          {item.trainingInterest && (
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }} numberOfLines={1}>
              {item.trainingInterest}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 }}>
          <Ionicons name={cfg.icon} size={13} color={cfg.color} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {item.gradeLevel && (
          <View style={{ backgroundColor: '#f5f3ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed' }}>Grade: {item.gradeLevel}</Text>
          </View>
        )}
        {item.previousSchool && (
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6b7280' }}>From: {item.previousSchool}</Text>
          </View>
        )}
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#9ca3af' }}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.status === 'rejected' && (
        <View style={{ marginTop: 10, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#dc2626' }}>
          <Text style={{ fontSize: 12, color: '#991b1b' }}>Your application was not successful. You may apply to another school.</Text>
        </View>
      )}
      {item.status === 'accepted' && (
        <View style={{ marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#16a34a' }}>
          <Text style={{ fontSize: 12, color: '#166534' }}>Congratulations! Your enrollment has been accepted.</Text>
        </View>
      )}
    </View>
  );
}

export default function MyEnrollmentsScreen() {
  const router = useRouter();
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#0c2030', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Enrollments</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {isLoading ? 'Loading…' : `${enrollments.length} application${enrollments.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <Ionicons name="document-text-outline" size={22} color="#5eead4" />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#14b8a6" size="large" />
        </View>
      ) : enrollments.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
            No applications yet
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            When you apply to enroll in a school, your applications will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        >
          {enrollments.map(item => <EnrollmentCard key={item.id} item={item} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
