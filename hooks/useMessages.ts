import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/message.service';
import {
  SendMessagePayload,
  CreateConversationPayload,
  ReactPayload,
} from '@/interface/message.interface';

export const useConversations = (enabled = true) =>
  useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageService.getConversations(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

export const useConversation = (conversationId: string | undefined) =>
  useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messageService.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 60_000,
  });

export const useMessages = (conversationId: string | undefined, limit = 30) =>
  useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageService.getMessages(conversationId!, limit),
    enabled: !!conversationId,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

export const useMessageableUsers = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['messageable-users', schoolId],
    queryFn: () => messageService.getMessageableUsers(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });

export const useSendMessage = (conversationId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => messageService.sendMessage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useCreateConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConversationPayload) =>
      messageService.createConversation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useMarkConversationRead = (conversationId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => messageService.markConversationRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useReactToMessage = (conversationId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReactPayload) => messageService.reactToMessage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
};

export const useDeleteMessage = (conversationId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
};

export const useSetupSchoolGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (schoolId: string) => messageService.setupSchoolGroup(schoolId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
