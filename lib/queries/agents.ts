import { createQueryKeys } from '@lukemorales/query-key-factory';

/**
 * Query keys for agents.
 *
 * All keys are actively used:
 * - active: Active agents optionally filtered by project
 * - all: All agents regardless of scope (for unified table view)
 * - builtIn: Built-in system agents
 * - byProject: Agents scoped to a specific project
 * - byType: Agents filtered by type
 * - detail: Single agent by ID (used for cache updates)
 * - global: Global agents (not project-scoped) with optional filters
 * - list: All agents with optional filters
 * - projectScoped: Agents scoped to a specific project with optional filters
 */
export const agentKeys = createQueryKeys('agents', {
  /** Active agents, optionally filtered by project */
  active: (projectId?: number) => [{ projectId }],
  /** All agents regardless of scope (for unified table view) */
  all: (filters?: {
    includeBuiltIn?: boolean;
    includeDeactivated?: boolean;
    includeSkills?: boolean;
    includeTools?: boolean;
  }) => [{ filters }],
  /** Built-in system agents */
  builtIn: null,
  /** Agents scoped to a specific project */
  byProject: (projectId: number) => [projectId],
  /** Agents filtered by type */
  byType: (type: string) => [type],
  /** Single agent by ID */
  detail: (id: number) => [id],
  /** Global agents (not project-scoped) with optional filters */
  global: (filters?: { includeDeactivated?: boolean; type?: string }) => [{ filters }],
  /** All agents with optional filters */
  list: (filters?: { includeDeactivated?: boolean; projectId?: number; type?: string }) => [{ filters }],
  /** Agents scoped to a specific project with optional filters */
  projectScoped: (projectId: number, filters?: { includeDeactivated?: boolean; type?: string }) => [
    projectId,
    { filters },
  ],
});
