# Clarify

## Project Overview

Clarify is an Electron-based desktop application that transforms informal feature requests into actionable implementation plans using AI-powered workflows. Built with Next.js, TypeScript, and the Claude Agent SDK, it orchestrates multi-step planning processes through specialized AI agents that perform clarification, refinement, file discovery, and detailed implementation planning. The application provides a comprehensive workspace for managing projects, workflows, templates, and custom AI agents with persistent SQLite storage.

## Purpose

- **Automated Feature Planning**: Transform vague feature ideas into detailed implementation plans through AI-driven workflows that clarify requirements, refine context, discover relevant files, and generate step-by-step implementation guides with quality gates
- **Multi-Agent Orchestration**: Leverage specialized AI agents (clarification, file discovery, implementation planning) alongside custom project-specific agents to break down complex development tasks into manageable steps with intelligent automation
- **Development Workflow Management**: Track active and historical workflows across projects, monitor progress through pipeline visualizations, manage implementation steps, and organize feature requests with persistent state and debug logging
- **Repository Integration**: Connect local Git repositories to projects, manage worktrees for isolated development, browse and discover files for planning context, and maintain project-specific configurations
- **Template-Driven Consistency**: Create reusable workflow templates with customizable placeholders, standardize planning processes across teams, and maintain consistent implementation patterns through structured prompt engineering

## Tech Stack

### Core Framework

- **next** 16.1.6 - React framework providing the application shell, routing, and server-side rendering capabilities for the Electron renderer process
- **react** 19.2.4 - UI library for building the component-based interface
- **react-dom** 19.2.4 - React renderer for web environments
- **electron** ^35.1.0 - Desktop application framework wrapping Next.js for cross-platform native apps
- **electron-serve** ^2.1.1 - Static file serving for production Electron builds
- **electron-builder** ^25.1.8 - Packaging and distribution tool for creating installable Electron applications

### Database & Backend

- **drizzle-orm** ^0.45.1 - TypeScript ORM providing type-safe database queries and migrations for SQLite
- **drizzle-kit** ^0.31.8 - Migration generator and schema management tooling for Drizzle ORM
- **drizzle-zod** ^0.8.3 - Zod schema generator from Drizzle table definitions for validation
- **better-sqlite3** ^12.6.0 - Synchronous SQLite3 driver used as the database engine for local persistence
- **electron-store** ^10.0.1 - Simple data persistence for Electron settings and preferences

### UI Components & Styling

- **@base-ui/react** ^1.1.0 - Unstyled, accessible UI primitive components (Dialog, Select, etc.) providing the foundation for custom components
- **class-variance-authority** ^0.7.1 - CVA pattern utility for building variant-based component APIs
- **clsx** ^2.1.1 - Utility for constructing className strings conditionally
- **tailwind-merge** ^3.4.0 - Utility to merge Tailwind CSS classes without conflicts
- **tailwindcss** ^4 - Utility-first CSS framework for styling
- **tw-animate-css** ^1.4.0 - Tailwind CSS animations plugin
- **lucide-react** ^0.562.0 - Icon library providing React components for UI icons

### State Management & Data Fetching

- **@tanstack/react-query** ^5.90.18 - Async state management for server data fetching, caching, and synchronization
- **@tanstack/react-query-devtools** ^5.91.2 - Developer tools for debugging React Query state
- **@lukemorales/query-key-factory** ^1.3.4 - Factory pattern for organizing React Query keys across the application
- **zustand** ^5.0.10 - Lightweight state management for client-side UI state (layout preferences, filters, ephemeral data)
- **nuqs** ^2.8.6 - Type-safe URL state management synchronized with Next.js search params

### Forms & Tables

- **@tanstack/react-form** ^1.27.7 - Headless form library with validation and field-level state management
- **@tanstack/react-table** ^8.21.3 - Headless table library for building data tables with sorting, filtering, and pagination
- **@tanstack/react-virtual** ^3.13.18 - Virtual scrolling for rendering large lists efficiently

### Validation & Utilities

- **zod** ^4.3.5 - TypeScript-first schema validation library used throughout forms and API boundaries
- **zod-validation-error** ^5.0.0 - Human-readable error messages from Zod validation failures
- **date-fns** ^4.1.0 - Date manipulation and formatting utilities
- **yaml** ^2.8.2 - YAML parser for reading agent configuration files

### AI & Streaming

- **@anthropic-ai/claude-agent-sdk** ^0.2.29 - Official SDK for integrating Claude AI agents with streaming support
- **streamdown** ^2.0.1 - Markdown streaming parser for AI responses
- **shiki** ^3.21.0 - Syntax highlighter for displaying code blocks in markdown content

### Development Tools

- **typescript** ^5 - Type-safe JavaScript with static typing
- **eslint** ^9 - Linting tool for code quality and consistency
- **eslint-config-next** 16.1.2 - Next.js-specific ESLint rules
- **eslint-config-prettier** ^10.1.8 - Disables ESLint rules that conflict with Prettier
- **eslint-plugin-better-tailwindcss** ^4.0.1 - Tailwind CSS class ordering and validation
- **eslint-plugin-perfectionist** ^5.3.1 - Sorts imports, objects, and other code structures
- **eslint-plugin-react-snob** ^0.0.26 - React best practices enforcement
- **prettier** ^3.8.0 - Code formatter for consistent style
- **typescript-eslint** ^8.53.0 - TypeScript support for ESLint
- **concurrently** ^9.1.2 - Run multiple commands concurrently (dev server + Electron)
- **cross-env** ^7.0.3 - Cross-platform environment variable setting
- **wait-on** ^8.0.3 - Wait for resources (like dev server) before starting Electron

### Additional Features

- **next-typesafe-url** ^6.1.0 - Type-safe routing with compile-time route validation
- **react-error-boundary** ^6.1.0 - Error boundary components for graceful error handling
- **use-stick-to-bottom** ^1.1.1 - Hook for auto-scrolling to bottom (used in logs/streams)
- **electron-log** ^5.4.3 - Logging library for Electron main and renderer processes

## Key Features

- Multi-step AI workflow orchestration (clarification → refinement → file discovery → implementation planning)
- Custom AI agent creation and management with configurable tools, skills, hooks, and system prompts
- Project-based organization with repository linking and worktree management
- Real-time workflow tracking with status updates, progress indicators, and step-by-step visualization
- Interactive pipeline view showing workflow progression through planning phases
- Specialized agents for database schemas, TanStack libraries, React components, IPC handlers, and Next.js pages
- Template system for reusable workflow configurations with placeholder substitution
- File discovery agent that intelligently identifies relevant files for feature implementation
- Clarification agent that assesses feature request ambiguity and generates targeted questions
- Refinement agent that enhances feature requests with project-specific context
- Implementation planner that generates detailed markdown plans with quality gates
- Dashboard with quick actions, favorite projects, active workflows, and statistics
- Agent import/export functionality for sharing agent configurations
- Built-in agents for Claude Code integration and specialized development tasks
- Project-specific agent customization and inheritance
- Workflow pause/resume with configurable pause behaviors (continuous, auto-pause, gates-only)
- Debug log viewer in separate window for real-time debugging
- Settings management for paths, logging, UI preferences, and workflow defaults
- Audit logging for tracking system changes and user actions
- Comprehensive data tables with sorting, filtering, column visibility, and resize
- Form validation with Zod schemas and field-level error messages
- Responsive UI with dark/light theme support
- Type-safe IPC communication between Electron main and renderer processes
- SQLite database with Drizzle ORM migrations and repository pattern
- React Query for server state caching and optimistic updates
- Keyboard shortcuts for common actions and navigation
- Toast notifications for user feedback and error messages

## Folder Structure

```
clarify/
├── .claude/                    - Claude Code configuration
│   ├── agents/                - Specialist subagent definitions
│   └── commands/              - Custom slash commands
├── app/                       - Next.js App Router pages
│   ├── (app)/                - Main application routes
│   │   ├── agents/           - Agent management UI
│   │   ├── dashboard/        - Dashboard overview page
│   │   ├── projects/         - Project list and detail pages
│   │   ├── settings/         - Settings page
│   │   ├── templates/        - Template management
│   │   └── workflows/        - Workflow pages (active, history, detail)
│   ├── debug/                - Debug log viewer page
│   ├── layout.tsx            - Root layout with providers
│   └── globals.css           - Global styles and Tailwind imports
├── components/                - React components
│   ├── agents/               - Agent management components
│   ├── dashboard/            - Dashboard widgets
│   ├── data/                 - Data display components
│   ├── projects/             - Project-related components
│   ├── providers/            - Context providers (Query, Theme, Toast)
│   ├── repositories/         - Repository management components
│   ├── settings/             - Settings form sections
│   ├── shell/                - App shell (header, navigation)
│   ├── templates/            - Template management components
│   ├── ui/                   - Reusable UI primitives
│   │   ├── form/             - Form field components
│   │   └── table/            - Table components
│   └── workflows/            - Workflow-related components
├── db/                        - Database layer
│   ├── repositories/         - Repository pattern implementations
│   ├── schema/               - Drizzle ORM table definitions
│   ├── seed/                 - Database seeding scripts
│   └── index.ts              - Database initialization and singleton
├── drizzle/                   - Generated SQL migrations
├── electron/                  - Electron main process
│   ├── debug-window/         - Debug window preload script
│   ├── ipc/                  - IPC handler definitions
│   ├── services/             - Business logic services
│   ├── main.ts               - Electron entry point
│   └── preload.ts            - Main window preload script
├── hooks/                     - React hooks
│   ├── agents/               - Agent-specific hooks
│   ├── queries/              - React Query hooks
│   ├── templates/            - Template-specific hooks
│   └── use-*.ts              - Generic utility hooks
├── lib/                       - Shared utilities
│   ├── colors/               - Color definitions
│   ├── constants/            - Constant values
│   ├── forms/                - Form utilities
│   ├── layout/               - Layout constants
│   ├── queries/              - Query key factories
│   ├── stores/               - Zustand stores
│   ├── theme/                - Theme configuration
│   ├── utils/                - Utility functions
│   └── validations/          - Zod validation schemas
├── public/                    - Static assets
├── types/                     - TypeScript type definitions
│   ├── agent-*.ts            - Agent-related types
│   ├── electron.d.ts         - Electron IPC types
│   └── *.d.ts                - Global type declarations
├── drizzle.config.ts          - Drizzle Kit configuration
├── electron-builder.yml       - Electron build configuration
├── eslint.config.mjs          - ESLint configuration
├── next.config.ts             - Next.js configuration
├── package.json               - Dependencies and scripts
└── tsconfig.json              - TypeScript compiler configuration
```

## Architecture

### Repository Pattern for Data Access

All database operations use the repository pattern with factory functions. Each entity (agents, projects, workflows, templates, etc.) has a corresponding repository in `db/repositories/` that provides a clean interface for CRUD operations. Repositories are instantiated with the Drizzle database instance and expose methods like `create()`, `getById()`, `getAll()`, `update()`, and `delete()`. This pattern centralizes data access logic and makes testing easier by allowing repository mocking.

### Electron IPC Communication

The application uses a type-safe IPC layer defined in `electron/ipc/` with channels organized by domain (agents, projects, workflows, settings, etc.). Each handler file exports functions that receive IPC events and interact with repositories. The main process registers all handlers via `registerAllHandlers()`, and the renderer process accesses them through a typed `window.electron` API exposed by the preload script. This architecture keeps business logic in the main process while the UI remains in the renderer.

### React Query for Server State

TanStack React Query manages all server state (data from the SQLite database via IPC). Query keys are organized using `@lukemorales/query-key-factory` in `lib/queries/`, creating a centralized registry of all queries with automatic TypeScript inference. Mutations use optimistic updates and cache invalidation to keep the UI responsive. The `QueryProvider` wraps the app to enable query caching and background refetching.

### Zustand for Client State

Client-side ephemeral state (UI preferences, filters, layout settings, temporary form data) is managed with Zustand stores in `lib/stores/`. Examples include `agent-layout-store` for agent editor view preferences, `pipeline-store` for workflow pipeline state, and `discovery-store` for file discovery UI state. Stores are small, focused, and use immer middleware for immutable updates.

### Multi-Agent Workflow Orchestration

Workflows execute in phases managed by services in `electron/services/`. Each phase (clarification, refinement, file discovery, implementation planning) streams AI responses through the Claude Agent SDK. The `agent-stream.service.ts` handles streaming events, while specialized services like `clarification-step.service.ts` and `refinement-step.service.ts` orchestrate individual steps. Workflow state is persisted to the database via the workflows repository, and progress is tracked through step records.

### Component Architecture with Base UI and CVA

UI components follow a consistent pattern: Base UI primitives from `@base-ui/react` are wrapped with project-specific styles using CVA (class-variance-authority) patterns. Components live in `components/ui/` and expose a variant-based API. Form fields use TanStack Form with field-level validation, while data tables use TanStack Table with column definitions. This approach provides full styling control while maintaining accessibility through Base UI's unstyled primitives.

### File Organization by Domain

Code is organized by domain rather than technical layer. For example, agent-related code spans `db/schema/agents.schema.ts`, `db/repositories/agents.repository.ts`, `lib/queries/agents.ts`, `hooks/queries/use-agents.ts`, `components/agents/`, and `app/(app)/agents/`. This collocation makes it easier to understand all code related to a feature in one place and reduces coupling between domains.

### Type-Safe Database Schema with Drizzle

Database schema is defined using Drizzle ORM in `db/schema/` with strict conventions: plural table names, snake_case columns, mandatory `id`, `createdAt`, and `updatedAt` fields. Tables export both insert types (`NewEntity`) and select types (`Entity`) for type safety. Migrations are auto-generated via `drizzle-kit generate` and applied with `drizzle-kit migrate`. The schema serves as the source of truth for all data types throughout the application.

## Development Commands

| Command                  | Description                                                                 |
| ------------------------ | --------------------------------------------------------------------------- |
| `pnpm dev`               | Start Next.js development server on http://localhost:3000                   |
| `pnpm build`             | Build Next.js application for production                                    |
| `pnpm start`             | Start Next.js production server                                             |
| `pnpm electron:compile`  | Compile TypeScript in electron/ directory to electron-dist/                 |
| `pnpm electron:dev`      | Run Next.js dev server and Electron concurrently for development            |
| `pnpm electron:build`    | Build both Next.js (for electron target) and compile Electron main process  |
| `pnpm electron:dist`     | Build and package Electron application for distribution                     |
| `pnpm db:generate`       | Generate Drizzle migration files from schema changes                        |
| `pnpm db:migrate`        | Apply pending migrations to the SQLite database                             |
| `pnpm lint`              | Run ESLint with auto-fix on cached files                                    |
| `pnpm format`            | Format all files with Prettier                                              |
| `pnpm typecheck`         | Run TypeScript compiler without emitting files (type checking only)         |
| `pnpm next-typesafe-url` | Generate type-safe route definitions from app directory                     |
| `pnpm postinstall`       | Install native dependencies for Electron (runs automatically after install) |

## Project Documentation Conventions

| Document Type               | Location                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Workflow orchestration logs | `docs/{YYYY_MM_DD}/orchestration/{feature-name}/`                                   |
| Implementation plans        | `docs/{YYYY_MM_DD}/plans/{feature-name}-implementation-plan.md`                     |
| Implementation results      | `docs/{YYYY_MM_DD}/implementation/{feature-name}/`                                  |
| Step-by-step execution logs | Each step saves as numbered markdown file (e.g., `01-pre-checks.md`, `02-setup.md`) |
| Clarification Q&A           | `00a-clarification.md` in orchestration directories                                 |
| Feature refinement          | `01-feature-refinement.md` in orchestration directories                             |
| File discovery results      | `02-file-discovery.md` in orchestration directories                                 |
| Planning results            | `03-implementation-planning.md` in orchestration directories                        |

## Custom Commands

| Command           | Description                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/plan-feature`   | Generate detailed implementation plans through automated 3-4 step orchestration with optional clarification                 |
| `/implement-plan` | Execute implementation plan with structured tracking and validation using subagent architecture                             |
| `/fix-file`       | Fix a single file to follow project patterns using specialist agents with automatic review and iteration                    |
| `/fix-files`      | Fix multiple files to follow project patterns using specialist agents with automatic review and iteration                   |
| `/audit-route`    | Audit a route/feature area for best practice violations across all layers (frontend through backend), optionally fix issues |
| `/audit-feature`  | Audit a specific feature for best practice violations across all layers (frontend through backend), optionally fix issues   |
| `/audit-logic`    | Audit a feature's business logic for correctness - data flow, cache invalidation, form completeness, and action behavior    |
| `/next-feature`   | Identify the next logical feature area to work on based on design document and codebase analysis                            |

## Specialist Subagents

| Agent                           | Domain                            | When to Use                                                                                                                |
| ------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `database-schema`               | Database schemas and repositories | Creating or modifying Drizzle ORM schemas, generating repositories, running migrations, and validating database code       |
| `frontend-component`            | React UI components               | Creating or modifying React components using Base UI primitives and CVA patterns, enforces component conventions           |
| `page-route`                    | Next.js pages and routing         | Creating or modifying Next.js App Router pages, layouts, loading states, and error boundaries with type-safe routing       |
| `ipc-handler`                   | Electron IPC communication        | Creating or modifying Electron IPC channels, handlers, preload scripts, and React hooks for IPC                            |
| `tanstack-form`                 | Form implementation               | Creating or modifying forms using TanStack Form with pre-built field components and validation                             |
| `tanstack-form-base-components` | Form system primitives            | Creating or modifying base form components (field components, form components) in components/ui/form/                      |
| `tanstack-query`                | Data fetching and caching         | Creating or modifying TanStack Query hooks, query keys, mutations, and cache management                                    |
| `tanstack-table`                | Data tables                       | Creating or modifying TanStack Table implementations with virtualization, server-side pagination, filtering, and sorting   |
| `zustand-store`                 | Client state management           | Creating or modifying Zustand stores with TypeScript, persist middleware, devtools, and slices pattern                     |
| `vercel-react-best-practices`   | React/Next.js optimization        | Analyzing and optimizing React and Next.js code for performance using Vercel Engineering guidelines                        |
| `claude-agent-sdk`              | Claude Agent integration          | Creating or modifying Claude Agent SDK integrations including streaming services, message handling, and session management |
| `clarification-agent`           | Feature request clarification     | Gathering clarifying questions for ambiguous feature requests through light codebase exploration                           |
| `file-discovery-agent`          | Codebase file discovery           | Identifying all files relevant to implementing a feature request with comprehensive codebase analysis                      |
| `implementation-planner`        | Implementation planning           | Creating comprehensive implementation plans for new features, refactoring, or multi-step development tasks                 |
