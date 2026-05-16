import React from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { UserSchoolMembership } from '@/interface/user.interface';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: 'Super Admin', color: '#6366f1', bg: '#e0e7ff' },
  school_admin: { label: 'School Admin', color: '#7c3aed', bg: '#ede9fe' },
  staff:        { label: 'Staff',        color: '#0284c7', bg: '#e0f2fe' },
  student:      { label: 'Student',      color: '#059669', bg: '#d1fae5' },
  parent:       { label: 'Parent',       color: '#d97706', bg: '#fef3c7' },
};

function SettingsRow({
  icon, iconBg, iconColor, label, value, onPress, isLast, showArrow = true, rightElement,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string; iconColor: string; label: string;
  value?: string; onPress?: () => void; isLast?: boolean;
  showArrow?: boolean; rightElement?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 13, paddingHorizontal: 16,
        backgroundColor: pressed && onPress ? '#f8fafc' : '#fff',
      })}
    >
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{label}</Text>
        {value ? <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{value}</Text> : null}
      </View>
      {rightElement ?? (showArrow && onPress ? <Ionicons name="chevron-forward" size={16} color="#d1d5db" /> : null)}
      {!rightElement && !isLast ? null : null}
    </Pressable>
  );
}

function SettingsGroup({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <View>
      {label && (
        <Text style={{ fontSize: 10, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
          {label}
        </Text>
      )}
      <View style={{ backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
        {React.Children.map(children, (child, i) => (
          <View>
            {child}
            {i < React.Children.count(children) - 1 && (
              <View style={{ height: 1, backgroundColor: '#f9fafb', marginLeft: 64 }} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AccountTab() {
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const setSelectedSchool = useAuthStore(s => s.setSelectedSchool);
  const logout = useLogout();

  const memberships: UserSchoolMembership[] = user?.schools ?? [];
  const currentInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const primaryMembership = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Dark profile header ───────────────────────────── */}
        <View style={{ backgroundColor: '#0B0F14', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 36 }}>
          {/* Avatar + name */}
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 76, height: 76, borderRadius: 26,
              backgroundColor: '#6366f1',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#6366f1', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 10,
            }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>{currentInitials}</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{user?.email}</Text>
              {user?.isAdmin && (
                <View style={{ backgroundColor: '#312e81', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text style={{ color: '#a5b4fc', fontSize: 11, fontWeight: '700' }}>⚡ Platform Admin</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', marginTop: 24, gap: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { label: 'Schools', value: memberships.length },
              { label: 'Role', value: ROLE_CONFIG[primaryMembership?.role ?? '']?.label ?? '—' },
              { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive' },
            ].map((s, i) => (
              <View key={s.label} style={{ flex: 1, padding: 14, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Content (pulls up over dark header) ──────────── */}
        <View style={{ backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingTop: 8, paddingBottom: 32, gap: 4 }}>

          {/* Account info */}
          <SettingsGroup label="Profile">
            <SettingsRow icon="mail-outline" iconBg="#e0e7ff" iconColor="#6366f1" label="Email" value={user?.email ?? '—'} />
            <SettingsRow icon="call-outline" iconBg="#d1fae5" iconColor="#059669" label="Phone" value={user?.phoneNumber ?? 'Not set'} />
            <SettingsRow icon="checkmark-circle-outline" iconBg={user?.emailVerified ? '#d1fae5' : '#fef3c7'} iconColor={user?.emailVerified ? '#059669' : '#d97706'} label="Email Verified" value={user?.emailVerified ? 'Verified' : 'Not verified'} showArrow={false} />
          </SettingsGroup>

          {/* School switcher */}
          {memberships.length > 0 && (
            <SettingsGroup label="My Schools">
              {memberships.map(m => {
                const cfg = ROLE_CONFIG[m.role] ?? { label: m.role, color: '#6b7280', bg: '#f3f4f6' };
                const isSelected = selectedSchoolId === m.schoolId;
                return (
                  <Pressable
                    key={m.schoolId}
                    onPress={() => setSelectedSchool(m.schoolId)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingVertical: 13, paddingHorizontal: 16,
                      backgroundColor: pressed ? '#f8fafc' : isSelected ? '#fafbff' : '#fff',
                    })}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: isSelected ? '#e0e7ff' : '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontWeight: '900', fontSize: 16, color: isSelected ? '#6366f1' : '#9ca3af' }}>
                        {m.school?.name?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={1}>{m.school?.name ?? 'Unknown'}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, alignItems: 'center' }}>
                        <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                          <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '700' }}>{cfg.label}</Text>
                        </View>
                        {m.isPrimary && (
                          <View style={{ backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600' }}>Primary</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {isSelected ? (
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    ) : (
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb' }} />
                    )}
                  </Pressable>
                );
              })}
            </SettingsGroup>
          )}

          {/* Preferences */}
          <SettingsGroup label="Preferences">
            <SettingsRow icon="notifications-outline" iconBg="#fef3c7" iconColor="#d97706" label="Push Notifications" showArrow={false}
              rightElement={<Switch value={true} onValueChange={() => {}} trackColor={{ true: '#6366f1' }} />}
            />
            <SettingsRow icon="moon-outline" iconBg="#e0e7ff" iconColor="#6366f1" label="Dark Mode" showArrow={false}
              rightElement={<Switch value={false} onValueChange={() => {}} trackColor={{ true: '#6366f1' }} />}
            />
          </SettingsGroup>

          {/* Support */}
          <SettingsGroup label="Support">
            <SettingsRow icon="help-circle-outline" iconBg="#f1f5f9" iconColor="#64748b" label="Help & Support" onPress={() => {}} />
            <SettingsRow icon="information-circle-outline" iconBg="#f1f5f9" iconColor="#64748b" label="About EduCore" value="v1.0.0" onPress={() => {}} />
          </SettingsGroup>

          {/* Sign out */}
          <View style={{ marginHorizontal: 16, marginTop: 12 }}>
            <Pressable
              onPress={logout}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                backgroundColor: pressed ? '#fef2f2' : '#fff',
                borderRadius: 16, padding: 16,
                borderWidth: 1.5, borderColor: '#fca5a5',
              })}
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#dc2626' }}>Sign Out</Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
