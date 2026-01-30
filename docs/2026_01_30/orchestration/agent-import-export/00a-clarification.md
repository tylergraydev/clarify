# Step 0a: Clarification

**Step**: 0a - Feature Request Clarification
**Started**: 2026-01-30T12:00:00Z
**Completed**: 2026-01-30T12:01:00Z
**Status**: Completed

## Original Request

> The agents management screen should be able to import an agent that is in the proper format (markdown file with a frontmatter block at the top). The users should also be able to export the created agents to a markdown file with proper formatting and frontmatter.

## Codebase Exploration Summary

The clarification agent examined:
- `app/(app)/agents/page.tsx` - Agent management page with DataTable-based UI
- `.claude/agents/*.md` files - Existing agent markdown format with YAML frontmatter
- `db/schema/agents.ts` - Agent database schema
- `components/agents/agent-table-toolbar.tsx` - Existing toolbar controls
- `electron/ipc/agent.handlers.ts` - IPC handlers for agent operations

## Ambiguity Assessment

**Score**: 3/5 (Moderately clear, a few clarifications helpful)

**Reasoning**: The request clearly specifies import/export functionality with markdown files and frontmatter, but several implementation details needed clarification:
1. Frontmatter schema mapping between existing `.claude/agents/*.md` format and database schema
2. Whether tools and skills (stored in separate tables) should be included
3. Batch operations support
4. UI placement decisions
5. Validation strategy for imports

## Questions Asked

### Question 1: Export Scope
**Question**: Should import/export include agent tools and skills configurations, or just the core agent properties?
**Options**:
- Core properties only: Export name, displayName, description, type, color, and systemPrompt
- Include tools and skills: Also export the allowed-tools list and required skills in the frontmatter

**User Answer**: Include tools and skills (Recommended)

### Question 2: UI Placement
**Question**: Where should the import/export actions be placed in the UI?
**Options**:
- Toolbar only: Add Import button to toolbar; export requires selecting rows first
- Row actions only: Add Export option to each agent's row action menu (three-dot menu)
- Both toolbar and row actions: Import in toolbar, Export in both toolbar (for selected) and row actions (for single)

**User Answer**: Both toolbar and row actions (Recommended)

### Question 3: Batch Operations
**Question**: Should batch export of multiple agents be supported?
**Options**:
- Single agent only: Export one agent at a time to one markdown file
- Multiple agents: Select multiple agents and export to separate files in a chosen folder
- Multiple to single file: Export multiple agents to a single markdown file with document separators

**User Answer**: Multiple agents (Recommended)

### Question 4: Import Validation
**Question**: How should validation errors during import be handled?
**Options**:
- Strict validation: Reject import if any field is invalid or missing, show detailed error
- Lenient with defaults: Use sensible defaults for missing optional fields, only reject for critical errors
- Preview before import: Show a preview dialog with validation warnings before committing the import

**User Answer**: Preview before import (Recommended)

## Enhanced Request

The agents management screen should be able to import an agent that is in the proper format (markdown file with a frontmatter block at the top). The users should also be able to export the created agents to a markdown file with proper formatting and frontmatter.

Additional context from clarification:
- Export Scope: Include tools and skills - export the allowed-tools list and required skills in the frontmatter along with core properties
- UI Placement: Both toolbar and row actions - Import button in toolbar, Export in both toolbar (for selected rows) and row actions (for single agent)
- Batch Operations: Multiple agents - Select multiple agents and export to separate files in a chosen folder
- Import Validation: Preview before import - Show a preview dialog with validation warnings before committing the import
