---
name: ipc-handler-conventions
description: Enforces project IPC handler conventions automatically when creating or modifying Electron IPC channels, handlers, preload scripts, or React hooks that interact with the Electron API. This skill should be used proactively whenever working with Electron IPC communication to ensure consistent patterns across the codebase.
---

# IPC Handler Conventions Enforcer

## Purpose

This skill enforces the project IPC handler conventions automatically during Electron IPC development.
It ensures consistent channel naming, handler patterns, type definitions, and React hooks for
all Electron IPC communication.

## When to Use This Skill

Use this skill proactively in the following scenarios:

- Creating new IPC channels in `electron/ipc/channels.ts`
- Creating or modifying handler files (`*.handlers.ts`)
- Updating the preload script (`electron/preload.ts`)
- Adding new methods to the `ElectronAPI` interface
- Creating or updating `useElectron` hooks
- Exposing new database entities via IPC
- Adding new native capabilities (dialogs, file system, etc.)
- Any task involving `electron/ipc/` directory changes

## How to Use This Skill

### 1. Load Conventions Reference

Before creating or modifying any IPC handler code, load the complete conventions document:

```
Read references/IPC-Handler-Conventions.md
```

This reference contains the authoritative standards including:

- Channel naming conventions
- Handler file organization
- Type definitions and interfaces
- Preload script patterns
- React hook patterns
- Error handling strategies
- Security considerations

### 2. Apply Conventions During Development

When writing IPC code, ensure strict adherence to all conventions:

**Channel Definition**:

- Channels defined in `electron/ipc/channels.ts` as nested const object
- Naming pattern: `{domain}:{action}` or `{domain}:{subdomain}:{action}`
- Group related channels under domain objects: `app`, `db`, `dialog`, `fs`, `store`
- Export as `IpcChannels` const

**Handler Files**:

- One file per domain: `{domain}.handlers.ts`
- Export single registration function: `registerXxxHandlers(dependencies)`
- Use `ipcMain.handle()` exclusively (not `send`/`on`)
- Type event as `IpcMainInvokeEvent`, prefix unused with `_`
- Import from local `channels` and type files

**Handler Registration**:

- Central registration in `electron/ipc/index.ts`
- Function: `registerAllHandlers(db, getMainWindow)`
- Instantiate repositories before passing to handlers
- Export `IpcChannels` for external use

**Preload Script**:

- Define `ElectronAPI` interface mirroring channel structure
- Use `ipcRenderer.invoke()` for all calls
- Expose via `contextBridge.exposeInMainWorld('electronAPI', electronAPI)`

**Type Definitions**:

- Types in `types/electron.d.ts`
- Re-export schema types from `db/types` for renderer
- Augment global `Window` interface

**React Hooks**:

- Domain-specific hooks in `hooks/useElectron.ts`
- Pattern: `useElectronXxx()` returning methods and `isElectron` flag
- Use `useCallback` for functions, `useMemo` for objects
- Check `api` availability before calls

### 3. Automatic Convention Enforcement

After generating or modifying IPC code, immediately perform automatic validation and correction:

1. **Scan for violations**: Review the generated code against all conventions from the reference document
2. **Identify issues**: Create a mental checklist of any violations found:
   - Channel naming format
   - Handler file structure and exports
   - Event parameter typing
   - Missing preload API methods
   - Missing type definitions
   - Hook patterns and dependencies
   - Error handling patterns
   - Security validations

3. **Fix automatically**: Apply corrections immediately without asking for permission:
   - Fix channel naming to follow pattern
   - Update handler registration functions
   - Add missing type annotations
   - Update ElectronAPI interface
   - Add missing React hooks
   - Implement proper error handling
   - Add path validation for fs operations

4. **Verify completeness**: Ensure all four layers are updated:
   - `channels.ts` (channel definitions)
   - `*.handlers.ts` (handler implementation)
   - `preload.ts` (API exposure)
   - `types/electron.d.ts` (type definitions)
   - `hooks/useElectron.ts` (React hooks) - if applicable

### 4. Reporting

After automatically fixing violations, provide a brief summary:

```
IPC conventions enforced:
  - Added channel db:features:getByProjectId to channels.ts
  - Created features.handlers.ts with registerFeaturesHandlers
  - Updated ElectronAPI interface with features methods
  - Added useElectronFeatures hook
  - Registered handlers in index.ts
```

**Do not ask for permission to apply fixes** - the skill's purpose is automatic enforcement.

## Convention Categories

The complete conventions are detailed in `references/IPC-Handler-Conventions.md`. Key categories include:

1. **Channel Definitions** - Naming patterns, structure, domain groupings
2. **Handler Implementation** - File organization, registration functions, error handling
3. **Preload Script** - API interface, context bridge, type safety
4. **Type Definitions** - ElectronAPI interface, global Window augmentation
5. **React Hooks** - Hook patterns, dependencies, availability checks
6. **Database Entity Handlers** - Repository pattern integration
7. **Security** - Path validation, context isolation, limited API surface

## Important Notes

- **Automatic enforcement**: Apply fixes immediately without requesting permission
- **No compromises**: All conventions must be followed strictly
- **Reference first**: Always load the conventions reference before working with IPC code
- **Complete validation**: Check all aspects of the conventions, not just obvious violations
- **Proactive application**: Use this skill automatically when IPC work is detected, even if user doesn't mention conventions
- **Four-layer consistency**: Ensure channels, handlers, preload, and types are all synchronized

## Workflow Summary

```
1. Detect IPC work (create/modify channels, handlers, preload, or hooks)
2. Load references/IPC-Handler-Conventions.md
3. Generate or modify IPC code following all conventions
4. Scan generated code for any violations
5. Automatically fix all violations found
6. Ensure all four layers are synchronized
7. Present corrected code to user with brief summary of fixes applied
```

This workflow ensures every IPC handler in the project maintains consistent, type-safe patterns that follow all established conventions.
