import { and, asc, eq, gt, like, sql, sum } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { type ConversationMessage, conversationMessages, type NewConversationMessage } from '../schema';

export interface ConversationMessagesRepository {
  bulkSoftDelete(ids: Array<number>): number;
  copyMessages(fromConversationId: number, toConversationId: number, upToMessageId?: number): Array<ConversationMessage>;
  create(data: NewConversationMessage): ConversationMessage;
  delete(id: number): boolean;
  findActiveByConversationId(conversationId: number): Array<ConversationMessage>;
  findByConversationId(conversationId: number): Array<ConversationMessage>;
  findById(id: number): ConversationMessage | undefined;
  getTokenEstimateTotal(conversationId: number): number;
  restoreMessage(id: number): ConversationMessage | undefined;
  searchInConversation(conversationId: number, query: string): Array<ConversationMessage>;
  softDelete(id: number): ConversationMessage | undefined;
  softDeleteAfter(conversationId: number, afterMessageId: number): number;
}

export function createConversationMessagesRepository(db: DrizzleDatabase): ConversationMessagesRepository {
  return {
    bulkSoftDelete(ids: Array<number>): number {
      let count = 0;
      for (const id of ids) {
        const result = db
          .update(conversationMessages)
          .set({ deletedAt: sql`(CURRENT_TIMESTAMP)`, isDeleted: true })
          .where(eq(conversationMessages.id, id))
          .run();
        count += result.changes;
      }
      return count;
    },

    copyMessages(
      fromConversationId: number,
      toConversationId: number,
      upToMessageId?: number
    ): Array<ConversationMessage> {
      const query = db
        .select()
        .from(conversationMessages)
        .where(
          and(
            eq(conversationMessages.conversationId, fromConversationId),
            eq(conversationMessages.isDeleted, false)
          )
        )
        .orderBy(asc(conversationMessages.id));

      const sourceMessages = query.all();
      const copied: Array<ConversationMessage> = [];

      for (const msg of sourceMessages) {
        if (upToMessageId !== undefined && msg.id > upToMessageId) break;

        const result = db
          .insert(conversationMessages)
          .values({
            content: msg.content,
            conversationId: toConversationId,
            isCompactionSummary: msg.isCompactionSummary,
            metadata: msg.metadata,
            role: msg.role,
            tokenEstimate: msg.tokenEstimate,
          })
          .returning()
          .get();

        if (result) copied.push(result);
      }

      return copied;
    },

    create(data: NewConversationMessage): ConversationMessage {
      const result = db.insert(conversationMessages).values(data).returning().get();
      if (!result) {
        throw new Error('Failed to create conversation message');
      }
      return result;
    },

    delete(id: number): boolean {
      const result = db.delete(conversationMessages).where(eq(conversationMessages.id, id)).run();
      return result.changes > 0;
    },

    findActiveByConversationId(conversationId: number): Array<ConversationMessage> {
      return db
        .select()
        .from(conversationMessages)
        .where(
          and(
            eq(conversationMessages.conversationId, conversationId),
            eq(conversationMessages.isDeleted, false)
          )
        )
        .orderBy(asc(conversationMessages.createdAt))
        .all();
    },

    findByConversationId(conversationId: number): Array<ConversationMessage> {
      return db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, conversationId))
        .orderBy(asc(conversationMessages.createdAt))
        .all();
    },

    findById(id: number): ConversationMessage | undefined {
      return db.select().from(conversationMessages).where(eq(conversationMessages.id, id)).get();
    },

    getTokenEstimateTotal(conversationId: number): number {
      const result = db
        .select({ total: sum(conversationMessages.tokenEstimate) })
        .from(conversationMessages)
        .where(
          and(
            eq(conversationMessages.conversationId, conversationId),
            eq(conversationMessages.isDeleted, false)
          )
        )
        .get();
      return Number(result?.total ?? 0);
    },

    restoreMessage(id: number): ConversationMessage | undefined {
      return db
        .update(conversationMessages)
        .set({ deletedAt: null, isDeleted: false })
        .where(eq(conversationMessages.id, id))
        .returning()
        .get();
    },

    searchInConversation(conversationId: number, query: string): Array<ConversationMessage> {
      return db
        .select()
        .from(conversationMessages)
        .where(
          and(
            eq(conversationMessages.conversationId, conversationId),
            eq(conversationMessages.isDeleted, false),
            like(conversationMessages.content, `%${query}%`)
          )
        )
        .orderBy(asc(conversationMessages.createdAt))
        .all();
    },

    softDelete(id: number): ConversationMessage | undefined {
      return db
        .update(conversationMessages)
        .set({ deletedAt: sql`(CURRENT_TIMESTAMP)`, isDeleted: true })
        .where(eq(conversationMessages.id, id))
        .returning()
        .get();
    },

    softDeleteAfter(conversationId: number, afterMessageId: number): number {
      const result = db
        .update(conversationMessages)
        .set({ deletedAt: sql`(CURRENT_TIMESTAMP)`, isDeleted: true })
        .where(
          and(
            eq(conversationMessages.conversationId, conversationId),
            gt(conversationMessages.id, afterMessageId),
            eq(conversationMessages.isDeleted, false)
          )
        )
        .run();
      return result.changes;
    },
  };
}
