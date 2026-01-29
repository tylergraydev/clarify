// Re-export database types for renderer use
export type {
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
} from '../db/schema';

export interface ElectronAPI {
  agent: {
    activate(id: number): Promise<import('../db/schema').Agent | undefined>;
    deactivate(id: number): Promise<import('../db/schema').Agent | undefined>;
    get(id: number): Promise<import('../db/schema').Agent | undefined>;
    list(): Promise<Array<import('../db/schema').Agent>>;
    reset(id: number): Promise<import('../db/schema').Agent | undefined>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewAgent>
    ): Promise<import('../db/schema').Agent | undefined>;
  };
  app: {
    getPath(
      name:
        | 'appData'
        | 'desktop'
        | 'documents'
        | 'downloads'
        | 'home'
        | 'temp'
        | 'userData'
    ): Promise<string>;
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
    openFile(
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
    saveFile(
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
  };
  discovery: {
    add(
      stepId: number,
      data: import('../db/schema').NewDiscoveredFile
    ): Promise<import('../db/schema').DiscoveredFile>;
    exclude(id: number): Promise<import('../db/schema').DiscoveredFile | undefined>;
    include(id: number): Promise<import('../db/schema').DiscoveredFile | undefined>;
    list(stepId: number): Promise<Array<import('../db/schema').DiscoveredFile>>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewDiscoveredFile>
    ): Promise<import('../db/schema').DiscoveredFile | undefined>;
    updatePriority(
      id: number,
      priority: string
    ): Promise<import('../db/schema').DiscoveredFile | undefined>;
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
  step: {
    complete(
      id: number,
      output?: string
    ): Promise<import('../db/schema').WorkflowStep | undefined>;
    edit(
      id: number,
      editedOutput: string
    ): Promise<import('../db/schema').WorkflowStep | undefined>;
    fail(
      id: number,
      errorMessage: string
    ): Promise<import('../db/schema').WorkflowStep | undefined>;
    get(id: number): Promise<import('../db/schema').WorkflowStep | undefined>;
    list(workflowId: number): Promise<Array<import('../db/schema').WorkflowStep>>;
    regenerate(id: number): Promise<import('../db/schema').WorkflowStep | undefined>;
  };
  store: {
    delete(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<boolean>;
  };
  template: {
    create(data: import('../db/schema').NewTemplate): Promise<import('../db/schema').Template>;
    delete(id: number): Promise<boolean>;
    get(id: number): Promise<import('../db/schema').Template | undefined>;
    incrementUsage(id: number): Promise<import('../db/schema').Template | undefined>;
    list(): Promise<Array<import('../db/schema').Template>>;
    update(
      id: number,
      data: Partial<import('../db/schema').NewTemplate>
    ): Promise<import('../db/schema').Template | undefined>;
  };
  workflow: {
    cancel(id: number): Promise<import('../db/schema').Workflow | undefined>;
    create(data: import('../db/schema').NewWorkflow): Promise<import('../db/schema').Workflow>;
    get(id: number): Promise<import('../db/schema').Workflow | undefined>;
    list(): Promise<Array<import('../db/schema').Workflow>>;
    pause(id: number): Promise<import('../db/schema').Workflow | undefined>;
    resume(id: number): Promise<import('../db/schema').Workflow | undefined>;
    start(id: number): Promise<import('../db/schema').Workflow | undefined>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
