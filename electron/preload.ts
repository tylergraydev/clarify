import { contextBridge, ipcRenderer } from 'electron';

import type {
  Agent,
  AgentHook,
  AgentSkill,
  AgentTool,
  AuditLog,
  DiscoveredFile,
  NewAgent,
  NewAgentHook,
  NewAgentSkill,
  NewAgentTool,
  NewAuditLog,
  NewDiscoveredFile,
  NewProject,
  NewRepository,
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
import type { UpdateWorkflowInput } from '../lib/validations/workflow';
import type { DebugLogFilters } from '../types/debug-log';

import { IpcChannels } from './ipc/channels';

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
  agent?: Agent;
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
  agent?: Agent;
  error?: string;
  success: boolean;
}

/**
 * Hook matcher configuration for filtering which events trigger callbacks.
 * Simplified version for preload - full type is `AgentStreamHookMatcher` in `types/agent-stream.d.ts`.
 */
export interface AgentStreamHookMatcher {
  /** Regex pattern to match tool names (e.g., 'Write|Edit') */
  matcher?: string;
}

/**
 * Hooks configuration for intercepting agent execution.
 * Simplified version for preload - full type is `AgentStreamHooks` in `types/agent-stream.d.ts`.
 */
export interface AgentStreamHooks {
  Notification?: Array<AgentStreamHookMatcher>;
  PermissionRequest?: Array<AgentStreamHookMatcher>;
  PostToolUse?: Array<AgentStreamHookMatcher>;
  PostToolUseFailure?: Array<AgentStreamHookMatcher>;
  PreCompact?: Array<AgentStreamHookMatcher>;
  PreToolUse?: Array<AgentStreamHookMatcher>;
  SessionEnd?: Array<AgentStreamHookMatcher>;
  SessionStart?: Array<AgentStreamHookMatcher>;
  Setup?: Array<AgentStreamHookMatcher>;
  Stop?: Array<AgentStreamHookMatcher>;
  SubagentStart?: Array<AgentStreamHookMatcher>;
  SubagentStop?: Array<AgentStreamHookMatcher>;
  UserPromptSubmit?: Array<AgentStreamHookMatcher>;
}

/**
 * Callback type for receiving stream messages.
 *
 * The actual message types are defined in `types/agent-stream.d.ts`:
 * - `AgentStreamMessage` - Union of all stream message types from SDK
 * - `AgentStreamPortReadyMessage` - Local message indicating port is ready
 *
 * Using `unknown` here because preload cannot import types from the renderer.
 */
export type AgentStreamMessageCallback = (message: unknown) => void;

/**
 * Options for starting an agent stream.
 *
 * This interface must stay synchronized with `AgentStreamOptions` in `types/agent-stream.d.ts`.
 * The canonical type definition is in that file.
 */
export interface AgentStreamOptions {
  /** Allowed tools (empty = all tools) */
  allowedTools?: Array<string>;
  /** Working directory for the agent */
  cwd?: string;
  /**
   * Hooks for intercepting agent execution.
   * Enables validation, logging, security controls, and pause points.
   */
  hooks?: AgentStreamHooks;
  /** Maximum API spend in USD before stopping */
  maxBudgetUsd?: number;
  /**
   * Maximum tokens for Claude's extended thinking/reasoning process.
   *
   * **Important: Disables partial streaming when set.**
   *
   * When `maxThinkingTokens` is explicitly configured, the SDK disables `StreamEvent`
   * messages. This means:
   * - No `text_delta` or `thinking_delta` messages will be received
   * - Only complete `AssistantMessage` objects arrive after each turn completes
   * - Real-time typewriter effects and incremental thinking display are not available
   *
   * Note: Extended thinking is disabled by default in the SDK, so streaming works
   * normally unless you enable it by setting this option.
   *
   * @see {@link https://platform.claude.com/docs/en/agent-sdk/streaming-responses SDK Streaming Documentation}
   */
  maxThinkingTokens?: number;
  /** Maximum turns before stopping */
  maxTurns?: number;
  /**
   * Permission mode controlling tool execution behavior.
   * @default 'default'
   */
  permissionMode?: AgentStreamPermissionMode;
  /** The prompt/task for the agent */
  prompt: string;
  /** System prompt override */
  systemPrompt?: string;
}

/**
 * Permission mode for controlling tool execution behavior.
 * Must match `AgentStreamPermissionMode` in `types/agent-stream.d.ts`.
 */
export type AgentStreamPermissionMode =
  | 'acceptEdits'
  | 'bypassPermissions'
  | 'default'
  | 'delegate'
  | 'dontAsk'
  | 'plan';

/**
 * Extended Agent type that includes optional tools, skills, and hooks arrays
 * for list responses when includeTools/includeSkills filters are used.
 */
export interface AgentWithRelations extends Agent {
  hooks?: Array<AgentHook>;
  skills?: Array<AgentSkill>;
  tools?: Array<AgentTool>;
}

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
 * Phase type for clarification service.
 */
export type ClarificationServicePhase =
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'executing'
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
  phase:
    | 'cancelled'
    | 'complete'
    | 'error'
    | 'executing'
    | 'idle'
    | 'loading_agent'
    | 'processing_response'
    | 'timeout'
    | 'waiting_for_user';
  questions: Array<ClarificationQuestion> | null;
  skipReason: null | string;
}

/**
 * Input for starting a clarification session.
 */
export interface ClarificationStartInput {
  featureRequest: string;
  keepExistingQuestions?: boolean;
  repositoryPath: string;
  rerunGuidance?: string;
  stepId: number;
  timeoutSeconds?: number;
  workflowId: number;
}

/**
 * Discriminated union of all clarification stream message types.
 */
export type ClarificationStreamMessage =
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
    activate(id: number): Promise<Agent | undefined>;
    copyToProject(agentId: number, targetProjectId: number): Promise<Agent>;
    create(data: NewAgent): Promise<Agent>;
    createOverride(agentId: number, projectId: number): Promise<Agent>;
    deactivate(id: number): Promise<Agent | undefined>;
    delete(id: number): Promise<void>;
    duplicate(id: number): Promise<Agent>;
    export(id: number): Promise<string>;
    exportBatch(ids: Array<number>): Promise<Array<AgentExportBatchItem>>;
    get(id: number): Promise<Agent | undefined>;
    import(parsedMarkdown: AgentImportInput): Promise<AgentImportResult>;
    list(filters?: AgentListFilters): Promise<Array<AgentWithRelations>>;
    move(agentId: number, targetProjectId: null | number): Promise<Agent>;
    reset(id: number): Promise<Agent | undefined>;
    update(id: number, data: Partial<NewAgent>): Promise<Agent>;
  };
  agentHook: {
    create(data: NewAgentHook): Promise<AgentHook>;
    delete(id: number): Promise<boolean>;
    list(agentId: number): Promise<Array<AgentHook>>;
    update(id: number, data: Partial<NewAgentHook>): Promise<AgentHook | undefined>;
  };
  agentSkill: {
    create(data: NewAgentSkill): Promise<AgentSkill>;
    delete(id: number): Promise<boolean>;
    list(agentId: number): Promise<Array<AgentSkill>>;
    setRequired(id: number, required: boolean): Promise<AgentSkill | undefined>;
    update(id: number, data: Partial<NewAgentSkill>): Promise<AgentSkill | undefined>;
  };
  agentStream: {
    /**
     * Cancel an active stream session
     */
    cancel(sessionId: string): Promise<boolean>;
    /**
     * Register a callback to receive stream messages
     * Returns an unsubscribe function
     */
    onMessage(callback: AgentStreamMessageCallback): () => void;
    /**
     * Send a message to the stream (e.g., tool response, cancel)
     */
    sendMessage(sessionId: string, message: unknown): void;
    /**
     * Start a new agent stream session
     * The onMessage callback will receive the port for this session
     */
    start(options: AgentStreamOptions): Promise<{ sessionId: string }>;
  };
  agentTool: {
    allow(id: number): Promise<AgentTool | undefined>;
    create(data: NewAgentTool): Promise<AgentTool>;
    delete(id: number): Promise<boolean>;
    disallow(id: number): Promise<AgentTool | undefined>;
    list(agentId: number): Promise<Array<AgentTool>>;
    update(id: number, data: Partial<NewAgentTool>): Promise<AgentTool | undefined>;
  };
  app: {
    getPath(name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'): Promise<string>;
    getVersion(): Promise<string>;
  };
  audit: {
    create(data: NewAuditLog): Promise<AuditLog>;
    export(workflowId: number): Promise<{ content?: string; error?: string; success: boolean }>;
    findByStep(stepId: number): Promise<Array<AuditLog>>;
    findByWorkflow(workflowId: number): Promise<Array<AuditLog>>;
    list(): Promise<Array<AuditLog>>;
  };
  clarification: {
    getState(workflowId: number): Promise<ClarificationServiceState | null>;
    /** Subscribe to streaming events during clarification. Returns unsubscribe function. */
    onStreamMessage(callback: (message: ClarificationStreamMessage) => void): () => void;
    retry(input: ClarificationStartInput): Promise<ClarificationOutcomeWithPause>;
    skip(workflowId: number, reason?: string): Promise<ClarificationOutcome>;
    start(input: ClarificationStartInput): Promise<ClarificationOutcomeWithPause>;
    submitAnswers(input: ClarificationRefinementInput): Promise<ClarificationSubmitAnswersResult>;
    submitEdits(workflowId: number, editedText: string): Promise<ClarificationOutcome>;
  };
  debugLog: {
    clearLogs(): Promise<{ error?: string; success: boolean }>;
    getLogPath(): Promise<string>;
    getLogs(filters?: DebugLogFilters): Promise<Array<import('../types/debug-log').DebugLogEntry>>;
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
  discovery: {
    add(stepId: number, data: NewDiscoveredFile): Promise<DiscoveredFile>;
    cancel(sessionId: string): Promise<FileDiscoveryOutcome>;
    delete(id: number): Promise<boolean>;
    exclude(id: number): Promise<DiscoveredFile | undefined>;
    getState(sessionId: string): Promise<FileDiscoveryServiceState | null>;
    include(id: number): Promise<DiscoveredFile | undefined>;
    list(stepId: number): Promise<Array<DiscoveredFile>>;
    /** Subscribe to streaming events during file discovery. Returns unsubscribe function. */
    onStreamMessage(callback: (message: FileDiscoveryStreamMessage) => void): () => void;
    rediscover(input: FileDiscoveryRediscoverInput): Promise<FileDiscoveryOutcomeWithPause>;
    start(input: FileDiscoveryStartInput): Promise<FileDiscoveryOutcomeWithPause>;
    toggle(id: number): Promise<DiscoveredFile | undefined>;
    update(id: number, data: Partial<NewDiscoveredFile>): Promise<DiscoveredFile | undefined>;
    updatePriority(id: number, priority: string): Promise<DiscoveredFile | undefined>;
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
    addRepo(projectId: number, repoData: NewRepository): Promise<Repository>;
    archive(id: number): Promise<Project | undefined>;
    create(data: NewProject): Promise<Project>;
    delete(id: number): Promise<boolean>;
    deleteHard(id: number): Promise<void>;
    get(id: number): Promise<Project | undefined>;
    list(options?: { includeArchived?: boolean }): Promise<Array<Project>>;
    listFavorites(): Promise<Array<Project>>;
    toggleFavorite(id: number): Promise<Project | undefined>;
    unarchive(id: number): Promise<Project | undefined>;
    update(id: number, data: Partial<NewProject>): Promise<Project | undefined>;
  };
  refinement: {
    cancel(sessionId: string): Promise<RefinementOutcome>;
    getResult(sessionId: string): Promise<null | RefinementOutcomeWithPause>;
    getState(sessionId: string): Promise<null | RefinementServiceState>;
    /** Subscribe to streaming events during refinement. Returns unsubscribe function. */
    onStreamMessage(callback: (message: RefinementStreamMessage) => void): () => void;
    regenerate(input: RefinementRegenerateInput): Promise<RefinementOutcomeWithPause>;
    retry(sessionId: string, input: RefinementStartInput): Promise<RefinementOutcomeWithPause>;
    start(input: RefinementStartInput): Promise<RefinementOutcomeWithPause>;
  };
  repository: {
    clearDefault(id: number): Promise<Repository | undefined>;
    create(data: NewRepository): Promise<Repository>;
    delete(id: number): Promise<boolean>;
    findByPath(path: string): Promise<Repository | undefined>;
    findByProject(projectId: number): Promise<Array<Repository>>;
    get(id: number): Promise<Repository | undefined>;
    list(): Promise<Array<Repository>>;
    setDefault(id: number): Promise<Repository | undefined>;
    update(id: number, data: Partial<NewRepository>): Promise<Repository | undefined>;
  };
  settings: {
    bulkUpdate(updates: Array<{ key: string; value: string }>): Promise<Array<Setting>>;
    get(id: number): Promise<Setting | undefined>;
    getByCategory(category: string): Promise<Array<Setting>>;
    getByKey(key: string): Promise<Setting | undefined>;
    list(): Promise<Array<Setting>>;
    resetToDefault(key: string): Promise<Setting | undefined>;
    setValue(key: string, value: string): Promise<Setting | undefined>;
  };
  step: {
    complete(id: number, output?: string, durationMs?: number): Promise<undefined | WorkflowStep>;
    edit(id: number, editedOutput: string): Promise<undefined | WorkflowStep>;
    fail(id: number, errorMessage: string): Promise<undefined | WorkflowStep>;
    get(id: number): Promise<undefined | WorkflowStep>;
    list(workflowId: number): Promise<Array<WorkflowStep>>;
    regenerate(id: number): Promise<undefined | WorkflowStep>;
    skip(id: number): Promise<undefined | WorkflowStep>;
    start(id: number): Promise<undefined | WorkflowStep>;
    update(id: number, data: Partial<NewWorkflowStep>): Promise<undefined | WorkflowStep>;
  };
  store: {
    delete(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<boolean>;
  };
  template: {
    activate(id: number): Promise<Template | undefined>;
    create(data: NewTemplate): Promise<Template>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<Template | undefined>;
    getPlaceholders(templateId: number): Promise<Array<TemplatePlaceholder>>;
    incrementUsage(id: number): Promise<Template | undefined>;
    list(filters?: TemplateListFilters): Promise<Array<Template>>;
    update(id: number, data: Partial<NewTemplate>): Promise<Template | undefined>;
    updatePlaceholders(
      templateId: number,
      placeholders: Array<Omit<NewTemplatePlaceholder, 'templateId'>>
    ): Promise<Array<TemplatePlaceholder>>;
  };
  workflow: {
    cancel(id: number): Promise<undefined | Workflow>;
    create(data: NewWorkflow): Promise<Workflow>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<undefined | Workflow>;
    getStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number }): Promise<WorkflowStatistics>;
    list(): Promise<Array<Workflow>>;
    listHistory(filters?: WorkflowHistoryFilters): Promise<WorkflowHistoryResult>;
    pause(id: number): Promise<undefined | Workflow>;
    resume(id: number): Promise<undefined | Workflow>;
    start(id: number): Promise<undefined | Workflow>;
    update(id: number, data: UpdateWorkflowInput): Promise<Workflow>;
  };
  workflowRepository: {
    add(workflowId: number, repositoryId: number, isPrimary?: boolean): Promise<WorkflowRepository>;
    addMultiple(
      workflowId: number,
      repositoryIds: Array<number>,
      primaryRepositoryId?: number
    ): Promise<Array<WorkflowRepository>>;
    list(workflowId: number): Promise<Array<WorkflowRepository>>;
    remove(workflowId: number, repositoryId: number): Promise<boolean>;
    setPrimary(workflowId: number, repositoryId: number): Promise<undefined | WorkflowRepository>;
  };
  worktree: {
    get(id: number): Promise<undefined | Worktree>;
    getByWorkflowId(workflowId: number): Promise<undefined | Worktree>;
    list(options?: { repositoryId?: number; status?: string }): Promise<Array<Worktree>>;
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

// =============================================================================
// File Discovery Types
// =============================================================================

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
  workflows: Array<Workflow>;
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

/**
 * Base interface for all clarification stream messages.
 */
interface ClarificationStreamMessageBase {
  sessionId: string;
  timestamp: number;
  type:
    | 'phase_change'
    | 'text_delta'
    | 'thinking_delta'
    | 'thinking_start'
    | 'tool_start'
    | 'tool_stop'
    | 'tool_update';
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

/**
 * Terminal workflow statuses that indicate a workflow has finished execution
 */
type TerminalStatus = 'cancelled' | 'completed' | 'failed';

/**
 * Valid sort fields for workflow history queries
 */
type WorkflowHistorySortField = 'completedAt' | 'createdAt' | 'durationMs' | 'featureName' | 'status';

/**
 * Sort order for workflow history queries
 */
type WorkflowHistorySortOrder = 'asc' | 'desc';

const electronAPI: ElectronAPI = {
  agent: {
    activate: (id) => ipcRenderer.invoke(IpcChannels.agent.activate, id),
    copyToProject: (agentId, targetProjectId) =>
      ipcRenderer.invoke(IpcChannels.agent.copyToProject, agentId, targetProjectId),
    create: (data) => ipcRenderer.invoke(IpcChannels.agent.create, data),
    createOverride: (agentId, projectId) => ipcRenderer.invoke(IpcChannels.agent.createOverride, agentId, projectId),
    deactivate: (id) => ipcRenderer.invoke(IpcChannels.agent.deactivate, id),
    delete: (id) => ipcRenderer.invoke(IpcChannels.agent.delete, id),
    duplicate: (id) => ipcRenderer.invoke(IpcChannels.agent.duplicate, id),
    export: (id) => ipcRenderer.invoke(IpcChannels.agent.export, id),
    exportBatch: (ids) => ipcRenderer.invoke(IpcChannels.agent.exportBatch, ids),
    get: (id) => ipcRenderer.invoke(IpcChannels.agent.get, id),
    import: (parsedMarkdown) => ipcRenderer.invoke(IpcChannels.agent.import, parsedMarkdown),
    list: (filters) => ipcRenderer.invoke(IpcChannels.agent.list, filters),
    move: (agentId, targetProjectId) => ipcRenderer.invoke(IpcChannels.agent.move, agentId, targetProjectId),
    reset: (id) => ipcRenderer.invoke(IpcChannels.agent.reset, id),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.agent.update, id, data),
  },
  agentHook: {
    create: (data) => ipcRenderer.invoke(IpcChannels.agentHook.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.agentHook.delete, id),
    list: (agentId) => ipcRenderer.invoke(IpcChannels.agentHook.list, agentId),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.agentHook.update, id, data),
  },
  agentSkill: {
    create: (data) => ipcRenderer.invoke(IpcChannels.agentSkill.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.agentSkill.delete, id),
    list: (agentId) => ipcRenderer.invoke(IpcChannels.agentSkill.list, agentId),
    setRequired: (id, required) => ipcRenderer.invoke(IpcChannels.agentSkill.setRequired, id, required),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.agentSkill.update, id, data),
  },
  /**
   * Agent Stream API for bidirectional streaming communication.
   *
   * Uses an Immediately Invoked Function Expression (IIFE) pattern to:
   * 1. Create private state (activePorts, messageCallbacks) that persists
   *    across API method calls but isn't exposed to the renderer.
   * 2. Set up the port transfer listener once during initialization.
   * 3. Return a clean public API object.
   *
   * This pattern is necessary because the preload script runs once and
   * we need to maintain state for multiple streaming sessions.
   */
  agentStream: (() => {
    // Private state - ports keyed by session ID for message routing
    const activePorts = new Map<string, MessagePort>();
    // Private state - callbacks registered via onMessage() to receive stream events
    const messageCallbacks = new Set<(message: unknown) => void>();

    /**
     * Clean up a port when a session ends.
     * Called when receiving 'result' messages to prevent memory leaks.
     */
    const cleanupPort = (sessionId: string) => {
      const port = activePorts.get(sessionId);
      if (port) {
        port.close();
        activePorts.delete(sessionId);
        console.log('[AgentStream] Port cleaned up for session:', sessionId);
      }
    };

    // Listen for port transfers from main process.
    // This runs once when the preload script loads, setting up a persistent listener.
    ipcRenderer.on(IpcChannels.agentStream.port, (event, data: { sessionId: string }) => {
      // Get the transferred port from the event
      const port = event.ports[0];
      if (!port) {
        console.error('[AgentStream] No port received for session:', data.sessionId);
        return;
      }

      // Store the port for later message sending
      activePorts.set(data.sessionId, port);

      // Set up message handler for this port
      port.onmessage = (messageEvent) => {
        // Attach session ID to the message (may already be present, but ensures it's there)
        const messageWithSession = {
          ...messageEvent.data,
          sessionId: data.sessionId,
        };

        // Notify all registered callbacks
        messageCallbacks.forEach((callback) => {
          try {
            callback(messageWithSession);
          } catch (error) {
            console.error('[AgentStream] Error in message callback:', error);
          }
        });

        // Clean up port when session ends (result message received)
        // This prevents memory leaks from accumulating ports over time
        if (messageEvent.data.type === 'result') {
          cleanupPort(data.sessionId);
        }
      };

      port.onmessageerror = (errorEvent) => {
        console.error('[AgentStream] Port message error:', errorEvent);
      };

      // Start the port to begin receiving messages
      port.start();

      // Notify callbacks that port is ready (allows UI to show session started)
      messageCallbacks.forEach((callback) => {
        try {
          callback({
            sessionId: data.sessionId,
            timestamp: Date.now(),
            type: 'port_ready',
          });
        } catch (error) {
          console.error('[AgentStream] Error in port ready callback:', error);
        }
      });
    });

    // Return the public API
    return {
      cancel: (sessionId: string) => ipcRenderer.invoke(IpcChannels.agentStream.cancel, sessionId),
      onMessage: (callback: (message: unknown) => void) => {
        messageCallbacks.add(callback);
        // Return unsubscribe function
        return () => {
          messageCallbacks.delete(callback);
        };
      },
      sendMessage: (sessionId: string, message: unknown) => {
        const port = activePorts.get(sessionId);
        if (!port) {
          console.error('[AgentStream] No active port for session:', sessionId);
          return;
        }
        port.postMessage(message);
      },
      start: (options: AgentStreamOptions) => ipcRenderer.invoke(IpcChannels.agentStream.start, options),
    };
  })(),
  agentTool: {
    allow: (id) => ipcRenderer.invoke(IpcChannels.agentTool.allow, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.agentTool.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.agentTool.delete, id),
    disallow: (id) => ipcRenderer.invoke(IpcChannels.agentTool.disallow, id),
    list: (agentId) => ipcRenderer.invoke(IpcChannels.agentTool.list, agentId),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.agentTool.update, id, data),
  },
  app: {
    getPath: (name) => ipcRenderer.invoke(IpcChannels.app.getPath, name),
    getVersion: () => ipcRenderer.invoke(IpcChannels.app.getVersion),
  },
  audit: {
    create: (data) => ipcRenderer.invoke(IpcChannels.audit.create, data),
    export: (workflowId) => ipcRenderer.invoke(IpcChannels.audit.export, workflowId),
    findByStep: (stepId) => ipcRenderer.invoke(IpcChannels.audit.findByStep, stepId),
    findByWorkflow: (workflowId) => ipcRenderer.invoke(IpcChannels.audit.findByWorkflow, workflowId),
    list: () => ipcRenderer.invoke(IpcChannels.audit.list),
  },
  clarification: (() => {
    // Private state - callbacks registered via onStreamMessage() to receive stream events
    const streamCallbacks = new Set<(message: ClarificationStreamMessage) => void>();

    // Listen for stream events from main process.
    // This runs once when the preload script loads, setting up a persistent listener.
    ipcRenderer.on(IpcChannels.clarification.stream, (_event, message: ClarificationStreamMessage) => {
      // Notify all registered callbacks
      streamCallbacks.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error('[Clarification] Error in stream callback:', error);
        }
      });
    });

    return {
      getState: (workflowId: number) => ipcRenderer.invoke(IpcChannels.clarification.getState, workflowId),
      /**
       * Subscribe to streaming events during clarification.
       * Returns an unsubscribe function to clean up the listener.
       *
       * @param callback - Function called for each stream event
       * @returns Unsubscribe function
       */
      onStreamMessage: (callback: (message: ClarificationStreamMessage) => void) => {
        streamCallbacks.add(callback);
        return () => {
          streamCallbacks.delete(callback);
        };
      },
      retry: (input: ClarificationStartInput) => ipcRenderer.invoke(IpcChannels.clarification.retry, input),
      skip: (workflowId: number, reason?: string) =>
        ipcRenderer.invoke(IpcChannels.clarification.skip, workflowId, reason),
      start: (input: ClarificationStartInput) => ipcRenderer.invoke(IpcChannels.clarification.start, input),
      submitAnswers: (input: ClarificationRefinementInput) =>
        ipcRenderer.invoke(IpcChannels.clarification.submitAnswers, input),
      submitEdits: (workflowId: number, editedText: string) =>
        ipcRenderer.invoke(IpcChannels.clarification.submitEdits, workflowId, editedText),
    };
  })(),
  debugLog: {
    clearLogs: () => ipcRenderer.invoke(IpcChannels.debugLog.clearLogs),
    getLogPath: () => ipcRenderer.invoke(IpcChannels.debugLog.getLogPath),
    getLogs: (filters?: DebugLogFilters) => ipcRenderer.invoke(IpcChannels.debugLog.getLogs, filters),
    getSessionIds: () => ipcRenderer.invoke(IpcChannels.debugLog.getSessionIds),
    openDebugWindow: () => ipcRenderer.invoke(IpcChannels.debugLog.openDebugWindow),
    openLogFile: () => ipcRenderer.invoke(IpcChannels.debugLog.openLogFile),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke(IpcChannels.dialog.openDirectory),
    openFile: (filters) => ipcRenderer.invoke(IpcChannels.dialog.openFile, filters),
    saveFile: (defaultPath, filters) => ipcRenderer.invoke(IpcChannels.dialog.saveFile, defaultPath, filters),
  },
  discovery: (() => {
    // Private state - callbacks registered via onStreamMessage() to receive stream events
    const streamCallbacks = new Set<(message: FileDiscoveryStreamMessage) => void>();

    // Listen for stream events from main process.
    // This runs once when the preload script loads, setting up a persistent listener.
    ipcRenderer.on(IpcChannels.discovery.stream, (_event, message: FileDiscoveryStreamMessage) => {
      // Notify all registered callbacks
      streamCallbacks.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error('[Discovery] Error in stream callback:', error);
        }
      });
    });

    return {
      add: (stepId: number, data: NewDiscoveredFile) => ipcRenderer.invoke(IpcChannels.discovery.add, stepId, data),
      cancel: (sessionId: string) => ipcRenderer.invoke(IpcChannels.discovery.cancel, sessionId),
      delete: (id: number) => ipcRenderer.invoke(IpcChannels.discovery.delete, id),
      exclude: (id: number) => ipcRenderer.invoke(IpcChannels.discovery.exclude, id),
      getState: (sessionId: string) => ipcRenderer.invoke(IpcChannels.discovery.getState, sessionId),
      include: (id: number) => ipcRenderer.invoke(IpcChannels.discovery.include, id),
      list: (stepId: number) => ipcRenderer.invoke(IpcChannels.discovery.list, stepId),
      /**
       * Subscribe to streaming events during file discovery.
       * Returns an unsubscribe function to clean up the listener.
       *
       * @param callback - Function called for each stream event
       * @returns Unsubscribe function
       */
      onStreamMessage: (callback: (message: FileDiscoveryStreamMessage) => void) => {
        streamCallbacks.add(callback);
        return () => {
          streamCallbacks.delete(callback);
        };
      },
      rediscover: (input: FileDiscoveryRediscoverInput) => ipcRenderer.invoke(IpcChannels.discovery.rediscover, input),
      start: (input: FileDiscoveryStartInput) => ipcRenderer.invoke(IpcChannels.discovery.start, input),
      toggle: (id: number) => ipcRenderer.invoke(IpcChannels.discovery.toggle, id),
      update: (id: number, data: Partial<NewDiscoveredFile>) =>
        ipcRenderer.invoke(IpcChannels.discovery.update, id, data),
      updatePriority: (id: number, priority: string) =>
        ipcRenderer.invoke(IpcChannels.discovery.updatePriority, id, priority),
    };
  })(),
  fs: {
    exists: (path) => ipcRenderer.invoke(IpcChannels.fs.exists, path),
    readDirectory: (path) => ipcRenderer.invoke(IpcChannels.fs.readDirectory, path),
    readFile: (path) => ipcRenderer.invoke(IpcChannels.fs.readFile, path),
    stat: (path) => ipcRenderer.invoke(IpcChannels.fs.stat, path),
    writeFile: (path, content) => ipcRenderer.invoke(IpcChannels.fs.writeFile, path, content),
  },
  project: {
    addRepo: (projectId, repoData) => ipcRenderer.invoke(IpcChannels.project.addRepo, projectId, repoData),
    archive: (id) => ipcRenderer.invoke(IpcChannels.project.archive, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.project.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.project.delete, id),
    deleteHard: (id) => ipcRenderer.invoke(IpcChannels.project.deleteHard, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.project.get, id),
    list: (options) => ipcRenderer.invoke(IpcChannels.project.list, options),
    listFavorites: () => ipcRenderer.invoke(IpcChannels.project.listFavorites),
    toggleFavorite: (id) => ipcRenderer.invoke(IpcChannels.project.toggleFavorite, id),
    unarchive: (id) => ipcRenderer.invoke(IpcChannels.project.unarchive, id),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.project.update, id, data),
  },
  refinement: (() => {
    // Private state - callbacks registered via onStreamMessage() to receive stream events
    const streamCallbacks = new Set<(message: RefinementStreamMessage) => void>();

    // Listen for stream events from main process.
    // This runs once when the preload script loads, setting up a persistent listener.
    ipcRenderer.on(IpcChannels.refinement.stream, (_event, message: RefinementStreamMessage) => {
      // Notify all registered callbacks
      streamCallbacks.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error('[Refinement] Error in stream callback:', error);
        }
      });
    });

    return {
      cancel: (sessionId: string) => ipcRenderer.invoke(IpcChannels.refinement.cancel, sessionId),
      getResult: (sessionId: string) => ipcRenderer.invoke(IpcChannels.refinement.getResult, sessionId),
      getState: (sessionId: string) => ipcRenderer.invoke(IpcChannels.refinement.getState, sessionId),
      /**
       * Subscribe to streaming events during refinement.
       * Returns an unsubscribe function to clean up the listener.
       *
       * @param callback - Function called for each stream event
       * @returns Unsubscribe function
       */
      onStreamMessage: (callback: (message: RefinementStreamMessage) => void) => {
        streamCallbacks.add(callback);
        return () => {
          streamCallbacks.delete(callback);
        };
      },
      regenerate: (input: RefinementRegenerateInput) => ipcRenderer.invoke(IpcChannels.refinement.regenerate, input),
      retry: (sessionId: string, input: RefinementStartInput) =>
        ipcRenderer.invoke(IpcChannels.refinement.retry, sessionId, input),
      start: (input: RefinementStartInput) => ipcRenderer.invoke(IpcChannels.refinement.start, input),
    };
  })(),
  repository: {
    clearDefault: (id) => ipcRenderer.invoke(IpcChannels.repository.clearDefault, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.repository.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.repository.delete, id),
    findByPath: (path) => ipcRenderer.invoke(IpcChannels.repository.findByPath, path),
    findByProject: (projectId) => ipcRenderer.invoke(IpcChannels.repository.findByProject, projectId),
    get: (id) => ipcRenderer.invoke(IpcChannels.repository.get, id),
    list: () => ipcRenderer.invoke(IpcChannels.repository.list),
    setDefault: (id) => ipcRenderer.invoke(IpcChannels.repository.setDefault, id),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.repository.update, id, data),
  },
  settings: {
    bulkUpdate: (updates) => ipcRenderer.invoke(IpcChannels.settings.bulkUpdate, updates),
    get: (id) => ipcRenderer.invoke(IpcChannels.settings.get, id),
    getByCategory: (category) => ipcRenderer.invoke(IpcChannels.settings.getByCategory, category),
    getByKey: (key) => ipcRenderer.invoke(IpcChannels.settings.getByKey, key),
    list: () => ipcRenderer.invoke(IpcChannels.settings.list),
    resetToDefault: (key) => ipcRenderer.invoke(IpcChannels.settings.resetToDefault, key),
    setValue: (key, value) => ipcRenderer.invoke(IpcChannels.settings.setValue, key, value),
  },
  step: {
    complete: (id, output, durationMs) => ipcRenderer.invoke(IpcChannels.step.complete, id, output, durationMs),
    edit: (id, editedOutput) => ipcRenderer.invoke(IpcChannels.step.edit, id, editedOutput),
    fail: (id, errorMessage) => ipcRenderer.invoke(IpcChannels.step.fail, id, errorMessage),
    get: (id) => ipcRenderer.invoke(IpcChannels.step.get, id),
    list: (workflowId) => ipcRenderer.invoke(IpcChannels.step.list, { workflowId }),
    regenerate: (id) => ipcRenderer.invoke(IpcChannels.step.regenerate, id),
    skip: (id) => ipcRenderer.invoke(IpcChannels.step.skip, id),
    start: (id) => ipcRenderer.invoke(IpcChannels.step.start, id),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.step.update, id, data),
  },
  store: {
    delete: (key) => ipcRenderer.invoke(IpcChannels.store.delete, key),
    get: <T>(key: string) => ipcRenderer.invoke(IpcChannels.store.get, key) as Promise<T | undefined>,
    set: (key, value) => ipcRenderer.invoke(IpcChannels.store.set, key, value),
  },
  template: {
    activate: (id) => ipcRenderer.invoke(IpcChannels.template.activate, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.template.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.template.delete, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.template.get, id),
    getPlaceholders: (templateId) => ipcRenderer.invoke(IpcChannels.template.getPlaceholders, templateId),
    incrementUsage: (id) => ipcRenderer.invoke(IpcChannels.template.incrementUsage, id),
    list: (filters) => ipcRenderer.invoke(IpcChannels.template.list, filters),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.template.update, id, data),
    updatePlaceholders: (templateId, placeholders) =>
      ipcRenderer.invoke(IpcChannels.template.updatePlaceholders, templateId, placeholders),
  },
  workflow: {
    cancel: (id) => ipcRenderer.invoke(IpcChannels.workflow.cancel, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.workflow.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.workflow.delete, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.workflow.get, id),
    getStatistics: (filters) => ipcRenderer.invoke(IpcChannels.workflow.getStatistics, filters),
    list: () => ipcRenderer.invoke(IpcChannels.workflow.list),
    listHistory: (filters) => ipcRenderer.invoke(IpcChannels.workflow.listHistory, filters),
    pause: (id) => ipcRenderer.invoke(IpcChannels.workflow.pause, id),
    resume: (id) => ipcRenderer.invoke(IpcChannels.workflow.resume, id),
    start: (id) => ipcRenderer.invoke(IpcChannels.workflow.start, id),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.workflow.update, id, data),
  },
  workflowRepository: {
    add: (workflowId, repositoryId, isPrimary) =>
      ipcRenderer.invoke(IpcChannels.workflowRepository.add, workflowId, repositoryId, isPrimary),
    addMultiple: (workflowId, repositoryIds, primaryRepositoryId) =>
      ipcRenderer.invoke(IpcChannels.workflowRepository.addMultiple, workflowId, repositoryIds, primaryRepositoryId),
    list: (workflowId) => ipcRenderer.invoke(IpcChannels.workflowRepository.list, workflowId),
    remove: (workflowId, repositoryId) =>
      ipcRenderer.invoke(IpcChannels.workflowRepository.remove, workflowId, repositoryId),
    setPrimary: (workflowId, repositoryId) =>
      ipcRenderer.invoke(IpcChannels.workflowRepository.setPrimary, workflowId, repositoryId),
  },
  worktree: {
    get: (id) => ipcRenderer.invoke(IpcChannels.worktree.get, id),
    getByWorkflowId: (workflowId) => ipcRenderer.invoke(IpcChannels.worktree.getByWorkflowId, workflowId),
    list: (options) => ipcRenderer.invoke(IpcChannels.worktree.list, options),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
