import { contextBridge, ipcRenderer } from "electron";

import type {
  Agent,
  AuditLog,
  DiscoveredFile,
  NewAgent,
  NewAuditLog,
  NewDiscoveredFile,
  NewProject,
  NewRepository,
  NewTemplate,
  NewWorkflow,
  Project,
  Repository,
  Template,
  Workflow,
  WorkflowStep,
} from "../db/schema";

// IPC Channel constants inlined here because sandboxed preload scripts
// cannot use require() for local modules - only for 'electron' and built-in Node.js modules
const IpcChannels = {
  agent: {
    activate: "agent:activate",
    deactivate: "agent:deactivate",
    get: "agent:get",
    list: "agent:list",
    reset: "agent:reset",
    update: "agent:update",
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
    create: "repository:create",
    delete: "repository:delete",
    findByPath: "repository:findByPath",
    findByProject: "repository:findByProject",
    get: "repository:get",
    list: "repository:list",
    setDefault: "repository:setDefault",
    update: "repository:update",
  },
  step: {
    complete: "step:complete",
    edit: "step:edit",
    fail: "step:fail",
    get: "step:get",
    list: "step:list",
    regenerate: "step:regenerate",
  },
  store: {
    delete: "store:delete",
    get: "store:get",
    set: "store:set",
  },
  template: {
    create: "template:create",
    delete: "template:delete",
    get: "template:get",
    incrementUsage: "template:incrementUsage",
    list: "template:list",
    update: "template:update",
  },
  workflow: {
    cancel: "workflow:cancel",
    create: "workflow:create",
    get: "workflow:get",
    list: "workflow:list",
    pause: "workflow:pause",
    resume: "workflow:resume",
    start: "workflow:start",
  },
} as const;

export interface ElectronAPI {
  agent: {
    activate(id: number): Promise<Agent | undefined>;
    deactivate(id: number): Promise<Agent | undefined>;
    get(id: number): Promise<Agent | undefined>;
    list(): Promise<Array<Agent>>;
    reset(id: number): Promise<Agent | undefined>;
    update(id: number, data: Partial<NewAgent>): Promise<Agent | undefined>;
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
  step: {
    complete(id: number, output?: string): Promise<undefined | WorkflowStep>;
    edit(id: number, editedOutput: string): Promise<undefined | WorkflowStep>;
    fail(id: number, errorMessage: string): Promise<undefined | WorkflowStep>;
    get(id: number): Promise<undefined | WorkflowStep>;
    list(workflowId: number): Promise<Array<WorkflowStep>>;
    regenerate(id: number): Promise<undefined | WorkflowStep>;
  };
  store: {
    delete(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<boolean>;
  };
  template: {
    create(data: NewTemplate): Promise<Template>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<Template | undefined>;
    incrementUsage(id: number): Promise<Template | undefined>;
    list(): Promise<Array<Template>>;
    update(
      id: number,
      data: Partial<NewTemplate>
    ): Promise<Template | undefined>;
  };
  workflow: {
    cancel(id: number): Promise<undefined | Workflow>;
    create(data: NewWorkflow): Promise<Workflow>;
    get(id: number): Promise<undefined | Workflow>;
    list(): Promise<Array<Workflow>>;
    pause(id: number): Promise<undefined | Workflow>;
    resume(id: number): Promise<undefined | Workflow>;
    start(id: number): Promise<undefined | Workflow>;
  };
}

const electronAPI: ElectronAPI = {
  agent: {
    activate: (id) => ipcRenderer.invoke(IpcChannels.agent.activate, id),
    deactivate: (id) => ipcRenderer.invoke(IpcChannels.agent.deactivate, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.agent.get, id),
    list: () => ipcRenderer.invoke(IpcChannels.agent.list),
    reset: (id) => ipcRenderer.invoke(IpcChannels.agent.reset, id),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.agent.update, id, data),
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
  step: {
    complete: (id, output) =>
      ipcRenderer.invoke(IpcChannels.step.complete, id, output),
    edit: (id, editedOutput) =>
      ipcRenderer.invoke(IpcChannels.step.edit, id, editedOutput),
    fail: (id, errorMessage) =>
      ipcRenderer.invoke(IpcChannels.step.fail, id, errorMessage),
    get: (id) => ipcRenderer.invoke(IpcChannels.step.get, id),
    list: (workflowId) => ipcRenderer.invoke(IpcChannels.step.list, workflowId),
    regenerate: (id) => ipcRenderer.invoke(IpcChannels.step.regenerate, id),
  },
  store: {
    delete: (key) => ipcRenderer.invoke(IpcChannels.store.delete, key),
    get: <T>(key: string) =>
      ipcRenderer.invoke(IpcChannels.store.get, key) as Promise<T | undefined>,
    set: (key, value) => ipcRenderer.invoke(IpcChannels.store.set, key, value),
  },
  template: {
    create: (data) => ipcRenderer.invoke(IpcChannels.template.create, data),
    delete: (id) => ipcRenderer.invoke(IpcChannels.template.delete, id),
    get: (id) => ipcRenderer.invoke(IpcChannels.template.get, id),
    incrementUsage: (id) =>
      ipcRenderer.invoke(IpcChannels.template.incrementUsage, id),
    list: () => ipcRenderer.invoke(IpcChannels.template.list),
    update: (id, data) =>
      ipcRenderer.invoke(IpcChannels.template.update, id, data),
  },
  workflow: {
    cancel: (id) => ipcRenderer.invoke(IpcChannels.workflow.cancel, id),
    create: (data) => ipcRenderer.invoke(IpcChannels.workflow.create, data),
    get: (id) => ipcRenderer.invoke(IpcChannels.workflow.get, id),
    list: () => ipcRenderer.invoke(IpcChannels.workflow.list),
    pause: (id) => ipcRenderer.invoke(IpcChannels.workflow.pause, id),
    resume: (id) => ipcRenderer.invoke(IpcChannels.workflow.resume, id),
    start: (id) => ipcRenderer.invoke(IpcChannels.workflow.start, id),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
