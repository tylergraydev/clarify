# Step 2: File Discovery

**Started**: 2026-01-28T00:02:00Z
**Completed**: 2026-01-28T00:03:00Z
**Duration**: ~60s
**Status**: Completed

## Refined Request Input

Implement the IPC (Inter-Process Communication) handlers that establish bidirectional communication between the Electron main process and the Next.js renderer process...

## Discovery Summary

- **Directories explored**: 8
- **Candidate files examined**: 45
- **Highly relevant files found**: 28
- **Supporting files identified**: 12
- **Total files discovered**: 34

## Files by Category

| Category | Count |
|----------|-------|
| Critical | 8 |
| High | 12 |
| Medium | 10 |
| Low | 4 |

---

## Critical Priority (Core Implementation)

| # | File Path | Action | Description |
|---|-----------|--------|-------------|
| 1 | `electron/main.ts` | modify | Add IPC handler registrations for all workflow, step, agent, template, project, and audit operations |
| 2 | `electron/preload.ts` | modify | Extend ElectronAPI interface with all new IPC channel type signatures |
| 3 | `types/electron.d.ts` | modify | Update type definitions to match new preload API |
| 4 | `hooks/use-electron.ts` | modify | Add domain-specific hooks for workflows, agents, templates, projects, audit |
| 5 | `electron/ipc/channels.ts` | create | Define IPC channel constants for all domains |
| 6 | `electron/ipc/index.ts` | create | Central handler registration and channel re-exports |
| 7 | `electron/ipc/workflows.handlers.ts` | create | Workflow management IPC handlers (create, start, pause, resume, cancel, get, list) |
| 8 | `electron/ipc/steps.handlers.ts` | create | Step management IPC handlers (edit, regenerate) |

## High Priority (Supporting Implementation)

| # | File Path | Action | Description |
|---|-----------|--------|-------------|
| 1 | `electron/ipc/agents.handlers.ts` | create | Agent management IPC handlers (list, get, update, reset) |
| 2 | `electron/ipc/templates.handlers.ts` | create | Template management IPC handlers (list, create) |
| 3 | `electron/ipc/projects.handlers.ts` | create | Project management IPC handlers (create, addRepo) |
| 4 | `electron/ipc/discovery.handlers.ts` | create | File discovery update IPC handlers |
| 5 | `electron/ipc/audit.handlers.ts` | create | Audit export IPC handler (md/json format) |
| 6 | `lib/queries/index.ts` | create | Merged query keys and type exports |
| 7 | `lib/queries/workflows.ts` | create | Workflow query key definitions |
| 8 | `lib/queries/agents.ts` | create | Agent query key definitions |
| 9 | `lib/queries/templates.ts` | create | Template query key definitions |
| 10 | `lib/queries/projects.ts` | create | Project query key definitions |
| 11 | `hooks/queries/use-workflows.ts` | create | TanStack Query hooks for workflow operations |
| 12 | `hooks/queries/use-agents.ts` | create | TanStack Query hooks for agent operations |

## Medium Priority (Integration/Reference)

| # | File Path | Action | Description |
|---|-----------|--------|-------------|
| 1 | `db/repositories/workflows.repository.ts` | reference | Existing workflow repository with CRUD operations |
| 2 | `db/repositories/workflow-steps.repository.ts` | reference | Existing workflow steps repository |
| 3 | `db/repositories/agents.repository.ts` | reference | Existing agents repository |
| 4 | `db/repositories/templates.repository.ts` | reference | Existing templates repository |
| 5 | `db/repositories/projects.repository.ts` | reference | Existing projects repository |
| 6 | `db/repositories/repositories.repository.ts` | reference | Existing git repositories repository |
| 7 | `db/repositories/discovered-files.repository.ts` | reference | Existing discovered files repository |
| 8 | `db/repositories/audit-logs.repository.ts` | reference | Existing audit logs repository |
| 9 | `db/index.ts` | reference | Database initialization module |
| 10 | `db/repositories/index.ts` | reference | Repository factory exports |

## Low Priority (May Need Minor Updates)

| # | File Path | Action | Description |
|---|-----------|--------|-------------|
| 1 | `components/providers/query-provider.tsx` | reference | QueryClient configuration |
| 2 | `db/schema/workflows.schema.ts` | reference | Workflow schema and types |
| 3 | `db/schema/agents.schema.ts` | reference | Agent schema and types |
| 4 | `db/schema/index.ts` | reference | Schema type exports |

## Pattern References

Files to use as implementation patterns:

| File | Pattern Demonstrated |
|------|---------------------|
| `.claude/skills/ipc-handler-conventions/references/IPC-Handler-Conventions.md` | IPC handler architecture, channel naming, handler structure, preload API patterns |
| `.claude/skills/tanstack-query-conventions/references/TanStack-Query-Conventions.md` | Query key factory usage, hook patterns, cache invalidation |
| `docs/clarify-design-document.md` | Section 6.4 IPC channel specifications |

## Architecture Insights

- **IPC Pattern**: invoke/handle pattern with `ipcMain.handle()` and `ipcRenderer.invoke()`
- **Repository Pattern**: All database access goes through typed repository interfaces created with factory functions
- **Channel Naming**: Uses `{domain}:{action}` or `{domain}:{subdomain}:{action}` pattern (e.g., `workflow:create`, `db:projects:getAll`)
- **Handler Organization**: Handlers organized into domain-specific files under `electron/ipc/`
- **Type Safety**: ElectronAPI interface in preload.ts must match types/electron.d.ts for full type safety
- **Query Hooks**: Use `@lukemorales/query-key-factory` for query key management with `enabled: isElectron` check

## Validation

- **Minimum files requirement**: 34 files discovered (exceeds 8 minimum)
- **File path validation**: All paths verified to exist or marked as create
- **Comprehensive coverage**: All architectural layers covered (handlers, preload, types, hooks, queries)
- **Pattern recognition**: Identified existing patterns in IPC-Handler-Conventions.md and TanStack-Query-Conventions.md
