# Step 1: Feature Request Refinement

**Status**: Completed
**Timestamp**: 2026-02-01
**Duration**: ~5 seconds

## Original Request

```
templates management page
```

## Context Provided to Agent

### Project Context
- Electron desktop app (Clarify - Claude Orchestrator) using Next.js 16.1.6, React 19, and TypeScript
- Database: SQLite with Drizzle ORM
- State: TanStack Query for server state, Zustand for client state
- Forms: TanStack Form with custom field components
- Tables: TanStack Table with sorting, filtering, pagination
- UI: Base UI primitives with CVA (class-variance-authority) patterns, Tailwind CSS v4
- Icons: lucide-react

### Existing Database Schema
- templates table: id, name (unique), category (backend|data|electron|security|ui), description, templateText (with {{placeholders}}), usageCount, builtInAt (null=custom, datetime=bundled), deactivatedAt (null=active, datetime=deactivated), createdAt, updatedAt
- template_placeholders table: id, templateId, name, displayName, description, defaultValue, orderIndex, requiredAt (null=optional, datetime=required), validationPattern (regex), createdAt, updatedAt

### Design Document Template Library Requirements
- Built-in templates: CRUD Feature, Form Component, API Integration, Auth Flow, Dashboard Widget, IPC Channel, Settings Page
- Template structure: ID, name, category, description, template body with placeholders, placeholder definitions
- Users can select templates when starting new workflows

### Similar Existing Page Pattern (Agents Page)
- Page component at app/(app)/agents/page.tsx
- Data table with toolbar containing search and filters
- Category filtering (for templates: backend, data, electron, security, ui)
- CRUD dialogs for create, edit, delete operations
- Import/export functionality

### IPC Layer Pattern
- Handlers in electron/ipc/ organized by domain
- Query hooks in hooks/queries/
- Repository pattern in db/repositories/

## Agent Prompt

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections): 'templates management page'.

Using the project context below, expand this request with relevant technical details while maintaining its core intent. Output ONLY the refined paragraph (200-500 words), nothing else.
```

## Agent Response (Refined Request)

The templates management page should provide a comprehensive interface for viewing, creating, editing, and managing workflow templates within the Clarify application, following the established pattern from the agents page at `app/(app)/agents/page.tsx`. This page will display templates in a TanStack Table with columns for name, category, description, usage count, and status (built-in vs custom, active vs deactivated), supporting sorting, filtering by category (backend, data, electron, security, ui), and search by name or description. The toolbar should include a search input, category filter dropdown using Base UI Select with CVA styling, and action buttons for creating new templates and potentially importing/exporting template configurations. Each table row should have actions for editing, duplicating, and deactivating/reactivating templates, with built-in templates (those with non-null `builtInAt`) being editable as custom copies rather than directly modified. The create/edit dialog should use TanStack Form with fields for name, category selection, description, and a template body textarea that supports `{{placeholder}}` syntax with syntax highlighting via Shiki. A nested section or separate tab within the dialog should allow managing template placeholders from the `template_placeholders` table, including fields for placeholder name, display name, description, default value, order index, required status, and optional validation pattern (regex). The page should use TanStack Query hooks following the query key factory pattern in `lib/queries/` for data fetching, with mutations for CRUD operations that properly invalidate the template list query. The IPC layer should have handlers in `electron/ipc/template-handlers.ts` connecting to a `TemplateRepository` in `db/repositories/` that implements standard CRUD operations plus queries for filtering by category and searching by name. State management for UI concerns like selected rows, dialog open states, and filter values should use Zustand stores, while all template data flows through TanStack Query for proper caching and synchronization.

## Validation Results

- **Format Check**: PASS - Single paragraph, no headers or sections
- **Length Check**: PASS - 371 words (within 200-500 range)
- **Scope Check**: PASS - Core intent preserved (templates CRUD page)
- **Quality Check**: PASS - Essential technical context added without excess
