import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import { useSalaryStructure, useMyStudentFees } from '@/hooks/useFinance';
import { useCurrency } from '@/hooks/useCurrency';
import { SalaryComponent } from '@/interface/finance.interface';

const COMPONENT_COLORS: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; sign: '+' | '-' }> = {
  basic_salary: { icon: 'cash-outline', color: '#6366f1', sign: '+' },
  allowance:    { icon: 'add-circle-outline', color: '#059669', sign: '+' },
  bonus:        { icon: 'star-outline', color: '#d97706', sign: '+' },
  overtime:     { icon: 'time-outline', color: '#0ea5e9', sign: '+' },
  commission:   { icon: 'trending-up-outline', color: '#7c3aed', sign: '+' },
  deduction:    { icon: 'remove-circle-outline', color: '#dc2626', sign: '-' },
};

function ComponentRow({ comp, fmt }: { comp: SalaryComponent; fmt: (n: number | undefined | null) => string }) {
  const cfg = COMPONENT_COLORS[comp.type] ?? { icon: 'ellipse-outline' as const, color: '#6b7280', sign: '+' as const };
  const isDeduction = comp.type === 'deduction';
  const amount = comp.isPercentage
    ? `${comp.percentage}%`
    : (isDeduction ? `-${fmt(comp.amount)}` : `+${fmt(comp.amount)}`);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: cfg.color + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={cfg.icon} size={17} color={cfg.color} />
      </View>
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' }}>{comp.name}</Text>
      <Text style={{ fontSize: 14, fontWeight: '800', color: isDeduction ? '#dc2626' : '#059669' }}>
        {amount}
      </Text>
    </View>
  );
}

export default function FinancesScreen() {
  const router = useRouter();
  const { formatCompact: currency } = useCurrency();
  const fmt = (n: number | undefined | null) => currency(n ?? 0);
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const role = primary?.role;
  const isStudent = role === UserRole.STUDENT;
  const schoolId = primary?.schoolId ?? '';

  const { data: salary, isLoading: loadingSalary, refetch: refetchSalary } = useSalaryStructure(!isStudent ? user?.id : undefined);
  const { data: fees = [], isLoading: loadingFees, refetch: refetchFees } = useMyStudentFees(isStudent ? schoolId : undefined);

  const isLoading = isStudent ? loadingFees : loadingSalary;
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSalary(), refetchFees()]);
    setRefreshing(false);
  }, [refetchSalary, refetchFees]);

  // Compute net for salary
  const netSalary = salary
    ? salary.components.reduce((acc, c) => {
        const amt = c.isPercentage ? (salary.baseSalary * (c.percentage ?? 0)) / 100 : c.amount;
        return c.type === 'deduction' ? acc - amt : acc + amt;
      }, salary.baseSalary)
    : 0;

  // Student fee totals
  const feeTotal = fees.reduce((a, f) => a + f.totalAmount, 0);
  const feePaid = fees.reduce((a, f) => a + f.amountPaid, 0);
  const feeBalance = fees.reduce((a, f) => a + f.balance, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#0B0F14', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Finances</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {isStudent ? 'Fee records' : 'Salary structure'}
            </Text>
          </View>
          <Ionicons name="wallet-outline" size={22} color="#6366f1" />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : isStudent ? (
        /* ── Student: fee records ──────────────────────────────── */
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}>
          {/* Summary cards */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { label: 'Total', value: fmt(feeTotal), color: '#6366f1', bg: '#eef2ff' },
              { label: 'Paid', value: fmt(feePaid), color: '#059669', bg: '#f0fdf4' },
              { label: 'Balance', value: fmt(feeBalance), color: feeBalance > 0 ? '#dc2626' : '#059669', bg: feeBalance > 0 ? '#fef2f2' : '#f0fdf4' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: s.color + 'b0', fontWeight: '600' }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {fees.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
              <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No fee records</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Your fee records will appear here once assigned.</Text>
            </View>
          ) : (
            fees.map(fee => {
              const paidPct = fee.totalAmount > 0 ? Math.min((fee.amountPaid / fee.totalAmount) * 100, 100) : 0;
              return (
                <View key={fee.id} style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 }}>
                  {/* Header */}
                  <View style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{fee.term} · {fee.academicYear}</Text>
                      {fee.classroom && (
                        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{fee.classroom.name}</Text>
                      )}
                    </View>
                    <View style={{ backgroundColor: fee.isPaid ? '#dcfce7' : fee.balance > 0 ? '#fee2e2' : '#fef3c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: fee.isPaid ? '#16a34a' : fee.balance > 0 ? '#dc2626' : '#b45309' }}>
                        {fee.isPaid ? 'Paid' : fee.balance > 0 ? 'Outstanding' : 'Partial'}
                      </Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View style={{ marginHorizontal: 14, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginBottom: 10 }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: fee.isPaid ? '#22c55e' : '#6366f1', width: `${paidPct}%` as `${number}%` }} />
                  </View>
                  {/* Amounts */}
                  <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 14, gap: 16 }}>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>Total: <Text style={{ fontWeight: '700', color: '#374151' }}>{fmt(fee.totalAmount)}</Text></Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>Paid: <Text style={{ fontWeight: '700', color: '#059669' }}>{fmt(fee.amountPaid)}</Text></Text>
                    {fee.balance > 0 && <Text style={{ fontSize: 12, color: '#9ca3af' }}>Due: <Text style={{ fontWeight: '700', color: '#dc2626' }}>{fmt(fee.balance)}</Text></Text>}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* ── Staff/Admin: salary structure ──────────────────────── */
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}>
          {!salary ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
              <Ionicons name="cash-outline" size={40} color="#d1d5db" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No salary structure</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Your salary structure hasn't been configured yet. Contact your admin.</Text>
            </View>
          ) : (
            <>
              {/* Hero net salary */}
              <View style={{ backgroundColor: '#0f172a', borderRadius: 20, padding: 20, gap: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>Estimated Net Salary</Text>
                <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -0.5 }}>{fmt(netSalary)}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{salary.jobTitle}{salary.department ? ` · ${salary.department}` : ''}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ color: '#a5b4fc', fontSize: 12, fontWeight: '700' }}>Base: {fmt(salary.baseSalary)}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ color: '#6ee7b7', fontSize: 12, fontWeight: '700' }}>{salary.currency}</Text>
                  </View>
                </View>
              </View>

              {/* Components */}
              {salary.components.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
                  <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>Pay Components</Text>
                  </View>
                  {salary.components.filter(c => c.isActive !== false).map((c, i) => (
                    <ComponentRow key={c.id ?? i} comp={c} fmt={fmt} />
                  ))}
                </View>
              )}

              {/* Bank info */}
              {salary.bankName && (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9', padding: 16, gap: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>Bank Details</Text>
                  {[
                    { label: 'Bank', value: salary.bankName },
                    { label: 'Account', value: salary.accountNumber ?? '—' },
                    { label: 'Name', value: salary.accountName ?? '—' },
                  ].map(r => (
                    <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: '#6b7280' }}>{r.label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>{r.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
