import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Switch, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { UserRole, UserSchoolMembership } from '@/interface/user.interface';

/* ── Role config ────────────────────────────────────────────────── */
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  super_admin:  { label: 'Super Admin',  color: '#6366f1', bg: '#e0e7ff' },
  school_admin: { label: 'School Admin', color: '#7c3aed', bg: '#ede9fe' },
  staff:        { label: 'Staff',        color: '#0284c7', bg: '#e0f2fe' },
  student:      { label: 'Student',      color: '#059669', bg: '#d1fae5' },
  parent:       { label: 'Parent',       color: '#d97706', bg: '#fef3c7' },
};

const ROLE_HERO_BG: Record<string, string> = {
  super_admin:  '#1e1b4b',
  school_admin: '#1e1b4b',
  staff:        '#0c2a24',
  student:      '#0c1a40',
  parent:       '#3b0a1e',
};
const ROLE_ACCENT: Record<string, string> = {
  super_admin:  '#6366f1',
  school_admin: '#7c3aed',
  staff:        '#10b981',
  student:      '#0ea5e9',
  parent:       '#f43f5e',
};

/* ── Feature card ───────────────────────────────────────────────── */
interface FeatureCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}
function FeatureCard({ icon, iconColor, iconBg, title, subtitle, onPress }: FeatureCardProps) {
  // Outer View owns the width — Pressable is touch-only
  return (
    <View style={{ width: '48%' }}>
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View style={{
            backgroundColor: pressed ? '#f0f0f5' : '#fff',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            padding: 14,
            gap: 10,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 2,
          }}>
            {/* Icon */}
            <View style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: iconBg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            {/* Text */}
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{title}</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', lineHeight: 16 }}>{subtitle}</Text>
            </View>
            {/* Arrow pinned bottom-right */}
            <View style={{ alignSelf: 'flex-end' }}>
              <Ionicons name="chevron-forward" size={13} color="#cbd5e1" />
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

/* ── Settings row — layout on inner View, not Pressable ─────────── */
function SettingsRow({
  icon, iconBg, iconColor, label, value, onPress, showArrow = true, rightElement,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string; iconColor: string; label: string;
  value?: string; onPress?: () => void;
  showArrow?: boolean; rightElement?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 13,
          paddingHorizontal: 20,
          minHeight: 52,
          backgroundColor: pressed && !!onPress ? '#f2f2f2' : '#fff',
        }}>
          {/* Coloured icon square */}
          <View style={{
            width: 34, height: 34, borderRadius: 9,
            backgroundColor: iconBg,
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Ionicons name={icon} size={17} color={iconColor} />
          </View>

          {/* Label */}
          <Text
            style={{ flex: 1, fontSize: 15, fontWeight: '400', color: '#111827' }}
            numberOfLines={1}
          >
            {label}
          </Text>

          {/* Value */}
          {value ? (
            <Text
              style={{ fontSize: 14, color: '#8a8a8a', flexShrink: 0, maxWidth: '45%', textAlign: 'right' }}
              numberOfLines={1}
            >
              {value}
            </Text>
          ) : null}

          {/* Right element or chevron */}
          {rightElement ?? (showArrow && onPress ? (
            <Ionicons name="chevron-forward" size={15} color="#c7c7cc" />
          ) : null)}
        </View>
      )}
    </Pressable>
  );
}

function SettingsGroup({ children, label }: { children: React.ReactNode; label?: string }) {
  const count = React.Children.count(children);
  return (
    <View style={{ marginBottom: 4 }}>
      {label && (
        <Text style={{
          fontSize: 13,
          fontWeight: '400',
          color: '#8a8a8a',
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 6,
        }}>
          {label}
        </Text>
      )}
      <View style={{
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#e5e7eb',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
      }}>
        {React.Children.map(children, (child, i) => (
          <View key={i}>
            {child}
            {i < count - 1 && (
              <View style={{ height: 0.5, backgroundColor: '#e5e7eb', marginLeft: 68 }} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── School picker modal ─────────────────────────────────────────── */
function SchoolPickerModal({
  visible,
  memberships,
  selectedSchoolId,
  accent,
  onSelect,
  onClose,
}: {
  visible: boolean;
  memberships: UserSchoolMembership[];
  selectedSchoolId: string | null;
  accent: string;
  onSelect: (schoolId: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={e => e.stopPropagation?.()}>
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingTop: 12, paddingBottom: 36,
            maxHeight: '80%',
          }}>
            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16 }} />

            {/* Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 6 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#111827' }}>Switch School</Text>
              <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={16} color="#6b7280" />
                </View>
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: '#9ca3af', paddingHorizontal: 20, marginBottom: 16 }}>
              {memberships.length} school{memberships.length !== 1 ? 's' : ''} you belong to
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {memberships.map((m, i) => {
                const cfg = ROLE_CONFIG[m.role] ?? { label: m.role, color: '#6b7280', bg: '#f3f4f6' };
                const isSelected = selectedSchoolId === m.schoolId;
                return (
                  <Pressable
                    key={m.schoolId}
                    onPress={() => { onSelect(m.schoolId); onClose(); }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 14,
                      paddingHorizontal: 20, paddingVertical: 14,
                      backgroundColor: isSelected ? cfg.bg + '40' : '#fff',
                      borderTopWidth: i === 0 ? 0.5 : 0,
                      borderBottomWidth: 0.5,
                      borderColor: '#f1f5f9',
                    }}>
                      {/* School initial */}
                      <View style={{
                        width: 48, height: 48, borderRadius: 16,
                        backgroundColor: cfg.bg,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? cfg.color : cfg.bg,
                        flexShrink: 0,
                      }}>
                        <Text style={{ fontWeight: '900', fontSize: 20, color: cfg.color }}>
                          {m.school?.name?.[0]?.toUpperCase() ?? '?'}
                        </Text>
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={1}>
                          {m.school?.name ?? 'Unknown School'}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          <View style={{ backgroundColor: cfg.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text>
                          </View>
                          {m.isPrimary && (
                            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '700' }}>Primary</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Active indicator */}
                      {isSelected ? (
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Ionicons name="checkmark" size={15} color="#fff" />
                        </View>
                      ) : (
                        <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', flexShrink: 0 }} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Main screen ────────────────────────────────────────────────── */
export default function AccountTab() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const setSelectedSchool = useAuthStore(s => s.setSelectedSchool);
  const logout = useLogout();
  const [schoolPickerOpen, setSchoolPickerOpen] = useState(false);

  const memberships: UserSchoolMembership[] = user?.schools ?? [];
  const primaryMembership = memberships.find(m => m.schoolId === selectedSchoolId)
    ?? memberships.find(m => m.isPrimary) ?? memberships[0];

  const role = primaryMembership?.role ?? '';
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;
  const isStaff = role === UserRole.STAFF;
  const isStudent = role === UserRole.STUDENT;
  const isSuperAdmin = role === UserRole.SUPER_ADMIN || !!user?.isAdmin;

  const heroBg = ROLE_HERO_BG[role] ?? '#0B0F14';
  const accent = ROLE_ACCENT[role] ?? '#6366f1';

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const roleInfo = ROLE_CONFIG[role] ?? { label: 'Member', color: '#6b7280', bg: '#f3f4f6' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero header ──────────────────────────────────────── */}
        <View style={{ backgroundColor: heroBg, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>
          {/* Avatar */}
          <View style={{ alignItems: 'center', gap: 14 }}>
            <Pressable onPress={() => router.push('/account/edit-profile' as never)} style={{ position: 'relative' }}>
              {user?.profilePicture ? (
                <Image
                  key={user.profilePicture}
                  source={{ uri: user.profilePicture }}
                  style={{
                    width: 80, height: 80, borderRadius: 28,
                    borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
                  }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={{
                  width: 80, height: 80, borderRadius: 28,
                  backgroundColor: accent,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: accent, shadowOpacity: 0.5,
                  shadowOffset: { width: 0, height: 8 }, shadowRadius: 16,
                  elevation: 12,
                  borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
                }}>
                  <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900' }}>{initials}</Text>
                </View>
              )}
              <View style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 26, height: 26, borderRadius: 9,
                backgroundColor: accent,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: heroBg,
              }}>
                <Ionicons name="camera" size={13} color="#fff" />
              </View>
            </Pressable>

            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                {user?.email}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <View style={{ backgroundColor: accent + '40', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: accent + '60' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{roleInfo.label}</Text>
                </View>
                {user?.isAdmin && (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                    <Text style={{ color: '#a5b4fc', fontSize: 12, fontWeight: '700' }}>⚡ Platform Admin</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats strip */}
          <View style={{
            flexDirection: 'row', marginTop: 20,
            backgroundColor: 'rgba(255,255,255,0.07)',
            borderRadius: 18, overflow: 'hidden',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          }}>
            {[
              { label: 'Schools', value: String(memberships.length) },
              { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive' },
              { label: 'Verified', value: user?.emailVerified ? 'Yes' : 'No' },
            ].map((s, i) => (
              <View key={s.label} style={{
                flex: 1, padding: 14, alignItems: 'center',
                borderRightWidth: i < 2 ? 1 : 0,
                borderRightColor: 'rgba(255,255,255,0.08)',
              }}>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Active school card ──────────────────────────── */}
          {memberships.length > 0 && (
            <Pressable
              onPress={() => setSchoolPickerOpen(true)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginTop: 14 })}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 18, padding: 14,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
              }}>
                {/* School initial circle */}
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: accent + '30',
                  borderWidth: 1.5, borderColor: accent + '50',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>
                    {primaryMembership?.school?.name?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>

                {/* School info */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                    Active School
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
                    {primaryMembership?.school?.name ?? 'No school selected'}
                  </Text>
                  {primaryMembership && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700' }}>
                          {ROLE_CONFIG[primaryMembership.role]?.label ?? primaryMembership.role}
                        </Text>
                      </View>
                      {primaryMembership.isPrimary && (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>· Primary</Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Switch button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flexShrink: 0 }}>
                  <Ionicons name="swap-horizontal" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Switch</Text>
                </View>
              </View>
            </Pressable>
          )}
        </View>

        {/* ── Pulls up over dark header ─────────────────────────── */}
        <View style={{
          backgroundColor: '#f8fafc', borderTopLeftRadius: 28,
          borderTopRightRadius: 28, marginTop: -22, paddingTop: 10, paddingBottom: 40,
        }}>

          <SchoolPickerModal
            visible={schoolPickerOpen}
            memberships={memberships}
            selectedSchoolId={selectedSchoolId}
            accent={accent}
            onSelect={setSelectedSchool}
            onClose={() => setSchoolPickerOpen(false)}
          />

          {/* ── Feature grid — flexWrap, always correct ───────── */}
          {(() => {
            const features: FeatureCardProps[] = [
              { icon: 'wallet-outline', iconColor: '#6366f1', iconBg: '#eef2ff',
                title: 'My Finances', subtitle: isStudent ? 'Fee balance & payments' : 'Salary & advances',
                onPress: () => router.push('/account/finances') },
              { icon: 'time-outline', iconColor: '#059669', iconBg: '#f0fdf4',
                title: 'Attendance', subtitle: 'Clock records & logs',
                onPress: () => router.push('/account/attendance') },
              { icon: 'library-outline', iconColor: '#7c3aed', iconBg: '#f5f3ff',
                title: 'Library', subtitle: 'School resources',
                onPress: () => router.push('/account/library') },
              { icon: 'document-text-outline', iconColor: '#d97706', iconBg: '#fffbeb',
                title: 'My Documents', subtitle: 'Personal files',
                onPress: () => router.push('/account/documents') },
              ...(isStudent ? [
                { icon: 'trophy-outline' as const, iconColor: '#0ea5e9', iconBg: '#f0f9ff',
                  title: 'My Results', subtitle: 'Term results & grades',
                  onPress: () => router.push('/account/results') },
                { icon: 'clipboard-outline' as const, iconColor: '#6366f1', iconBg: '#eef2ff',
                  title: 'My Assessments', subtitle: 'Tests & quizzes assigned',
                  onPress: () => router.push('/account/my-assessments') },
              ] : []),
              ...((isStaff || isAdmin) ? [
                { icon: 'clipboard-outline' as const, iconColor: '#6366f1', iconBg: '#eef2ff',
                  title: 'Assessments', subtitle: 'Manage tests & quizzes',
                  onPress: () => router.push('/account/assessments') },
                { icon: 'help-circle-outline' as const, iconColor: '#e11d48', iconBg: '#fff1f2',
                  title: 'Question Bank', subtitle: 'Browse & create questions',
                  onPress: () => router.push('/account/question-bank') },
              ] : []),
              ...(isSuperAdmin ? [{ icon: 'card-outline' as const, iconColor: '#0f172a', iconBg: '#f1f5f9',
                title: 'Subscription', subtitle: 'Plan status & usage',
                onPress: () => router.push('/account/subscription') }] : []),
            ];
            return (
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
                  My Features
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 }}>
                  {features.map(f => <FeatureCard key={f.title} {...f} />)}
                  {/* Invisible spacer when odd number keeps last card half-width */}
                  {features.length % 2 !== 0 && <View style={{ width: '48%' }} />}
                </View>
              </View>
            );
          })()}

          {/* ── Applications & Enquiries ─────────────────────── */}
          <SettingsGroup label="Applications & Enquiries">
            <SettingsRow
              icon="briefcase-outline" iconBg="#e0f2fe" iconColor="#0284c7"
              label="My Job Applications"
              value="Jobs I've applied for"
              onPress={() => router.push('/my-jobs' as never)}
            />
            <SettingsRow
              icon="document-text-outline" iconBg="#d1fae5" iconColor="#059669"
              label="My Enrollments"
              value="School enrollment applications"
              onPress={() => router.push('/my-enrollments' as never)}
            />
            <SettingsRow
              icon="chatbubble-outline" iconBg="#fef3c7" iconColor="#d97706"
              label="My Enquiries"
              value="Questions sent to schools"
              onPress={() => router.push('/my-enquiries' as never)}
            />
          </SettingsGroup>

          {/* ── Profile & security ────────────────────────────── */}
          <SettingsGroup label="Profile & Security">
            <SettingsRow
              icon="person-outline" iconBg="#e0e7ff" iconColor="#6366f1"
              label="Edit Profile"
              value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Update your info'}
              onPress={() => router.push('/account/edit-profile')}
            />
            <SettingsRow
              icon="lock-closed-outline" iconBg="#fef3c7" iconColor="#d97706"
              label="Change Password"
              value="Update your password"
              onPress={() => router.push('/account/change-password')}
            />
          </SettingsGroup>

          {/* ── Account settings ──────────────────────────────── */}
          <SettingsGroup label="Account">
            <SettingsRow icon="mail-outline" iconBg="#e0e7ff" iconColor="#6366f1" label="Email" value={user?.email ?? '—'} />
            <SettingsRow icon="call-outline" iconBg="#d1fae5" iconColor="#059669" label="Phone" value={user?.phoneNumber ?? 'Not set'} />
            <SettingsRow icon="checkmark-circle-outline" iconBg={user?.emailVerified ? '#d1fae5' : '#fef3c7'} iconColor={user?.emailVerified ? '#059669' : '#d97706'} label="Email Verified" value={user?.emailVerified ? 'Verified' : 'Not verified'} showArrow={false} />
          </SettingsGroup>

          <SettingsGroup label="Preferences">
            <SettingsRow
              icon="notifications-outline" iconBg="#fef3c7" iconColor="#d97706"
              label="Push Notifications" showArrow={false}
              rightElement={<Switch value trackColor={{ true: accent }} />}
            />
          </SettingsGroup>

          <SettingsGroup label="Support">
            <SettingsRow icon="help-circle-outline" iconBg="#f1f5f9" iconColor="#64748b" label="Help & Support" onPress={() => {}} />
            <SettingsRow icon="information-circle-outline" iconBg="#f1f5f9" iconColor="#64748b" label="About EduCore" value="v1.0.0" onPress={() => {}} />
          </SettingsGroup>

          {/* Sign out */}
          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <View style={{
              backgroundColor: '#fff',
              borderTopWidth: 0.5, borderTopColor: '#e5e7eb',
              borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
            }}>
              <Pressable onPress={logout}>
                {({ pressed }) => (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    backgroundColor: pressed ? '#fef2f2' : '#fff',
                  }}>
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ionicons name="log-out-outline" size={17} color="#dc2626" />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '400', color: '#dc2626' }}>Sign Out</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
