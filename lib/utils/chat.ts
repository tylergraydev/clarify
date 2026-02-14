import type { AgentStreamMessage, AgentStreamPortReadyMessage } from '@/types/agent-stream';
import type { ChatContentBlock, ChatMessageWithBlocks } from '@/types/chat';
import type { Conversation, ConversationMessage } from '@/types/electron';

/**
 * Date group label type for sidebar grouping.
 */
export type DateGroupLabel = 'Last 7 Days' | 'Last 30 Days' | 'Older' | 'Today' | 'Yesterday';

/**
 * Walk the useAgentStream messages array after completion
 * and build structured content blocks from the stream messages.
 */
export function extractBlocksFromStream(
  messages: Array<AgentStreamMessage | AgentStreamPortReadyMessage>
): Array<ChatContentBlock> {
  const blocks: Array<ChatContentBlock> = [];
  let currentText = '';

  // Track tool uses to pair with results
  const toolUseMap = new Map<string, { toolInput: Record<string, unknown>; toolName: string }>();

  for (const msg of messages) {
    switch (msg.type) {
      case 'text': {
        currentText += msg.text;
        break;
      }

      case 'text_delta': {
        currentText += msg.delta;
        break;
      }

      case 'thinking': {
        // Flush accumulated text before thinking block
        if (currentText) {
          blocks.push({ text: currentText, type: 'text' });
          currentText = '';
        }
        blocks.push({ thinking: msg.content, type: 'thinking' });
        break;
      }

      case 'tool_result': {
        blocks.push({
          isError: msg.isError,
          output: msg.output,
          toolUseId: msg.toolUseId,
          type: 'tool_result',
        });
        break;
      }

      case 'tool_use': {
        // Flush accumulated text before tool use
        if (currentText) {
          blocks.push({ text: currentText, type: 'text' });
          currentText = '';
        }
        toolUseMap.set(msg.toolUseId, { toolInput: msg.toolInput, toolName: msg.toolName });
        blocks.push({
          toolInput: msg.toolInput,
          toolName: msg.toolName,
          toolUseId: msg.toolUseId,
          type: 'tool_use',
        });
        break;
      }

      // Skip system, port_ready, result, and other non-content messages
      default:
        break;
    }
  }

  // Flush any remaining text
  if (currentText) {
    blocks.push({ text: currentText, type: 'text' });
  }

  return blocks;
}

/**
 * Group conversations by date for sidebar display.
 */
export function groupConversationsByDate<T extends Pick<Conversation, 'updatedAt'>>(
  conversations: Array<T>
): Array<{ conversations: Array<T>; label: DateGroupLabel }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const last7Days = new Date(today.getTime() - 7 * 86_400_000);
  const last30Days = new Date(today.getTime() - 30 * 86_400_000);

  const groups: Record<DateGroupLabel, Array<T>> = {
    'Last 7 Days': [],
    'Last 30 Days': [],
    'Older': [],
    'Today': [],
    'Yesterday': [],
  };

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);
    if (date >= today) {
      groups['Today'].push(conv);
    } else if (date >= yesterday) {
      groups['Yesterday'].push(conv);
    } else if (date >= last7Days) {
      groups['Last 7 Days'].push(conv);
    } else if (date >= last30Days) {
      groups['Last 30 Days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  }

  const order: Array<DateGroupLabel> = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Older'];
  return order
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ conversations: groups[label], label }));
}

/**
 * Parse a conversation message's metadata JSON into typed content blocks.
 * Falls back to wrapping the `content` field as a single text block
 * for legacy messages without metadata.
 */
export function parseMessageBlocks(message: ConversationMessage): ChatMessageWithBlocks {
  if (message.metadata) {
    try {
      const blocks = JSON.parse(message.metadata) as Array<ChatContentBlock>;
      if (Array.isArray(blocks) && blocks.length > 0) {
        return { ...message, blocks };
      }
    } catch {
      // Fall through to default
    }
  }

  // Legacy fallback: wrap content as a single text block
  return {
    ...message,
    blocks: message.content ? [{ text: message.content, type: 'text' }] : [],
  };
}
