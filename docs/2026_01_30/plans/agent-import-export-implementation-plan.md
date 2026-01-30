# Agent Import/Export Implementation Plan

**Generated**: 2026-01-30
**Original Request**: The agents management screen should be able to import an agent that is in the proper format (markdown file with a frontmatter block at the top). The users should also be able to export the created agents to a markdown file with proper formatting and frontmatter.
**Refined Request**: The agents management screen should enable users to import and export agents in a structured markdown format with YAML frontmatter containing agent metadata, tools, and skills. For imports, users should click an Import button in the toolbar to select a markdown file, which triggers a preview dialog displaying the agent properties, allowed-tools list, required skills, and any validation warnings before committing the import to the database. For exports, users can select one or multiple agents from the table and choose between toolbar buttons (for batch export of selected rows) or row action menu items (for single agent export), with the system prompting for a destination folder when exporting multiple agents and saving each as a separate markdown file with properly formatted frontmatter including core properties (name, displayName, description, type, color), the agent's assigned tools and skills, and version information. The export format should match the import format so agents can be round-tripped between markdown and the database without data loss. Both operations should integrate seamlessly with the existing agents table (built on TanStack Table with row selection support), leverage the current Electron IPC bridge pattern to handle file system operations and dialogs, and use TanStack Query to manage cache invalidation after successful imports. The import validation should check for required fields, validate tool and skill references, and warn about version conflicts or missing dependencies before the user confirms the import action.

## Analysis Summary

- Feature request refined with project context
- Discovered 28 files across 7 categories
- Generated 13-step implementation plan

## File Discovery Results

### Critical/High Priority Files

**Files to Modify:**
- `electron/ipc/agent.handlers.ts` - Add importAgent and exportAgents handlers
- `electron/ipc/channels.ts` - Add agent:import, agent:export channels
- `electron/preload.ts` - Add import/export methods to ElectronAPI.agent
- `types/electron.d.ts` - Add import/export method types
- `app/(app)/agents/page.tsx` - Add import/export handlers and row selection
- `components/agents/agent-table.tsx` - Enable row selection, add Export row action
- `components/agents/agent-table-toolbar.tsx` - Add Import and Export buttons
- `hooks/queries/use-agents.ts` - Add useImportAgent and useExportAgents mutations

**Files to Create:**
- `components/agents/import-agent-dialog.tsx` - Import preview dialog
- `lib/utils/agent-markdown.ts` - Markdown/YAML parsing utilities
- `lib/validations/agent-import.ts` - Zod validation schema for imports

**Reference Files:**
- `db/schema/agents.schema.ts` - Agent schema
- `db/schema/agent-tools.schema.ts` - Tool associations
- `db/schema/agent-skills.schema.ts` - Skill associations
- `db/repositories/agents.repository.ts` - CRUD operations
- `electron/ipc/dialog.handlers.ts` - File dialog patterns
- `electron/ipc/fs.handlers.ts` - File system operations
- `components/agents/agent-editor-dialog.tsx` - Dialog pattern reference
- `components/ui/table/data-table.tsx` - Row selection support

## Implementation Plan

### Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

### Quick Summary

This feature adds import and export capabilities for agents using a structured markdown format with YAML frontmatter. Users can export one or multiple agents to markdown files and import agents from markdown files with full validation preview, enabling round-trip data transfer between the database and human-readable files.

### Prerequisites

- [ ] Install `yaml` package for YAML frontmatter parsing/serialization: `pnpm add yaml`
- [ ] Verify Electron IPC bridge patterns are understood (see `electron/ipc/agent.handlers.ts`)
- [ ] Verify TanStack Query mutation patterns are understood (see `hooks/queries/use-agents.ts`)

### Step 1: Add YAML Package Dependency

**What**: Install the `yaml` package for parsing and serializing YAML frontmatter
**Why**: The project does not currently have a YAML parsing library, which is required for handling agent markdown files with YAML frontmatter
**Confidence**: High

**Files to Modify:**

- `package.json` - Add yaml dependency

**Changes:**

- Add `yaml` package to dependencies section

**Validation Commands:**

```bash
pnpm install && pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] `yaml` package is installed and listed in package.json dependencies
- [ ] No dependency conflicts or peer dependency warnings

---

### Step 2: Create Agent Markdown Parsing and Serialization Utilities

**What**: Create utility functions for converting between agent database records and markdown format with YAML frontmatter
**Why**: Centralizes the markdown/YAML parsing and serialization logic, ensuring consistent format handling for both import and export operations
**Confidence**: High

**Files to Create:**

- `lib/utils/agent-markdown.ts` - Markdown/YAML parsing and serialization utilities

**Changes:**

- Define TypeScript interface for the parsed agent markdown structure
- Implement `parseAgentMarkdown` function that extracts YAML frontmatter and markdown body (system prompt)
- Implement `serializeAgentToMarkdown` function that converts an agent with tools and skills to markdown format
- Define the standard markdown format with YAML frontmatter sections for: name, displayName, description, type, color, version, tools (array with toolName and pattern), skills (array with skillName and isRequired)
- Handle edge cases like empty tools/skills arrays, missing optional fields
- Export format version constant for future compatibility

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] `parseAgentMarkdown` correctly extracts frontmatter and body content
- [ ] `serializeAgentToMarkdown` produces valid markdown with proper YAML frontmatter
- [ ] Round-trip conversion (serialize then parse) preserves all data without loss
- [ ] All validation commands pass

---

### Step 3: Create Agent Import Validation Schema

**What**: Create Zod validation schema for validating imported agent markdown data
**Why**: Ensures imported agent data meets all required constraints before database insertion, providing clear validation errors for the preview dialog
**Confidence**: High

**Files to Create:**

- `lib/validations/agent-import.ts` - Zod validation schema for agent imports

**Changes:**

- Define `agentImportSchema` using Zod that validates all frontmatter fields
- Validate required fields: name (kebab-case pattern), displayName, type (enum), systemPrompt
- Validate optional fields: description, color (enum), version (positive integer), tools array, skills array
- Add custom validation for tool entries (toolName required, pattern optional)
- Add custom validation for skill entries (skillName required, isRequired boolean optional)
- Define `AgentImportData` type inferred from schema
- Define `AgentImportValidationResult` type for holding validation results and warnings

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Schema rejects invalid agent names (non-kebab-case)
- [ ] Schema rejects invalid agent types
- [ ] Schema rejects missing required fields
- [ ] Schema accepts valid agent data with all fields
- [ ] All validation commands pass

---

### Step 4: Add IPC Channels for Agent Import and Export

**What**: Add new IPC channel definitions for agent:import and agent:export operations
**Why**: Following the established IPC bridge pattern, channels must be defined in both the main process channels file and the preload script
**Confidence**: High

**Files to Modify:**

- `electron/ipc/channels.ts` - Add import and export channels
- `electron/preload.ts` - Add import and export channels (duplicated for sandbox)

**Changes:**

- Add `import: "agent:import"` to the agent section in IpcChannels (channels.ts)
- Add `export: "agent:export"` to the agent section in IpcChannels (channels.ts)
- Add `exportBatch: "agent:exportBatch"` to the agent section in IpcChannels (channels.ts)
- Mirror all changes in preload.ts IpcChannels object

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Channels are defined in both files
- [ ] Channel naming follows existing pattern (domain:action format)
- [ ] All validation commands pass

---

### Step 5: Implement Agent Import and Export IPC Handlers

**What**: Implement the main process IPC handlers for importing and exporting agents
**Why**: These handlers execute the actual file system operations and database mutations required for import/export functionality
**Confidence**: High

**Files to Modify:**

- `electron/ipc/agent.handlers.ts` - Add import and export handlers

**Changes:**

- Import the agent markdown utilities from `lib/utils/agent-markdown`
- Implement `agent:import` handler that:
  - Receives parsed markdown data (already read by renderer via fs:readFile)
  - Validates data against import schema
  - Checks for duplicate agent names in database
  - Creates agent record and associated tools/skills
  - Returns success result with created agent or validation errors
- Implement `agent:export` handler that:
  - Receives agent ID
  - Fetches agent with tools and skills from repositories
  - Serializes to markdown format using utilities
  - Returns markdown content string
- Implement `agent:exportBatch` handler that:
  - Receives array of agent IDs
  - Fetches each agent with tools and skills
  - Returns array of objects with agentName and markdown content
- Add proper error handling and type safety for all handlers

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Import handler validates data and creates agent with tools and skills
- [ ] Import handler returns appropriate errors for validation failures
- [ ] Import handler returns appropriate errors for duplicate names
- [ ] Export handler returns properly formatted markdown
- [ ] Export batch handler returns array of markdown content for multiple agents
- [ ] All validation commands pass

---

### Step 6: Add Import and Export Methods to ElectronAPI Type Definitions

**What**: Add TypeScript type definitions for the new import and export API methods
**Why**: Ensures type safety when calling the import/export methods from the renderer process
**Confidence**: High

**Files to Modify:**

- `types/electron.d.ts` - Add import and export method types
- `electron/preload.ts` - Add import and export method implementations

**Changes:**

- Define `AgentImportData` interface in electron.d.ts with all import fields
- Define `AgentImportResult` interface with success, agent, errors, and warnings fields
- Define `AgentExportResult` interface with success, content, and error fields
- Define `AgentExportBatchResult` interface with success, agents array, and error fields
- Add `import(data: AgentImportData): Promise<AgentImportResult>` to ElectronAPI.agent
- Add `export(agentId: number): Promise<AgentExportResult>` to ElectronAPI.agent
- Add `exportBatch(agentIds: number[]): Promise<AgentExportBatchResult>` to ElectronAPI.agent
- Implement the corresponding methods in electronAPI object in preload.ts

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Types accurately represent the import/export data structures
- [ ] Types match the handler implementations
- [ ] preload.ts implementations correctly invoke IPC channels
- [ ] All validation commands pass

---

### Step 7: Create useImportAgent and useExportAgents Mutation Hooks

**What**: Create TanStack Query mutation hooks for importing and exporting agents
**Why**: Provides a consistent data fetching pattern with proper cache invalidation and toast notifications
**Confidence**: High

**Files to Modify:**

- `hooks/queries/use-agents.ts` - Add import and export mutation hooks

**Changes:**

- Add `useImportAgent` mutation hook that:
  - Calls api.agent.import with parsed agent data
  - On success: invalidates all agent query caches, shows success toast
  - On error: shows error toast with validation errors
  - Returns mutation result with imported agent
- Add `useExportAgent` mutation hook that:
  - Calls api.agent.export with agent ID
  - Returns markdown content string
  - On error: shows error toast
- Add `useExportAgentsBatch` mutation hook that:
  - Calls api.agent.exportBatch with array of agent IDs
  - Returns array of agent markdown objects
  - On error: shows error toast

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Import mutation properly invalidates agent query caches on success
- [ ] Export mutations return markdown content
- [ ] Toast notifications display on success and error
- [ ] All validation commands pass

---

### Step 8: Create Import Agent Preview Dialog Component

**What**: Create the dialog component that previews imported agent data with validation warnings before confirming import
**Why**: Provides users with a clear preview of what will be imported and any validation issues that need attention
**Confidence**: Medium

**Files to Create:**

- `components/agents/import-agent-dialog.tsx` - Import preview dialog

**Changes:**

- Create controlled dialog component with props for isOpen, onOpenChange, and onImport callback
- Accept parsed agent data as prop for preview display
- Display agent properties in readable format: name, displayName, type, color, description
- Display tools list with count and names
- Display skills list with count and required status
- Display validation warnings (e.g., duplicate name, missing optional fields)
- Display validation errors that prevent import
- Include Cancel and Import buttons in footer
- Import button disabled when validation errors exist
- Use existing Dialog component primitives from `components/ui/dialog`
- Use existing Badge component for displaying type, color, status
- Show loading state during import operation

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dialog displays all agent properties clearly
- [ ] Validation errors prevent import and display prominently
- [ ] Validation warnings display but allow import
- [ ] Import button triggers onImport callback with agent data
- [ ] Dialog follows existing dialog patterns in codebase
- [ ] All validation commands pass

---

### Step 9: Add Import and Export Buttons to Agent Table Toolbar

**What**: Add Import button and Export Selected button to the agent table toolbar
**Why**: Provides toolbar-level access to import functionality and batch export for selected rows
**Confidence**: High

**Files to Modify:**

- `components/agents/agent-table-toolbar.tsx` - Add Import and Export buttons

**Changes:**

- Add optional props for import/export handlers: onImport, onExportSelected
- Add optional prop for selectedCount to show export button state
- Add Import button with Upload icon that triggers onImport callback
- Add Export Selected button with Download icon that triggers onExportSelected callback
- Export Selected button shows count badge and is disabled when no rows selected
- Place buttons in a new actions section with separator from existing filters
- Follow existing button styling patterns in toolbar

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Import button renders in toolbar
- [ ] Export Selected button renders with selection count
- [ ] Export Selected button disabled when selectedCount is 0
- [ ] Buttons follow existing toolbar styling
- [ ] All validation commands pass

---

### Step 10: Add Export Row Action to Agent Table

**What**: Add Export action to the row actions dropdown menu in the agent table
**Why**: Enables single-agent export from the row context menu without needing to select the row first
**Confidence**: High

**Files to Modify:**

- `components/agents/agent-table.tsx` - Add Export row action

**Changes:**

- Add optional `onExport` prop to AgentTableProps interface
- Add optional `isExporting` prop for loading state
- Add Export action item to getRowActions function with Download icon
- Place Export action after Duplicate action in the menu
- Disable action when isExporting is true

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Export action appears in row actions dropdown
- [ ] Export action triggers onExport callback with agent
- [ ] Export action is disabled during export operation
- [ ] All validation commands pass

---

### Step 11: Enable Row Selection in Agent Table

**What**: Enable TanStack Table row selection feature for batch export functionality
**Why**: Required for users to select multiple agents for batch export operations
**Confidence**: High

**Files to Modify:**

- `components/agents/agent-table.tsx` - Enable row selection

**Changes:**

- Add selection column as first column using TanStack Table checkbox selection pattern
- Add optional props for row selection state: rowSelection, onRowSelectionChange
- Pass enableRowSelection option to DataTable
- Add getRowId function using agent.id for stable row selection
- Update columns array to include select column with header checkbox (select all) and row checkbox

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Checkbox column renders in table
- [ ] Header checkbox toggles all row selections
- [ ] Row checkboxes toggle individual selections
- [ ] Selection state is controlled by parent component
- [ ] All validation commands pass

---

### Step 12: Integrate Import/Export Functionality in Agents Page

**What**: Wire up all import/export functionality in the agents page component
**Why**: Connects all the individual components and hooks to provide the complete import/export user experience
**Confidence**: Medium

**Files to Modify:**

- `app/(app)/agents/page.tsx` - Add import/export integration

**Changes:**

- Import the new mutation hooks: useImportAgent, useExportAgent, useExportAgentsBatch
- Import the ImportAgentDialog component
- Import agent markdown utilities for parsing
- Add state for row selection: rowSelection, setRowSelection
- Add state for import dialog: isImportDialogOpen, importedAgentData
- Add state for selected agents count derived from rowSelection
- Implement handleImportClick that:
  - Opens file dialog via api.dialog.openFile with markdown filter
  - Reads file content via api.fs.readFile
  - Parses markdown using parseAgentMarkdown utility
  - Sets importedAgentData and opens import dialog
- Implement handleImportConfirm that:
  - Calls useImportAgent mutation with parsed data
  - Closes dialog and clears import data on success
- Implement handleExportSingle that:
  - Calls useExportAgent mutation to get markdown content
  - Opens save dialog via api.dialog.saveFile with default filename
  - Writes content via api.fs.writeFile
- Implement handleExportSelected that:
  - Gets selected agent IDs from rowSelection state
  - Calls useExportAgentsBatch mutation to get all markdown content
  - Opens directory dialog via api.dialog.openDirectory
  - Writes each agent to separate file in selected directory
- Pass row selection props to AgentTable
- Pass import/export handlers to AgentTableToolbar
- Pass export handler to AgentTable for row actions
- Render ImportAgentDialog with appropriate props

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Import button opens file picker for markdown files
- [ ] Import dialog shows preview of parsed agent data
- [ ] Import confirm creates agent and closes dialog
- [ ] Single export saves markdown file to user-selected location
- [ ] Batch export saves multiple files to user-selected directory
- [ ] Row selection enables batch export button
- [ ] All validation commands pass

---

### Step 13: Manual Integration Testing

**What**: Perform end-to-end testing of import and export flows
**Why**: Ensures all components work together correctly and the round-trip data integrity is maintained
**Confidence**: High

**Changes:**

- Test single agent export from row actions menu
- Test batch export with multiple selected agents
- Test import with valid markdown file
- Test import with invalid markdown file (validation errors)
- Test import with duplicate agent name (warning)
- Test round-trip: export agent, import exported file, verify data matches
- Test edge cases: agent with no tools, agent with no skills, maximum length fields

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Single export creates valid markdown file
- [ ] Batch export creates correct number of files
- [ ] Import preview shows all agent data correctly
- [ ] Import creates agent with all tools and skills
- [ ] Round-trip preserves all data without loss
- [ ] Validation errors display appropriately
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Import dialog follows existing dialog patterns
- [ ] Export format documented in code comments
- [ ] Round-trip data integrity verified (export then import produces identical agent)

## Notes

**Markdown Format Specification:**

The agent markdown format uses YAML frontmatter for metadata and the markdown body for the system prompt:

```markdown
---
name: my-agent-name
displayName: My Agent Display Name
type: specialist
color: blue
description: Optional description
version: 1
tools:
  - toolName: Read
    pattern: "*"
  - toolName: Edit
    pattern: "*.ts"
skills:
  - skillName: tanstack-query
    isRequired: true
  - skillName: react-conventions
    isRequired: false
---

System prompt content goes here as the markdown body.
Multiple paragraphs and formatting are preserved.
```

**Assumptions:**

- Users will typically export agents to share configurations between projects or for backup purposes
- The yaml package provides sufficient YAML parsing capabilities for the frontmatter format
- File naming for batch export will use the agent's name property (kebab-case) as the filename

**Risk Mitigation:**

- Validation schema catches invalid imports before database operations
- Duplicate name detection prevents accidental overwrites
- Preview dialog gives users chance to review before confirming import
