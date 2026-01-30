# Step 2: File Discovery

**Step**: 2 - AI-Powered File Discovery
**Started**: 2026-01-30T12:02:00Z
**Completed**: 2026-01-30T12:04:00Z
**Status**: Completed

## Refined Request Input

The agents management screen should enable users to import and export agents in a structured markdown format with YAML frontmatter containing agent metadata, tools, and skills. For imports, users should click an Import button in the toolbar to select a markdown file, which triggers a preview dialog displaying the agent properties, allowed-tools list, required skills, and any validation warnings before committing the import to the database. For exports, users can select one or multiple agents from the table and choose between toolbar buttons (for batch export of selected rows) or row action menu items (for single agent export), with the system prompting for a destination folder when exporting multiple agents and saving each as a separate markdown file with properly formatted frontmatter including core properties (name, displayName, description, type, color), the agent's assigned tools and skills, and version information. The export format should match the import format so agents can be round-tripped between markdown and the database without data loss.

## Discovery Analysis Summary

- **Directories Explored**: 12
- **Candidate Files Examined**: 48
- **Highly Relevant Files Found**: 23
- **Supporting Files Identified**: 12

## Discovered Files by Category

### Database Layer

| File Path | Priority | Reason | Action |
|-----------|----------|--------|--------|
| `db/schema/agents.schema.ts` | Critical | Defines Agent table schema with fields: name, displayName, description, type, color, version, systemPrompt. All fields needed for export/import format. | Reference |
| `db/schema/agent-tools.schema.ts` | Critical | Defines agent_tools table for tool associations. Required for export/import of tool configurations. | Reference |
| `db/schema/agent-skills.schema.ts` | Critical | Defines agent_skills table for skill associations. Required for export/import of skill configurations. | Reference |
| `db/repositories/agents.repository.ts` | Critical | Repository with CRUD operations (create, findByName, findAll). Import will use create(), duplicate checking uses findByName(). | Reference |
| `db/repositories/agent-tools.repository.ts` | High | Required for creating tool associations after agent import. | Reference |
| `db/repositories/agent-skills.repository.ts` | High | Required for creating skill associations after agent import. | Reference |

### Electron IPC Layer

| File Path | Priority | Reason | Action |
|-----------|----------|--------|--------|
| `electron/ipc/agent.handlers.ts` | Critical | Main agent IPC handlers. Need to add importAgent and exportAgents handlers for markdown-based import/export operations. | Modify |
| `electron/ipc/channels.ts` | Critical | IPC channel definitions. Need to add agent:import, agent:export, agent:exportBatch channels. | Modify |
| `electron/preload.ts` | Critical | Context bridge API definitions. Need to add corresponding import/export methods to ElectronAPI.agent interface. | Modify |
| `electron/ipc/dialog.handlers.ts` | High | File dialog handlers (openFile, saveFile, openDirectory). Used for selecting import files and export destinations. | Reference |
| `electron/ipc/fs.handlers.ts` | High | File system handlers (readFile, writeFile). Used for reading markdown files and writing exports. | Reference |

### Pages and Components

| File Path | Priority | Reason | Action |
|-----------|----------|--------|--------|
| `app/(app)/agents/page.tsx` | Critical | Agents management page. Need to add import/export handlers, toolbar buttons, and state management for row selection. | Modify |
| `components/agents/agent-table.tsx` | Critical | Agent table component with row actions. Need to enable row selection and add Export action to row menu. | Modify |
| `components/agents/agent-table-toolbar.tsx` | Critical | Table toolbar component. Need to add Import button and batch Export button for selected rows. | Modify |

### New Files to Create

| File Path | Priority | Reason | Action |
|-----------|----------|--------|--------|
| `components/agents/import-agent-dialog.tsx` | Critical | New dialog for import preview, validation warnings, and confirmation. Shows parsed agent data before committing. | Create |
| `lib/utils/agent-markdown.ts` | Critical | Utility functions for parsing/generating markdown with YAML frontmatter. Handles round-trip serialization. | Create |
| `lib/validations/agent-import.ts` | High | Zod schema for validating imported agent markdown structure and required fields. | Create |

### Query Hooks

| File Path | Priority | Reason | Action |
|-----------|----------|--------|--------|
| `hooks/queries/use-agents.ts` | Critical | TanStack Query hooks for agents. Need to add useImportAgent and useExportAgents mutations with cache invalidation. | Modify |
| `lib/queries/agents.ts` | High | Query key factory. May need additional keys for import/export operations. | Reference |

### UI Components (Reference)

| File Path | Priority | Reason | Action |
|-----------|----------|--------|--------|
| `components/ui/table/data-table.tsx` | High | DataTable with row selection support (isRowSelectionEnabled). Reference for enabling batch export. | Reference |
| `components/ui/table/data-table-toolbar.tsx` | Medium | Base toolbar component. Reference for toolbar styling patterns. | Reference |
| `components/ui/table/data-table-row-actions.tsx` | Medium | Row actions dropdown. Reference for adding Export action to row menu. | Reference |
| `components/ui/dialog.tsx` | Medium | Dialog component primitives. Used by import preview dialog. | Reference |
| `components/agents/agent-editor-dialog.tsx` | Medium | Existing dialog pattern. Reference for dialog structure and form handling. | Reference |

### Validation and Types

| File Path | Priority | Reason | Action |
|-----------|----------|--------|--------|
| `lib/validations/agent.ts` | High | Existing agent validation schemas. Reference for consistent validation patterns. | Reference |
| `types/electron.d.ts` | High | ElectronAPI type definitions. Need to add import/export method types. | Modify |

### Supporting Files

| File Path | Priority | Reason | Action |
|-----------|----------|--------|--------|
| `hooks/queries/use-agent-tools.ts` | Low | Tool query hooks. May need to refresh after import. | Reference |
| `hooks/queries/use-agent-skills.ts` | Low | Skill query hooks. May need to refresh after import. | Reference |
| `electron/ipc/index.ts` | Low | IPC handler registration. Need to ensure new handlers are registered. | Reference |

## Architecture Insights

### Key Patterns Discovered

1. **IPC Bridge Pattern**: All database operations flow through IPC handlers in `electron/ipc/` with corresponding preload bridge methods. Both `channels.ts` and `preload.ts` must be updated in sync.

2. **Repository Pattern**: Database access uses typed repository classes in `db/repositories/`. Import operations should use existing repository methods.

3. **TanStack Query Integration**: Mutations use `useQueryClient` for cache invalidation. Import mutation must invalidate `agentKeys.all._def` and related keys.

4. **CVA Component Pattern**: UI components use class-variance-authority for styling variants.

5. **Dialog Pattern**: Dialogs use Base UI primitives with controlled open state via `isOpen`/`onOpenChange` pattern (see `agent-editor-dialog.tsx`).

6. **DataTable Row Selection**: DataTable supports row selection via `isRowSelectionEnabled` prop and `onRowSelectionChange` callback with `RowSelectionState`.

### Existing Similar Functionality

- **Agent Duplication** (`agent.handlers.ts:174-255`): Similar pattern for copying agent with tools/skills - can reference for import logic
- **File Dialog Usage**: `dialog.handlers.ts` already provides `openFile` with filter support for markdown files

### Integration Points

1. **Toolbar Integration**: Custom toolbar content passed via `toolbarContent` prop to DataTable
2. **Row Actions**: Actions returned from `getRowActions` callback in `agent-table.tsx`
3. **Toast Notifications**: Use `useToast()` hook for success/error feedback (pattern in use-agents.ts)

## Missing Dependencies

**YAML/Frontmatter Parsing**: No existing yaml or gray-matter packages installed. Need to add `yaml` package or `gray-matter` for parsing frontmatter in markdown files.

## Discovery Statistics

- **Critical Priority Files**: 13 (6 Reference, 4 Modify, 3 Create)
- **High Priority Files**: 8 (6 Reference, 2 Modify)
- **Medium Priority Files**: 4 (4 Reference)
- **Low Priority Files**: 3 (3 Reference)
- **Total Files**: 28

## File Validation Results

All discovered file paths verified to exist in the codebase except for:
- `components/agents/import-agent-dialog.tsx` (to be created)
- `lib/utils/agent-markdown.ts` (to be created)
- `lib/validations/agent-import.ts` (to be created)
