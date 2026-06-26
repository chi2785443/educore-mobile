import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { differenceInMinutes } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { Message } from '@/interface/message.interface';
import { useQueryClient } from '@tanstack/react-query';
import {
  useConversation,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
  useReactToMessage,
  useDeleteMessage,
} from '@/hooks/useMessages';
import { messageService } from '@/services/message.service';
import ChatBubble from '@/components/chat/ChatBubble';
import MessageInput from '@/components/chat/MessageInput';
import LoadingScreen from '@/components/ui/LoadingScreen';

const TYPE_CONFIG: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; bg: string; fg: string }> = {
  school: { icon: 'school',  bg: '#F0EEFF', fg: '#4C3FC4' },
  team:   { icon: 'shield',  bg: '#F0EEFF', fg: '#4C3FC4' },
  class:  { icon: 'book',    bg: '#d1fae5', fg: '#059669' },
  group:  { icon: 'people',  bg: '#fef3c7', fg: '#d97706' },
  direct: { icon: 'person',  bg: '#f1f5f9', fg: '#64748b' },
};

/* ── Load Older button ─────────────────────────────────────────── */
function LoadOlderButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={{ alignSelf: 'center', marginVertical: 12 }}>
      {({ pressed }) => (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 7,
          borderRadius: 20,
          backgroundColor: pressed ? '#F0EEFF' : '#f8f7ff',
          borderWidth: 1,
          borderColor: '#d4d0f5',
        }}>
          {loading
            ? <ActivityIndicator size="small" color="#2563eb" />
            : <Ionicons name="arrow-up-circle-outline" size={14} color="#2563eb" />}
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563eb' }}>
            {loading ? 'Loading…' : 'Load older messages'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* ── Main screen ───────────────────────────────────────────────── */
export default function ChatRoomScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();

  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  /* Data */
  const { data: conversation, isLoading: loadingConv } = useConversation(conversationId);
  const { data: latestMessages = [], isLoading: loadingMsgs, refetch: refetchMessages } = useMessages(conversationId);

  /* Mutations */
  const sendMutation      = useSendMessage(conversationId ?? '');
  const markReadMutation  = useMarkConversationRead(conversationId ?? '');
  const reactMutation     = useReactToMessage(conversationId ?? '');
  const deleteMutation    = useDeleteMessage(conversationId ?? '');

  /* Mark as read on mount */
  useEffect(() => {
    if (conversationId) markReadMutation.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  /* Merge latest with older (latest takes precedence by id) */
  const allMessages = React.useMemo(() => {
    const latestIds = new Set(latestMessages.map(m => m.id));
    const unique = olderMessages.filter(m => !latestIds.has(m.id));
    const merged = [...latestMessages, ...unique];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  }, [latestMessages, olderMessages]);

  /* Load older messages */
  const handleLoadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore || allMessages.length === 0) return;
    const oldest = allMessages[allMessages.length - 1];
    setLoadingOlder(true);
    try {
      const older = await messageService.getMessages(conversationId ?? '', 30, oldest.createdAt);
      if (older.length === 0) {
        setHasMore(false);
      } else {
        setOlderMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newOnes = older.filter(m => m.id !== oldest.id && !existingIds.has(m.id));
          return [...prev, ...newOnes];
        });
        if (older.length < 30) setHasMore(false);
      }
    } catch {
      // silent
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, hasMore, allMessages]);

  /* Send — optimistic update so message text always shows immediately */
  const handleSend = useCallback(async (text: string) => {
    if (!conversationId || !user?.id) return;

    // 1. Show the message RIGHT NOW using the text we know is correct
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId,
      senderId: user.id,
      content: text,          // ← guaranteed to be the typed text
      isDeleted: false,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    qc.setQueryData<Message[]>(['messages', conversationId], (old = []) => [optimistic, ...old]);

    try {
      // 2. Actually send to server
      await sendMutation.mutateAsync({ conversationId, content: text });
      // 3. Refetch to replace temp message with real server message
      refetchMessages();
    } catch (err) {
      // 4. On failure, remove the optimistic message
      qc.setQueryData<Message[]>(['messages', conversationId], (old = []) =>
        old.filter(m => m.id !== tempId),
      );
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [conversationId, user?.id, sendMutation, refetchMessages, qc]);

  /* Delete */
  const handleDelete = (messageId: string) => {
    Alert.alert('Delete message', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(messageId);
            toast.success('Message deleted');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  /* React */
  const handleReact = useCallback((messageId: string, emoji: string) => {
    reactMutation.mutate({ messageId, emoji });
  }, [reactMutation]);

  /* Render message */
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    // Primary check: senderId matches logged-in user's id
    // Fallback: check sender name matches (handles edge cases where IDs might differ)
    const userId = user?.id;
    const isOwn = !!userId && (
      item.senderId === userId ||
      (!!item.sender &&
        item.sender.firstName === user?.firstName &&
        item.sender.lastName === user?.lastName)
    );

    const next = allMessages[index + 1]; // older (higher index in reversed list)
    const showSender = !isOwn && (
      !next ||
      next.senderId !== item.senderId ||
      differenceInMinutes(
        new Date(item.createdAt || Date.now()),
        new Date(next.createdAt || Date.now()),
      ) > 5
    );

    return (
      <ChatBubble
        message={item}
        isOwn={isOwn}
        showSender={showSender}
        onLongPress={isOwn ? () => handleDelete(item.id) : undefined}
        onReact={(emoji) => handleReact(item.id, emoji)}
      />
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages, user?.id, handleDelete, handleReact]);

  /* Header data */
  const convType = conversation?.type ?? 'direct';
  const cfg = TYPE_CONFIG[convType] ?? TYPE_CONFIG.direct;
  const convName = convType === 'school' ? 'Everyone'
    : convType === 'team' ? 'Admin'
    : conversation?.name
    ?? (convType === 'direct' ? 'Direct Message'
      : convType === 'class' ? 'Class Chat'
      : convType === 'group' ? 'Group Chat'
      : '…');
  const participantCount = conversation?.participantIds?.length;

  if (loadingConv || loadingMsgs) {
    return <LoadingScreen color="#4C3FC4" message="Opening chat" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4fb' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >

        {/* ── Header ───────────────────────────────────────────── */}
        <View style={{
          backgroundColor: '#4C3FC4',
          paddingHorizontal: 16, paddingVertical: 12,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>

          {/* Avatar */}
          <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={cfg.icon} size={18} color={cfg.fg} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
              {convName}
            </Text>
            {participantCount !== undefined && participantCount > 0 && (
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>
                {participantCount} member{participantCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        {/* ── Messages ─────────────────────────────────────────── */}
        <FlatList
          data={allMessages}
          keyExtractor={(m, index) => m.id ?? `msg-${index}`}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            allMessages.length > 0 ? (
              <LoadOlderButton onPress={handleLoadOlder} loading={loadingOlder} />
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chatbubbles-outline" size={26} color="#4C3FC4" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>No messages yet</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 24 }}>
                Send the first message to start the conversation.
              </Text>
            </View>
          }
        />

        {/* ── Input ───────────────────────────────────────────── */}
        <MessageInput
          onSend={handleSend}
          sending={sendMutation.isPending}
          disabled={sendMutation.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
