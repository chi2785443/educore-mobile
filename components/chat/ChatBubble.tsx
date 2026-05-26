import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Message } from '@/interface/message.interface';

interface Props {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
  onLongPress?: () => void;
  onReact?: (emoji: string) => void;
}

const AVATAR_COLORS = [
  '#6366f1', '#0ea5e9', '#14b8a6', '#7c3aed',
  '#f59e0b', '#e11d48', '#10b981', '#f97316',
];

function avatarColor(id: string | undefined | null): string {
  if (!id) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return format(d, 'HH:mm');
  } catch {
    return '';
  }
}

export default function ChatBubble({ message, isOwn, showSender, onLongPress, onReact }: Props) {
  const hasSender = !!message.sender?.firstName;
  const senderName = hasSender
    ? `${message.sender!.firstName} ${message.sender!.lastName}`
    : null; // no name → don't show "Unknown"

  const initials = hasSender
    ? `${message.sender!.firstName?.[0] ?? ''}${message.sender!.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : null; // no initials when sender info missing

  const color = avatarColor(message.senderId);

  const reactions = message.reactionCounts
    ? Object.entries(message.reactionCounts).filter(([, count]) => count > 0)
    : [];

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 2,
      marginBottom: showSender && !isOwn ? 4 : 1,
    }}>
      {/* Other sender avatar */}
      {!isOwn && (
        <View style={{ width: 32, marginRight: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          {showSender ? (
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: color,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {initials ? (
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{initials}</Text>
              ) : (
                /* No sender info — show generic person icon */
                <Ionicons name="person" size={16} color="#fff" />
              )}
            </View>
          ) : null}
        </View>
      )}

      {/* Bubble column */}
      <View style={{ maxWidth: '75%', gap: 3 }}>
        {/* Sender name — only show when we have an actual name */}
        {!isOwn && showSender && senderName && (
          <Text style={{ fontSize: 11, fontWeight: '700', color, marginLeft: 2, marginBottom: 2 }}>
            {senderName}
          </Text>
        )}

        {/* Bubble */}
        <Pressable
          onLongPress={isOwn && !message.isDeleted ? onLongPress : undefined}
          delayLongPress={350}
          style={{
            paddingHorizontal: 13,
            paddingVertical: 9,
            ...(isOwn
              ? {
                  backgroundColor: '#6366f1',
                  borderRadius: 18,
                  borderTopRightRadius: 4,
                }
              : {
                  backgroundColor: '#eef2f8',
                  borderWidth: 1,
                  borderColor: '#dde3ee',
                  borderRadius: 18,
                  borderTopLeftRadius: 4,
                }),
          }}
        >
          {message.isDeleted ? (
            <Text style={{ fontSize: 13, color: isOwn ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontStyle: 'italic' }}>
              This message was deleted
            </Text>
          ) : (
            <Text style={{ fontSize: 14, color: isOwn ? '#fff' : '#1e293b', lineHeight: 20 }}>
              {message.content}
            </Text>
          )}
        </Pressable>

        {/* Reactions */}
        {!message.isDeleted && reactions.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {reactions.map(([emoji, count]) => (
              <Pressable
                key={emoji}
                onPress={() => onReact?.(emoji)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 3,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
                  borderWidth: 1, borderColor: '#e5e7eb',
                }}
              >
                <Text style={{ fontSize: 13 }}>{emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#6b7280' }}>{count}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Time + read status */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
        }}>
          <Text style={{ fontSize: 10, color: '#9ca3af' }}>{formatTime(message.createdAt)}</Text>
          {isOwn && !message.isDeleted && (
            <Ionicons
              name={message.isRead ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={message.isRead ? '#6366f1' : '#9ca3af'}
            />
          )}
        </View>
      </View>

      {/* Own avatar spacer — keeps bubble from touching right edge */}
      {isOwn && <View style={{ width: 8, marginLeft: 4 }} />}
    </View>
  );
}
