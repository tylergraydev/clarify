# Clarify AI - Project Overview

## 1. Project Overview

Clarify is a cross-platform Electron desktop application that transforms informal feature requests into actionable implementation plans using AI-powered workflows. Built with Next.js 16 as the renderer process and the Claude Agent SDK for AI orchestration, it provides a structured multi-step pipeline — clarification, refinement, file discovery, and planning — to produce high-quality development specifications from vague product requirements.

## 2. Purpose

- **Feature Request Clarification** — Uses AI agents to analyze ambiguous feature requests and generate targeted clarifying questions, ensuring requirements are fully understood before implementation planning begins.
- **Automated Refinement** — Takes raw feature descriptions along with clarification Q&A context and produces a polished, enhanced feature specification through a dedicated refinement agent.
- **File Discovery & Codebase Analysis** — Scans project repositories to identify relevant files and code patterns, providing the AI planner with the context it needs to produce accurate implementation plans.
- **Multi-Agent Workflow Orchestration** — Manages a configurable pipeline of AI agents (clarification, refinement, discovery, planning) with pause/resume support, retry logic, timeout handling, and real-time streaming of agent output.
- **Project & Repository Management** — Organizes work into projects with associated Git repositories, reusable prompt templates, and configurable agents, providing a complete workspace for managing multiple development efforts.

## 3. Tech Stack

### Core Framework
- **Next.js** 16.1.6 — App Router for UI rendering (static export for Electron production builds)
- **React** 19.2.4 — UI component library
- **Electron** 35.1.0 — Desktop shell with context-isolated preload scripts
- **TypeScript** 5.x — Strict mode with `noUncheckedIndexedAccess`, `noImplicitAny`, and full strictness

### Database & Backend
- **better-sqlite3** 12.6.0 — Embedded SQLite database (stored in `userData` for production, `clarify-dev.db` for development)
- **Drizzle ORM** 0.45.1 — Type-safe SQL schema definitions, migrations, and query builder
- **drizzle-kit** 0.31.8 — Schema migration generation tool
- **drizzle-zod** 0.8.3 — Automatic Zod schema derivation from Drizzle tables

### AI & Agent Integration
- **@anthropic-ai/claude-agent-sdk** 0.2.29 — Claude Agent SDK for orchestrating multi-step AI workflows
- **shiki** 3.21.0 — Syntax-highlighted code blocks in agent output
- **streamdown** 2.0.1 — Streaming markdown rendering for real-time agent responses

### UI Components & Styling
- **@base-ui/react** 1.1.0 — Unstyled headless UI primitives (dialogs, menus, tooltips, etc.)
- **Tailwind CSS** 4.x — Utility-first CSS framework with PostCSS integration
- **class-variance-authority (CVA)** 0.7.1 — Type-safe component variant management
- **tailwind-merge** 3.4.0 — Intelligent Tailwind class deduplication
- **tw-animate-css** 1.4.0 — Animation utilities
- **lucide-react** 0.562.0 — Icon library
- **Geist & Geist Mono** — Application fonts (via `next/font/google`)

### State Management & Data Fetching
- **@tanstack/react-query** 5.90.18 — Server state management with query key factory pattern
- **@lukemorales/query-key-factory** 1.3.4 — Structured, type-safe query key definitions
- **@tanstack/react-form** 1.27.7 — Headless form management with field-level validation
- **@tanstack/react-table** 8.21.3 — Headless data tables with sorting, filtering, and pagination
- **@tanstack/react-virtual** 3.13.18 — Virtualized scrolling for large lists
- **Zustand** 5.0.10 — Lightweight client-side state stores (shell layout, workflow detail, debug logs)
- **nuqs** 2.8.6 — Type-safe URL search parameter state management
- **Zod** 4.3.5 — Runtime schema validation for IPC payloads and form data

### Routing & Navigation
- **next-typesafe-url** 6.1.0 — Type-safe route parameters with generated `route-type.ts` files
- **electron-serve** 2.1.1 — Serves static Next.js export in production Electron builds
- **electron-store** 10.0.1 — Persistent key-value storage for user preferences

### Testing & Development Tools
- **ESLint** 9.x — Linting with `eslint-config-next`, `eslint-plugin-perfectionist`, `eslint-plugin-better-tailwindcss`, `eslint-plugin-react-snob`
- **Prettier** 3.8.0 — Code formatting
- **concurrently** 9.1.2 — Parallel process runner for Electron dev mode
- **cross-env** 7.0.3 — Cross-platform environment variable setting
- **esbuild** 0.27.2 — Bundling Electron preload scripts (`scripts/build-preloads.mjs`)
- **wait-on** 8.0.3 — Waits for Next.js dev server before launching Electron
- **electron-builder** 25.1.8 — Cross-platform packaging (NSIS for Windows, DMG for macOS, AppImage/deb for Linux)

### Logging & Debugging
- **electron-log** 5.4.3 — Structured logging for the main process
- **Debug Log Viewer** — Built-in debug window (`Ctrl+Shift+D`) with real-time log streaming, filtering, and search

## 4. Key Features

- Multi-step AI workflow pipeline with clarification, refinement, file discovery, and implementation planning stages
- Real-time streaming of AI agent output with markdown rendering, code highlighting, and chain-of-thought display
- Configurable AI agents with customizable system prompts, models (Sonnet/Opus/Haiku), permission modes, tools, skills, and hooks
- Agent hierarchy with parent/child relationships, project-scoped overrides, and built-in vs. custom agent distinction
- Project organization with associated Git repositories, favorites, and archiving support
- Reusable prompt templates with `{{placeholder}}` syntax, categorized by domain (backend, UI, data, security, Electron)
- Workflow pause/resume with auto-pause behavior and user attention notifications
- Audit logging for all workflow step executions with token usage statistics
- Persistent application settings organized by category (workflow, worktree, logging, UI) with auto-save
- Four-region app shell with collapsible sidebar, header, main content area, and status bar
- Data tables with column resizing, drag-and-drop header reordering, sorting, filtering, and persistence via `electron-store`
- Dedicated debug log viewer window with session filtering, log level filtering, and full-text search
- Cross-platform desktop distribution (Windows NSIS, macOS DMG, Linux AppImage/deb)
- Git worktree integration for isolated workflow execution environments
- Type-safe IPC layer with domain-namespaced channels and centralized handler registration

## 5. Folder Structure

- **`app/`** — Next.js App Router pages and layouts
  - **`app/(app)/`** — Main application route group with shell layout (sidebar, header, status bar)
    - **`agents/`** — Agent management page and layout
    - **`dashboard/`** — Dashboard with statistics, active workflows, favorites, and quick actions
    - **`projects/[id]/`** — Project detail page with type-safe route params
    - **`settings/`** — Application settings page
    - **`templates/`** — Prompt template management page
    - **`workflows/`** — Workflow list (active, created, history) and detail view (`[id]/`)
  - **`app/debug/`** — Standalone debug log viewer (loaded in separate Electron window)

- **`components/`** — React components organized by domain
  - **`agents/`** — Agent CRUD, editor dialog, tools/skills/hooks managers, table/grid views
  - **`dashboard/`** — Dashboard widget components (statistics, active workflows, favorites, quick actions)
  - **`data/`** — Data-layer utilities (`QueryErrorBoundary`)
  - **`debug/`** — Debug log viewer components (entry, filters, search, toolbar)
  - **`projects/`** — Project CRUD dialogs, table, detail overview with stats/repos/activity
  - **`providers/`** — React context providers (QueryProvider, ThemeProvider, ToastProvider, ShellLayoutProvider)
  - **`repositories/`** — Repository CRUD dialogs and card components
  - **`settings/`** — Settings form with category sections (workflow, worktree, logging, UI, debug)
  - **`shell/`** — App shell components (AppHeader, AppSidebar, StatusBar, NavItem)
  - **`templates/`** — Template CRUD dialogs, table, and placeholder management
  - **`ui/`** — Shared UI primitives built on Base UI + CVA
    - **`ui/ai/`** — AI-specific components (streaming analysis, chain-of-thought, code blocks, reasoning)
    - **`ui/form/`** — TanStack Form field components (text, textarea, select, checkbox, switch, color picker, etc.)
    - **`ui/table/`** — TanStack Table components (DataTable, column headers, pagination, row actions, resize handles)
  - **`workflows/`** — Workflow CRUD, table, and detail view
    - **`workflows/detail/`** — Workflow execution UI (step accordion, streaming panel, top bar)
    - **`workflows/detail/steps/`** — Step-specific content (clarification questions, file discovery, refinement, planning)

- **`db/`** — Database layer
  - **`db/schema/`** — Drizzle ORM table definitions (18 tables: agents, workflows, projects, templates, settings, etc.)
  - **`db/repositories/`** — Repository-pattern data access classes with a shared `BaseRepository`
  - **`db/seed/`** — Seed data for built-in agents, templates, and default settings

- **`drizzle/`** — Generated SQL migration files

- **`electron/`** — Electron main process code
  - **`electron/ipc/`** — IPC handler modules organized by domain (27 handler files + centralized `channels.ts`)
  - **`electron/services/`** — Business logic services for agent execution
    - **`electron/services/agent-step/`** — Core agent execution framework (base service, SDK executor, timeout, retry, audit, heartbeat, structured output validation)
  - **`electron/main.ts`** — Application entry point (window creation, DB init, menu, shortcuts)
  - **`electron/preload.ts`** — Context bridge exposing `window.electronAPI`

- **`hooks/`** — Custom React hooks
  - **`hooks/electron/`** — Electron IPC bridge hooks (`use-electron-base.ts` and domain-specific hooks)
  - **`hooks/queries/`** — TanStack Query hooks for all data domains (agents, workflows, projects, templates, settings, etc.)
  - **`hooks/agents/`** — Agent page state management hooks (filters, dialogs, editor form)
  - **`hooks/templates/`** — Template page state management hooks

- **`lib/`** — Shared library code
  - **`lib/queries/`** — TanStack Query key factory definitions per domain
  - **`lib/stores/`** — Zustand stores (shell, workflow detail, debug log, agent/template layout, clarification)
  - **`lib/validations/`** — Zod schemas for all domains (agent, workflow, template, settings, etc.)
  - **`lib/forms/`** — Shared TanStack Form hook factory
  - **`lib/constants/`** — Application constants (Claude tools list, clarification config)
  - **`lib/utils/`** — Utility functions (agent activity transforms, markdown processing)

- **`types/`** — Global TypeScript type definitions (`electron.d.ts`, `agent-stream.d.ts`, `debug-log.d.ts`, etc.)

- **`scripts/`** — Build scripts (`build-preloads.mjs` for esbuild-based preload bundling)

## 6. Architecture

- **Electron + Next.js Hybrid** — Next.js serves as the renderer process (dev server in development, static export in production via `output: 'export'`). Electron provides the desktop shell, native APIs, and database access. The two communicate exclusively through a type-safe IPC layer.

- **Domain-Namespaced IPC Pattern** — All Electron IPC channels follow a `{domain}:{action}` naming convention (e.g., `workflow:create`, `agent:list`) defined in a centralized `channels.ts`. Each domain has a dedicated handler file registered through `registerAllHandlers()`. React hooks in `hooks/electron/` mirror the IPC domains for clean frontend integration.

- **Repository Pattern for Data Access** — All database operations go through repository classes (`db/repositories/`) that extend a shared `BaseRepository`. Each repository encapsulates Drizzle ORM queries for a single domain, keeping SQL concerns isolated from IPC handlers and services.

- **Multi-Step Agent Workflow Engine** — Workflows execute through a pipeline of typed steps (`clarification` -> `refinement` -> `discovery` -> `planning`). Each step type has a dedicated service class extending `BaseAgentStepService`, which provides session lifecycle management, retry with exponential backoff, timeout handling, heartbeat monitoring, and structured output validation via the Claude Agent SDK.

- **TanStack Query as Server State Layer** — All data from Electron IPC is treated as "server state" managed by TanStack Query. Query keys are defined via `@lukemorales/query-key-factory` in `lib/queries/`. Mutations invalidate relevant queries for automatic UI synchronization. Electron IPC hooks in `hooks/electron/domains/` serve as the query/mutation function providers.

- **Component Architecture with Base UI + CVA** — UI primitives in `components/ui/` wrap Base UI headless components with CVA-driven variant styling and Tailwind CSS. Feature components in domain folders compose these primitives. Form fields in `components/ui/form/` integrate TanStack Form with the UI primitives for consistent form behavior across the app.

- **Zustand for Client-Only UI State** — Ephemeral UI state (sidebar collapse, layout preferences, debug log filters, workflow detail panel state) lives in Zustand stores under `lib/stores/`. Some stores persist to `electron-store` via IPC for cross-session continuity, while others are purely in-memory.

- **Centralized Validation with Zod** — All data flowing through the application (IPC payloads, form submissions, agent output) is validated against Zod schemas defined in `lib/validations/`. The `drizzle-zod` integration derives base schemas from database table definitions, which are then extended for specific use cases.

## 7. Development Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start the Next.js development server on port 3000 |
| `pnpm build` | Build the Next.js application for production |
| `pnpm electron:dev` | Start Next.js dev server and Electron concurrently (waits for port 3000) |
| `pnpm electron:compile` | Compile Electron TypeScript and bundle preload scripts with esbuild |
| `pnpm electron:build` | Full Electron production build (Next.js static export + Electron compile) |
| `pnpm electron:dist` | Build and package for distribution via electron-builder (NSIS/DMG/AppImage) |
| `pnpm lint` | Run ESLint with auto-fix and caching |
| `pnpm format` | Format all files with Prettier |
| `pnpm typecheck` | Run TypeScript type checking without emitting |
| `pnpm db:generate` | Generate Drizzle ORM migration files from schema changes |
| `pnpm next-typesafe-url` | Generate type-safe route parameter definitions |
| `pnpm start` | Start the Next.js production server (web mode only) |
