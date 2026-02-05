import { and, asc, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewWorkflow, Workflow } from '../schema';

import { type UpdateWorkflowInput, updateWorkflowSchema } from '../../lib/validations/workflow';
import { workflows } from '../schema';
import { createBaseRepository } from './base.repository';

/**
 * Terminal workflow statuses that indicate a workflow has finished execution
 */
export const terminalStatuses = ['completed', 'failed', 'cancelled'] as const;
export type TerminalStatus = (typeof terminalStatuses)[number];

/**
 * Valid sort fields for workflow history queries
 */
export const workflowHistorySortFields = ['createdAt', 'completedAt', 'featureName', 'status', 'durationMs'] as const;
/**
 * Filters for querying workflow history
 */
export interface WorkflowHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  projectId?: number;
  searchTerm?: string;
  sortBy?: WorkflowHistorySortField;
  sortOrder?: WorkflowHistorySortOrder;
  statuses?: Array<TerminalStatus>;
  type?: 'implementation' | 'planning';
}

/**
 * Paginated result for workflow history queries
 */
export interface WorkflowHistoryResult {
  page: number;
  pageSize: number;
  total: number;
  workflows: Array<Workflow>;
}

export type WorkflowHistorySortField = (typeof workflowHistorySortFields)[number];

/**
 * Sort order for workflow history queries
 */
export type WorkflowHistorySortOrder = 'asc' | 'desc';

export interface WorkflowsRepository {
  complete(id: number, durationMs: number): undefined | Workflow;
  create(data: NewWorkflow): Workflow;
  delete(id: number): boolean;
  fail(id: number, errorMessage: string): undefined | Workflow;
  findAll(options?: { projectId?: number; status?: string; type?: string }): Array<Workflow>;
  findById(id: number): undefined | Workflow;
  findByProjectId(projectId: number): Array<Workflow>;
  findByStatus(status: string): Array<Workflow>;
  findByType(type: string): Array<Workflow>;
  findHistory(filters?: WorkflowHistoryFilters): WorkflowHistoryResult;
  findRunning(): Array<Workflow>;
  getHistoryStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number }): WorkflowStatistics;
  start(id: number): undefined | Workflow;
  update(id: number, data: Partial<NewWorkflow>): undefined | Workflow;
  updateStatus(id: number, status: string, errorMessage?: string): undefined | Workflow;
  updateWorkflow(id: number, data: UpdateWorkflowInput): Workflow;
}

/**
 * Aggregate statistics for terminal-status workflows
 */
export interface WorkflowStatistics {
  averageDurationMs: null | number;
  cancelledCount: number;
  completedCount: number;
  failedCount: number;
  successRate: number;
}

export function createWorkflowsRepository(db: DrizzleDatabase): WorkflowsRepository {
  const base = createBaseRepository<typeof workflows, Workflow, NewWorkflow>(db, workflows);

  return {
    ...base,

    complete(id: number, durationMs: number): undefined | Workflow {
      return db
        .update(workflows)
        .set({
          completedAt: sql`(CURRENT_TIMESTAMP)`,
          durationMs,
          status: 'completed',
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflows.id, id))
        .returning()
        .get();
    },

    fail(id: number, errorMessage: string): undefined | Workflow {
      return db
        .update(workflows)
        .set({
          errorMessage,
          status: 'failed',
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflows.id, id))
        .returning()
        .get();
    },

    findAll(options?: { projectId?: number; status?: string; type?: string }): Array<Workflow> {
      const conditions = [];

      if (options?.projectId !== undefined) {
        conditions.push(eq(workflows.projectId, options.projectId));
      }
      if (options?.status !== undefined) {
        conditions.push(eq(workflows.status, options.status));
      }
      if (options?.type !== undefined) {
        conditions.push(eq(workflows.type, options.type));
      }

      if (conditions.length === 0) {
        return db.select().from(workflows).all();
      }

      return db
        .select()
        .from(workflows)
        .where(and(...conditions))
        .all();
    },

    findByProjectId(projectId: number): Array<Workflow> {
      return db.select().from(workflows).where(eq(workflows.projectId, projectId)).all();
    },

    findByStatus(status: string): Array<Workflow> {
      return db.select().from(workflows).where(eq(workflows.status, status)).all();
    },

    findByType(type: string): Array<Workflow> {
      return db.select().from(workflows).where(eq(workflows.type, type)).all();
    },

    findHistory(filters?: WorkflowHistoryFilters): WorkflowHistoryResult {
      const limit = filters?.limit ?? 20;
      const offset = filters?.offset ?? 0;
      const sortBy = filters?.sortBy ?? 'completedAt';
      const sortOrder = filters?.sortOrder ?? 'desc';
      const statuses = filters?.statuses ?? [...terminalStatuses];

      const conditions = [];

      conditions.push(inArray(workflows.status, statuses));

      if (filters?.dateFrom !== undefined) {
        conditions.push(gte(workflows.completedAt, filters.dateFrom));
      }
      if (filters?.dateTo !== undefined) {
        conditions.push(lte(workflows.completedAt, filters.dateTo));
      }

      if (filters?.projectId !== undefined) {
        conditions.push(eq(workflows.projectId, filters.projectId));
      }

      if (filters?.searchTerm !== undefined && filters.searchTerm.trim() !== '') {
        const searchPattern = `%${filters.searchTerm}%`;
        conditions.push(
          sql`(${workflows.featureName} LIKE ${searchPattern} OR ${workflows.featureRequest} LIKE ${searchPattern})`
        );
      }

      if (filters?.type !== undefined) {
        conditions.push(eq(workflows.type, filters.type));
      }

      const getSortColumn = () => {
        switch (sortBy) {
          case 'completedAt':
            return workflows.completedAt;
          case 'createdAt':
            return workflows.createdAt;
          case 'durationMs':
            return workflows.durationMs;
          case 'featureName':
            return workflows.featureName;
          case 'status':
            return workflows.status;
        }
      };
      const sortColumn = getSortColumn();
      const orderFn = sortOrder === 'asc' ? asc : desc;

      const countResult = db
        .select({ count: count() })
        .from(workflows)
        .where(and(...conditions))
        .get();
      const total = countResult?.count ?? 0;

      const results = db
        .select()
        .from(workflows)
        .where(and(...conditions))
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset)
        .all();

      return {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        total,
        workflows: results,
      };
    },

    findRunning(): Array<Workflow> {
      return db.select().from(workflows).where(eq(workflows.status, 'running')).all();
    },

    getHistoryStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number }): WorkflowStatistics {
      const conditions = [];
      conditions.push(inArray(workflows.status, [...terminalStatuses]));

      if (filters?.dateFrom !== undefined) {
        conditions.push(gte(workflows.completedAt, filters.dateFrom));
      }
      if (filters?.dateTo !== undefined) {
        conditions.push(lte(workflows.completedAt, filters.dateTo));
      }

      if (filters?.projectId !== undefined) {
        conditions.push(eq(workflows.projectId, filters.projectId));
      }

      const result = db
        .select({
          averageDurationMs: sql<null | number>`AVG(${workflows.durationMs})`,
          cancelledCount: sql<number>`SUM(CASE WHEN ${workflows.status} = 'cancelled' THEN 1 ELSE 0 END)`,
          completedCount: sql<number>`SUM(CASE WHEN ${workflows.status} = 'completed' THEN 1 ELSE 0 END)`,
          failedCount: sql<number>`SUM(CASE WHEN ${workflows.status} = 'failed' THEN 1 ELSE 0 END)`,
          totalCount: count(),
        })
        .from(workflows)
        .where(and(...conditions))
        .get();

      const completedCount = result?.completedCount ?? 0;
      const failedCount = result?.failedCount ?? 0;
      const cancelledCount = result?.cancelledCount ?? 0;
      const totalCount = result?.totalCount ?? 0;

      const successRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      return {
        averageDurationMs: result?.averageDurationMs ?? null,
        cancelledCount,
        completedCount,
        failedCount,
        successRate,
      };
    },

    start(id: number): undefined | Workflow {
      return db
        .update(workflows)
        .set({
          startedAt: sql`(CURRENT_TIMESTAMP)`,
          status: 'running',
          updatedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(eq(workflows.id, id))
        .returning()
        .get();
    },

    updateStatus(id: number, status: string, errorMessage?: string): undefined | Workflow {
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      };

      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }

      return db.update(workflows).set(updateData).where(eq(workflows.id, id)).returning().get();
    },

    updateWorkflow(id: number, data: UpdateWorkflowInput): Workflow {
      const workflow = db.select().from(workflows).where(eq(workflows.id, id)).get();

      if (!workflow) {
        throw new Error(`Workflow with id ${id} not found`);
      }

      if (workflow.status !== 'created') {
        throw new Error(`Cannot update workflow: status must be 'created' but is '${workflow.status}'`);
      }

      const validated = updateWorkflowSchema.parse(data);

      const updated = db
        .update(workflows)
        .set({ ...validated, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(workflows.id, id))
        .returning()
        .get();

      if (!updated) {
        throw new Error(`Failed to update workflow with id ${id}`);
      }

      return updated;
    },
  };
}
