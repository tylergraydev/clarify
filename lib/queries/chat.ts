import { createQueryKeys } from '@lukemorales/query-key-factory';

/**
 * Query keys for chat-related queries.
 *
 * Key structure:
 * - `chat.conversations(projectId)` - All conversations for a project
 * - `chat.messages(conversationId)` - All messages for a conversation
 * - `chat.activeMessages(conversationId)` - Non-deleted messages for a conversation
 * - `chat.tokenEstimate(conversationId)` - Token estimate for a conversation
 * - `chat.searchResults(conversationId, query)` - Search results within a conversation
 */
export const chatKeys = createQueryKeys('chat', {
  activeMessages: (conversationId: number) => [conversationId],
  conversations: (projectId: number) => [projectId],
  messages: (conversationId: number) => [conversationId],
  searchResults: (conversationId: number, query: string) => [conversationId, query],
  tokenEstimate: (conversationId: number) => [conversationId],
});
