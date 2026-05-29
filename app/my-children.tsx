import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useParentChildren } from '@/hooks/useSchool';
import { ParentChild } from '@/services/school.service';


function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={{
      flex: 1,
      borderRadius: 18,
      padding: 16,
      backgroundColor: color,
    }}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 32 }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', marginTop: 3 }}>{label}</Text>
    </View>
  );
}

function ChildCard({ child }: { child: ParentChild }) {
  const s = child.student;
  if (!s) return null;
  const name = `${s.firstName} ${s.lastName}`;

  return (
    <View style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
      }}>
        {/* Avatar */}
        <View style={{ position: 'relative' }}>
          {s.profilePicture ? (
            <Image
              source={{ uri: s.profilePicture }}
              style={{ width: 52, height: 52, borderRadius: 16 }}
              contentFit="cover"
            />
          ) : (
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: '#fce7f3',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#e11d48' }}>
                {getInitials(s.firstName, s.lastName)}
              </Text>
            </View>
          )}
          {child.isPrimaryContact && (
            <View style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: '#f59e0b',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#fff',
            }}>
              <Ionicons name="star" size={9} color="#fff" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ fontSize: 12, color: '#94a3b8' }} numberOfLines={1}>{s.email}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {child.relationship && (
              <View style={{
                backgroundColor: '#f1f5f9', borderRadius: 6,
                paddingHorizontal: 7, paddingVertical: 2,
              }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'capitalize' }}>
                  {child.relationship.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
            {child.gradeLevel && (
              <View style={{
                backgroundColor: '#fce7f3', borderRadius: 6,
                paddingHorizontal: 7, paddingVertical: 2,
              }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#e11d48' }}>
                  {child.gradeLevel}
                </Text>
              </View>
            )}
            {child.canPickup !== undefined && (
              <View style={{
                backgroundColor: child.canPickup ? '#dcfce7' : '#f1f5f9',
                borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
              }}>
                <Text style={{
                  fontSize: 10, fontWeight: '700',
                  color: child.canPickup ? '#16a34a' : '#94a3b8',
                }}>
                  {child.canPickup ? '✓ Can pick up' : '✗ No pickup'}
                </Text>
              </View>
            )}
          </View>
        </View>

      </View>
  );
}

export default function MyChildrenScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);

  const primary = (user?.schools ?? []).find(m => m.schoolId === selectedSchoolId)
    ?? (user?.schools ?? [])[0];
  const schoolId = primary?.schoolId ?? '';
  const userId = user?.id ?? '';

  const { data: children = [], isLoading } = useParentChildren(schoolId, userId);

  const primaryCount = children.filter(c => c.isPrimaryContact).length;
  const gradeLevels = new Set(children.map(c => c.gradeLevel).filter(Boolean)).size;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#e11d48',
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
              My Children
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
              Students linked to your account
            </Text>
          </View>
          <View style={{
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="people-outline" size={18} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      >
        {/* Stat cards */}
        {!isLoading && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard value={children.length} label="Linked Children" color="#e11d48" />
            <StatCard value={primaryCount} label="Primary Contact" color="#f59e0b" />
            <StatCard value={gradeLevels} label="Grade Levels" color="#6366f1" />
          </View>
        )}

        {isLoading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#e11d48" />
          </View>
        ) : children.length === 0 ? (
          <View style={{
            alignItems: 'center', paddingVertical: 56,
            backgroundColor: '#fff', borderRadius: 20,
            borderWidth: 2, borderColor: '#f1f5f9', borderStyle: 'dashed',
          }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: '#fff1f2', marginBottom: 16,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="people-outline" size={30} color="#fda4af" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No children linked yet</Text>
            <Text style={{
              fontSize: 12, color: '#9ca3af', marginTop: 6,
              textAlign: 'center', maxWidth: 240, lineHeight: 18,
            }}>
              Ask your school administrator to link your account to your child's student profile.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={{
              fontSize: 11, fontWeight: '700', color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2,
            }}>
              {children.length} {children.length === 1 ? 'Child' : 'Children'}
            </Text>
            {children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
