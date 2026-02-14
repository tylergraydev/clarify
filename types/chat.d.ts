/**
 * Chat Content Block Types
 *
 * Discriminated union types for structured chat message content.
 * Used to persist and render rich agent output including
 * thinking, tool use, and tool results alongside text.
 */

import type { ConversationMessage } from '../db/schema';

/**
 * Discriminated union of all chat content block types.
 */
export type ChatContentBlock = ChatTextBlock | ChatThinkingBlock | ChatToolResultBlock | ChatToolUseBlock;

/**
 * A conversation message enriched with parsed structured blocks.
 */
export interface ChatMessageWithBlocks extends ConversationMessage {
  blocks: Array<ChatContentBlock>;
}

/**
 * Search match result with snippet and position info.
 */
export interface ChatSearchMatch {
  matchIndex: number;
  messageId: number;
  snippet: string;
}

/**
 * A text content block containing markdown.
 */
export interface ChatTextBlock {
  text: string;
  type: 'text';
}

/**
 * A thinking/reasoning content block from the agent.
 */
export interface ChatThinkingBlock {
  thinking: string;
  type: 'thinking';
}

/**
 * A tool result content block representing the output of a tool call.
 */
export interface ChatToolResultBlock {
  isError?: boolean;
  output: unknown;
  toolUseId: string;
  type: 'tool_result';
}

/**
 * A tool use content block representing an agent tool call.
 */
export interface ChatToolUseBlock {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
  type: 'tool_use';
}

/**
 * Request payload for compacting a conversation.
 */
export interface CompactionRequest {
  conversationId: number;
  upToMessageId?: number;
}

/**
 * Result of a compaction operation.
 */
export interface CompactionResult {
  compactedCount: number;
  summaryMessageId: number;
  tokensSaved: number;
}

/**
 * Conversation with fork tree information.
 */
export interface ConversationWithForkInfo {
  childCount: number;
  compactedAt: null | string;
  createdAt: string;
  forkPointMessageId: null | number;
  forkSummary: null | string;
  id: number;
  isCompacted: boolean;
  parentConversationId: null | number;
  parentTitle: null | string;
  projectId: number;
  title: string;
  titleGeneratedByAi: boolean;
  updatedAt: string;
}

/**
 * Request payload for exporting messages to a new conversation.
 */
export interface ExportToChatRequest {
  messageIds: Array<number>;
  projectId: number;
  sourceConversationId: number;
}

/**
 * Request payload for forking a conversation.
 */
export interface ForkRequest {
  forkPointMessageId: number;
  generateSummary?: boolean;
  sourceConversationId: number;
}
