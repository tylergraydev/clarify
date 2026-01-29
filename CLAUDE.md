# Clarify - Project Overview

## 1. Project Overview

Clarify is a standalone Electron desktop application that provides a visual interface for orchestrating Claude Code CLI workflows, enabling granular control over AI-assisted feature planning and implementation processes. It transforms the opaque CLI experience into a transparent pipeline where users can pause, review, edit, and resume at any step while maintaining comprehensive audit trails.

## 2. Purpose

- **Visual Pipeline Control**: Wraps Claude Code CLI with a visual interface showing real-time progress, configurable pause points, and inline editing of intermediate outputs at each orchestration step.

- **Workflow Orchestration**: Manages planning workflows (Feature Request → Clarify → Refine → Discover → Plan) and implementation workflows (Plan → Route → Specialist Steps → Quality Gate) with full intervention capabilities.

- **Parallel Execution Support**: Enables multiple concurrent workflows via automatic git worktree management, allowing users to plan one feature while implementing another on isolated branches.

- **Comprehensive Audit Trail**: Maintains queryable SQLite database records of all workflow steps, agent interactions, and file discoveries with exportable log files for compliance and debugging.

- **Agent Customization**: Bundles specialist agents (database-schema, tanstack-query, frontend-component, etc.) with visual editors for prompt customization at both global and project-specific levels.

## 3. Tech Stack

### Core Framework
- **Next.js** 16.1.6 - React framework with App Router (static export for Electron)
- **Electron** 35.1.0 - Desktop application runtime
- **React** 19.2.4 - UI library
- **TypeScript** 5.x - Type-safe development with strict mode

### Database & Backend
- **better-sqlite3** 12.6.0 - SQLite database driver
- **Drizzle ORM** 0.45.1 - TypeScript ORM with migrations
- **drizzle-kit** 0.31.8 - Schema migration tooling
- **drizzle-zod** 0.8.3 - Schema validation integration
- **electron-store** 10.0.1 - Persistent key-value storage

### UI Components & Styling
- **@base-ui/react** 1.1.0 - Unstyled accessible component primitives
- **Tailwind CSS** 4.x - Utility-first CSS framework
- **class-variance-authority (CVA)** 0.7.1 - Variant-based component styling
- **tailwind-merge** 3.4.0 - Tailwind class conflict resolution
- **lucide-react** 0.562.0 - Icon library
- **Geist** - Primary font family (sans and mono)

### State Management & Data Fetching
- **TanStack Query** 5.90.18 - Server state management with devtools
- **TanStack Form** 1.27.7 - Type-safe form management
- **Zustand** 5.0.10 - Client state management
- **@lukemorales/query-key-factory** 1.3.4 - Structured query key management
- **nuqs** 2.8.6 - URL query state synchronization

### Validation & Utilities
- **Zod** 4.3.5 - Schema validation
- **zod-validation-error** 5.0.0 - Human-readable validation errors
- **date-fns** 4.1.0 - Date manipulation
- **clsx** 2.1.1 - Conditional className utility
- **next-typesafe-url** 6.1.0 - Type-safe routing

### Development Tools
- **ESLint** 9.x with eslint-config-next, prettier, perfectionist, better-tailwindcss, react-snob plugins
- **Prettier** 3.8.0 - Code formatting
- **electron-builder** 25.1.8 - Application packaging
- **concurrently** 9.1.2 - Parallel script execution

### Additional Features
- **shiki** 3.21.0 - Syntax highlighting
- **streamdown** 2.0.1 - Markdown streaming
- **react-error-boundary** 6.1.0 - Error handling
- **use-stick-to-bottom** 1.1.1 - Auto-scroll behavior

## 4. Key Features

- Visual pipeline view with expandable step details for workflow monitoring
- Configurable pause points between orchestration steps (auto-pause vs continuous)
- Inline editing of all intermediate outputs (refined requests, discovered files, plans)
- Multi-project support with grouped repository management
- Automatic git worktree lifecycle management for parallel implementations
- Comprehensive audit logging with per-workflow export capability
- Template library for common feature request patterns with placeholder support
- Specialist agent configuration with customizable prompts and tool allowlists
- File discovery management with priority assignment and include/exclude controls
- Real-time workflow state management (pending, running, paused, completed, failed, cancelled)
- Dark/light/system theme support via CSS variables
- Collapsible sidebar navigation with persistent state
- Type-safe Electron IPC bridge with namespaced channel handlers
- TanStack Query integration for optimistic updates and cache invalidation
- Four-region app shell layout (header, sidebar, content, status bar)

## 5. Folder Structure

- **`app/`** - Next.js App Router pages and layouts
  - `(app)/` - Main application route group with app shell layout
    - `dashboard/` - Dashboard overview page
    - `workflows/` - Workflow management (list, active, history)
    - `agents/` - Agent configuration page
    - `templates/` - Template library page
    - `settings/` - Application settings page
  - `globals.css` - Global styles and Tailwind configuration
  - `layout.tsx` - Root layout with providers (Query, Theme, Toast, Nuqs)

- **`components/`** - React components organized by concern
  - `data/` - Data display components (query-error-boundary)
  - `providers/` - Context providers (QueryProvider, ThemeProvider, ToastProvider)
  - `shell/` - App shell components (AppHeader, AppSidebar, StatusBar, NavItem, ProjectSelector)
  - `ui/` - Reusable UI primitives built on Base UI with CVA patterns
    - `form/` - TanStack Form field components (TextField, SelectField, CheckboxField, etc.)
    - `focus-management/` - Form focus context and HOC

- **`db/`** - Database layer
  - `index.ts` - Database initialization and connection management
  - `schema/` - Drizzle ORM schema definitions (19 tables including projects, workflows, workflow_steps, agents, templates, audit_logs, discovered_files, etc.)
  - `repositories/` - Data access layer with typed repository classes

- **`electron/`** - Electron main process code
  - `main.ts` - Application entry point, window creation, database initialization
  - `preload.ts` - Context bridge with typed ElectronAPI interface
  - `ipc/` - IPC handlers organized by domain (agent, audit, dialog, discovery, fs, project, repository, step, store, template, workflow)

- **`hooks/`** - Custom React hooks
  - `queries/` - TanStack Query hooks for each domain (useWorkflows, useProjects, useAgents, etc.)
  - `use-electron.ts` - Electron API detection and access hook
  - `use-toast.ts` - Toast notification hook
  - `use-controllable-state.ts` - Controlled/uncontrolled state helper
  - `use-debounced-callback.ts` - Debouncing utility hook

- **`lib/`** - Shared utilities and configuration
  - `forms/` - Form configuration and utilities
  - `queries/` - TanStack Query key factories using @lukemorales/query-key-factory
  - `stores/` - Zustand stores (shell-store for sidebar/navigation state)
  - `theme/` - Theme configuration
  - `utils.ts` - Common utilities (cn function for classNames)

- **`types/`** - TypeScript type definitions
  - `component-types.ts` - Shared component prop types
  - `electron.d.ts` - ElectronAPI global type declarations

- **`docs/`** - Project documentation
  - `clarify-design-document.md` - Comprehensive design specification
  - `database-design-document.md` - Database schema documentation

- **`drizzle/`** - Database migration files

## 6. Architecture

- **Electron IPC Bridge Pattern**: Type-safe communication between renderer and main processes using namespaced IPC channels with a comprehensive preload API that exposes domain-specific methods (agent, app, audit, dialog, discovery, fs, project, repository, step, store, template, workflow).

- **Repository Pattern**: Database access abstracted through typed repository classes that encapsulate Drizzle ORM queries, providing clean separation between business logic and data persistence.

- **Query Key Factory Pattern**: Centralized TanStack Query key management using @lukemorales/query-key-factory, enabling consistent cache invalidation patterns and type-safe query composition across all data domains.

- **CVA Component Pattern**: UI components built on Base UI primitives with class-variance-authority for variant-based styling, enabling consistent theming while maintaining accessibility guarantees.

- **Provider Composition**: Root layout composes NuqsAdapter, QueryProvider, ThemeProvider, and ToastProvider to establish application-wide contexts without prop drilling.

- **App Shell Layout**: Four-region design with fixed header, collapsible sidebar, scrollable main content, and status bar, managed through Zustand store for sidebar state persistence.

- **Domain-Organized IPC Handlers**: Main process IPC handlers grouped by domain (agent.handlers.ts, workflow.handlers.ts, etc.) with centralized registration, enabling clean separation of concerns and testability.

- **Schema-First Database Design**: Drizzle ORM schemas define the data model with automatic type inference, Zod integration for validation, and migration support via drizzle-kit.

## 7. Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js development server on port 3000 |
| `pnpm build` | Build Next.js production bundle |
| `pnpm start` | Start Next.js production server |
| `pnpm electron:dev` | Run full Electron dev environment (Next.js + Electron concurrently) |
| `pnpm electron:compile` | Compile Electron TypeScript to JavaScript |
| `pnpm electron:build` | Build both Next.js and Electron for production |
| `pnpm electron:dist` | Package Electron app for distribution using electron-builder |
| `pnpm typecheck` | Run TypeScript type checking without emit |
| `pnpm lint` | Run ESLint with auto-fix and caching |
| `pnpm format` | Format all files with Prettier |
| `pnpm db:generate` | Generate Drizzle migrations from schema changes |
| `pnpm db:migrate` | Apply pending database migrations |
| `pnpm next-typesafe-url` | Generate type-safe route definitions |
