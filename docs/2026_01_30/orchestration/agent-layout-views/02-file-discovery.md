# Step 2: AI-Powered File Discovery

**Status**: Completed
**Timestamp**: 2026-01-30

## Input

Refined feature request from Step 1.

## Discovery Results

### Critical Priority (Must Be Modified)

| File | Purpose | Modification Needed |
|------|---------|---------------------|
| `app/(app)/agents/page.tsx` | Main agents page component | Add layout toggle control in header |
| `components/agents/global-agents-tab-content.tsx` | Global agents tab | Modify to support layout switching |
| `components/agents/project-agents-tab-content.tsx` | Project agents tab | Modify to support layout switching |
| `components/agents/agent-card.tsx` | Current card component | Reference for data interface (no changes) |

### High Priority (Patterns to Follow)

| File | Purpose | How It Relates |
|------|---------|----------------|
| `components/workflows/workflow-table.tsx` | Reference table layout | Pattern for AgentTable component |
| `lib/stores/shell-store.ts` | Zustand store pattern | Pattern for agent-layout-store |
| `components/providers/theme-provider.tsx` | electron-store persistence | Pattern for layout persistence |
| `lib/theme/constants.ts` | Constants file pattern | Pattern for layout constants |

### Medium Priority (Supporting Infrastructure)

| File | Purpose | Notes |
|------|---------|-------|
| `electron/ipc/store.handlers.ts` | Store IPC handlers | No modification needed |
| `hooks/use-electron.ts` | useElectronStore hook | No modification needed |
| `components/ui/button-group.tsx` | For layout toggle | Existing component to use |
| `components/ui/icon-button.tsx` | For layout icons | Existing component to use |
| `components/ui/badge.tsx` | Used in agent display | Existing component to use |
| `components/ui/empty-state.tsx` | For no-agents state | Existing component to use |

### Low Priority (Reference/Types)

| File | Purpose |
|------|---------|
| `types/electron.d.ts` | ElectronAPI type definitions |
| `db/schema/agents.schema.ts` | Agent database schema |
| `hooks/queries/use-agents.ts` | TanStack Query hooks |
| `lib/queries/agents.ts` | Query key factory |
| `lib/utils.ts` | Utility functions (cn) |
| `types/component-types.ts` | Component prop types |

### New Files to Create

| File | Purpose |
|------|---------|
| `components/agents/agent-list.tsx` | New list view component |
| `components/agents/agent-table.tsx` | New table view component |
| `lib/stores/agent-layout-store.ts` | Zustand store for layout preference |
| `lib/layout/constants.ts` | Layout type and storage key constants |

## Statistics

- **Directories Explored**: 12
- **Files Examined**: 35+
- **Critical Files**: 4
- **High Priority Files**: 4
- **Medium Priority Files**: 6
- **Low Priority Files**: 6
- **New Files to Create**: 4
