import { createQueryKeys } from "@lukemorales/query-key-factory";

/**
 * Query keys for agents.
 *
 * All keys are actively used:
 * - active: Active agents optionally filtered by project
 * - builtIn: Built-in system agents
 * - byProject: Agents scoped to a specific project
 * - byType: Agents filtered by type
 * - detail: Single agent by ID (used for cache updates)
 * - list: All agents with optional filters
 */
export const agentKeys = createQueryKeys("agents", {
  /** Active agents, optionally filtered by project */
  active: (projectId?: number) => [{ projectId }],
  /** Built-in system agents */
  builtIn: null,
  /** Agents scoped to a specific project */
  byProject: (projectId: number) => [projectId],
  /** Agents filtered by type */
  byType: (type: string) => [type],
  /** Single agent by ID */
  detail: (id: number) => [id],
  /** All agents with optional filters */
  list: (filters?: {
    includeDeactivated?: boolean;
    projectId?: number;
    type?: string;
  }) => [{ filters }],
});
