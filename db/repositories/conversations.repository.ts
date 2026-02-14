import { desc, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';

import { type Conversation, conversations, type NewConversation } from '../schema';

export interface ConversationsRepository {
  create(data: NewConversation): Conversation;
  delete(id: number): boolean;
  findById(id: number): Conversation | undefined;
  findByProjectId(projectId: number): Array<Conversation>;
  findByProjectIdWithForkInfo(projectId: number): Array<ConversationWithForkInfo>;
  findChildren(parentId: number): Array<Conversation>;
  markCompacted(id: number): Conversation | undefined;
  update(id: number, data: Partial<Omit<NewConversation, 'createdAt' | 'id'>>): Conversation | undefined;
}

export interface ConversationWithForkInfo extends Conversation {
  childCount: number;
  parentTitle: null | string;
}

export function createConversationsRepository(db: DrizzleDatabase): ConversationsRepository {
  return {
    create(data: NewConversation): Conversation {
      const result = db.insert(conversations).values(data).returning().get();
      if (!result) {
        throw new Error('Failed to create conversation');
      }
      return result;
    },

    delete(id: number): boolean {
      const result = db.delete(conversations).where(eq(conversations.id, id)).run();
      return result.changes > 0;
    },

    findById(id: number): Conversation | undefined {
      return db.select().from(conversations).where(eq(conversations.id, id)).get();
    },

    findByProjectId(projectId: number): Array<Conversation> {
      return db
        .select()
        .from(conversations)
        .where(eq(conversations.projectId, projectId))
        .orderBy(desc(conversations.updatedAt))
        .all();
    },

    findByProjectIdWithForkInfo(projectId: number): Array<ConversationWithForkInfo> {
      const allConversations = db
        .select()
        .from(conversations)
        .where(eq(conversations.projectId, projectId))
        .orderBy(desc(conversations.updatedAt))
        .all();

      // Build lookup maps for parent titles and child counts
      const idMap = new Map<number, Conversation>();
      const childCounts = new Map<number, number>();

      for (const conv of allConversations) {
        idMap.set(conv.id, conv);
        if (conv.parentConversationId) {
          childCounts.set(
            conv.parentConversationId,
            (childCounts.get(conv.parentConversationId) ?? 0) + 1
          );
        }
      }

      return allConversations.map((conv) => ({
        ...conv,
        childCount: childCounts.get(conv.id) ?? 0,
        parentTitle: conv.parentConversationId
          ? (idMap.get(conv.parentConversationId)?.title ?? null)
          : null,
      }));
    },

    findChildren(parentId: number): Array<Conversation> {
      return db
        .select()
        .from(conversations)
        .where(eq(conversations.parentConversationId, parentId))
        .orderBy(desc(conversations.updatedAt))
        .all();
    },

    markCompacted(id: number): Conversation | undefined {
      return db
        .update(conversations)
        .set({
          compactedAt: sql`(CURRENT_TIMESTAMP)`,
          isCompacted: true,
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(conversations.id, id))
        .returning()
        .get();
    },

    update(id: number, data: Partial<Omit<NewConversation, 'createdAt' | 'id'>>): Conversation | undefined {
      return db
        .update(conversations)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(conversations.id, id))
        .returning()
        .get();
    },
  };
}
