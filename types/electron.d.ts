// Re-export database types for renderer use
export type {
  Agent,
  AgentSkill,
  AgentTool,
  AuditLog,
  DiscoveredFile,
  NewAgent,
  NewAgentSkill,
  NewAgentTool,
  NewAuditLog,
  NewDiscoveredFile,
  NewProject,
  NewRepository,
  NewSetting,
  NewTemplate,
  NewTemplatePlaceholder,
  NewWorkflow,
  Project,
  Repository,
  Setting,
  Template,
  TemplatePlaceholder,
  Workflow,
  WorkflowRepository,
  WorkflowStep,
  Worktree,
} from '../db/schema';

/**
 * Item in batch export result
 */
export interface AgentExportBatchItem {
  agentName: string;
  error?: string;
  markdown?: string;
  success: boolean;
}

/**
 * Result type for agent export operations
 */
export interface AgentExportResult {
  error?: string;
  markdown?: string;
  success: boolean;
}

/**
 * Hook entry structure matching Claude Code specification.
 */
export interface AgentImportHookEntry {
  body: string;
  matcher?: string;
}

/**
 * Hooks structure matching Claude Code specification.
 */
export interface AgentImportHooks {
  PostToolUse?: Array<AgentImportHookEntry>;
  PreToolUse?: Array<AgentImportHookEntry>;
  Stop?: Array<AgentImportHookEntry>;
}

/**
 * Input data for agent import - parsed markdown data.
 * Matches the official Claude Code subagent specification.
 */
export interface AgentImportInput {
  frontmatter: {
    // Clarify-specific fields (optional)
    color?: string;
    // Required by Claude Code spec
    description?: string;
    // Optional Claude Code fields
    disallowedTools?: Array<string>;
    displayName?: string;
    hooks?: AgentImportHooks;
    model?: string;
    name: string;
    permissionMode?: string;
    // Simple string arrays (Claude Code format)
    skills?: Array<string>;
    tools?: Array<string>;
    type?: string;
    version?: number;
  };
  systemPrompt: string;
}

/**
 * Result type for agent import operations
 */
export interface AgentImportResult {
  agent?: import('../db/schema').Agent;
  errors?: Array<{ field: string; message: string }>;
  success: boolean;
  warnings?: Array<{ field: string; message: string }>;
}

/**
 * Filters for querying agents
 */
export interface AgentListFilters {
  /**
   * When true, excludes agents that have a projectId set.
   * Useful for showing only global agents in the global view.
   */
  excludeProjectAgents?: boolean;
  includeDeactivated?: boolean;
  /**
   * When true, includes the skills array for each agent.
   * Useful for displaying skill counts in table views.
   */
  includeSkills?: boolean;
  /**
   * When true, includes the tools array for each agent.
   * Useful for displaying tool counts in table views.
   */
  includeTools?: boolean;
  projectId?: number;
  /**
   * Filter by agent scope:
   * - "global": Only agents with projectId IS NULL (global agents)
   * - "project": Only agents with projectId IS NOT NULL (project-specific agents)
   */
  scope?: 'global' | 'project';
  type?: 'planning' | 'review' | 'specialist';
}

/**
 * Result type for agent operations that can fail due to validation or protection rules
 */
export interface AgentOperationResult {
  agent?: import('../db/schema').Agent;
  error?: string;
  success: boolean;
}

/**
 * Extended Agent type that includes optional tools, skills, and hooks arrays
 * for list responses when includeTools/includeSkills filters are used.
 */
export type AgentWithRelations = import('../db/schema').Agent & {
  hooks?: Array<import('../db/schema').AgentHook>;
  skills?: Array<import('../db/schema').AgentSkill>;
  tools?: Array<import('../db/schema').AgentTool>;
};

export interface ElectronAPI {
  agent: {
    activate(id: number): Promise<import('../db/schema').Agent | undefined>;
    copyToProject(agentId: number, targetProjectId: number): Promise<AgentOperationResult>;
    create(data: import('../db/schema').NewAgent): Promise<AgentOperationResult>;
    createOverride(agentId: number, projectId: number): Promise<AgentOperationResult>;
    deactivate(id: number): Promise<import('../db/schema').Agent | undefined>;
    delete(id: number): Promise<AgentOperationResult>;
    duplicate(id: number): Promise<AgentOperationResult>;
    export(id: number): Promise<AgentExportResult>;
    exportBatch(ids: Array<number>): Promise<Array<AgentExportBatchItem>>;
    get(id: number): Promise<import('../db/schema').Agent | undefined>;
    import(parsedMarkdown: AgentImportInput): Promise<AgentImportResult>;
    list(filters?: AgentListFilters): Promise<Array<AgentWithRelations>>;
    move(agentId: number, targetProjectId: null | number): Promise<AgentOperationResult>;
    reset(id: number): Promise<import('../db/schema').Agent | undefined>;
    update(id: number, data: Partial<import('../db/schema').NewAgent>): Promise<AgentOperationResult>;
  };
  agentSkill: {
    create(data: import('../db/schema').NewAgentSkill): Promise<import('../db/schema').AgentSkill>;
    delete(id: number): Promise<boolean>;
    list(agentId: number): Promise<Array<import('../db/schema').AgentSkill>>;
    setRequired(id: number, required: boolean): Promise<import('../db/schema').AgentSkill | undefined>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewAgentSkill>
    ): Promise<import('../db/schema').AgentSkill | undefined>;
  };
  agentTool: {
    allow(id: number): Promise<import('../db/schema').AgentTool | undefined>;
    create(data: import('../db/schema').NewAgentTool): Promise<import('../db/schema').AgentTool>;
    delete(id: number): Promise<boolean>;
    disallow(id: number): Promise<import('../db/schema').AgentTool | undefined>;
    list(agentId: number): Promise<Array<import('../db/schema').AgentTool>>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewAgentTool>
    ): Promise<import('../db/schema').AgentTool | undefined>;
  };
  app: {
    getPath(name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'): Promise<string>;
    getVersion(): Promise<string>;
  };
  audit: {
    create(data: import('../db/schema').NewAuditLog): Promise<import('../db/schema').AuditLog>;
    export(workflowId: number): Promise<{ content?: string; error?: string; success: boolean }>;
    findByStep(stepId: number): Promise<Array<import('../db/schema').AuditLog>>;
    findByWorkflow(workflowId: number): Promise<Array<import('../db/schema').AuditLog>>;
    list(): Promise<Array<import('../db/schema').AuditLog>>;
  };
  dialog: {
    openDirectory(): Promise<null | string>;
    openFile(filters?: Array<{ extensions: Array<string>; name: string }>): Promise<null | string>;
    saveFile(
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
  };
  discovery: {
    add(stepId: number, data: import('../db/schema').NewDiscoveredFile): Promise<import('../db/schema').DiscoveredFile>;
    exclude(id: number): Promise<import('../db/schema').DiscoveredFile | undefined>;
    include(id: number): Promise<import('../db/schema').DiscoveredFile | undefined>;
    list(stepId: number): Promise<Array<import('../db/schema').DiscoveredFile>>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewDiscoveredFile>
    ): Promise<import('../db/schema').DiscoveredFile | undefined>;
    updatePriority(id: number, priority: string): Promise<import('../db/schema').DiscoveredFile | undefined>;
  };
  fs: {
    exists(path: string): Promise<boolean>;
    readDirectory(path: string): Promise<{
      entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
      error?: string;
      success: boolean;
    }>;
    readFile(path: string): Promise<{ content?: string; error?: string; success: boolean }>;
    stat(path: string): Promise<{
      error?: string;
      stats?: {
        ctime: string;
        isDirectory: boolean;
        isFile: boolean;
        mtime: string;
        size: number;
      };
      success: boolean;
    }>;
    writeFile(path: string, content: string): Promise<{ error?: string; success: boolean }>;
  };
  project: {
    addRepo(
      projectId: number,
      repoData: import('../db/schema').NewRepository
    ): Promise<import('../db/schema').Repository>;
    create(data: import('../db/schema').NewProject): Promise<import('../db/schema').Project>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<import('../db/schema').Project | undefined>;
    list(): Promise<Array<import('../db/schema').Project>>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewProject>
    ): Promise<import('../db/schema').Project | undefined>;
  };
  repository: {
    clearDefault(id: number): Promise<import('../db/schema').Repository | undefined>;
    create(data: import('../db/schema').NewRepository): Promise<import('../db/schema').Repository>;
    delete(id: number): Promise<boolean>;
    findByPath(path: string): Promise<import('../db/schema').Repository | undefined>;
    findByProject(projectId: number): Promise<Array<import('../db/schema').Repository>>;
    get(id: number): Promise<import('../db/schema').Repository | undefined>;
    list(): Promise<Array<import('../db/schema').Repository>>;
    setDefault(id: number): Promise<import('../db/schema').Repository | undefined>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewRepository>
    ): Promise<import('../db/schema').Repository | undefined>;
  };
  settings: {
    bulkUpdate(updates: Array<{ key: string; value: string }>): Promise<Array<import('../db/schema').Setting>>;
    get(id: number): Promise<import('../db/schema').Setting | undefined>;
    getByCategory(category: string): Promise<Array<import('../db/schema').Setting>>;
    getByKey(key: string): Promise<import('../db/schema').Setting | undefined>;
    list(): Promise<Array<import('../db/schema').Setting>>;
    resetToDefault(key: string): Promise<import('../db/schema').Setting | undefined>;
    setValue(key: string, value: string): Promise<import('../db/schema').Setting | undefined>;
  };
  step: {
    complete(
      id: number,
      output?: string,
      durationMs?: number
    ): Promise<import('../db/schema').WorkflowStep | undefined>;
    edit(id: number, editedOutput: string): Promise<import('../db/schema').WorkflowStep | undefined>;
    fail(id: number, errorMessage: string): Promise<import('../db/schema').WorkflowStep | undefined>;
    get(id: number): Promise<import('../db/schema').WorkflowStep | undefined>;
    list(workflowId: number): Promise<Array<import('../db/schema').WorkflowStep>>;
    regenerate(id: number): Promise<import('../db/schema').WorkflowStep | undefined>;
    skip(id: number): Promise<import('../db/schema').WorkflowStep | undefined>;
  };
  store: {
    delete(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<boolean>;
  };
  template: {
    activate(id: number): Promise<import('../db/schema').Template | undefined>;
    create(data: import('../db/schema').NewTemplate): Promise<import('../db/schema').Template>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<import('../db/schema').Template | undefined>;
    getPlaceholders(templateId: number): Promise<Array<import('../db/schema').TemplatePlaceholder>>;
    incrementUsage(id: number): Promise<import('../db/schema').Template | undefined>;
    list(filters?: TemplateListFilters): Promise<Array<import('../db/schema').Template>>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewTemplate>
    ): Promise<import('../db/schema').Template | undefined>;
    updatePlaceholders(
      templateId: number,
      placeholders: Array<Omit<import('../db/schema').NewTemplatePlaceholder, 'templateId'>>
    ): Promise<Array<import('../db/schema').TemplatePlaceholder>>;
  };
  workflow: {
    cancel(id: number): Promise<import('../db/schema').Workflow | undefined>;
    create(data: import('../db/schema').NewWorkflow): Promise<import('../db/schema').Workflow>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<import('../db/schema').Workflow | undefined>;
    getStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number }): Promise<WorkflowStatistics>;
    list(): Promise<Array<import('../db/schema').Workflow>>;
    listHistory(filters?: WorkflowHistoryFilters): Promise<WorkflowHistoryResult>;
    pause(id: number): Promise<import('../db/schema').Workflow | undefined>;
    resume(id: number): Promise<import('../db/schema').Workflow | undefined>;
    start(id: number): Promise<import('../db/schema').Workflow | undefined>;
  };
  workflowRepository: {
    add(
      workflowId: number,
      repositoryId: number,
      isPrimary?: boolean
    ): Promise<import('../db/schema').WorkflowRepository>;
    addMultiple(
      workflowId: number,
      repositoryIds: Array<number>,
      primaryRepositoryId?: number
    ): Promise<Array<import('../db/schema').WorkflowRepository>>;
    list(workflowId: number): Promise<Array<import('../db/schema').WorkflowRepository>>;
    remove(workflowId: number, repositoryId: number): Promise<boolean>;
    setPrimary(
      workflowId: number,
      repositoryId: number
    ): Promise<import('../db/schema').WorkflowRepository | undefined>;
  };
  worktree: {
    get(id: number): Promise<import('../db/schema').Worktree | undefined>;
    getByWorkflowId(workflowId: number): Promise<import('../db/schema').Worktree | undefined>;
    list(options?: { repositoryId?: number; status?: string }): Promise<Array<import('../db/schema').Worktree>>;
  };
}

/**
 * Filters for querying templates
 */
export interface TemplateListFilters {
  category?: 'backend' | 'data' | 'electron' | 'security' | 'ui';
  includeDeactivated?: boolean;
}

/**
 * Terminal workflow statuses that indicate a workflow has finished execution
 */
export type TerminalStatus = 'cancelled' | 'completed' | 'failed';

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
}

/**
 * Paginated result for workflow history queries
 */
export interface WorkflowHistoryResult {
  page: number;
  pageSize: number;
  total: number;
  workflows: Array<import('../db/schema').Workflow>;
}

/**
 * Valid sort fields for workflow history queries
 */
export type WorkflowHistorySortField = 'completedAt' | 'createdAt' | 'durationMs' | 'featureName' | 'status';

/**
 * Sort order for workflow history queries
 */
export type WorkflowHistorySortOrder = 'asc' | 'desc';

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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
