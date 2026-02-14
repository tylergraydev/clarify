/**
 * Chat IPC Handlers
 *
 * Handles all chat-related operations including:
 * - Creating, updating, and deleting conversations
 * - Creating and listing conversation messages
 * - Forking conversations, reverting, compaction
 * - Search, export, token estimates, AI title generation
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { ConversationMessagesRepository, ConversationsRepository } from '../../db/repositories';
import type { Conversation, ConversationMessage, NewConversation, NewConversationMessage } from '../../db/schema';
import type { CompactionRequest, ExportToChatRequest, ForkRequest } from '../../types/chat';

import {
  generateCompactionSummary,
  generateConversationTitle,
  generateForkSummary,
} from '../services/chat-utility-agent.service';
import { IpcChannels } from './channels';

/**
 * Register all chat-related IPC handlers.
 *
 * @param conversationsRepo - The conversations repository for database operations
 * @param messagesRepo - The conversation messages repository for database operations
 */
export function registerChatHandlers(
  conversationsRepo: ConversationsRepository,
  messagesRepo: ConversationMessagesRepository
): void {
  // Create a new conversation
  ipcMain.handle(
    IpcChannels.chat.createConversation,
    (_event: IpcMainInvokeEvent, data: NewConversation): Conversation => {
      try {
        return conversationsRepo.create(data);
      } catch (error) {
        console.error('[IPC Error] chat:createConversation:', error);
        throw error;
      }
    }
  );

  // Get a conversation by ID
  ipcMain.handle(
    IpcChannels.chat.getConversation,
    (_event: IpcMainInvokeEvent, id: number): Conversation | undefined => {
      try {
        return conversationsRepo.findById(id);
      } catch (error) {
        console.error('[IPC Error] chat:getConversation:', error);
        throw error;
      }
    }
  );

  // List conversations for a project
  ipcMain.handle(
    IpcChannels.chat.listConversations,
    (_event: IpcMainInvokeEvent, projectId: number): Array<Conversation> => {
      try {
        return conversationsRepo.findByProjectIdWithForkInfo(projectId);
      } catch (error) {
        console.error('[IPC Error] chat:listConversations:', error);
        throw error;
      }
    }
  );

  // Update a conversation
  ipcMain.handle(
    IpcChannels.chat.updateConversation,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<Omit<NewConversation, 'createdAt' | 'id'>>
    ): Conversation | undefined => {
      try {
        return conversationsRepo.update(id, data);
      } catch (error) {
        console.error('[IPC Error] chat:updateConversation:', error);
        throw error;
      }
    }
  );

  // Delete a conversation
  ipcMain.handle(IpcChannels.chat.deleteConversation, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      return conversationsRepo.delete(id);
    } catch (error) {
      console.error('[IPC Error] chat:deleteConversation:', error);
      throw error;
    }
  });

  // Create a new message in a conversation
  ipcMain.handle(
    IpcChannels.chat.createMessage,
    (_event: IpcMainInvokeEvent, data: NewConversationMessage): ConversationMessage => {
      try {
        return messagesRepo.create(data);
      } catch (error) {
        console.error('[IPC Error] chat:createMessage:', error);
        throw error;
      }
    }
  );

  // List all messages for a conversation (including soft-deleted)
  ipcMain.handle(
    IpcChannels.chat.listMessages,
    (_event: IpcMainInvokeEvent, conversationId: number): Array<ConversationMessage> => {
      try {
        return messagesRepo.findByConversationId(conversationId);
      } catch (error) {
        console.error('[IPC Error] chat:listMessages:', error);
        throw error;
      }
    }
  );

  // List only active (non-deleted) messages
  ipcMain.handle(
    IpcChannels.chat.listActiveMessages,
    (_event: IpcMainInvokeEvent, conversationId: number): Array<ConversationMessage> => {
      try {
        return messagesRepo.findActiveByConversationId(conversationId);
      } catch (error) {
        console.error('[IPC Error] chat:listActiveMessages:', error);
        throw error;
      }
    }
  );

  // Search messages within a conversation
  ipcMain.handle(
    IpcChannels.chat.searchMessages,
    (_event: IpcMainInvokeEvent, conversationId: number, query: string): Array<ConversationMessage> => {
      try {
        return messagesRepo.searchInConversation(conversationId, query);
      } catch (error) {
        console.error('[IPC Error] chat:searchMessages:', error);
        throw error;
      }
    }
  );

  // Soft-delete a single message
  ipcMain.handle(
    IpcChannels.chat.softDeleteMessage,
    (_event: IpcMainInvokeEvent, id: number): ConversationMessage | undefined => {
      try {
        return messagesRepo.softDelete(id);
      } catch (error) {
        console.error('[IPC Error] chat:softDeleteMessage:', error);
        throw error;
      }
    }
  );

  // Restore a soft-deleted message
  ipcMain.handle(
    IpcChannels.chat.restoreMessage,
    (_event: IpcMainInvokeEvent, id: number): ConversationMessage | undefined => {
      try {
        return messagesRepo.restoreMessage(id);
      } catch (error) {
        console.error('[IPC Error] chat:restoreMessage:', error);
        throw error;
      }
    }
  );

  // Revert conversation to a specific message (soft-delete everything after)
  ipcMain.handle(
    IpcChannels.chat.revertToMessage,
    (_event: IpcMainInvokeEvent, conversationId: number, messageId: number): { affectedCount: number } => {
      try {
        const count = messagesRepo.softDeleteAfter(conversationId, messageId);
        return { affectedCount: count };
      } catch (error) {
        console.error('[IPC Error] chat:revertToMessage:', error);
        throw error;
      }
    }
  );

  // Get token estimate for a conversation
  ipcMain.handle(
    IpcChannels.chat.getTokenEstimate,
    (_event: IpcMainInvokeEvent, conversationId: number): number => {
      try {
        return messagesRepo.getTokenEstimateTotal(conversationId);
      } catch (error) {
        console.error('[IPC Error] chat:getTokenEstimate:', error);
        throw error;
      }
    }
  );

  // Copy messages between conversations
  ipcMain.handle(
    IpcChannels.chat.copyMessages,
    (
      _event: IpcMainInvokeEvent,
      fromConversationId: number,
      toConversationId: number,
      upToMessageId?: number
    ): Array<ConversationMessage> => {
      try {
        return messagesRepo.copyMessages(fromConversationId, toConversationId, upToMessageId);
      } catch (error) {
        console.error('[IPC Error] chat:copyMessages:', error);
        throw error;
      }
    }
  );

  // Fork a conversation at a specific message
  ipcMain.handle(
    IpcChannels.chat.forkConversation,
    async (_event: IpcMainInvokeEvent, request: ForkRequest): Promise<Conversation> => {
      try {
        const source = conversationsRepo.findById(request.sourceConversationId);
        if (!source) throw new Error(`Conversation ${request.sourceConversationId} not found`);

        // Create the forked conversation
        const forked = conversationsRepo.create({
          forkPointMessageId: request.forkPointMessageId,
          parentConversationId: request.sourceConversationId,
          projectId: source.projectId,
          title: `Fork of ${source.title}`,
        });

        // Copy messages up to the fork point
        messagesRepo.copyMessages(request.sourceConversationId, forked.id, request.forkPointMessageId);

        // Optionally generate a fork summary
        if (request.generateSummary) {
          try {
            const sourceMessages = messagesRepo.findActiveByConversationId(request.sourceConversationId);
            const forkPointMsg = messagesRepo.findById(request.forkPointMessageId);
            if (forkPointMsg) {
              const messagesUpToFork = sourceMessages.filter((m) => m.id <= request.forkPointMessageId);
              const { summary } = await generateForkSummary(
                messagesUpToFork.map((m) => ({ content: m.content, role: m.role })),
                forkPointMsg.content
              );
              conversationsRepo.update(forked.id, { forkSummary: summary });
            }
          } catch (summaryError) {
            console.error('[IPC Warn] chat:forkConversation - summary generation failed:', summaryError);
          }
        }

        return conversationsRepo.findById(forked.id) ?? forked;
      } catch (error) {
        console.error('[IPC Error] chat:forkConversation:', error);
        throw error;
      }
    }
  );

  // Export selected messages to a new conversation
  ipcMain.handle(
    IpcChannels.chat.exportToNewChat,
    (_event: IpcMainInvokeEvent, request: ExportToChatRequest): Conversation => {
      try {
        // Create the new conversation
        const newConv = conversationsRepo.create({
          projectId: request.projectId,
          title: 'Exported Conversation',
        });

        // Copy specified messages
        for (const msgId of request.messageIds) {
          const msg = messagesRepo.findById(msgId);
          if (msg) {
            messagesRepo.create({
              content: msg.content,
              conversationId: newConv.id,
              metadata: msg.metadata,
              role: msg.role,
              tokenEstimate: msg.tokenEstimate,
            });
          }
        }

        return conversationsRepo.findById(newConv.id) ?? newConv;
      } catch (error) {
        console.error('[IPC Error] chat:exportToNewChat:', error);
        throw error;
      }
    }
  );

  // Generate an AI title for a conversation
  ipcMain.handle(
    IpcChannels.chat.generateTitle,
    async (_event: IpcMainInvokeEvent, conversationId: number): Promise<Conversation | undefined> => {
      try {
        const messages = messagesRepo.findActiveByConversationId(conversationId);
        if (messages.length === 0) return conversationsRepo.findById(conversationId);

        const { title } = await generateConversationTitle(
          messages.slice(0, 6).map((m) => ({ content: m.content, role: m.role }))
        );

        return conversationsRepo.update(conversationId, {
          title,
          titleGeneratedByAi: true,
        });
      } catch (error) {
        console.error('[IPC Error] chat:generateTitle:', error);
        throw error;
      }
    }
  );

  // Compact a conversation by summarizing old messages
  ipcMain.handle(
    IpcChannels.chat.compactConversation,
    async (
      _event: IpcMainInvokeEvent,
      request: CompactionRequest
    ): Promise<{ compactedCount: number; summaryMessageId: number }> => {
      try {
        const messages = messagesRepo.findActiveByConversationId(request.conversationId);
        if (messages.length < 2) throw new Error('Not enough messages to compact');

        // Determine which messages to compact (all up to boundary, or first N)
        const boundary = request.upToMessageId ?? messages[messages.length - 2]!.id;
        const toCompact = messages.filter((m) => m.id <= boundary);
        if (toCompact.length === 0) throw new Error('No messages within compaction boundary');

        // Generate summary
        const { summary } = await generateCompactionSummary(
          toCompact.map((m) => ({ content: m.content, role: m.role }))
        );

        // Create summary message
        const summaryMsg = messagesRepo.create({
          content: summary,
          conversationId: request.conversationId,
          isCompactionSummary: true,
          originalMessageCount: toCompact.length,
          role: 'assistant',
        });

        // Soft-delete compacted messages
        messagesRepo.bulkSoftDelete(toCompact.map((m) => m.id));

        // Mark conversation as compacted
        conversationsRepo.markCompacted(request.conversationId);

        return { compactedCount: toCompact.length, summaryMessageId: summaryMsg.id };
      } catch (error) {
        console.error('[IPC Error] chat:compactConversation:', error);
        throw error;
      }
    }
  );
}
