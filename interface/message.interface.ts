export type ConversationType = 'direct' | 'group' | 'class' | 'school' | 'team';

export interface ConversationParticipant {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
}

export interface Conversation {
  id: string;
  name: string | null;          // null for direct messages (use fallback in UI)
  type: ConversationType;
  participantIds: string[];
  participants?: ConversationParticipant[];
  classroomId?: string | null;
  schoolId?: string | null;
  createdBy?: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  content: string;
  isDeleted: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  replyToId?: string;
  reactionCounts?: Record<string, number>;
}

export interface MessageableUser {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  jobTitle: string | null;
  profilePicture: string | null;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  replyToId?: string;
}

export interface CreateConversationPayload {
  name?: string;
  type: ConversationType;
  schoolId?: string;
  classroomId?: string;
  participantIds: string[];
}

export interface ReactPayload {
  messageId: string;
  emoji: string;
}
