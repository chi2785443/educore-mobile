import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionSummary } from '@/hooks/useSubscription';
import { SubscriptionPlan, SubscriptionStatus } from '@/interface/subscription.interface';

/* ── Plan config ────────────────────────────────────────────────── */
const PLAN_CONFIG: Record<SubscriptionPlan, { label: string; color: string; bg: string }> = {
  free:         { label: 'Free',         color: '#64748b', bg: '#f8fafc' },
  starter:      { label: 'Starter',      color: '#0284c7', bg: '#eff6ff' },
  professional: { label: 'Professional', color: '#7c3aed', bg: '#f5f3ff' },
  enterprise:   { label: 'Enterprise',   color: '#d97706', bg: '#fffbeb' },
};

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#16a34a', bg: '#dcfce7' },
  trial:     { label: 'Trial',     color: '#0284c7', bg: '#dbeafe' },
  expired:   { label: 'Expired',   color: '#dc2626', bg: '#fee2e2' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
  suspended: { label: 'Suspended', color: '#d97706', bg: '#fef3c7' },
};

/* ── Usage bar ─────────────────────────────────────────────────── */
function UsageBar({ label, current, max, icon, color }: {
  label: string; current: number; max: number | null; icon: React.ComponentProps<typeof Ionicons>['name']; color: string;
}) {
  const pct = max ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = max ? pct >= 80 : false;
  const barColor = isNearLimit ? '#dc2626' : color;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={14} color={color} />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{label}</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '800', color: isNearLimit ? '#dc2626' : '#0f172a' }}>
          {current}{max ? `/${max}` : ' used'}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: barColor, width: max ? `${pct}%` as `${number}%` : '0%' }} />
      </View>
      {max && (
        <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>
          {max - current} slot{max - current !== 1 ? 's' : ''} remaining
        </Text>
      )}
    </View>
  );
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';

  const { data: summary, isLoading, refetch } = useSubscriptionSummary(schoolId);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sub = summary?.subscription;
  const usage = summary?.usage;
  const planCfg = PLAN_CONFIG[sub?.planType ?? 'free'];
  const statusCfg = STATUS_CONFIG[sub?.status ?? 'expired'];

  const endDate = sub?.endDate ? new Date(sub.endDate) : null;
  const isExpiringSoon = summary?.daysUntilExpiry !== null && (summary?.daysUntilExpiry ?? 99) <= 14;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Subscription</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>Plan status & usage</Text>
          </View>
          <Ionicons name="card-outline" size={22} color="#a5b4fc" />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : !summary ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="card-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center' }}>No subscription found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}>

          {/* Plan hero card */}
          <View style={{ backgroundColor: '#0f172a', borderRadius: 22, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ gap: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Current Plan
                </Text>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>
                  {planCfg.label.toUpperCase()}
                </Text>
              </View>
              <View style={{ backgroundColor: statusCfg.bg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: statusCfg.color }}>{statusCfg.label}</Text>
              </View>
            </View>

            {/* Billing info */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>Billing</Text>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'capitalize' }}>
                  {sub?.billingCycle ?? '—'}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                  {sub?.status === 'expired' ? 'Expired' : 'Renews'}
                </Text>
                <Text style={{ color: endDate ? (isExpiringSoon ? '#fca5a5' : '#fff') : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '800' }}>
                  {endDate ? format(endDate, 'd MMM yyyy') : 'No expiry'}
                </Text>
              </View>
            </View>

            {/* Expiry warning */}
            {isExpiringSoon && sub?.status !== 'expired' && (
              <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}>
                <Ionicons name="warning-outline" size={16} color="#fca5a5" />
                <Text style={{ color: '#fca5a5', fontSize: 12, fontWeight: '700', flex: 1 }}>
                  Expires in {summary.daysUntilExpiry} day{summary.daysUntilExpiry !== 1 ? 's' : ''} — renew soon
                </Text>
              </View>
            )}
          </View>

          {/* Usage meters */}
          {usage && (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 18, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>Resource Usage</Text>
              <UsageBar
                label="Students" icon="people-outline" color="#6366f1"
                current={usage.students} max={sub?.maxStudents ?? null}
              />
              <UsageBar
                label="Teachers / Staff" icon="person-outline" color="#059669"
                current={usage.teachers} max={sub?.maxTeachers ?? null}
              />
              <UsageBar
                label="Classrooms" icon="book-outline" color="#0ea5e9"
                current={usage.classrooms} max={sub?.maxClassrooms ?? null}
              />
            </View>
          )}

          {/* Active tools */}
          {summary.tools.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>Add-on Tools</Text>
              </View>
              {summary.tools.map((t, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: i < summary.tools.length - 1 ? 1 : 0, borderBottomColor: '#f9fafb' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="cube-outline" size={18} color="#7c3aed" />
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' }}>{t.tool.name}</Text>
                  <View style={{ backgroundColor: t.status === 'active' ? '#dcfce7' : '#fee2e2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: t.status === 'active' ? '#16a34a' : '#dc2626', textTransform: 'capitalize' }}>
                      {t.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Upgrade CTA for free plan */}
          {sub?.planType === 'free' && (
            <View style={{ backgroundColor: '#6366f1', borderRadius: 18, padding: 20, gap: 12, alignItems: 'center' }}>
              <Ionicons name="rocket-outline" size={32} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'center' }}>
                Upgrade for more features
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                Get more students, classrooms, and premium tools on a paid plan.
              </Text>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ color: '#6366f1', fontSize: 14, fontWeight: '800' }}>View Plans on Web →</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
