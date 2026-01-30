import { contextBridge, ipcRenderer } from "electron";

import type {
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
} from "../db/schema";

/**
 * IPC Channel Constants (Duplicate - Required for Preload)
 *
 * This is a duplicate of electron/ipc/channels.ts. Due to Electron's
 * sandboxed preload restrictions, we cannot import local modules.
 *
 * IMPORTANT: Keep this synchronized with the source in electron/ipc/channels.ts.
 * When adding or modifying channels, update BOTH files.
 */
const IpcChannels = {
  agent: {
    activate: "agent:activate",
    create: "agent:create",
    deactivate: "agent:deactivate",
    delete: "agent:delete",
    get: "agent:get",
    list: "agent:list",
    reset: "agent:reset",
    update: "agent:update",
  },
  agentSkill: {
    create: "agentSkill:create",
    delete: "agentSkill:delete",
    list: "agentSkill:list",
    setRequired: "agentSkill:setRequired",
    update: "agentSkill:update",
  },
  agentTool: {
    allow: "agentTool:allow",
    create: "agentTool:create",
    delete: "agentTool:delete",
    disallow: "agentTool:disallow",
    list: "agentTool:list",
    update: "agentTool:update",
  },
  app: {
    getPath: "app:getPath",
    getVersion: "app:getVersion",
  },
  audit: {
    create: "audit:create",
    export: "audit:export",
    findByStep: "audit:findByStep",
    findByWorkflow: "audit:findByWorkflow",
    list: "audit:list",
  },
  dialog: {
    openDirectory: "dialog:openDirectory",
    openFile: "dialog:openFile",
    saveFile: "dialog:saveFile",
  },
  discovery: {
    add: "discovery:add",
    exclude: "discovery:exclude",
    include: "discovery:include",
    list: "discovery:list",
    update: "discovery:update",
    updatePriority: "discovery:updatePriority",
  },
  fs: {
    exists: "fs:exists",
    readDirectory: "fs:readDirectory",
    readFile: "fs:readFile",
    stat: "fs:stat",
    writeFile: "fs:writeFile",
  },
  project: {
    addRepo: "project:addRepo",
    create: "project:create",
    delete: "project:delete",
    get: "project:get",
    list: "project:list",
    update: "project:update",
  },
  repository: {
    clearDefault: "repository:clearDefault",
    create: "repository:create",
    delete: "repository:delete",
    findByPath: "repository:findByPath",
    findByProject: "repository:findByProject",
    get: "repository:get",
    list: "repository:list",
    setDefault: "repository:setDefault",
    update: "repository:update",
  },
  settings: {
    bulkUpdate: "settings:bulkUpdate",
    get: "settings:get",
    getByCategory: "settings:getByCategory",
    getByKey: "settings:getByKey",
    list: "settings:list",
    resetToDefault: "settings:resetToDefault",
    setValue: "settings:setValue",
  },
  step: {
    complete: "step:complete",
    edit: "step:edit",
    fail: "step:fail",
    get: "step:get",
    list: "step:list",
    regenerate: "step:regenerate",
    skip: "step:skip",
  },
  store: {
    delete: "store:delete",
    get: "store:get",
    set: "store:set",
  },
  template: {
    activate: "template:activate",
    create: "template:create",
    delete: "template:delete",
    get: "template:get",
    getPlaceholders: "template:getPlaceholders",
    incrementUsage: "template:incrementUsage",
    list: "template:list",
    update: "template:update",
    updatePlaceholders: "template:updatePlaceholders",
  },
  workflow: {
    cancel: "workflow:cancel",
    create: "workflow:create",
    delete: "workflow:delete",
    get: "workflow:get",
    getStatistics: "workflow:getStatistics",
    list: "workflow:list",
    listHistory: "workflow:listHistory",
    pause: "workflow:pause",
    resume: "workflow:resume",
    start: "workflow:start",
  },
  workflowRepository: {
    add: "workflowRepository:add",
    addMultiple: "workflowRepository:addMultiple",
    list: "workflowRepository:list",
    remove: "workflowRepository:remove",
    setPrimary: "workflowRepository:setPrimary",
  },
  worktree: {
    get: "worktree:get",
    getByWorkflowId: "worktree:getByWorkflowId",
    list: "worktree:list",
  },
} as const;

/**
 * Filters for querying agents
 */
export interface AgentListFilters {
  includeDeactivated?: boolean;
  projectId?: number;
  type?: "planning" | "review" | "specialist";
}

/**
 * Result type for agent operations that can fail due to validation or protection rules
 */
export interface AgentOperationResult {
  agent?: Agent;
  error?: string;
  success: boolean;
}

export interface ElectronAPI {
  agent: {
    activate(id: number): Promise<Agent | undefined>;
    create(data: NewAgent): Promise<AgentOperationResult>;
    deactivate(id: number): Promise<Agent | undefined>;
    delete(id: number): Promise<AgentOperationResult>;
    get(id: number): Promise<Agent | undefined>;
    list(filters?: AgentListFilters): Promise<Array<Agent>>;
    reset(id: number): Promise<Agent | undefined>;
    update(id: number, data: Partial<NewAgent>): Promise<AgentOperationResult>;
  };
  agentSkill: {
    create(data: NewAgentSkill): Promise<AgentSkill>;
    delete(id: number): Promise<void>;
    list(agentId: number): Promise<Array<AgentSkill>>;
    setRequired(id: number, required: boolean): Promise<AgentSkill | undefined>;
    update(
      id: number,
      data: Partial<NewAgentSkill>
    ): Promise<AgentSkill | undefined>;
  };
  agentTool: {
    allow(id: number): Promise<AgentTool | undefined>;
    create(data: NewAgentTool): Promise<AgentTool>;
    delete(id: number): Promise<void>;
    disallow(id: number): Promise<AgentTool | undefined>;
    list(agentId: number): Promise<Array<AgentTool>>;
    update(
      id: number,
      data: Partial<NewAgentTool>
    ): Promise<AgentTool | undefined>;
  };
  app: {
    getPath(
      name:
        | "appData"
        | "desktop"
        | "documents"
        | "downloads"
        | "home"
        | "temp"
        | "userData"
    ): Promise<string>;
    getVersion(): Promise<string>;
  };
  audit: {
    create(data: NewAuditLog): Promise<AuditLog>;
    export(
      workflowId: number
    ): Promise<{ content?: string; error?: string; success: boolean }>;
    findByStep(stepId: number): Promise<Array<AuditLog>>;
    findByWorkflow(workflowId: number): Promise<Array<AuditLog>>;
    list(): Promise<Array<AuditLog>>;
  };
  dialog: {
    openDirectory(): Promise<null | string>;
    openFile(
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
    saveFile(
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
  };
  discovery: {
    add(stepId: number, data: NewDiscoveredFile): Promise<DiscoveredFile>;
    exclude(id: number): Promise<DiscoveredFile | undefined>;
    include(id: number): Promise<DiscoveredFile | undefined>;
    list(stepId: number): Promise<Array<DiscoveredFile>>;
    update(
      id: number,
      data: Partial<NewDiscoveredFile>
    ): Promise<DiscoveredFile | undefined>;
    updatePriority(
      id: number,
      priority: string
    ): Promise<DiscoveredFile | undefined>;
  };
  fs: {
    exists(path: string): Promise<boolean>;
    readDirectory(path: string): Promise<{
      entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
      error?: string;
      success: boolean;
    }>;
    readFile(
      path: string
    ): Promise<{ content?: string; error?: string; success: boolean }>;
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
    writeFile(
      path: string,
      content: string
    ): Promise<{ error?: string; success: boolean }>;
  };
  project: {
    addRepo(projectId: number, repoData: NewRepository): Promise<Repository>;
    create(data: NewProject): Promise<Project>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<Project | undefined>;
    list(): Promise<Array<Project>>;
    update(id: number, data: Partial<NewProject>): Promise<Project | undefined>;
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
    update(
      id: number,
      data: Partial<NewRepository>
    ): Promise<Repository | undefined>;
  };
  settings: {
    bulkUpdate(
      updates: Array<{ key: string; value: string }>
    ): Promise<Array<Setting>>;
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
    update(
      id: number,
      data: Partial<NewTemplate>
    ): Promise<Template | undefined>;
    updatePlaceholders(
      templateId: number,
      placeholders: Array<Omit<NewTemplatePlaceholder, "templateId">>
    ): Promise<Array<TemplatePlaceholder>>;
  };
  workflow: {
    cancel(id: number): Promise<undefined | Workflow>;
    create(data: NewWorkflow): Promise<Workflow>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<undefined | Workflow>;
    getStatistics(filters?: {
      dateFrom?: string;
      dateTo?: string;
      projectId?: number;
    }): Promise<WorkflowStatistics>;
    list(): Promise<Array<Workflow>>;
    listHistory(
      filters?: WorkflowHistoryFilters
    ): Promise<WorkflowHistoryResult>;
    pause(id: number): Promise<undefined | Workflow>;
    resume(id: number): Promise<undefined | Workflow>;
    start(id: number): Promise<undefined | Workflow>;
  };
  workflowRepository: {
    add(
      workflowId: number,
      repositoryId: number,
      isPrimary?: boolean
    ): Promise<WorkflowRepository>;
    addMultiple(
      workflowId: number,
      repositoryIds: Array<number>,
      primaryRepositoryId?: number
    ): Promise<Array<WorkflowRepository>>;
    list(workflowId: number): Promise<Array<WorkflowRepository>>;
    remove(workflowId: number, repositoryId: number): Promise<boolean>;
    setPrimary(
      workflowId: number,
      repositoryId: number
    ): Promise<undefined | WorkflowRepository>;
  };
  worktree: {
    get(id: number): Promise<undefined | Worktree>;
    getByWorkflowId(workflowId: number): Promise<undefined | Worktree>;
    list(options?: {
      repositoryId?: number;
      status?: string;
    }): Promise<Array<Worktree>>;
  };
}

/**
 * Filters for querying templates
 */
export interface TemplateListFilters {
  category?: "backend" | "data" | "electron" | "security" | "ui";
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
 * Terminal workflow statuses that indicate a workflow has finished execution
 */
type TerminalStatus = "cancelled" | "completed" | "failed";

/**
 * Valid sort fields for workflow history queries
 */
type WorkflowHistorySortField =
  | "completedAt"
  | "createdAt"
  | "durationMs"
  | "featureName"
  | "status";

/**
 * Sort order for workflow history queries
 */
type WorkflowHistorySortOrder = "asc" | "desc";

const electronAPI: ElectronAPI = {
  agent: {
    activate: (id) => ipcRenderer.invoke(IpcChannels.agent.activate, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.agent.create, data),
    deactivate: (id) => ipcRenderer.invoke(IpcChannels.agent.deactivate, id),
    delete: (id) => ipcRenderer.invoke(IpcChannels.agent.delete, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.agent.get, id),
    list: (filters) => ipcRenderer.invoke(IpcChannels.agent.list, filters),
    reset: (id) => ipcRenderer.invoke(IpcChannels.agent.reset, id),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.agent.update, id, data),
  },
  agentSkill: {
    create: (data) => ipcRenderer.invoke(IpcChannels.agentSkill.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.agentSkill.delete, id),
    list: (agentId) => ipcRenderer.invoke(IpcChannels.agentSkill.list, agentId),
    setRequired: (id, required) =>
      ipcRenderer.invoke(IpcChannels.agentSkill.setRequired, id, required),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.agentSkill.update, id, data),
  },
  agentTool: {
    allow: (id) => ipcRenderer.invoke(IpcChannels.agentTool.allow, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.agentTool.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.agentTool.delete, id),
    disallow: (id) => ipcRenderer.invoke(IpcChannels.agentTool.disallow, id),
    list: (agentId) => ipcRenderer.invoke(IpcChannels.agentTool.list, agentId),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.agentTool.update, id, data),
  },
  app: {
    getPath: (name) => ipcRenderer.invoke(IpcChannels.app.getPath, name),
    getVersion: () => ipcRenderer.invoke(IpcChannels.app.getVersion),
  },
  audit: {
    create: (data) => ipcRenderer.invoke(IpcChannels.audit.create, data),
    export: (workflowId) =>
      ipcRenderer.invoke(IpcChannels.audit.export, workflowId),
    findByStep: (stepId) =>
      ipcRenderer.invoke(IpcChannels.audit.findByStep, stepId),
    findByWorkflow: (workflowId) =>
      ipcRenderer.invoke(IpcChannels.audit.findByWorkflow, workflowId),
    list: () => ipcRenderer.invoke(IpcChannels.audit.list),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke(IpcChannels.dialog.openDirectory),
    openFile: (filters) =>
      ipcRenderer.invoke(IpcChannels.dialog.openFile, filters),
    saveFile: (defaultPath, filters) =>
      ipcRenderer.invoke(IpcChannels.dialog.saveFile, defaultPath, filters),
  },
  discovery: {
    add: (stepId, data) =>
      ipcRenderer.invoke(IpcChannels.discovery.add, stepId, data),
    exclude: (id) => ipcRenderer.invoke(IpcChannels.discovery.exclude, id),
    include: (id) => ipcRenderer.invoke(IpcChannels.discovery.include, id),
    list: (stepId) => ipcRenderer.invoke(IpcChannels.discovery.list, stepId),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.discovery.update, id, data),
    updatePriority: (id, priority) =>
      ipcRenderer.invoke(IpcChannels.discovery.updatePriority, id, priority),
  },
  fs: {
    exists: (path) => ipcRenderer.invoke(IpcChannels.fs.exists, path),
    readDirectory: (path) =>
      ipcRenderer.invoke(IpcChannels.fs.readDirectory, path),
    readFile: (path) => ipcRenderer.invoke(IpcChannels.fs.readFile, path),
    stat: (path) => ipcRenderer.invoke(IpcChannels.fs.stat, path),
    writeFile: (path, content) =>
      ipcRenderer.invoke(IpcChannels.fs.writeFile, path, content),
  },
  project: {
    addRepo: (projectId, repoData) =>
      ipcRenderer.invoke(IpcChannels.project.addRepo, projectId, repoData),
    create: (data) => ipcRenderer.invoke(IpcChannels.project.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.project.delete, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.project.get, id),
    list: () => ipcRenderer.invoke(IpcChannels.project.list),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.project.update, id, data),
  },
  repository: {
    clearDefault: (id) =>
      ipcRenderer.invoke(IpcChannels.repository.clearDefault, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.repository.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.repository.delete, id),
    findByPath: (path) =>
      ipcRenderer.invoke(IpcChannels.repository.findByPath, path),
    findByProject: (projectId) =>
      ipcRenderer.invoke(IpcChannels.repository.findByProject, projectId),
    get: (id) => ipcRenderer.invoke(IpcChannels.repository.get, id),
    list: () => ipcRenderer.invoke(IpcChannels.repository.list),
    setDefault: (id) =>
      ipcRenderer.invoke(IpcChannels.repository.setDefault, id),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.repository.update, id, data),
  },
  settings: {
    bulkUpdate: (updates) =>
      ipcRenderer.invoke(IpcChannels.settings.bulkUpdate, updates),
    get: (id) => ipcRenderer.invoke(IpcChannels.settings.get, id),
    getByCategory: (category) =>
      ipcRenderer.invoke(IpcChannels.settings.getByCategory, category),
    getByKey: (key) => ipcRenderer.invoke(IpcChannels.settings.getByKey, key),
    list: () => ipcRenderer.invoke(IpcChannels.settings.list),
    resetToDefault: (key) =>
      ipcRenderer.invoke(IpcChannels.settings.resetToDefault, key),
    setValue: (key, value) =>
      ipcRenderer.invoke(IpcChannels.settings.setValue, key, value),
  },
  step: {
    complete: (id, output, durationMs) =>
      ipcRenderer.invoke(IpcChannels.step.complete, id, output, durationMs),
    edit: (id, editedOutput) =>
      ipcRenderer.invoke(IpcChannels.step.edit, id, editedOutput),
    fail: (id, errorMessage) =>
      ipcRenderer.invoke(IpcChannels.step.fail, id, errorMessage),
    get: (id) => ipcRenderer.invoke(IpcChannels.step.get, id),
    list: (workflowId) => ipcRenderer.invoke(IpcChannels.step.list, workflowId),
    regenerate: (id) => ipcRenderer.invoke(IpcChannels.step.regenerate, id),
    skip: (id) => ipcRenderer.invoke(IpcChannels.step.skip, id),
  },
  store: {
    delete: (key) => ipcRenderer.invoke(IpcChannels.store.delete, key),
    get: <T>(key: string) =>
      ipcRenderer.invoke(IpcChannels.store.get, key) as Promise<T | undefined>,
    set: (key, value) => ipcRenderer.invoke(IpcChannels.store.set, key, value),
  },
  template: {
    activate: (id) => ipcRenderer.invoke(IpcChannels.template.activate, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.template.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.template.delete, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.template.get, id),
    getPlaceholders: (templateId) =>
      ipcRenderer.invoke(IpcChannels.template.getPlaceholders, templateId),
    incrementUsage: (id) =>
      ipcRenderer.invoke(IpcChannels.template.incrementUsage, id),
    list: (filters) => ipcRenderer.invoke(IpcChannels.template.list, filters),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.template.update, id, data),
    updatePlaceholders: (templateId, placeholders) =>
      ipcRenderer.invoke(
        IpcChannels.template.updatePlaceholders,
        templateId,
        placeholders
      ),
  },
  workflow: {
    cancel: (id) => ipcRenderer.invoke(IpcChannels.workflow.cancel, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.workflow.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.workflow.delete, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.workflow.get, id),
    getStatistics: (filters) =>
      ipcRenderer.invoke(IpcChannels.workflow.getStatistics, filters),
    list: () => ipcRenderer.invoke(IpcChannels.workflow.list),
    listHistory: (filters) =>
      ipcRenderer.invoke(IpcChannels.workflow.listHistory, filters),
    pause: (id) => ipcRenderer.invoke(IpcChannels.workflow.pause, id),
    resume: (id) => ipcRenderer.invoke(IpcChannels.workflow.resume, id),
    start: (id) => ipcRenderer.invoke(IpcChannels.workflow.start, id),
  },
  workflowRepository: {
    add: (workflowId, repositoryId, isPrimary) =>
      ipcRenderer.invoke(
        IpcChannels.workflowRepository.add,
        workflowId,
        repositoryId,
        isPrimary
      ),
    addMultiple: (workflowId, repositoryIds, primaryRepositoryId) =>
      ipcRenderer.invoke(
        IpcChannels.workflowRepository.addMultiple,
        workflowId,
        repositoryIds,
        primaryRepositoryId
      ),
    list: (workflowId) =>
      ipcRenderer.invoke(IpcChannels.workflowRepository.list, workflowId),
    remove: (workflowId, repositoryId) =>
      ipcRenderer.invoke(
        IpcChannels.workflowRepository.remove,
        workflowId,
        repositoryId
      ),
    setPrimary: (workflowId, repositoryId) =>
      ipcRenderer.invoke(
        IpcChannels.workflowRepository.setPrimary,
        workflowId,
        repositoryId
      ),
  },
  worktree: {
    get: (id) => ipcRenderer.invoke(IpcChannels.worktree.get, id),
    getByWorkflowId: (workflowId) =>
      ipcRenderer.invoke(IpcChannels.worktree.getByWorkflowId, workflowId),
    list: (options) => ipcRenderer.invoke(IpcChannels.worktree.list, options),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
