import { apiClient } from './axios.service';
import {
  Conversation,
  ConversationParticipant,
  Message,
  MessageableUser,
  SendMessagePayload,
  CreateConversationPayload,
  ReactPayload,
} from '@/interface/message.interface';

// Raw shape returned by GET /messages/conversations
interface ConvDto {
  conversation: Omit<Conversation, 'unreadCount' | 'participants'> & {
    lastMessage?: string | null;
    lastMessageAt?: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    sender?: { firstName: string; lastName: string };
    createdAt: string;
    isDeleted: boolean;
  } | null;
  unreadCount: number;
  participantNames?: string[];
  participantProfiles?: ConversationParticipant[];
}

const extract = <T>(data: unknown): T => {
  if (data && typeof data === 'object' && 'data' in data) return (data as { data: T }).data;
  return data as T;
};

const extractList = <T>(data: unknown): T[] => {
  const inner = extract<T[] | { data: T[] }>(data);
  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === 'object' && 'data' in inner) return (inner as { data: T[] }).data;
  return [];
};

// Transform the nested DTO into a flat Conversation object the app uses
function mapConvDto(item: ConvDto): Conversation {
  const { conversation: c, lastMessage: lm, unreadCount } = item;
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    participantIds: c.participantIds ?? [],
    participants: item.participantProfiles,
    classroomId: c.classroomId,
    schoolId: c.schoolId,
    createdBy: c.createdBy,
    // Prefer the full message object's content for the preview
    lastMessage: lm
      ? lm.isDeleted
        ? 'Message deleted'
        : lm.content
      : (c.lastMessage ?? undefined),
    lastMessageAt: lm?.createdAt ?? c.lastMessageAt ?? undefined,
    unreadCount: unreadCount ?? 0,
  };
}

export const messageService = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get('/messages/conversations');
    const items = extractList<ConvDto>(res.data);
    // Handle both nested DTO format and flat format (future-proofing)
    return items.map(item =>
      item && typeof item === 'object' && 'conversation' in item
        ? mapConvDto(item as ConvDto)
        : (item as unknown as Conversation),
    );
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const res = await apiClient.get(`/messages/conversations/${id}`);
    const raw = extract<ConvDto | Conversation>(res.data);
    // Handle nested format
    if (raw && typeof raw === 'object' && 'conversation' in raw) {
      return mapConvDto(raw as ConvDto);
    }
    return raw as Conversation;
  },

  getMessages: async (
    conversationId: string,
    limit = 30,
    before?: string,
  ): Promise<Message[]> => {
    const params: Record<string, string | number> = { limit };
    if (before) params.before = before;
    const res = await apiClient.get(
      `/messages/conversations/${conversationId}/messages`,
      { params },
    );
    // Handle multiple response shapes the backend might return
    const d = res.data;
    let raw: unknown[] = [];
    if (Array.isArray(d)) {
      raw = d;
    } else if (d && typeof d === 'object') {
      const obj = d as Record<string, unknown>;
      if (Array.isArray(obj.data)) raw = obj.data as unknown[];
      else if (obj.data && typeof obj.data === 'object') {
        const inner = obj.data as Record<string, unknown>;
        if (Array.isArray(inner.messages)) raw = inner.messages as unknown[];
        else if (Array.isArray(inner.data)) raw = inner.data as unknown[];
      } else if (Array.isArray(obj.messages)) raw = obj.messages as unknown[];
    }
    // Backend returns MessageWithReactionsDto: { message: Message, reactionCounts, isRead }
    // Unwrap the nested structure and flatten into a single Message object
    return raw.map(item => {
      const wrapper = item as Record<string, unknown>;
      // If it's a wrapped DTO, extract the inner message; otherwise treat as flat
      const inner = (wrapper.message && typeof wrapper.message === 'object')
        ? wrapper.message as Record<string, unknown>
        : wrapper;
      return {
        ...inner,
        content: (inner.content ?? inner.body ?? inner.text ?? '') as string,
        reactionCounts: (wrapper.reactionCounts ?? inner.reactionCounts ?? {}) as Record<string, number>,
        isRead: (wrapper.isRead ?? inner.isRead ?? false) as boolean,
      } as unknown as Message;
    });
  },

  sendMessage: async (payload: SendMessagePayload): Promise<Message> => {
    const res = await apiClient.post('/messages/send', payload);
    const raw = extract<Record<string, unknown>>(res.data);
    // Normalise content field in case backend uses a different name
    return {
      ...raw,
      content: (raw.content ?? raw.body ?? raw.text ?? payload.content) as string,
    } as unknown as Message;
  },

  createConversation: async (payload: CreateConversationPayload): Promise<Conversation> => {
    const res = await apiClient.post('/messages/conversations', payload);
    const raw = extract<ConvDto | Conversation>(res.data);
    if (raw && typeof raw === 'object' && 'conversation' in raw) {
      return mapConvDto(raw as ConvDto);
    }
    return raw as Conversation;
  },

  getMessageableUsers: async (schoolId: string): Promise<MessageableUser[]> => {
    const res = await apiClient.get(`/messages/schools/${schoolId}/messageable-users`);
    return extractList<MessageableUser>(res.data);
  },

  markConversationRead: async (conversationId: string): Promise<void> => {
    await apiClient.post(`/messages/conversations/${conversationId}/mark-read`);
  },

  reactToMessage: async (payload: ReactPayload): Promise<void> => {
    await apiClient.post('/messages/react', payload);
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/messages/${messageId}`);
  },

  setupSchoolGroup: async (schoolId: string): Promise<Conversation> => {
    const res = await apiClient.post(`/messages/schools/${schoolId}/setup-group`);
    const raw = extract<ConvDto | Conversation>(res.data);
    if (raw && typeof raw === 'object' && 'conversation' in raw) {
      return mapConvDto(raw as ConvDto);
    }
    return raw as Conversation;
  },
};
