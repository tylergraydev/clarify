/**
 * IPC Channel Constants
 *
 * Centralized channel definitions for all Electron IPC communication.
 * Follow the naming pattern: `{domain}:{action}` or `{domain}:{subdomain}:{action}`
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
    getStatistics: "workflow:getStatistics",
    list: "workflow:list",
    listHistory: "workflow:listHistory",
    pause: "workflow:pause",
    resume: "workflow:resume",
    start: "workflow:start",
  },
} as const;

/**
 * Type for extracting channel string values for type-safe usage
 */
export type IpcChannel = typeof IpcChannels;
