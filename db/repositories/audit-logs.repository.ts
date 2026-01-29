import { and, desc, eq, lt } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { AuditLog, NewAuditLog } from '../schema';

import { auditLogs } from '../schema';

export interface AuditLogsRepository {
  create(data: NewAuditLog): AuditLog;
  createMany(data: Array<NewAuditLog>): Array<AuditLog>;
  deleteOlderThan(date: string): number;
  findAll(options?: {
    eventCategory?: string;
    limit?: number;
    severity?: string;
    workflowId?: number;
  }): Array<AuditLog>;
  findByEventCategory(eventCategory: string): Array<AuditLog>;
  findById(id: number): AuditLog | undefined;
  findByWorkflowId(workflowId: number): Array<AuditLog>;
  findByWorkflowStepId(workflowStepId: number): Array<AuditLog>;
  findRecent(limit: number): Array<AuditLog>;
}

export function createAuditLogsRepository(db: DrizzleDatabase): AuditLogsRepository {
  return {
    create(data: NewAuditLog): AuditLog {
      return db.insert(auditLogs).values(data).returning().get();
    },

    createMany(data: Array<NewAuditLog>): Array<AuditLog> {
      if (data.length === 0) {
        return [];
      }
      return db.insert(auditLogs).values(data).returning().all();
    },

    deleteOlderThan(date: string): number {
      const result = db.delete(auditLogs).where(lt(auditLogs.timestamp, date)).run();
      return result.changes;
    },

    findAll(options?: {
      eventCategory?: string;
      limit?: number;
      severity?: string;
      workflowId?: number;
    }): Array<AuditLog> {
      const conditions = [];

      if (options?.workflowId !== undefined) {
        conditions.push(eq(auditLogs.workflowId, options.workflowId));
      }
      if (options?.eventCategory !== undefined) {
        conditions.push(eq(auditLogs.eventCategory, options.eventCategory));
      }
      if (options?.severity !== undefined) {
        conditions.push(eq(auditLogs.severity, options.severity));
      }

      let query = db.select().from(auditLogs);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      const orderedQuery = query.orderBy(desc(auditLogs.timestamp));

      if (options?.limit !== undefined) {
        return orderedQuery.limit(options.limit).all();
      }

      return orderedQuery.all();
    },

    findByEventCategory(eventCategory: string): Array<AuditLog> {
      return db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.eventCategory, eventCategory))
        .orderBy(desc(auditLogs.timestamp))
        .all();
    },

    findById(id: number): AuditLog | undefined {
      return db.select().from(auditLogs).where(eq(auditLogs.id, id)).get();
    },

    findByWorkflowId(workflowId: number): Array<AuditLog> {
      return db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.workflowId, workflowId))
        .orderBy(desc(auditLogs.timestamp))
        .all();
    },

    findByWorkflowStepId(workflowStepId: number): Array<AuditLog> {
      return db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.workflowStepId, workflowStepId))
        .orderBy(desc(auditLogs.timestamp))
        .all();
    },

    findRecent(limit: number): Array<AuditLog> {
      return db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .all();
    },
  };
}
