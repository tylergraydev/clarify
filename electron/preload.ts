import { contextBridge, ipcRenderer } from 'electron';

import type {
  Agent,
  AgentActivity,
  AgentHook,
  AgentSkill,
  AgentTool,
  AuditLog,
  Conversation,
  ConversationMessage,
  DiscoveredFile,
  NewAgent,
  NewAgentHook,
  NewAgentSkill,
  NewAgentTool,
  NewAuditLog,
  NewConversation,
  NewConversationMessage,
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
import type { TerminalCreateOptions, TerminalInfo } from '../types/terminal';

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
export type ClarificationAgentConfig = import('../types/agent-config').AgentConfig;

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
export type ClarificationUsageStats = import('../types/usage-stats').UsageStats;

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
  agentActivity: {
    getByStepId(stepId: number): Promise<Array<AgentActivity>>;
    getByWorkflowId(workflowId: number): Promise<Array<AgentActivity>>;
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
  chat: {
    compactConversation(request: { conversationId: number; upToMessageId?: number }): Promise<{ compactedCount: number; summaryMessageId: number }>;
    copyMessages(fromConversationId: number, toConversationId: number, upToMessageId?: number): Promise<Array<ConversationMessage>>;
    createConversation(data: NewConversation): Promise<Conversation>;
    createMessage(data: NewConversationMessage): Promise<ConversationMessage>;
    deleteConversation(id: number): Promise<boolean>;
    exportToNewChat(request: { messageIds: Array<number>; projectId: number; sourceConversationId: number }): Promise<Conversation>;
    forkConversation(request: { forkPointMessageId: number; generateSummary?: boolean; sourceConversationId: number }): Promise<Conversation>;
    generateTitle(conversationId: number): Promise<Conversation | undefined>;
    getConversation(id: number): Promise<Conversation | undefined>;
    getTokenEstimate(conversationId: number): Promise<number>;
    listActiveMessages(conversationId: number): Promise<Array<ConversationMessage>>;
    listConversations(projectId: number): Promise<Array<Conversation>>;
    listMessages(conversationId: number): Promise<Array<ConversationMessage>>;
    restoreMessage(id: number): Promise<ConversationMessage | undefined>;
    revertToMessage(conversationId: number, messageId: number): Promise<{ affectedCount: number }>;
    searchMessages(conversationId: number, query: string): Promise<Array<ConversationMessage>>;
    softDeleteMessage(id: number): Promise<ConversationMessage | undefined>;
    updateConversation(id: number, data: Partial<NewConversation>): Promise<Conversation | undefined>;
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
  diff: {
    getBranches(repoPath: string): Promise<Array<import('../types/diff').GitBranch>>;
    getDiff(repoPath: string, options?: import('../types/diff').DiffOptions): Promise<import('../types/diff').GitDiffResult>;
    getFileContent(repoPath: string, filePath: string, ref?: string): Promise<string>;
    getFileDiff(repoPath: string, options: import('../types/diff').FileDiffOptions): Promise<import('../types/diff').GitDiffResult>;
    getLog(repoPath: string, options?: import('../types/diff').GitLogOptions): Promise<Array<import('../types/diff').GitLogEntry>>;
    getStatus(repoPath: string): Promise<import('../types/diff').GitStatusResult>;
    getWorktreeDiff(
      worktreePath: string,
      baseBranch?: string
    ): Promise<{ committed: import('../types/diff').GitDiffResult; uncommitted: import('../types/diff').GitDiffResult }>;
  };
  diffComment: {
    create(data: import('../db/schema').NewDiffCommentRow): Promise<import('../db/schema').DiffCommentRow>;
    delete(id: number): Promise<boolean>;
    list(workflowId: number): Promise<Array<import('../db/schema').DiffCommentRow>>;
    listByFile(workflowId: number, filePath: string): Promise<Array<import('../db/schema').DiffCommentRow>>;
    toggleResolved(id: number): Promise<import('../db/schema').DiffCommentRow | undefined>;
    update(id: number, data: { content: string }): Promise<import('../db/schema').DiffCommentRow | undefined>;
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
  fileViewState: {
    getStats(workflowId: number, totalFiles: number): Promise<{ totalFiles: number; viewedFiles: number }>;
    list(workflowId: number): Promise<Array<import('../db/schema').FileViewStateRow>>;
    markUnviewed(workflowId: number, filePath: string): Promise<boolean>;
    markViewed(workflowId: number, filePath: string): Promise<import('../db/schema').FileViewStateRow>;
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
  github: GitHubAPI;
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
    deleteWithCleanup(repositoryId: number): Promise<{ cancelledCount: number; deleted: boolean }>;
    detectGitInfo(path: string): Promise<{
      defaultBranch?: string;
      isGitRepo: boolean;
      name?: string;
      remoteUrl?: string;
    }>;
    findByPath(path: string): Promise<Repository | undefined>;
    findByProject(projectId: number): Promise<Array<Repository>>;
    get(id: number): Promise<Repository | undefined>;
    list(): Promise<Array<Repository>>;
    preDeleteInfo(repositoryId: number): Promise<{
      totalCount: number;
      workflows: Array<{ featureName: string; id: number; status: string }>;
    }>;
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
  terminal: {
    create(options?: TerminalCreateOptions): Promise<TerminalInfo>;
    getInfo(terminalId: string): Promise<null | TerminalInfo>;
    input(terminalId: string, data: string): void;
    kill(terminalId: string): Promise<boolean>;
    listActive(): Promise<Array<string>>;
    onData(terminalId: string, callback: (data: string) => void): () => void;
    onExit(terminalId: string, callback: (exitCode: number) => void): () => void;
    resize(terminalId: string, cols: number, rows: number): void;
  };
  workflow: {
    cancel(id: number): Promise<undefined | Workflow>;
    create(data: NewWorkflow): Promise<Workflow>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<undefined | Workflow>;
    getConcurrencyStats(): Promise<{ maxConcurrent: number; queued: number; running: number }>;
    getQueuePosition(id: number): Promise<number>;
    getStatistics(filters?: { dateFrom?: string; dateTo?: string; projectId?: number }): Promise<WorkflowStatistics>;
    list(): Promise<Array<Workflow>>;
    listHistory(filters?: WorkflowHistoryFilters): Promise<WorkflowHistoryResult>;
    pause(id: number): Promise<undefined | Workflow>;
    resume(id: number): Promise<undefined | Workflow>;
    start(id: number): Promise<undefined | Workflow>;
    update(id: number, data: UpdateWorkflowInput): Promise<Workflow>;
  };
  workflowRepository: {
    add(workflowId: number, repositoryId: number): Promise<WorkflowRepository>;
    addMultiple(workflowId: number, repositoryIds: Array<number>): Promise<Array<WorkflowRepository>>;
    list(workflowId: number): Promise<Array<WorkflowRepository>>;
    remove(workflowId: number, repositoryId: number): Promise<boolean>;
  };
  worktree: {
    cleanup(workflowId: number): Promise<boolean>;
    create(input: { featureName: string; repositoryId: number; workflowId: number }): Promise<Worktree>;
    get(id: number): Promise<undefined | Worktree>;
    getByWorkflowId(workflowId: number): Promise<undefined | Worktree>;
    list(options?: { repositoryId?: number; status?: string }): Promise<Array<Worktree>>;
  };
}

/**
 * Agent configuration for file discovery.
 */
export type FileDiscoveryAgentConfig = import('../types/agent-config').AgentConfig;

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
export type FileDiscoveryUsageStats = import('../types/usage-stats').UsageStats;

export interface GitHubAPI {
  checkAuth(): Promise<import('../types/github').GitHubAuthStatus>;
  closePr(repoPath: string, prNumber: number): Promise<import('../types/github').GitHubPullRequest>;
  convertToReady(repoPath: string, prNumber: number): Promise<import('../types/github').GitHubPullRequest>;
  createPr(repoPath: string, input: import('../types/github').CreatePrInput): Promise<import('../types/github').GitHubPullRequest>;
  createPrComment(repoPath: string, prNumber: number, input: import('../types/github').CreatePrCommentInput): Promise<import('../types/github').GitHubPrComment>;
  detectPrTemplate(repoPath: string): Promise<null | string>;
  getDeployments(repoPath: string, prNumber: number): Promise<Array<import('../types/github').GitHubDeployment>>;
  getPr(repoPath: string, prNumber: number): Promise<import('../types/github').GitHubPullRequest>;
  getPrDiff(repoPath: string, prNumber: number): Promise<string>;
  getPrDiffParsed(repoPath: string, prNumber: number): Promise<import('../types/diff').GitDiffResult>;
  getRepoInfo(repoPath: string): Promise<import('../types/github').GitHubRepoInfo>;
  listChecks(repoPath: string, ref: string): Promise<Array<import('../types/github').GitHubCheckRun>>;
  listPrComments(repoPath: string, prNumber: number): Promise<Array<import('../types/github').GitHubPrComment>>;
  listPrs(repoPath: string, filters?: import('../types/github').PrListFilters): Promise<Array<import('../types/github').GitHubPullRequest>>;
  mergePr(repoPath: string, prNumber: number, strategy: import('../types/github').MergeStrategy): Promise<import('../types/github').MergeResult>;
  pushComment(repoPath: string, prNumber: number, localCommentId: number): Promise<import('../db/schema').DiffCommentRow>;
  replyToPrComment(repoPath: string, prNumber: number, commentId: number, body: string): Promise<import('../types/github').GitHubPrComment>;
  rerunCheck(repoPath: string, runId: number): Promise<void>;
  rerunFailedChecks(repoPath: string, runId: number): Promise<void>;
  syncComments(repoPath: string, prNumber: number, workflowId: number): Promise<import('../electron/services/github-comment-sync.service').CommentSyncResult>;
  updatePr(repoPath: string, prNumber: number, input: import('../types/github').UpdatePrInput): Promise<import('../types/github').GitHubPullRequest>;
}

/**
 * Agent configuration for refinement.
 */
export type RefinementAgentConfig = import('../types/agent-config').AgentConfig;

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
export type RefinementUsageStats = import('../types/usage-stats').UsageStats;

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

// =============================================================================
// Clarification Stream Message Types
// =============================================================================

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
    | 'tool_stop'
    | 'tool_update';
  workflowId: number;
}

type ClarificationStreamPhaseChange = ClarificationStreamMessageBase & { phase: ClarificationServicePhase; type: 'phase_change' };
type ClarificationStreamTextDelta = ClarificationStreamMessageBase & { delta: string; type: 'text_delta' };
type ClarificationStreamThinkingDelta = ClarificationStreamMessageBase & { blockIndex: number; delta: string; type: 'thinking_delta' };
type ClarificationStreamThinkingStart = ClarificationStreamMessageBase & { blockIndex: number; type: 'thinking_start' };
type ClarificationStreamToolStart = ClarificationStreamMessageBase & { toolInput: Record<string, unknown>; toolName: string; toolUseId: string; type: 'tool_start' };
type ClarificationStreamToolStop = ClarificationStreamMessageBase & { toolUseId: string; type: 'tool_stop' };
type ClarificationStreamToolUpdate = ClarificationStreamMessageBase & { toolInput: Record<string, unknown>; toolName: string; toolUseId: string; type: 'tool_update' };

// =============================================================================
// File Discovery Stream Message Types
// =============================================================================

/** Step-specific: discovery completed. */
interface FileDiscoveryStreamComplete extends FileDiscoveryStreamMessageBase { outcome: FileDiscoveryOutcome; type: 'complete' }

/** Step-specific: error occurred. */
interface FileDiscoveryStreamError extends FileDiscoveryStreamMessageBase { error: string; stack?: string; type: 'error' }
type FileDiscoveryStreamExtendedThinkingHeartbeat = FileDiscoveryStreamMessageBase & { elapsedMs: number; estimatedProgress: null | number; maxThinkingTokens: number; type: 'extended_thinking_heartbeat' };
/** Step-specific: file discovered during execution. */
interface FileDiscoveryStreamFileDiscovered extends FileDiscoveryStreamMessageBase {
  file: { action: 'create' | 'delete' | 'modify' | 'reference'; filePath: string; priority: 'high' | 'low' | 'medium'; relevanceExplanation: string; role: string };
  type: 'file_discovered';
}
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

type FileDiscoveryStreamPhaseChange = FileDiscoveryStreamMessageBase & { phase: FileDiscoveryServicePhase; type: 'phase_change' };
type FileDiscoveryStreamTextDelta = FileDiscoveryStreamMessageBase & { delta: string; type: 'text_delta' };
type FileDiscoveryStreamThinkingDelta = FileDiscoveryStreamMessageBase & { blockIndex: number; delta: string; type: 'thinking_delta' };
type FileDiscoveryStreamThinkingStart = FileDiscoveryStreamMessageBase & { blockIndex: number; type: 'thinking_start' };
/** Step-specific: tool finished executing. */
interface FileDiscoveryStreamToolFinish extends FileDiscoveryStreamMessageBase { toolOutput?: unknown; toolUseId: string; type: 'tool_finish' }
type FileDiscoveryStreamToolStart = FileDiscoveryStreamMessageBase & { toolInput: Record<string, unknown>; toolName: string; toolUseId: string; type: 'tool_start' };
type FileDiscoveryStreamToolUpdate = FileDiscoveryStreamMessageBase & { toolInput: Record<string, unknown>; toolName: string; toolUseId: string; type: 'tool_update' };

// =============================================================================
// Refinement Stream Message Types
// =============================================================================

type RefinementStreamExtendedThinkingHeartbeat = RefinementStreamMessageBase & { elapsedMs: number; estimatedProgress: null | number; maxThinkingTokens: number; type: 'extended_thinking_heartbeat' };

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
type RefinementStreamPhaseChange = RefinementStreamMessageBase & { phase: RefinementServicePhase; type: 'phase_change' };
type RefinementStreamTextDelta = RefinementStreamMessageBase & { delta: string; type: 'text_delta' };
type RefinementStreamThinkingDelta = RefinementStreamMessageBase & { blockIndex: number; delta: string; type: 'thinking_delta' };
type RefinementStreamThinkingStart = RefinementStreamMessageBase & { blockIndex: number; type: 'thinking_start' };
type RefinementStreamToolStart = RefinementStreamMessageBase & { toolInput: Record<string, unknown>; toolName: string; toolUseId: string; type: 'tool_start' };
type RefinementStreamToolStop = RefinementStreamMessageBase & { toolUseId: string; type: 'tool_stop' };
type RefinementStreamToolUpdate = RefinementStreamMessageBase & { toolInput: Record<string, unknown>; toolName: string; toolUseId: string; type: 'tool_update' };

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
  agentActivity: {
    getByStepId: (stepId) => ipcRenderer.invoke(IpcChannels.agentActivity.getByStepId, stepId),
    getByWorkflowId: (workflowId) => ipcRenderer.invoke(IpcChannels.agentActivity.getByWorkflowId, workflowId),
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
  chat: {
    compactConversation: (request: { conversationId: number; upToMessageId?: number }) =>
      ipcRenderer.invoke(IpcChannels.chat.compactConversation, request) as Promise<{ compactedCount: number; summaryMessageId: number }>,
    copyMessages: (fromConversationId: number, toConversationId: number, upToMessageId?: number) =>
      ipcRenderer.invoke(IpcChannels.chat.copyMessages, fromConversationId, toConversationId, upToMessageId) as Promise<Array<ConversationMessage>>,
    createConversation: (data: NewConversation) =>
      ipcRenderer.invoke(IpcChannels.chat.createConversation, data) as Promise<Conversation>,
    createMessage: (data: NewConversationMessage) =>
      ipcRenderer.invoke(IpcChannels.chat.createMessage, data) as Promise<ConversationMessage>,
    deleteConversation: (id: number) =>
      ipcRenderer.invoke(IpcChannels.chat.deleteConversation, id) as Promise<boolean>,
    exportToNewChat: (request: { messageIds: Array<number>; projectId: number; sourceConversationId: number }) =>
      ipcRenderer.invoke(IpcChannels.chat.exportToNewChat, request) as Promise<Conversation>,
    forkConversation: (request: { forkPointMessageId: number; generateSummary?: boolean; sourceConversationId: number }) =>
      ipcRenderer.invoke(IpcChannels.chat.forkConversation, request) as Promise<Conversation>,
    generateTitle: (conversationId: number) =>
      ipcRenderer.invoke(IpcChannels.chat.generateTitle, conversationId) as Promise<Conversation | undefined>,
    getConversation: (id: number) =>
      ipcRenderer.invoke(IpcChannels.chat.getConversation, id) as Promise<Conversation | undefined>,
    getTokenEstimate: (conversationId: number) =>
      ipcRenderer.invoke(IpcChannels.chat.getTokenEstimate, conversationId) as Promise<number>,
    listActiveMessages: (conversationId: number) =>
      ipcRenderer.invoke(IpcChannels.chat.listActiveMessages, conversationId) as Promise<Array<ConversationMessage>>,
    listConversations: (projectId: number) =>
      ipcRenderer.invoke(IpcChannels.chat.listConversations, projectId) as Promise<Array<Conversation>>,
    listMessages: (conversationId: number) =>
      ipcRenderer.invoke(IpcChannels.chat.listMessages, conversationId) as Promise<Array<ConversationMessage>>,
    restoreMessage: (id: number) =>
      ipcRenderer.invoke(IpcChannels.chat.restoreMessage, id) as Promise<ConversationMessage | undefined>,
    revertToMessage: (conversationId: number, messageId: number) =>
      ipcRenderer.invoke(IpcChannels.chat.revertToMessage, conversationId, messageId) as Promise<{ affectedCount: number }>,
    searchMessages: (conversationId: number, query: string) =>
      ipcRenderer.invoke(IpcChannels.chat.searchMessages, conversationId, query) as Promise<Array<ConversationMessage>>,
    softDeleteMessage: (id: number) =>
      ipcRenderer.invoke(IpcChannels.chat.softDeleteMessage, id) as Promise<ConversationMessage | undefined>,
    updateConversation: (id: number, data: Partial<NewConversation>) =>
      ipcRenderer.invoke(IpcChannels.chat.updateConversation, id, data) as Promise<Conversation | undefined>,
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
  diff: {
    getBranches: (repoPath: string) => ipcRenderer.invoke(IpcChannels.diff.getBranches, repoPath),
    getDiff: (repoPath: string, options?: import('../types/diff').DiffOptions) =>
      ipcRenderer.invoke(IpcChannels.diff.getDiff, repoPath, options),
    getFileContent: (repoPath: string, filePath: string, ref?: string) =>
      ipcRenderer.invoke(IpcChannels.diff.getFileContent, repoPath, filePath, ref),
    getFileDiff: (repoPath: string, options: import('../types/diff').FileDiffOptions) =>
      ipcRenderer.invoke(IpcChannels.diff.getFileDiff, repoPath, options),
    getLog: (repoPath: string, options?: import('../types/diff').GitLogOptions) =>
      ipcRenderer.invoke(IpcChannels.diff.getLog, repoPath, options),
    getStatus: (repoPath: string) => ipcRenderer.invoke(IpcChannels.diff.getStatus, repoPath),
    getWorktreeDiff: (worktreePath: string, baseBranch?: string) =>
      ipcRenderer.invoke(IpcChannels.diff.getWorktreeDiff, worktreePath, baseBranch),
  },
  diffComment: {
    create: (data: import('../db/schema').NewDiffCommentRow) =>
      ipcRenderer.invoke(IpcChannels.diffComment.create, data),
    delete: (id: number) => ipcRenderer.invoke(IpcChannels.diffComment.delete, id),
    list: (workflowId: number) => ipcRenderer.invoke(IpcChannels.diffComment.list, workflowId),
    listByFile: (workflowId: number, filePath: string) =>
      ipcRenderer.invoke(IpcChannels.diffComment.listByFile, workflowId, filePath),
    toggleResolved: (id: number) => ipcRenderer.invoke(IpcChannels.diffComment.toggleResolved, id),
    update: (id: number, data: { content: string }) =>
      ipcRenderer.invoke(IpcChannels.diffComment.update, id, data),
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
  fileViewState: {
    getStats: (workflowId: number, totalFiles: number) =>
      ipcRenderer.invoke(IpcChannels.fileViewState.getStats, workflowId, totalFiles),
    list: (workflowId: number) => ipcRenderer.invoke(IpcChannels.fileViewState.list, workflowId),
    markUnviewed: (workflowId: number, filePath: string) =>
      ipcRenderer.invoke(IpcChannels.fileViewState.markUnviewed, workflowId, filePath),
    markViewed: (workflowId: number, filePath: string) =>
      ipcRenderer.invoke(IpcChannels.fileViewState.markViewed, workflowId, filePath),
  },
  fs: {
    exists: (path) => ipcRenderer.invoke(IpcChannels.fs.exists, path),
    readDirectory: (path) => ipcRenderer.invoke(IpcChannels.fs.readDirectory, path),
    readFile: (path) => ipcRenderer.invoke(IpcChannels.fs.readFile, path),
    stat: (path) => ipcRenderer.invoke(IpcChannels.fs.stat, path),
    writeFile: (path, content) => ipcRenderer.invoke(IpcChannels.fs.writeFile, path, content),
  },
  github: {
    checkAuth: () => ipcRenderer.invoke(IpcChannels.github.checkAuth),
    closePr: (repoPath: string, prNumber: number) =>
      ipcRenderer.invoke(IpcChannels.github.closePr, repoPath, prNumber),
    convertToReady: (repoPath: string, prNumber: number) =>
      ipcRenderer.invoke(IpcChannels.github.convertToReady, repoPath, prNumber),
    createPr: (repoPath: string, input: import('../types/github').CreatePrInput) =>
      ipcRenderer.invoke(IpcChannels.github.createPr, repoPath, input),
    createPrComment: (repoPath: string, prNumber: number, input: import('../types/github').CreatePrCommentInput) =>
      ipcRenderer.invoke(IpcChannels.github.createPrComment, repoPath, prNumber, input),
    detectPrTemplate: (repoPath: string) =>
      ipcRenderer.invoke(IpcChannels.github.detectPrTemplate, repoPath),
    getDeployments: (repoPath: string, prNumber: number) =>
      ipcRenderer.invoke(IpcChannels.github.getDeployments, repoPath, prNumber),
    getPr: (repoPath: string, prNumber: number) =>
      ipcRenderer.invoke(IpcChannels.github.getPr, repoPath, prNumber),
    getPrDiff: (repoPath: string, prNumber: number) =>
      ipcRenderer.invoke(IpcChannels.github.getPrDiff, repoPath, prNumber),
    getPrDiffParsed: (repoPath: string, prNumber: number) =>
      ipcRenderer.invoke(IpcChannels.github.getPrDiffParsed, repoPath, prNumber),
    getRepoInfo: (repoPath: string) =>
      ipcRenderer.invoke(IpcChannels.github.getRepoInfo, repoPath),
    listChecks: (repoPath: string, ref: string) =>
      ipcRenderer.invoke(IpcChannels.github.listChecks, repoPath, ref),
    listPrComments: (repoPath: string, prNumber: number) =>
      ipcRenderer.invoke(IpcChannels.github.listPrComments, repoPath, prNumber),
    listPrs: (repoPath: string, filters?: import('../types/github').PrListFilters) =>
      ipcRenderer.invoke(IpcChannels.github.listPrs, repoPath, filters),
    mergePr: (repoPath: string, prNumber: number, strategy: import('../types/github').MergeStrategy) =>
      ipcRenderer.invoke(IpcChannels.github.mergePr, repoPath, prNumber, strategy),
    pushComment: (repoPath: string, prNumber: number, localCommentId: number) =>
      ipcRenderer.invoke(IpcChannels.github.pushComment, repoPath, prNumber, localCommentId),
    replyToPrComment: (repoPath: string, prNumber: number, commentId: number, body: string) =>
      ipcRenderer.invoke(IpcChannels.github.replyToPrComment, repoPath, prNumber, commentId, body),
    rerunCheck: (repoPath: string, runId: number) =>
      ipcRenderer.invoke(IpcChannels.github.rerunCheck, repoPath, runId),
    rerunFailedChecks: (repoPath: string, runId: number) =>
      ipcRenderer.invoke(IpcChannels.github.rerunFailedChecks, repoPath, runId),
    syncComments: (repoPath: string, prNumber: number, workflowId: number) =>
      ipcRenderer.invoke(IpcChannels.github.syncComments, repoPath, prNumber, workflowId),
    updatePr: (repoPath: string, prNumber: number, input: import('../types/github').UpdatePrInput) =>
      ipcRenderer.invoke(IpcChannels.github.updatePr, repoPath, prNumber, input),
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
    deleteWithCleanup: (repositoryId) =>
      ipcRenderer.invoke(IpcChannels.repository.deleteWithCleanup, repositoryId),
    detectGitInfo: (path) => ipcRenderer.invoke(IpcChannels.repository.detectGitInfo, path),
    findByPath: (path) => ipcRenderer.invoke(IpcChannels.repository.findByPath, path),
    findByProject: (projectId) => ipcRenderer.invoke(IpcChannels.repository.findByProject, projectId),
    get: (id) => ipcRenderer.invoke(IpcChannels.repository.get, id),
    list: () => ipcRenderer.invoke(IpcChannels.repository.list),
    preDeleteInfo: (repositoryId) =>
      ipcRenderer.invoke(IpcChannels.repository.preDeleteInfo, repositoryId),
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
  terminal: (() => {
    // Private state - data callbacks keyed by terminalId
    const dataCallbacks = new Map<string, Set<(data: string) => void>>();
    // Private state - exit callbacks keyed by terminalId
    const exitCallbacks = new Map<string, Set<(exitCode: number) => void>>();

    // Listen for PTY data from main process
    ipcRenderer.on(IpcChannels.terminal.data, (_event, msg: { data: string; terminalId: string }) => {
      const callbacks = dataCallbacks.get(msg.terminalId);
      if (callbacks) {
        for (const cb of callbacks) {
          try {
            cb(msg.data);
          } catch (error) {
            console.error('[Terminal] Error in data callback:', error);
          }
        }
      }
    });

    // Listen for PTY exit from main process
    ipcRenderer.on(IpcChannels.terminal.exit, (_event, msg: { exitCode: number; terminalId: string }) => {
      const callbacks = exitCallbacks.get(msg.terminalId);
      if (callbacks) {
        for (const cb of callbacks) {
          try {
            cb(msg.exitCode);
          } catch (error) {
            console.error('[Terminal] Error in exit callback:', error);
          }
        }
      }
      // Cleanup callback maps on exit
      dataCallbacks.delete(msg.terminalId);
      exitCallbacks.delete(msg.terminalId);
    });

    // Listen for menu shortcuts and dispatch as CustomEvents
    ipcRenderer.on(IpcChannels.terminal.toggle, () => {
      window.dispatchEvent(new CustomEvent('terminal:toggle'));
    });

    ipcRenderer.on(IpcChannels.terminal.new, () => {
      window.dispatchEvent(new CustomEvent('terminal:new'));
    });

    return {
      create: (options?: TerminalCreateOptions) =>
        ipcRenderer.invoke(IpcChannels.terminal.create, options) as Promise<TerminalInfo>,
      getInfo: (terminalId: string) =>
        ipcRenderer.invoke(IpcChannels.terminal.getInfo, terminalId) as Promise<null | TerminalInfo>,
      input: (terminalId: string, data: string) => {
        ipcRenderer.send(IpcChannels.terminal.input, terminalId, data);
      },
      kill: (terminalId: string) =>
        ipcRenderer.invoke(IpcChannels.terminal.kill, terminalId) as Promise<boolean>,
      listActive: () =>
        ipcRenderer.invoke(IpcChannels.terminal.listActive) as Promise<Array<string>>,
      onData: (terminalId: string, callback: (data: string) => void) => {
        if (!dataCallbacks.has(terminalId)) {
          dataCallbacks.set(terminalId, new Set());
        }
        dataCallbacks.get(terminalId)!.add(callback);
        return () => {
          const callbacks = dataCallbacks.get(terminalId);
          if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
              dataCallbacks.delete(terminalId);
            }
          }
        };
      },
      onExit: (terminalId: string, callback: (exitCode: number) => void) => {
        if (!exitCallbacks.has(terminalId)) {
          exitCallbacks.set(terminalId, new Set());
        }
        exitCallbacks.get(terminalId)!.add(callback);
        return () => {
          const callbacks = exitCallbacks.get(terminalId);
          if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
              exitCallbacks.delete(terminalId);
            }
          }
        };
      },
      resize: (terminalId: string, cols: number, rows: number) => {
        ipcRenderer.send(IpcChannels.terminal.resize, terminalId, cols, rows);
      },
    };
  })(),
  workflow: {
    cancel: (id) => ipcRenderer.invoke(IpcChannels.workflow.cancel, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.workflow.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.workflow.delete, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.workflow.get, id),
    getConcurrencyStats: () => ipcRenderer.invoke(IpcChannels.workflow.getConcurrencyStats),
    getQueuePosition: (id) => ipcRenderer.invoke(IpcChannels.workflow.getQueuePosition, id),
    getStatistics: (filters) => ipcRenderer.invoke(IpcChannels.workflow.getStatistics, filters),
    list: () => ipcRenderer.invoke(IpcChannels.workflow.list),
    listHistory: (filters) => ipcRenderer.invoke(IpcChannels.workflow.listHistory, filters),
    pause: (id) => ipcRenderer.invoke(IpcChannels.workflow.pause, id),
    resume: (id) => ipcRenderer.invoke(IpcChannels.workflow.resume, id),
    start: (id) => ipcRenderer.invoke(IpcChannels.workflow.start, id),
    update: (id, data) => ipcRenderer.invoke(IpcChannels.workflow.update, id, data),
  },
  workflowRepository: {
    add: (workflowId, repositoryId) =>
      ipcRenderer.invoke(IpcChannels.workflowRepository.add, workflowId, repositoryId),
    addMultiple: (workflowId, repositoryIds) =>
      ipcRenderer.invoke(IpcChannels.workflowRepository.addMultiple, workflowId, repositoryIds),
    list: (workflowId) => ipcRenderer.invoke(IpcChannels.workflowRepository.list, workflowId),
    remove: (workflowId, repositoryId) =>
      ipcRenderer.invoke(IpcChannels.workflowRepository.remove, workflowId, repositoryId),
  },
  worktree: {
    cleanup: (workflowId) => ipcRenderer.invoke(IpcChannels.worktree.cleanup, workflowId),
    create: (input) => ipcRenderer.invoke(IpcChannels.worktree.create, input),
    get: (id) => ipcRenderer.invoke(IpcChannels.worktree.get, id),
    getByWorkflowId: (workflowId) => ipcRenderer.invoke(IpcChannels.worktree.getByWorkflowId, workflowId),
    list: (options) => ipcRenderer.invoke(IpcChannels.worktree.list, options),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
