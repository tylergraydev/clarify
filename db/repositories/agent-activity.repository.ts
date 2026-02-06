import { asc, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { AgentActivity, NewAgentActivity } from '../schema';

import { agentActivity, workflowSteps } from '../schema';
import { createBaseRepository } from './base.repository';

export interface AgentActivityRepository {
  create(data: NewAgentActivity): AgentActivity;
  createMany(data: Array<NewAgentActivity>): Array<AgentActivity>;
  delete(id: number): boolean;
  deleteByStepId(stepId: number): number;
  findById(id: number): AgentActivity | undefined;
  findByStepId(stepId: number): Array<AgentActivity>;
  findByWorkflowId(workflowId: number): Array<AgentActivity>;
  update(id: number, data: Partial<NewAgentActivity>): AgentActivity | undefined;
}

export function createAgentActivityRepository(db: DrizzleDatabase): AgentActivityRepository {
  const base = createBaseRepository<typeof agentActivity, AgentActivity, NewAgentActivity>(db, agentActivity);

  return {
    ...base,

    createMany(data: Array<NewAgentActivity>): Array<AgentActivity> {
      if (data.length === 0) {
        return [];
      }

      return db.insert(agentActivity).values(data).returning().all();
    },

    deleteByStepId(stepId: number): number {
      const result = db.delete(agentActivity).where(eq(agentActivity.workflowStepId, stepId)).run();
      return result.changes;
    },

    findByStepId(stepId: number): Array<AgentActivity> {
      return db
        .select()
        .from(agentActivity)
        .where(eq(agentActivity.workflowStepId, stepId))
        .orderBy(asc(agentActivity.createdAt))
        .all();
    },

    findByWorkflowId(workflowId: number): Array<AgentActivity> {
      return db
        .select({
          cacheCreationInputTokens: agentActivity.cacheCreationInputTokens,
          cacheReadInputTokens: agentActivity.cacheReadInputTokens,
          createdAt: agentActivity.createdAt,
          durationMs: agentActivity.durationMs,
          estimatedCost: agentActivity.estimatedCost,
          eventType: agentActivity.eventType,
          id: agentActivity.id,
          inputTokens: agentActivity.inputTokens,
          outputTokens: agentActivity.outputTokens,
          phase: agentActivity.phase,
          startedAt: agentActivity.startedAt,
          stoppedAt: agentActivity.stoppedAt,
          textDelta: agentActivity.textDelta,
          thinkingBlockIndex: agentActivity.thinkingBlockIndex,
          toolInput: agentActivity.toolInput,
          toolName: agentActivity.toolName,
          toolUseId: agentActivity.toolUseId,
          updatedAt: agentActivity.updatedAt,
          workflowStepId: agentActivity.workflowStepId,
        })
        .from(agentActivity)
        .innerJoin(workflowSteps, eq(agentActivity.workflowStepId, workflowSteps.id))
        .where(eq(workflowSteps.workflowId, workflowId))
        .orderBy(asc(agentActivity.createdAt))
        .all();
    },

    update(id: number, data: Partial<NewAgentActivity>): AgentActivity | undefined {
      return db
        .update(agentActivity)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(agentActivity.id, id))
        .returning()
        .get();
    },
  };
}
