// Re-export database types for renderer use
export type {
  Agent,
  AgentActivity,
  AgentHook,
  AgentSkill,
  AgentTool,
  AuditLog,
  DiscoveredFile,
  NewAgent,
  NewAgentActivity,
  NewAgentHook,
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
  NewWorkflowStep,
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
 * Re-export AgentStreamAPI from agent-stream.d.ts for consistency.
 * The canonical definition is in types/agent-stream.d.ts.
 */
export type { AgentStreamAPI } from './agent-stream';

/**
 * Agent activity API interface for fetching persisted activity records.
 */
export interface AgentActivityAPI {
  getByStepId(stepId: number): Promise<Array<import('../db/schema').AgentActivity>>;
  getByWorkflowId(workflowId: number): Promise<Array<import('../db/schema').AgentActivity>>;
}

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
    extendedThinkingEnabled?: boolean;
    hooks?: AgentImportHooks;
    maxThinkingTokens?: number;
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
   * When true, includes the hooks array for each agent.
   * Useful for displaying hook counts in table views.
   */
  includeHooks?: boolean;
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

// Re-export debug log types for renderer use
export type { DebugLogAPI, DebugLogEntry, DebugLogFilters } from './debug-log';

/**
 * Extended Agent type that includes optional tools, skills, and hooks arrays
 * for list responses when includeTools/includeSkills filters are used.
 */
export type AgentWithRelations = import('../db/schema').Agent & {
  hooks?: Array<import('../db/schema').AgentHook>;
  skills?: Array<import('../db/schema').AgentSkill>;
  tools?: Array<import('../db/schema').AgentTool>;
};

// =============================================================================
// Clarification Types
// =============================================================================

/**
 * Agent configuration for clarification.
 */
export interface ClarificationAgentConfig {
  hooks: Array<{ body: string; eventType: string; matcher: null | string }>;
  id: number;
  model: null | string;
  name: string;
  permissionMode: null | string;
  skills: Array<{ isRequired: boolean; skillName: string }>;
  systemPrompt: string;
  tools: Array<{ toolName: string; toolPattern: string }>;
}

/**
 * Discriminated union for a single answer to a clarification question.
 */
export type ClarificationAnswer =
  | { other?: string; selected: Array<string>; type: 'checkbox' }
  | { other?: string; selected: string; type: 'radio' }
  | { text: string; type: 'text' };

/**
 * Clarification API interface.
 */
export interface ClarificationAPI {
  getState(workflowId: number): Promise<ClarificationServiceState | null>;
  /** Subscribe to streaming events during clarification. Returns unsubscribe function. */
  onStreamMessage(callback: (message: ClarificationStreamMessage) => void): () => void;
  retry(input: ClarificationStartInput): Promise<ClarificationOutcomeWithPause>;
  skip(workflowId: number, reason?: string): Promise<ClarificationOutcome>;
  start(input: ClarificationStartInput): Promise<ClarificationOutcomeWithPause>;
  submitAnswers(input: ClarificationRefinementInput): Promise<ClarificationSubmitAnswersResult>;
  submitEdits(workflowId: number, editedText: string): Promise<ClarificationOutcome>;
}

/**
 * Assessment of feature request clarity.
 */
export interface ClarificationAssessment {
  reason: string;
  score: number;
}

/**
 * Discriminated union of all possible clarification outcomes.
 */
export type ClarificationOutcome =
  | { assessment: ClarificationAssessment; questions: Array<ClarificationQuestion>; type: 'QUESTIONS_FOR_USER' }
  | { assessment: ClarificationAssessment; reason: string; type: 'SKIP_CLARIFICATION' }
  | { elapsedSeconds: number; error: string; type: 'TIMEOUT' }
  | { error: string; stack?: string; type: 'ERROR' }
  | { reason?: string; type: 'CANCELLED' };

/**
 * Extended outcome fields for pause and retry information.
 */
export interface ClarificationOutcomePauseInfo {
  /** Whether the workflow should pause after this step */
  pauseRequested?: boolean;
  /** Current retry count for this session */
  retryCount?: number;
  /** SDK session ID for potential resumption */
  sdkSessionId?: string;
  /** Whether skip fallback is available */
  skipFallbackAvailable?: boolean;
  /** Usage statistics from SDK result */
  usage?: ClarificationUsageStats;
}

/**
 * Extended clarification outcome with pause and retry information.
 */
export type ClarificationOutcomeWithPause = ClarificationOutcome & ClarificationOutcomePauseInfo;

/**
 * A single clarification question with options.
 */
export interface ClarificationQuestion {
  allowOther?: boolean;
  header: string;
  options?: Array<{ description: string; label: string }>;
  question: string;
  questionType?: 'checkbox' | 'radio' | 'text';
}

/**
 * Input for submitting answers to clarification questions.
 */
export interface ClarificationRefinementInput {
  answers: Record<string, ClarificationAnswer>;
  questions: Array<ClarificationQuestion>;
  stepId: number;
  workflowId: number;
}

/**
 * Phase of clarification service execution.
 */
export type ClarificationServicePhase =
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'executing'
  | 'executing_extended_thinking'
  | 'idle'
  | 'loading_agent'
  | 'processing_response'
  | 'timeout'
  | 'waiting_for_user';

/**
 * State of the clarification service during execution.
 */
export interface ClarificationServiceState {
  agentConfig: ClarificationAgentConfig | null;
  phase: ClarificationServicePhase;
  questions: Array<ClarificationQuestion> | null;
  skipReason: null | string;
}

/**
 * Input for starting a clarification session.
 */
export interface ClarificationStartInput {
  /** Optional agent ID override. When provided, takes precedence over the step's configured agent. */
  agentId?: number;
  featureRequest: string;
  /** Whether to keep existing questions and append new ones instead of replacing. */
  keepExistingQuestions?: boolean;
  repositoryPath: string;
  /** Optional guidance text from the user to influence the rerun. */
  rerunGuidance?: string;
  stepId: number;
  timeoutSeconds?: number;
  workflowId: number;
}

/**
 * Discriminated union of all clarification stream message types.
 */
export type ClarificationStreamMessage =
  | ClarificationStreamExtendedThinkingHeartbeat
  | ClarificationStreamPhaseChange
  | ClarificationStreamTextDelta
  | ClarificationStreamThinkingDelta
  | ClarificationStreamThinkingStart
  | ClarificationStreamToolStart
  | ClarificationStreamToolStop
  | ClarificationStreamToolUpdate;

/**
 * Result of submitting clarification answers.
 */
export interface ClarificationSubmitAnswersResult {
  formattedAnswers: string;
  questions: Array<ClarificationQuestion>;
  selectedOptions: Record<string, string>;
}

// =============================================================================
// Clarification Streaming Types
// =============================================================================

/**
 * Usage statistics from SDK result.
 */
export interface ClarificationUsageStats {
  /** Total cost in USD */
  costUsd: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Input tokens consumed */
  inputTokens: number;
  /** Number of conversation turns */
  numTurns: number;
  /** Output tokens generated */
  outputTokens: number;
}

// =============================================================================
// Refinement Types
// =============================================================================

export interface ElectronAPI {
  agent: {
    activate(id: number): Promise<import('../db/schema').Agent | undefined>;
    copyToProject(agentId: number, targetProjectId: number): Promise<import('../db/schema').Agent>;
    create(data: import('../db/schema').NewAgent): Promise<import('../db/schema').Agent>;
    createOverride(agentId: number, projectId: number): Promise<import('../db/schema').Agent>;
    deactivate(id: number): Promise<import('../db/schema').Agent | undefined>;
    delete(id: number): Promise<void>;
    duplicate(id: number): Promise<import('../db/schema').Agent>;
    export(id: number): Promise<string>;
    exportBatch(ids: Array<number>): Promise<Array<AgentExportBatchItem>>;
    get(id: number): Promise<import('../db/schema').Agent | undefined>;
    import(parsedMarkdown: AgentImportInput): Promise<AgentImportResult>;
    list(filters?: AgentListFilters): Promise<Array<AgentWithRelations>>;
    move(agentId: number, targetProjectId: null | number): Promise<import('../db/schema').Agent>;
    reset(id: number): Promise<import('../db/schema').Agent | undefined>;
    update(id: number, data: Partial<import('../db/schema').NewAgent>): Promise<import('../db/schema').Agent>;
  };
  agentActivity: AgentActivityAPI;
  agentHook: {
    create(data: import('../db/schema').NewAgentHook): Promise<import('../db/schema').AgentHook>;
    delete(id: number): Promise<boolean>;
    list(agentId: number): Promise<Array<import('../db/schema').AgentHook>>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewAgentHook>
    ): Promise<import('../db/schema').AgentHook | undefined>;
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
  agentStream?: AgentStreamAPI;
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
  clarification: ClarificationAPI;
  debugLog: {
    clearLogs(): Promise<{ error?: string; success: boolean }>;
    getLogPath(): Promise<string>;
    getLogs(filters?: import('./debug-log').DebugLogFilters): Promise<Array<import('./debug-log').DebugLogEntry>>;
    getSessionIds(): Promise<Array<string>>;
    openDebugWindow(): Promise<void>;
    openLogFile(): Promise<{ error?: string; success: boolean }>;
  };
  dialog: {
    openDirectory(): Promise<null | string>;
    openFile(filters?: Array<{ extensions: Array<string>; name: string }>): Promise<null | string>;
    saveFile(
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
  };
  discovery: FileDiscoveryAPI;
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
    archive(id: number): Promise<import('../db/schema').Project | undefined>;
    create(data: import('../db/schema').NewProject): Promise<import('../db/schema').Project>;
    delete(id: number): Promise<boolean>;
    deleteHard(id: number): Promise<void>;
    get(id: number): Promise<import('../db/schema').Project | undefined>;
    list(options?: { includeArchived?: boolean }): Promise<Array<import('../db/schema').Project>>;
    listFavorites(): Promise<Array<import('../db/schema').Project>>;
    toggleFavorite(id: number): Promise<import('../db/schema').Project | undefined>;
    unarchive(id: number): Promise<import('../db/schema').Project | undefined>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewProject>
    ): Promise<import('../db/schema').Project | undefined>;
  };
  refinement: RefinementAPI;
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
    start(id: number): Promise<import('../db/schema').WorkflowStep | undefined>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewWorkflowStep>
    ): Promise<import('../db/schema').WorkflowStep | undefined>;
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
    update(
      id: number,
      data: import('../lib/validations/workflow').UpdateWorkflowInput
    ): Promise<import('../db/schema').Workflow>;
  };
  workflowRepository: {
    add(workflowId: number, repositoryId: number): Promise<import('../db/schema').WorkflowRepository>;
    addMultiple(
      workflowId: number,
      repositoryIds: Array<number>
    ): Promise<Array<import('../db/schema').WorkflowRepository>>;
    list(workflowId: number): Promise<Array<import('../db/schema').WorkflowRepository>>;
    remove(workflowId: number, repositoryId: number): Promise<boolean>;
  };
  worktree: {
    get(id: number): Promise<import('../db/schema').Worktree | undefined>;
    getByWorkflowId(workflowId: number): Promise<import('../db/schema').Worktree | undefined>;
    list(options?: { repositoryId?: number; status?: string }): Promise<Array<import('../db/schema').Worktree>>;
  };
}

/**
 * Agent configuration for file discovery.
 */
export interface FileDiscoveryAgentConfig {
  extendedThinkingEnabled: boolean;
  hooks: Array<{ body: string; eventType: string; matcher: null | string }>;
  id: number;
  maxThinkingTokens: null | number;
  model: null | string;
  name: string;
  permissionMode: null | string;
  skills: Array<{ isRequired: boolean; skillName: string }>;
  systemPrompt: string;
  tools: Array<{ toolName: string; toolPattern: string }>;
}

/**
 * File discovery API interface.
 */
export interface FileDiscoveryAPI {
  add(stepId: number, data: import('../db/schema').NewDiscoveredFile): Promise<import('../db/schema').DiscoveredFile>;
  cancel(sessionId: string): Promise<FileDiscoveryOutcome>;
  delete(id: number): Promise<boolean>;
  exclude(id: number): Promise<import('../db/schema').DiscoveredFile | undefined>;
  getState(sessionId: string): Promise<FileDiscoveryServiceState | null>;
  include(id: number): Promise<import('../db/schema').DiscoveredFile | undefined>;
  list(stepId: number): Promise<Array<import('../db/schema').DiscoveredFile>>;
  /** Subscribe to streaming events during file discovery. Returns unsubscribe function. */
  onStreamMessage(callback: (message: FileDiscoveryStreamMessage) => void): () => void;
  rediscover(input: FileDiscoveryRediscoverInput): Promise<FileDiscoveryOutcomeWithPause>;
  start(input: FileDiscoveryStartInput): Promise<FileDiscoveryOutcomeWithPause>;
  toggle(id: number): Promise<import('../db/schema').DiscoveredFile | undefined>;
  update(
    id: number,
    data: Partial<import('../db/schema').NewDiscoveredFile>
  ): Promise<import('../db/schema').DiscoveredFile | undefined>;
  updatePriority(id: number, priority: string): Promise<import('../db/schema').DiscoveredFile | undefined>;
}

/**
 * Discriminated union of all possible file discovery outcomes.
 */
export type FileDiscoveryOutcome =
  | {
      discoveredFiles: Array<{ filePath: string; id: number; priority: string }>;
      summary: string;
      totalCount: number;
      type: 'SUCCESS';
    }
  | { elapsedSeconds: number; error: string; partialCount?: number; type: 'TIMEOUT' }
  | { error: string; partialCount?: number; stack?: string; type: 'ERROR' }
  | { partialCount: number; reason?: string; type: 'CANCELLED' };

/**
 * Extended outcome fields for pause and retry information.
 */
export interface FileDiscoveryOutcomePauseInfo {
  /** Whether the workflow should pause after this step */
  pauseRequested?: boolean;
  /** Current retry count for this session */
  retryCount?: number;
  /** SDK session ID for potential resumption */
  sdkSessionId?: string;
  /** Whether skip fallback is available */
  skipFallbackAvailable?: boolean;
  /** Usage statistics from SDK result */
  usage?: FileDiscoveryUsageStats;
}

/**
 * Extended file discovery outcome with pause and retry information.
 */
export type FileDiscoveryOutcomeWithPause = FileDiscoveryOutcome & FileDiscoveryOutcomePauseInfo;

/**
 * Input for re-discovery operation.
 */
export interface FileDiscoveryRediscoverInput extends FileDiscoveryStartInput {
  mode: 'additive' | 'replace';
}

/**
 * Phase type for file discovery service.
 */
export type FileDiscoveryServicePhase =
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'executing'
  | 'executing_extended_thinking'
  | 'idle'
  | 'loading_agent'
  | 'processing_response'
  | 'saving_results'
  | 'timeout';

/**
 * State of the file discovery service during execution.
 */
export interface FileDiscoveryServiceState {
  agentConfig: FileDiscoveryAgentConfig | null;
  discoveredCount: number;
  phase: FileDiscoveryServicePhase;
  summary: null | string;
}

/**
 * Input for starting a file discovery session.
 */
export interface FileDiscoveryStartInput {
  agentId: number;
  refinedFeatureRequest: string;
  repositoryPath: string;
  stepId: number;
  timeoutSeconds?: number;
  workflowId: number;
}

// =============================================================================
// File Discovery Types
// =============================================================================

/**
 * Discriminated union of all file discovery stream message types.
 */
export type FileDiscoveryStreamMessage =
  | FileDiscoveryStreamComplete
  | FileDiscoveryStreamError
  | FileDiscoveryStreamExtendedThinkingHeartbeat
  | FileDiscoveryStreamFileDiscovered
  | FileDiscoveryStreamPhaseChange
  | FileDiscoveryStreamTextDelta
  | FileDiscoveryStreamThinkingDelta
  | FileDiscoveryStreamThinkingStart
  | FileDiscoveryStreamToolFinish
  | FileDiscoveryStreamToolStart
  | FileDiscoveryStreamToolUpdate;

/**
 * Usage statistics for file discovery.
 */
export interface FileDiscoveryUsageStats {
  costUsd: number;
  durationMs: number;
  inputTokens: number;
  numTurns: number;
  outputTokens: number;
}

/**
 * Agent configuration for refinement.
 */
export interface RefinementAgentConfig {
  extendedThinkingEnabled: boolean;
  hooks: Array<{ body: string; eventType: string; matcher: null | string }>;
  id: number;
  maxThinkingTokens: null | number;
  model: null | string;
  name: string;
  permissionMode: null | string;
  skills: Array<{ isRequired: boolean; skillName: string }>;
  systemPrompt: string;
  tools: Array<{ toolName: string; toolPattern: string }>;
}

/**
 * Refinement API interface.
 */
export interface RefinementAPI {
  cancel(sessionId: string): Promise<RefinementOutcome>;
  getResult(sessionId: string): Promise<null | RefinementOutcomeWithPause>;
  getState(sessionId: string): Promise<null | RefinementServiceState>;
  /** Subscribe to streaming events during refinement. Returns unsubscribe function. */
  onStreamMessage(callback: (message: RefinementStreamMessage) => void): () => void;
  regenerate(input: RefinementRegenerateInput): Promise<RefinementOutcomeWithPause>;
  retry(sessionId: string, input: RefinementStartInput): Promise<RefinementOutcomeWithPause>;
  start(input: RefinementStartInput): Promise<RefinementOutcomeWithPause>;
}

/**
 * Discriminated union of all possible refinement outcomes.
 */
export type RefinementOutcome =
  | { elapsedSeconds: number; error: string; type: 'TIMEOUT' }
  | { error: string; stack?: string; type: 'ERROR' }
  | { reason?: string; type: 'CANCELLED' }
  | { refinedText: string; type: 'SUCCESS' };

/**
 * Extended outcome with pause/retry information.
 */
export interface RefinementOutcomeWithPause {
  isPaused: boolean;
  outcome: RefinementOutcome;
  retryCount: number;
}

/**
 * Input for regenerating with additional guidance.
 */
export interface RefinementRegenerateInput {
  guidance: string;
  stepId: number;
  workflowId: number;
}

/**
 * Phase type for refinement service.
 */
export type RefinementServicePhase =
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'executing'
  | 'executing_extended_thinking'
  | 'idle'
  | 'loading_agent'
  | 'processing_response'
  | 'timeout';

/**
 * State of the refinement service during execution.
 */
export interface RefinementServiceState {
  agentConfig: null | RefinementAgentConfig;
  phase: RefinementServicePhase;
  refinedText: null | string;
}

/**
 * Input for starting a refinement session.
 */
export interface RefinementStartInput {
  agentId: number;
  clarificationContext: {
    answers: Record<string, string>;
    assessment?: { reason: string; score: number };
    questions: Array<{ header: string; options: Array<{ description: string; label: string }>; question: string }>;
  };
  featureRequest: string;
  repositoryPath: string;
  stepId: number;
  timeoutSeconds?: number;
  workflowId: number;
}

/**
 * Discriminated union of all refinement stream message types.
 */
export type RefinementStreamMessage =
  | RefinementStreamExtendedThinkingHeartbeat
  | RefinementStreamPhaseChange
  | RefinementStreamTextDelta
  | RefinementStreamThinkingDelta
  | RefinementStreamThinkingStart
  | RefinementStreamToolStart
  | RefinementStreamToolStop
  | RefinementStreamToolUpdate;

/**
 * Usage statistics from SDK result.
 */
export interface RefinementUsageStats {
  costUsd: number;
  durationMs: number;
  inputTokens: number;
  numTurns: number;
  outputTokens: number;
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
  type?: 'implementation' | 'planning';
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

/**
 * Heartbeat message during extended thinking execution.
 * Sent periodically to indicate progress when streaming is disabled.
 */
interface ClarificationStreamExtendedThinkingHeartbeat extends ClarificationStreamMessageBase {
  /** Elapsed time in milliseconds since execution started */
  elapsedMs: number;
  /** Estimated completion percentage (0-100, null if unknown) */
  estimatedProgress: null | number;
  /** Maximum thinking tokens budget */
  maxThinkingTokens: number;
  type: 'extended_thinking_heartbeat';
}

/**
 * Base interface for all clarification stream messages.
 */
interface ClarificationStreamMessageBase {
  sessionId: string;
  timestamp: number;
  type:
    | 'extended_thinking_heartbeat'
    | 'phase_change'
    | 'text_delta'
    | 'thinking_delta'
    | 'thinking_start'
    | 'tool_start'
    | 'tool_stop';
  workflowId: number;
}

/**
 * Stream message for phase transitions.
 */
interface ClarificationStreamPhaseChange extends ClarificationStreamMessageBase {
  phase: ClarificationServicePhase;
  type: 'phase_change';
}

/**
 * Stream message for text delta.
 */
interface ClarificationStreamTextDelta extends ClarificationStreamMessageBase {
  delta: string;
  type: 'text_delta';
}

/**
 * Stream message for thinking delta.
 */
interface ClarificationStreamThinkingDelta extends ClarificationStreamMessageBase {
  blockIndex: number;
  delta: string;
  type: 'thinking_delta';
}

/**
 * Stream message for thinking block start.
 */
interface ClarificationStreamThinkingStart extends ClarificationStreamMessageBase {
  blockIndex: number;
  type: 'thinking_start';
}

/**
 * Stream message for tool start.
 */
interface ClarificationStreamToolStart extends ClarificationStreamMessageBase {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
  type: 'tool_start';
}

/**
 * Stream message for tool stop.
 */
interface ClarificationStreamToolStop extends ClarificationStreamMessageBase {
  toolUseId: string;
  type: 'tool_stop';
}

/**
 * Stream message for tool input updates.
 */
interface ClarificationStreamToolUpdate extends ClarificationStreamMessageBase {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
  type: 'tool_update';
}

/**
 * Stream message indicating discovery completed.
 */
interface FileDiscoveryStreamComplete extends FileDiscoveryStreamMessageBase {
  outcome: FileDiscoveryOutcome;
  type: 'complete';
}

/**
 * Stream message indicating an error occurred.
 */
interface FileDiscoveryStreamError extends FileDiscoveryStreamMessageBase {
  error: string;
  stack?: string;
  type: 'error';
}

/**
 * Heartbeat message during extended thinking execution.
 */
interface FileDiscoveryStreamExtendedThinkingHeartbeat extends FileDiscoveryStreamMessageBase {
  elapsedMs: number;
  estimatedProgress: null | number;
  maxThinkingTokens: number;
  type: 'extended_thinking_heartbeat';
}

/**
 * Stream message for a single file discovered during execution.
 */
interface FileDiscoveryStreamFileDiscovered extends FileDiscoveryStreamMessageBase {
  file: {
    action: 'create' | 'delete' | 'modify' | 'reference';
    filePath: string;
    priority: 'high' | 'low' | 'medium';
    relevanceExplanation: string;
    role: string;
  };
  type: 'file_discovered';
}

/**
 * Base interface for all file discovery stream messages.
 */
interface FileDiscoveryStreamMessageBase {
  sessionId: string;
  timestamp: number;
  type:
    | 'complete'
    | 'error'
    | 'extended_thinking_heartbeat'
    | 'file_discovered'
    | 'phase_change'
    | 'text_delta'
    | 'thinking_delta'
    | 'thinking_start'
    | 'tool_finish'
    | 'tool_start'
    | 'tool_update';
}

/**
 * Stream message for phase transitions.
 */
interface FileDiscoveryStreamPhaseChange extends FileDiscoveryStreamMessageBase {
  phase: FileDiscoveryServicePhase;
  type: 'phase_change';
}

/**
 * Stream message for text delta.
 */
interface FileDiscoveryStreamTextDelta extends FileDiscoveryStreamMessageBase {
  delta: string;
  type: 'text_delta';
}

/**
 * Stream message for thinking delta.
 */
interface FileDiscoveryStreamThinkingDelta extends FileDiscoveryStreamMessageBase {
  blockIndex: number;
  delta: string;
  type: 'thinking_delta';
}

/**
 * Stream message for thinking block start.
 */
interface FileDiscoveryStreamThinkingStart extends FileDiscoveryStreamMessageBase {
  blockIndex: number;
  type: 'thinking_start';
}

/**
 * Stream message for tool finish.
 */
interface FileDiscoveryStreamToolFinish extends FileDiscoveryStreamMessageBase {
  toolOutput?: unknown;
  toolUseId: string;
  type: 'tool_finish';
}

/**
 * Stream message for tool start.
 */
interface FileDiscoveryStreamToolStart extends FileDiscoveryStreamMessageBase {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
  type: 'tool_start';
}

/**
 * Stream message for tool input updates.
 */
interface FileDiscoveryStreamToolUpdate extends FileDiscoveryStreamMessageBase {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
  type: 'tool_update';
}

// =============================================================================
// Refinement Streaming Types
// =============================================================================

/**
 * Heartbeat message during extended thinking execution.
 */
interface RefinementStreamExtendedThinkingHeartbeat extends RefinementStreamMessageBase {
  elapsedMs: number;
  estimatedProgress: null | number;
  maxThinkingTokens: number;
  type: 'extended_thinking_heartbeat';
}

/**
 * Base interface for all refinement stream messages.
 */
interface RefinementStreamMessageBase {
  sessionId: string;
  timestamp: number;
  type:
    | 'extended_thinking_heartbeat'
    | 'phase_change'
    | 'text_delta'
    | 'thinking_delta'
    | 'thinking_start'
    | 'tool_start'
    | 'tool_stop'
    | 'tool_update';
}

/**
 * Stream message for phase transitions.
 */
interface RefinementStreamPhaseChange extends RefinementStreamMessageBase {
  phase: RefinementServicePhase;
  type: 'phase_change';
}

/**
 * Stream message for text delta.
 */
interface RefinementStreamTextDelta extends RefinementStreamMessageBase {
  delta: string;
  type: 'text_delta';
}

/**
 * Stream message for thinking delta.
 */
interface RefinementStreamThinkingDelta extends RefinementStreamMessageBase {
  blockIndex: number;
  delta: string;
  type: 'thinking_delta';
}

/**
 * Stream message for thinking block start.
 */
interface RefinementStreamThinkingStart extends RefinementStreamMessageBase {
  blockIndex: number;
  type: 'thinking_start';
}

/**
 * Stream message for tool start.
 */
interface RefinementStreamToolStart extends RefinementStreamMessageBase {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
  type: 'tool_start';
}

/**
 * Stream message for tool stop.
 */
interface RefinementStreamToolStop extends RefinementStreamMessageBase {
  toolUseId: string;
  type: 'tool_stop';
}

/**
 * Stream message for tool input updates.
 */
interface RefinementStreamToolUpdate extends RefinementStreamMessageBase {
  toolInput: Record<string, unknown>;
  toolName: string;
  toolUseId: string;
  type: 'tool_update';
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
