import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';
import { Conversation } from '@/interface/message.interface';
import { useConversations, useSetupSchoolGroup } from '@/hooks/useMessages';
import PeoplePickerSheet from '@/components/chat/PeoplePickerSheet';
import LoadingScreen from '@/components/ui/LoadingScreen';

function timeLabel(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function convDisplayName(conv: Conversation): string {
  if (conv.type === 'school') return 'Everyone';
  if (conv.type === 'team') return 'Admin';
  if (conv.name) return conv.name;
  if (conv.type === 'direct') return 'Direct Message';
  if (conv.type === 'group') return 'Group Chat';
  if (conv.type === 'class') return 'Class Chat';
  return 'Conversation';
}

const AVATAR_PALETTE = [
  '#4C3FC4', '#0ea5e9', '#14b8a6', '#F5486A',
  '#f59e0b', '#059669', '#10b981', '#f97316',
];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const SECTION_ORDER = ['school', 'team', 'class', 'group', 'direct'];
const SECTION_LABELS: Record<string, string> = {
  school: 'School', team: 'Admin', class: 'Classes',
  group: 'Groups', direct: 'Direct Messages',
};

/* ── Conversation row ──────────────────────────────────────────── */
function ConvItem({ conv, currentUserId, onPress }: { conv: Conversation; currentUserId?: string; onPress: () => void }) {
  const name = convDisplayName(conv);
  const initials = getInitials(name);
  const bg = avatarColor(name);
  const hasUnread = (conv.unreadCount ?? 0) > 0;
  const preview = conv.lastMessage ?? 'No messages yet';
  const time = timeLabel(conv.lastMessageAt);

  // For direct chats, show the other participant's profile picture if available
  const otherParticipant = conv.type === 'direct' && conv.participants
    ? conv.participants.find(p => p.userId !== currentUserId)
    : undefined;
  const profilePicture = otherParticipant?.profilePicture ?? null;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 12,
          backgroundColor: pressed ? '#f2f2f2' : '#fff',
        }}>
          {/* Avatar: profile picture if available, else initials */}
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={{ width: 52, height: 52, borderRadius: 26, flexShrink: 0 }}
              contentFit="cover"
            />
          ) : (
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: bg,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                {initials}
              </Text>
            </View>
          )}

          {/* Name + preview */}
          <View style={{ flex: 1, minWidth: 0 }}>
            {/* Row 1: name + time */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 3,
            }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: hasUnread ? '700' : '500',
                  color: '#111827',
                  flex: 1,
                  marginRight: 8,
                }}
                numberOfLines={1}
              >
                {name}
              </Text>
              {time ? (
                <Text style={{
                  fontSize: 12,
                  color: hasUnread ? '#25D366' : '#8a8a8a',
                  fontWeight: hasUnread ? '600' : '400',
                  flexShrink: 0,
                }}>
                  {time}
                </Text>
              ) : null}
            </View>

            {/* Row 2: preview + unread badge */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text
                style={{
                  fontSize: 13,
                  color: hasUnread ? '#374151' : '#8a8a8a',
                  flex: 1,
                  marginRight: 8,
                }}
                numberOfLines={1}
              >
                {preview}
              </Text>
              {hasUnread && (
                <View style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#25D366',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 5,
                  flexShrink: 0,
                }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                    {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/* ── Main screen ───────────────────────────────────────────────── */
export default function ChatTab() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';
  const role = primary?.role;
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;

  const { data: conversations = [], isLoading, refetch } = useConversations(!!user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const setupMutation = useSetupSchoolGroup();

  useEffect(() => {
    if (schoolId) setupMutation.mutate(schoolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const filtered = conversations.filter(c => {
    if (c.type === 'team' && !isAdmin) return false;
    if (!search) return true;
    return convDisplayName(c).toLowerCase().includes(search.toLowerCase());
  });

  const grouped = SECTION_ORDER.reduce<Record<string, Conversation[]>>((acc, type) => {
    const items = filtered.filter(c => c.type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

  const handleConvCreated = (conv: Conversation) => {
    setShowPicker(false);
    router.push(`/chat/${conv.id}`);
  };

  if (isLoading) return <LoadingScreen color="#4C3FC4" message="Loading messages" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>

      {/* Header */}
      <View style={{ backgroundColor: '#4C3FC4', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4 }}>
            Messages
          </Text>
          <Pressable onPress={() => setShowPicker(true)}>
            {({ pressed }) => (
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: pressed ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="create-outline" size={18} color="rgba(255,255,255,0.85)" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 9,
        }}>
          <Ionicons name="search" size={15} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={{ flex: 1, color: '#fff', fontSize: 14 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.3)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={34} color="#9ca3af" />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
            {search ? 'No results' : 'No conversations yet'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {search ? 'Try a different search term.' : 'Tap the compose icon to start a conversation.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
        >
          {Object.entries(grouped).map(([type, convs]) => (
            <View key={type}>
              {/* Section label */}
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#9ca3af',
                paddingHorizontal: 16,
                paddingTop: 18,
                paddingBottom: 6,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                {SECTION_LABELS[type]}
              </Text>

              {/* Rows with hairline separator */}
              {convs.map((conv, i) => (
                <View key={conv.id}>
                  <ConvItem conv={conv} currentUserId={user?.id} onPress={() => router.push(`/chat/${conv.id}`)} />
                  {i < convs.length - 1 && (
                    <View style={{ height: 0.5, backgroundColor: '#e5e7eb', marginLeft: 80 }} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <PeoplePickerSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        schoolId={schoolId}
        conversations={conversations}
        onConversationCreated={handleConvCreated}
      />
    </SafeAreaView>
  );
}
