import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/axios.service';
import { useAuthStore } from '@/store/authStore';
import { format, isToday, isYesterday } from 'date-fns';

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'class' | 'school' | 'team';
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

function timeLabel(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; bg: string; fg: string }> = {
  school: { icon: 'school', bg: '#ede9fe', fg: '#7c3aed' },
  team:   { icon: 'shield', bg: '#e0e7ff', fg: '#6366f1' },
  class:  { icon: 'book',   bg: '#d1fae5', fg: '#059669' },
  group:  { icon: 'people', bg: '#fef3c7', fg: '#d97706' },
  direct: { icon: 'person', bg: '#f1f5f9', fg: '#64748b' },
};

const SECTION_ORDER = ['school', 'team', 'class', 'group', 'direct'];
const SECTION_LABELS: Record<string, string> = {
  school: 'School', team: 'Admin', class: 'Classes', group: 'Groups', direct: 'Direct Messages',
};

function ConvItem({
  conv, onPress,
}: { conv: Conversation; onPress: () => void }) {
  const cfg = TYPE_CONFIG[conv.type] ?? TYPE_CONFIG.direct;
  const initials = (conv.name ?? '?').slice(0, 2).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 16,
        backgroundColor: pressed ? '#f8fafc' : '#fff',
      })}
    >
      {/* Avatar */}
      <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Text style={{ color: cfg.fg, fontWeight: '900', fontSize: 16 }}>{initials}</Text>
        {/* Type dot */}
        <View style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 16, height: 16, borderRadius: 8, backgroundColor: cfg.bg,
          borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={cfg.icon} size={9} color={cfg.fg} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 }} numberOfLines={1}>{conv.name}</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8, flexShrink: 0 }}>{timeLabel(conv.lastMessageAt)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: '#9ca3af', flex: 1 }} numberOfLines={1}>
            {conv.lastMessage ?? 'No messages yet'}
          </Text>
          {(conv.unreadCount ?? 0) > 0 && (
            <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: 8 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{conv.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function ChatTab() {
  const [search, setSearch] = useState('');
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primary = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0];
  const schoolId = primary?.schoolId ?? '';

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', user?.id],
    queryFn: () => apiClient.get('/messages/conversations').then(r => r.data?.data ?? r.data ?? []),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const filtered = conversations.filter(c =>
    !search || (c.name ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  // Group by type
  const grouped = SECTION_ORDER.reduce<Record<string, Conversation[]>>((acc, type) => {
    const items = filtered.filter(c => c.type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Dark header */}
      <View style={{ backgroundColor: '#0B0F14', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>Messages</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="create-outline" size={17} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 10,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        }}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.35)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={{ flex: 1, color: '#fff', fontSize: 14 }}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={30} color="#6366f1" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-base font-bold text-gray-700">No conversations yet</Text>
            <Text className="text-sm text-gray-400 text-center">
              {search ? `No results for "${search}"` : 'Your school chats will appear here once you join a school.'}
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {Object.entries(grouped).map(([type, convs]) => (
            <View key={type}>
              {/* Section header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  {SECTION_LABELS[type]}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#f3f4f6' }} />
                <View style={{ backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#6b7280' }}>{convs.length}</Text>
                </View>
              </View>

              {/* Conversation items */}
              <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
                {convs.map((conv, i) => (
                  <View key={conv.id}>
                    <ConvItem conv={conv} onPress={() => {}} />
                    {i < convs.length - 1 && <View style={{ height: 1, backgroundColor: '#f9fafb', marginLeft: 74 }} />}
                  </View>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
