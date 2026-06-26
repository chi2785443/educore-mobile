import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useParentChildren } from '@/hooks/useSchool';
import { ParentChild } from '@/services/school.service';

function ChildRow({ child, onPress }: { child: ParentChild; onPress: () => void }) {
  const s = child.student;
  if (!s) return null;
  const name = `${s.firstName} ${s.lastName}`;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderColor: '#f8fafc', gap: 12,
      }}>
        {/* Avatar */}
        {s.profilePicture ? (
          <Image
            source={{ uri: s.profilePicture }}
            style={{ width: 42, height: 42, borderRadius: 13 }}
            contentFit="cover"
          />
        ) : (
          <View style={{
            width: 42, height: 42, borderRadius: 13,
            backgroundColor: '#ede9fe',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#7c3aed' }}>
              {(s.firstName[0] ?? '').toUpperCase()}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{name}</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8' }} numberOfLines={1}>{s.email}</Text>
        </View>

        {/* Badges */}
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          {child.relationship && (
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'capitalize' }}>
                {child.relationship.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
          {child.gradeLevel && (
            <View style={{ backgroundColor: '#ede9fe', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#7c3aed' }}>{child.gradeLevel}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
        </View>
      </View>
    </Pressable>
  );
}

export default function MyChildrenReportsScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);

  const primary = (user?.schools ?? []).find(m => m.schoolId === selectedSchoolId)
    ?? (user?.schools ?? [])[0];
  const schoolId = primary?.schoolId ?? '';
  const userId = user?.id ?? '';

  const { data: children = [], isLoading } = useParentChildren(schoolId, userId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#7c3aed',
        paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
              {"Children's Reports"}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
              Select a child to view their reports
            </Text>
          </View>
          <View style={{
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="document-text-outline" size={18} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{
          margin: 16,
          backgroundColor: '#fff',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#f1f5f9',
          overflow: 'hidden',
        }}>
          {/* Column header */}
          <View style={{
            flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
            backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
          }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
              STUDENT
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
              GRADE
            </Text>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#7c3aed" />
            </View>
          ) : children.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: '#f8fafc', marginBottom: 12,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="people-outline" size={22} color="#e2e8f0" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>No linked children</Text>
              <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'center', maxWidth: 220 }}>
                Ask the school administrator to link your children to your account.
              </Text>
            </View>
          ) : (
            children.map(child => (
              <ChildRow
                key={child.id}
                child={child}
                onPress={() => child.student && router.push(`/my-children-reports/${child.student.id}` as never)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
