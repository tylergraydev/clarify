/**
 * IPC Channel Constants (Source of Truth)
 *
 * Centralized channel definitions for all Electron IPC communication.
 * Follow the naming pattern: `{domain}:{action}` or `{domain}:{subdomain}:{action}`
 *
 * IMPORTANT: This constant is duplicated in electron/preload.ts because
 * sandboxed preload scripts cannot import local modules. When adding
 * or modifying channels, update BOTH files to keep them synchronized.
 *
 * Rules:
 * - Use lowercase with colons as separators
 * - Action names are camelCase
 * - Group related channels under domain objects
 * - Maintain alphabetical order within objects
 * - Export as `const` for type inference
 */
export const IpcChannels = {
  agent: {
    activate: "agent:activate",
    copyToProject: "agent:copyToProject",
    create: "agent:create",
    createOverride: "agent:createOverride",
    deactivate: "agent:deactivate",
    delete: "agent:delete",
    duplicate: "agent:duplicate",
    export: "agent:export",
    exportBatch: "agent:exportBatch",
    get: "agent:get",
    import: "agent:import",
    list: "agent:list",
    move: "agent:move",
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
 * Type for extracting channel string values for type-safe usage
 */
export type IpcChannel = typeof IpcChannels;
