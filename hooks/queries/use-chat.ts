'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { chatKeys } from '@/lib/queries/chat';

import { useElectronDb } from '../use-electron';

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch only active (non-deleted) messages for a conversation.
 */
export function useActiveMessages(conversationId: null | number) {
  const { chat, isElectron } = useElectronDb();

  return useQuery({
    ...chatKeys.activeMessages(conversationId ?? 0),
    enabled: isElectron && conversationId !== null && conversationId > 0,
    queryFn: () => chat.listActiveMessages(conversationId!),
  });
}

/**
 * Search messages within a conversation. Debounce should be handled at the call site.
 */
export function useChatSearch(conversationId: null | number, query: string) {
  const { chat, isElectron } = useElectronDb();

  return useQuery({
    ...chatKeys.searchResults(conversationId ?? 0, query),
    enabled: isElectron && conversationId !== null && conversationId > 0 && query.length >= 2,
    queryFn: () => chat.searchMessages(conversationId!, query),
  });
}

/**
 * Compact a conversation by summarizing old messages.
 */
export function useCompactConversation(conversationId: number, projectId: number) {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (request: Parameters<typeof chat.compactConversation>[0]) => chat.compactConversation(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.activeMessages(conversationId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.tokenEstimate(conversationId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(projectId).queryKey,
      });
    },
  });
}

/**
 * Fetch all messages for a conversation (including soft-deleted).
 */
export function useConversationMessages(conversationId: null | number) {
  const { chat, isElectron } = useElectronDb();

  return useQuery({
    ...chatKeys.messages(conversationId ?? 0),
    enabled: isElectron && conversationId !== null && conversationId > 0,
    queryFn: () => chat.listMessages(conversationId!),
  });
}

/**
 * Fetch all conversations for a project.
 */
export function useConversations(projectId: number) {
  const { chat, isElectron } = useElectronDb();

  return useQuery({
    ...chatKeys.conversations(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => chat.listConversations(projectId),
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new conversation.
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof chat.createConversation>[0]) => chat.createConversation(data),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(conversation.projectId).queryKey,
      });
    },
  });
}

/**
 * Create a new message in a conversation.
 */
export function useCreateMessage() {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof chat.createMessage>[0]) => chat.createMessage(data),
    onSuccess: (message) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(message.conversationId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.activeMessages(message.conversationId).queryKey,
      });
    },
  });
}

/**
 * Delete a conversation.
 */
export function useDeleteConversation(projectId: number) {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => chat.deleteConversation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(projectId).queryKey,
      });
    },
  });
}

/**
 * Export selected messages to a new conversation.
 */
export function useExportToNewChat() {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (request: Parameters<typeof chat.exportToNewChat>[0]) => chat.exportToNewChat(request),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(conversation.projectId).queryKey,
      });
    },
  });
}

/**
 * Fork a conversation at a specific message.
 */
export function useForkConversation() {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (request: Parameters<typeof chat.forkConversation>[0]) => chat.forkConversation(request),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(conversation.projectId).queryKey,
      });
    },
  });
}

/**
 * Generate an AI title for a conversation.
 */
export function useGenerateTitle() {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (conversationId: number) => chat.generateTitle(conversationId),
    onSuccess: (conversation) => {
      if (conversation) {
        void queryClient.invalidateQueries({
          queryKey: chatKeys.conversations(conversation.projectId).queryKey,
        });
      }
    },
  });
}

/**
 * Restore a soft-deleted message.
 */
export function useRestoreMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => chat.restoreMessage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.activeMessages(conversationId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId).queryKey,
      });
    },
  });
}

/**
 * Revert a conversation to a specific message.
 */
export function useRevertToMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (messageId: number) => chat.revertToMessage(conversationId, messageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.activeMessages(conversationId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId).queryKey,
      });
    },
  });
}

/**
 * Soft-delete a single message.
 */
export function useSoftDeleteMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => chat.softDeleteMessage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.activeMessages(conversationId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId).queryKey,
      });
    },
  });
}

/**
 * Get token estimate for a conversation.
 * Polls every 30 seconds for compaction notifications.
 */
export function useTokenEstimate(conversationId: null | number) {
  const { chat, isElectron } = useElectronDb();

  return useQuery({
    ...chatKeys.tokenEstimate(conversationId ?? 0),
    enabled: isElectron && conversationId !== null && conversationId > 0,
    queryFn: () => chat.getTokenEstimate(conversationId!),
    refetchInterval: 30_000,
  });
}

/**
 * Update a conversation (e.g. title).
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient();
  const { chat } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof chat.updateConversation>[1]; id: number }) =>
      chat.updateConversation(id, data),
    onSuccess: (conversation) => {
      if (conversation) {
        void queryClient.invalidateQueries({
          queryKey: chatKeys.conversations(conversation.projectId).queryKey,
        });
      }
    },
  });
}
