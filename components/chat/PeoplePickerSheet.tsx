import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, Pressable, TextInput, ScrollView, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { toast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { Conversation, MessageableUser } from '@/interface/message.interface';
import { useMessageableUsers, useCreateConversation } from '@/hooks/useMessages';

interface Props {
  visible: boolean;
  onClose: () => void;
  schoolId: string;
  conversations: Conversation[];
  onConversationCreated: (conv: Conversation) => void;
}

type Mode = 'dm' | 'group';

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  super_admin:  { bg: '#ede9fe', text: '#7c3aed' },
  school_admin: { bg: '#e0e7ff', text: '#6366f1' },
  staff:        { bg: '#d1fae5', text: '#059669' },
  student:      { bg: '#dbeafe', text: '#2563eb' },
  parent:       { bg: '#fef3c7', text: '#d97706' },
};
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Admin', school_admin: 'Admin', staff: 'Staff',
  student: 'Student', parent: 'Parent',
};

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#14b8a6', '#7c3aed', '#f59e0b', '#e11d48'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

interface MemberRowProps {
  member: MessageableUser;
  mode: Mode;
  isSelected: boolean;
  isOpening: boolean;
  onDmTap: (member: MessageableUser) => void;
  onToggle: (member: MessageableUser) => void;
}

const MemberRow = React.memo(function MemberRow({ member, mode, isSelected, isOpening, onDmTap, onToggle }: MemberRowProps) {
  const color = avatarColor(member.userId);
  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase();
  const roleStyle = ROLE_COLORS[member.role] ?? { bg: '#f3f4f6', text: '#6b7280' };
  const roleLabel = ROLE_LABELS[member.role] ?? member.role;

  const handlePress = useCallback(() => {
    if (mode === 'dm') onDmTap(member);
    else onToggle(member);
  }, [mode, member, onDmTap, onToggle]);

  return (
    <Pressable onPress={handlePress} disabled={isOpening}>
      {({ pressed }) => (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingVertical: 11, paddingHorizontal: 16,
          backgroundColor: pressed ? '#f8fafc' : isSelected ? '#f5f3ff' : '#fff',
        }}>
          {mode === 'group' && (
            <View style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: isSelected ? '#6366f1' : '#fff',
              borderWidth: isSelected ? 0 : 1.5, borderColor: '#cbd5e1',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
          )}
          {member.profilePicture ? (
            <Image
              source={{ uri: member.profilePicture }}
              style={{ width: 46, height: 46, borderRadius: 23, flexShrink: 0 }}
              contentFit="cover"
            />
          ) : (
            <View style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', flexShrink: 1 }} numberOfLines={1}>
                {member.firstName} {member.lastName}
              </Text>
              <View style={{ backgroundColor: roleStyle.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexShrink: 0 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: roleStyle.text }}>{roleLabel}</Text>
              </View>
            </View>
            {member.jobTitle && (
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
                {member.jobTitle}
              </Text>
            )}
          </View>
          {mode === 'dm' && (
            isOpening
              ? <ActivityIndicator size="small" color="#6366f1" />
              : <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          )}
        </View>
      )}
    </Pressable>
  );
});

export default function PeoplePickerSheet({
  visible, onClose, schoolId, conversations, onConversationCreated,
}: Props) {
  const { height } = useWindowDimensions();
  const user = useAuthStore(s => s.user);

  const [mode, setMode] = useState<Mode>('dm');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MessageableUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const [openingDm, setOpeningDm] = useState<string | null>(null);

  const { data: members = [], isLoading } = useMessageableUsers(visible ? schoolId : undefined);
  const createMutation = useCreateConversation();

  useEffect(() => {
    if (!visible) {
      setSearch(''); setSelected([]); setGroupName('');
      setMode('dm'); setOpeningDm(null);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return members.filter(m => {
      if (m.userId === user?.id) return false;
      if (!s) return true;
      return (
        m.firstName.toLowerCase().includes(s) ||
        m.lastName.toLowerCase().includes(s) ||
        (m.jobTitle ?? '').toLowerCase().includes(s)
      );
    });
  }, [members, search, user?.id]);

  const handleDmTap = useCallback(async (member: MessageableUser) => {
    setOpeningDm(member.userId);
    try {
      const existing = conversations.find(
        c => c.type === 'direct' && c.participantIds.includes(member.userId),
      );
      if (existing) { onConversationCreated(existing); return; }
      const participants = [member.userId];
      if (user?.id && !participants.includes(user.id)) participants.push(user.id);
      const conv = await createMutation.mutateAsync({
        type: 'direct', schoolId, participantIds: participants,
      });
      onConversationCreated(conv);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open chat');
    } finally {
      setOpeningDm(null);
    }
  }, [conversations, schoolId, user?.id, createMutation, onConversationCreated]);

  const toggleGroupSelect = useCallback((member: MessageableUser) => {
    setSelected(prev => {
      const idx = prev.findIndex(s => s.userId === member.userId);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, member];
    });
  }, []);

  const canCreateGroup = selected.length >= 2 && groupName.trim().length >= 1;

  const handleCreateGroup = async () => {
    if (!canCreateGroup) return;
    try {
      // Include all selected members + current user
      const participants = selected.map(s => s.userId);
      if (user?.id && !participants.includes(user.id)) participants.push(user.id);
      const conv = await createMutation.mutateAsync({
        type: 'group', name: groupName.trim(),
        schoolId, participantIds: participants,
      });
      onConversationCreated(conv);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  // Responsive height budget
  const fixedHeight =
    20 + 60 + 56 +
    (mode === 'group' && selected.length > 0 ? 44 : 0) +
    (mode === 'group' ? 52 : 0) +
    48 +
    (mode === 'group' ? 80 : 0);
  const memberListHeight = Math.max(120, height * 0.88 - fixedHeight);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />

          {/* Sheet */}
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            maxHeight: height * 0.88,
          }}>
            {/* Handle bar */}
            <View style={{
              width: 36, height: 4, backgroundColor: '#e2e8f0',
              borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6,
            }} />

            {/* Header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 20, paddingBottom: 14, paddingTop: 4,
              borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a' }}>
                  New Message
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {mode === 'dm' ? 'Tap a person to start chatting' : 'Select people to create a group'}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                {({ pressed }) => (
                  <View style={{
                    width: 30, height: 30, borderRadius: 15,
                    backgroundColor: pressed ? '#e5e7eb' : '#f1f5f9',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="close" size={16} color="#64748b" />
                  </View>
                )}
              </Pressable>
            </View>

            {/* Mode toggle — layout on View inside each Pressable */}
            <View style={{
              flexDirection: 'row',
              paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
              gap: 8,
            }}>
              {(['dm', 'group'] as Mode[]).map(m => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => { setMode(m); setSelected([]); setSearch(''); }}
                    style={{ flex: 1 }}
                  >
                    {({ pressed }) => (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: active ? '#0f172a' : pressed ? '#f1f5f9' : '#f8fafc',
                        borderWidth: 1,
                        borderColor: active ? '#0f172a' : '#e2e8f0',
                      }}>
                        <Ionicons
                          name={m === 'dm' ? 'person-outline' : 'people-outline'}
                          size={14}
                          color={active ? '#fff' : '#64748b'}
                        />
                        <Text style={{
                          fontSize: 13, fontWeight: '700',
                          color: active ? '#fff' : '#64748b',
                        }}>
                          {m === 'dm' ? 'Direct' : 'Group'}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Group mode extras: chips + group name */}
            {mode === 'group' && (
              <>
                {selected.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ maxHeight: 44 }}
                    contentContainerStyle={{
                      paddingHorizontal: 16, gap: 6,
                      flexDirection: 'row', alignItems: 'center', paddingBottom: 8,
                    }}
                  >
                    {selected.map(m => (
                      <Pressable key={m.userId} onPress={() => toggleGroupSelect(m)}>
                        {({ pressed }) => (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: pressed ? '#e0f2fe' : '#f0f9ff',
                            borderWidth: 1, borderColor: '#bae6fd',
                            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
                          }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
                              {m.firstName}
                            </Text>
                            <Ionicons name="close" size={11} color="#0284c7" />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
                <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                  <TextInput
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Group name (required)..."
                    placeholderTextColor="#94a3b8"
                    style={{
                      backgroundColor: '#f8fafc',
                      borderWidth: 1.5,
                      borderColor: groupName.trim() ? '#6366f1' : '#e2e8f0',
                      borderRadius: 12,
                      paddingHorizontal: 14, paddingVertical: 10,
                      fontSize: 14, color: '#0f172a',
                    }}
                  />
                </View>
              </>
            )}

            {/* Search bar */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              marginHorizontal: 16, marginBottom: 6,
              backgroundColor: '#f8fafc',
              borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
              borderWidth: 1, borderColor: '#e2e8f0',
            }}>
              <Ionicons name="search-outline" size={15} color="#94a3b8" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or role..."
                placeholderTextColor="#94a3b8"
                style={{ flex: 1, fontSize: 13, color: '#0f172a', paddingVertical: 0 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={15} color="#94a3b8" />
                </Pressable>
              )}
            </View>

            {/* Member list */}
            {isLoading ? (
              <View style={{ height: memberListHeight, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <ActivityIndicator color="#6366f1" size="large" />
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>Loading members…</Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(m) => m.userId}
                renderItem={({ item }) => (
                  <MemberRow
                    member={item}
                    mode={mode}
                    isSelected={selected.some(s => s.userId === item.userId)}
                    isOpening={openingDm === item.userId}
                    onDmTap={handleDmTap}
                    onToggle={toggleGroupSelect}
                  />
                )}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 0.5, backgroundColor: '#f1f5f9', marginLeft: mode === 'group' ? 90 : 74 }} />
                )}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 36, gap: 8 }}>
                    <Ionicons name="search-outline" size={28} color="#cbd5e1" />
                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>
                      {search ? `No results for "${search}"` : 'No members found'}
                    </Text>
                  </View>
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ height: memberListHeight }}
                windowSize={10}
                maxToRenderPerBatch={15}
              />
            )}

            {/* Group create button */}
            {mode === 'group' && (
              <View style={{
                paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16,
                borderTopWidth: 0.5, borderTopColor: '#e5e7eb',
              }}>
                {!canCreateGroup && (
                  <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 10 }}>
                    {selected.length === 0
                      ? 'Select at least 2 people'
                      : selected.length === 1
                        ? 'Select 1 more person'
                        : 'Enter a group name above'}
                  </Text>
                )}
                <Pressable
                  onPress={handleCreateGroup}
                  disabled={!canCreateGroup || createMutation.isPending}
                >
                  {({ pressed }) => (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingVertical: 15,
                      borderRadius: 16,
                      backgroundColor: canCreateGroup
                        ? (pressed ? '#4f46e5' : '#6366f1')
                        : '#e2e8f0',
                      shadowColor: canCreateGroup ? '#6366f1' : 'transparent',
                      shadowOpacity: 0.3,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
                      elevation: canCreateGroup ? 4 : 0,
                    }}>
                      {createMutation.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons
                          name="people"
                          size={18}
                          color={canCreateGroup ? '#fff' : '#94a3b8'}
                        />
                      )}
                      <Text style={{
                        fontSize: 15, fontWeight: '800',
                        color: canCreateGroup ? '#fff' : '#94a3b8',
                      }}>
                        {createMutation.isPending
                          ? 'Creating…'
                          : selected.length >= 2
                            ? `Create Group · ${selected.length} people`
                            : 'Create Group'}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
