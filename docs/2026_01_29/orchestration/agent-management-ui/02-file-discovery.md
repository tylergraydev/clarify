# Step 2: File Discovery

**Status**: Completed
**Started**: 2026-01-29T00:02:00Z
**Completed**: 2026-01-29T00:03:00Z
**Duration**: ~60 seconds

## Input

Refined feature request for Agent Management UI (from Step 1)

## AI-Powered Discovery Analysis

### Analysis Summary

- Explored 15+ directories
- Examined 55+ candidate files
- Found 24 highly relevant files
- Identified 15 supporting files

## Discovered Files

### Critical Priority (Must Modify/Create)

| File Path                   | Relevance                                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(app)/agents/page.tsx` | **The main agents page to implement** - currently a placeholder that needs to be replaced with the full agent management UI including list/grid view, search, and agent cards |

### High Priority (Core Implementation Files)

| File Path                              | Relevance                                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/queries/use-agents.ts`          | **Agent query hooks** - Already implemented with useAgents, useAgent, useUpdateAgent, useActivateAgent, useDeactivateAgent, useResetAgent - will be consumed by the UI |
| `lib/queries/agents.ts`                | **Agent query key factory** - Already implemented with agentKeys for cache invalidation patterns                                                                       |
| `db/schema/agents.schema.ts`           | **Agent database schema** - Defines Agent type with displayName, description, type, color, systemPrompt, deactivatedAt, builtInAt, parentAgentId fields                |
| `db/schema/agent-tools.schema.ts`      | **Agent tools schema** - Defines allowed tools per agent with toolName, toolPattern, disallowedAt fields                                                               |
| `electron/ipc/agent.handlers.ts`       | **Agent IPC handlers** - Backend handlers for list, get, update, activate, deactivate, reset operations                                                                |
| `db/repositories/agents.repository.ts` | **Agent repository** - Data access layer with findAll, findById, update, activate, deactivate methods                                                                  |
| `types/electron.d.ts`                  | **Type definitions** - ElectronAPI interface and Agent/NewAgent type exports for renderer use                                                                          |
| `lib/forms/form-hook.ts`               | **Form hook factory** - useAppForm hook with field components for building TanStack Form-based forms                                                                   |

### Medium Priority (UI Components to Use)

| File Path                                  | Relevance                                                                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/card.tsx`                   | **Card component** - Pattern for agent cards (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)                           |
| `components/ui/dialog.tsx`                 | **Dialog component** - Pattern for agent editor modal with DialogRoot, DialogTrigger, DialogPopup, DialogTitle, DialogDescription, DialogClose |
| `components/ui/badge.tsx`                  | **Badge component** - For agent type indicators and status display with CVA variants                                                           |
| `components/ui/button.tsx`                 | **Button component** - For actions with variant support (default, outline, ghost, destructive)                                                 |
| `components/ui/switch.tsx`                 | **Switch component** - For activation toggle controls                                                                                          |
| `components/ui/input.tsx`                  | **Input component** - For search functionality with inputVariants                                                                              |
| `components/ui/empty-state.tsx`            | **Empty state component** - For when no agents match search/filters                                                                            |
| `components/ui/tooltip.tsx`                | **Tooltip component** - For additional context on agent actions                                                                                |
| `components/ui/form/text-field.tsx`        | **TextField component** - TanStack Form field for agent name input                                                                             |
| `components/ui/form/textarea-field.tsx`    | **TextareaField component** - TanStack Form field for system prompt editing                                                                    |
| `components/ui/form/select-field.tsx`      | **SelectField component** - TanStack Form field for agent type selection                                                                       |
| `components/ui/form/switch-field.tsx`      | **SwitchField component** - TanStack Form field for boolean options                                                                            |
| `components/ui/form/submit-button.tsx`     | **SubmitButton component** - TanStack Form submit button with loading state                                                                    |
| `components/ui/form/field-wrapper.tsx`     | **Field wrapper variants** - CVA variants for form styling                                                                                     |
| `components/data/query-error-boundary.tsx` | **Query error boundary** - For handling data loading errors                                                                                    |

### Low Priority (Reference Patterns)

| File Path                                         | Relevance                                                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(app)/workflows/page.tsx`                    | **Reference pattern** - Comprehensive example of list page with card/table views, filters, search, URL state (nuqs), loading skeletons, empty states |
| `components/workflows/workflow-card.tsx`          | **Reference pattern** - Example card component with status badges, actions, styling patterns                                                         |
| `components/workflows/create-workflow-dialog.tsx` | **Reference pattern** - Example TanStack Form dialog with validation, form fields, submit handling                                                   |
| `lib/validations/workflow.ts`                     | **Reference pattern** - Zod schema validation pattern for forms                                                                                      |
| `hooks/use-electron.ts`                           | **Electron hook** - useElectron hook for API access detection                                                                                        |
| `hooks/queries/index.ts`                          | **Query hooks index** - Barrel export pattern for query hooks                                                                                        |
| `lib/queries/index.ts`                            | **Query keys index** - Merged query keys export pattern                                                                                              |
| `lib/utils.ts`                                    | **Utilities** - cn() function for className composition                                                                                              |
| `app/(app)/layout.tsx`                            | **App layout** - Shell layout with sidebar state                                                                                                     |
| `electron/preload.ts`                             | **Preload script** - ElectronAPI definition with agent methods                                                                                       |
| `electron/ipc/channels.ts`                        | **IPC channels** - Channel constants for IPC communication                                                                                           |
| `db/schema/index.ts`                              | **Schema index** - Barrel export for all schemas                                                                                                     |
| `db/repositories/index.ts`                        | **Repository index** - Barrel export for repositories                                                                                                |
| `db/schema/agent-skills.schema.ts`                | **Agent skills schema** - Related schema for agent skills                                                                                            |

## Architecture Insights

### Existing Patterns Discovered

1. **Page Structure Pattern** (from workflows page):
   - URL state management with nuqs (parseAsString, parseAsStringLiteral)
   - Card/table view toggle with ButtonGroup
   - Search input with debouncing
   - Filter selects using SelectRoot components
   - Loading skeletons for data loading states
   - Empty states with action buttons
   - QueryErrorBoundary wrapping content

2. **Card Component Pattern** (from workflow-card):
   - Card with CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - Badge for status display with variant mapping
   - Action buttons in footer
   - Status-to-variant mapping functions

3. **Form Dialog Pattern** (from create-workflow-dialog):
   - DialogRoot with controlled open state
   - useAppForm with defaultValues and validators
   - form.AppField with field components (SelectField, TextField, TextareaField)
   - form.SubmitButton inside form.AppForm wrapper
   - Reset on close handling
   - Mutation integration with onSuccess callback

4. **Query Hook Pattern** (from use-agents):
   - useQuery with agentKeys for caching
   - useMutation with cache invalidation
   - Client-side filtering when API returns all data
   - Optimistic updates via setQueryData

### Key Integration Points

- **Agent Type Constants**: Use `agentTypes` and `agentColors` from agents.schema.ts
- **Built-in Detection**: Check `builtInAt !== null` for built-in agents
- **Activation Status**: Check `deactivatedAt === null` for active agents
- **Reset Logic**: Reset operation deactivates custom agent and activates parent built-in agent

### Recommended New Files to Create

1. `components/agents/agent-card.tsx` - Agent card component
2. `components/agents/agent-editor-dialog.tsx` - Agent editor dialog with TanStack Form
3. `lib/validations/agent.ts` - Zod validation schema for agent form
4. Optional: `app/(app)/agents/route-type.ts` - Type-safe URL route if using nuqs params

## Validation Results

- **Minimum Files**: PASS - 24+ relevant files discovered
- **AI Analysis Quality**: PASS - Detailed reasoning for each file
- **File Validation**: PASS - All paths validated to exist
- **Smart Categorization**: PASS - Files categorized by priority level
- **Comprehensive Coverage**: PASS - Covers schemas, hooks, handlers, components, pages
- **Pattern Recognition**: PASS - Identified workflows page pattern as reference
