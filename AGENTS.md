# Clarify (Claude Orchestrator)

## Project Overview

Clarify is a standalone Electron desktop application that provides a visual interface for orchestrating Claude Code CLI workflows. It wraps the Claude Code CLI with a pipeline-based UI, enabling configurable pause points, inline editing of intermediate outputs, comprehensive audit trails, and support for multiple concurrent workflows via git worktrees.

## Purpose

- **Visual Workflow Orchestration**: Provides a polished UI with real-time visibility into Claude Code CLI execution, replacing blind waiting with step-by-step progress tracking
- **Intervention Control**: Enables pausing, reviewing, and modifying intermediate outputs at any step of the planning or implementation process
- **Comprehensive Audit Trail**: Maintains queryable SQLite database of all workflow events, enabling full traceability of what happened during orchestration
- **Concurrent Workflow Support**: Allows multiple simultaneous implementations via auto-managed git worktrees, with isolated feature branches
- **Customizable Agent Library**: Bundles specialist agents with visual editors for project-specific customization and template management

## Tech Stack

### Core Framework

- **next** 16.1.6 - React framework with static export for Electron renderer
- **react** 19.2.4 - UI library with latest concurrent features
- **electron** ^35.1.0 - Desktop application wrapper for cross-platform deployment
- **electron-serve** ^2.1.1 - Static file serving for production Electron builds
- **electron-store** ^10.0.1 - Persistent key-value storage for Electron apps

### Database & Backend

- **better-sqlite3** ^12.6.0 - SQLite database for local data persistence
- **drizzle-orm** ^0.45.1 - TypeScript ORM for schema definition and queries
- **drizzle-kit** ^0.31.8 - Migration generation and database management
- **drizzle-zod** ^0.8.3 - Automatic Zod schema generation from Drizzle schemas

### UI Components & Styling

- **@base-ui/react** ^1.1.0 - Unstyled, accessible component primitives
- **tailwindcss** ^4 - Utility-first CSS framework
- **class-variance-authority** ^0.7.1 - Component variant management (CVA pattern)
- **tailwind-merge** ^3.4.0 - Intelligent Tailwind class merging
- **clsx** ^2.1.1 - Conditional className composition
- **lucide-react** ^0.562.0 - Icon library
- **tw-animate-css** ^1.4.0 - Tailwind animation utilities

### State Management & Data Fetching

- **@tanstack/react-query** ^5.90.18 - Server state management and caching
- **@tanstack/react-query-devtools** ^5.91.2 - Query debugging tools
- **@lukemorales/query-key-factory** ^1.3.4 - Type-safe query key management
- **zustand** ^5.0.10 - Lightweight client-side state management

### Forms & Tables

- **@tanstack/react-form** ^1.27.7 - Form state management with validation
- **@tanstack/react-table** ^8.21.3 - Headless table with sorting, filtering, pagination
- **@tanstack/react-virtual** ^3.13.18 - Virtualization for large lists

### Validation & Utilities

- **zod** ^4.3.5 - Schema validation and type inference
- **zod-validation-error** ^5.0.0 - Human-readable Zod error formatting
- **date-fns** ^4.1.0 - Date utility library
- **yaml** ^2.8.2 - YAML parsing for agent definitions
- **nuqs** ^2.8.6 - URL query state management

### Routing & Navigation

- **next-typesafe-url** ^6.1.0 - Type-safe URL parameter handling

### Code Display

- **shiki** ^3.21.0 - Syntax highlighting
- **streamdown** ^2.0.1 - Markdown streaming support

### UI Utilities

- **react-error-boundary** ^6.1.0 - Error boundary components
- **use-stick-to-bottom** ^1.1.1 - Auto-scroll behavior

### Development Tools

- **typescript** ^5 - Type-safe JavaScript
- **eslint** ^9 - Code linting
- **eslint-config-next** 16.1.2 - Next.js ESLint rules
- **eslint-plugin-perfectionist** ^5.3.1 - Import/export sorting
- **eslint-plugin-better-tailwindcss** ^4.0.1 - Tailwind class validation
- **eslint-plugin-react-snob** ^0.0.26 - React best practices
- **prettier** ^3.8.0 - Code formatting
- **concurrently** ^9.1.2 - Parallel command execution
- **cross-env** ^7.0.3 - Cross-platform environment variables
- **electron-builder** ^25.1.8 - Electron packaging and distribution
- **wait-on** ^8.0.3 - Wait for resources before starting

## Key Features

- Pipeline view with expandable step details for planning and implementation workflows
- Configurable pause behavior (continuous, auto-pause, gates-only) between workflow steps
- Inline editing of workflow step outputs with regeneration capability
- File discovery editor with priority levels, include/exclude toggles, and manual file addition
- Routing table generation for automatic step-to-agent mapping
- Implementation workflow with per-step progress tracking and specialist agent delegation
- Git worktree management for isolated concurrent implementations
- Project and repository management with multi-repo support
- Agent editor with visual tool configuration and system prompt editing
- Template library with placeholder support for common feature patterns
- Settings panel for workflow execution, timeouts, and git configuration
- Dashboard with active workflows, quick actions, and statistics widgets
- Workflow history with filtering by date range, status, and type
- Audit log capture for all workflow events with exportable markdown format
- Theme support with light/dark mode toggle
- Toast notifications for async operation feedback
- Responsive sidebar with collapsible navigation
- Data tables with column reordering, resizing, and persistence

## Folder Structure

```
clarify/
├── app/                           # Next.js App Router pages
│   ├── (app)/                     # Main application route group
│   │   ├── agents/                # Agent management page
│   │   ├── dashboard/             # Dashboard with widgets
│   │   ├── projects/              # Project list and detail pages
│   │   │   └── [id]/              # Dynamic project detail route
│   │   ├── settings/              # Application settings
│   │   ├── templates/             # Template library
│   │   └── workflows/             # Workflow pages
│   │       ├── [id]/              # Workflow detail with pipeline view
│   │       ├── active/            # Active workflows list
│   │       ├── history/           # Workflow history table
│   │       └── new/               # New workflow creation
│   ├── layout.tsx                 # Root layout with providers
│   └── page.tsx                   # Root redirect
├── components/                    # React components
│   ├── agents/                    # Agent-related components (cards, tables, dialogs)
│   ├── data/                      # Data handling components (error boundaries)
│   ├── projects/                  # Project management components
│   ├── providers/                 # React context providers
│   ├── repositories/              # Repository management components
│   ├── settings/                  # Settings form components
│   ├── shell/                     # App shell (header, sidebar, nav)
│   ├── templates/                 # Template management components
│   ├── ui/                        # Base UI primitives
│   │   ├── form/                  # TanStack Form field components
│   │   └── table/                 # Data table components
│   └── workflows/                 # Workflow UI components
├── db/                            # Database layer
│   ├── repositories/              # Repository pattern implementations
│   ├── schema/                    # Drizzle ORM schema definitions
│   ├── seed/                      # Database seeding scripts
│   └── index.ts                   # Database connection
├── docs/                          # Implementation documentation
│   ├── clarify-design-document.md # Main design specification
│   ├── database-design-document.md
│   └── [date]/                    # Date-organized implementation logs
├── drizzle/                       # Generated migrations
├── electron/                      # Electron main process
│   ├── ipc/                       # IPC handlers by domain
│   ├── main.ts                    # Main process entry
│   └── preload.ts                 # Preload script for IPC bridge
├── hooks/                         # Custom React hooks
│   └── queries/                   # TanStack Query hooks
├── lib/                           # Shared utilities
│   ├── colors/                    # Color constants
│   ├── constants/                 # Application constants
│   ├── forms/                     # Form utilities
│   ├── layout/                    # Layout constants
│   ├── queries/                   # Query key factories
│   ├── stores/                    # Zustand stores
│   ├── theme/                     # Theme configuration
│   ├── utils/                     # Utility functions
│   └── validations/               # Zod validation schemas
├── types/                         # TypeScript type definitions
├── .claude/                       # Claude Code configuration
│   ├── agents/                    # Specialist subagent definitions
│   ├── commands/                  # Custom slash commands
│   └── skills/                    # Reusable skill definitions
└── public/                        # Static assets
```

## Architecture

- **Electron IPC Bridge**: Main process exposes database and system operations to renderer via typed IPC channels defined in `electron/ipc/channels.ts`. Handlers are organized by domain (agent, workflow, project, etc.) with each handler file following a consistent pattern.

- **Repository Pattern**: Database access is abstracted through repository classes in `db/repositories/`. Each entity has a dedicated repository with CRUD operations and custom queries, enabling testability and separation of concerns.

- **TanStack Query for Server State**: All data fetching uses TanStack Query with query key factories from `@lukemorales/query-key-factory`. Query hooks in `hooks/queries/` wrap IPC calls with proper caching, invalidation, and optimistic updates.

- **Component Architecture with CVA**: UI components use Base UI primitives with class-variance-authority (CVA) for variant management. Components follow a consistent pattern with separated styling, compound components, and proper TypeScript types.

- **Form Management with TanStack Form**: Forms use TanStack Form with custom field components in `components/ui/form/`. Each field wraps Base UI primitives with validation, error display, and accessibility support.

- **Zustand for UI State**: Client-side state like sidebar collapse, view preferences, and layout settings use Zustand stores in `lib/stores/`. Stores support persistence with middleware for cross-session state.

- **Specialist Subagent Delegation**: The codebase uses an orchestrator pattern where high-level commands delegate work to specialist subagents. Each subagent (database-schema, frontend-component, etc.) has focused responsibilities and required skills.

- **Skills System**: Reusable convention documents in `.claude/skills/` provide consistent patterns for different domains. Skills are loaded by subagents and enforce project-specific coding standards.

## Development Commands

| Command                  | Description                                                                 |
| ------------------------ | --------------------------------------------------------------------------- |
| `pnpm dev`               | Start Next.js development server                                            |
| `pnpm build`             | Build Next.js for production                                                |
| `pnpm start`             | Start production server                                                     |
| `pnpm electron:dev`      | Run Electron in development mode (starts Next.js and Electron concurrently) |
| `pnpm electron:compile`  | Compile TypeScript in electron/ directory                                   |
| `pnpm electron:build`    | Build Next.js with Electron target and compile TypeScript                   |
| `pnpm electron:dist`     | Build and package Electron app for distribution                             |
| `pnpm db:generate`       | Generate Drizzle migrations from schema changes                             |
| `pnpm db:migrate`        | Apply pending migrations to database                                        |
| `pnpm lint`              | Run ESLint with auto-fix                                                    |
| `pnpm typecheck`         | Run TypeScript type checking                                                |
| `pnpm format`            | Format code with Prettier                                                   |
| `pnpm next-typesafe-url` | Generate type-safe URL types                                                |

## Project Documentation Conventions

| Document Type         | Location                                                              |
| --------------------- | --------------------------------------------------------------------- |
| Design Specifications | `docs/clarify-design-document.md`, `docs/database-design-document.md` |
| Implementation Logs   | `docs/[date]/implementation/[feature]/`                               |
| Orchestration Logs    | `docs/[date]/orchestration/[feature]/`                                |
| Implementation Plans  | `docs/[date]/plans/[feature]-implementation-plan.md`                  |
| Skill Conventions     | `.claude/skills/[skill-name]/references/`                             |

@.claude/available-agents.md
