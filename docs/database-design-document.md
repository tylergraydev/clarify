# Claude Orchestrator - Database Schema Design Document

## Overview

This document defines the comprehensive relational database schema for the Claude Orchestrator application. The schema is designed for SQLite with Drizzle ORM, following the project's established conventions.

### Key Design Decisions

| Decision             | Choice                   | Rationale                                                             |
| -------------------- | ------------------------ | --------------------------------------------------------------------- |
| Database             | SQLite + Drizzle ORM     | Project standard, embedded, no server needed                          |
| Workflow-Repository  | Many-to-many             | Workflows can span multiple repositories                              |
| Implementation Plans | Fully normalized         | Enable UI editing of steps, reordering, agent assignment              |
| Settings             | Key-value table          | Flexible, no migrations for new settings                              |
| Deletes              | Hard cascade + archiving | Hard delete with audit logs; projects/feature requests are archivable |
| Boolean fields       | DateTime pattern         | Use `archived_at`, `deleted_at` etc. instead of `is_archived`         |

---

## Tables Overview

### Core Tables (17 total)

| #   | Table                            | Purpose                             |
| --- | -------------------------------- | ----------------------------------- |
| 1   | `projects`                       | Project groupings                   |
| 2   | `repositories`                   | Git repositories                    |
| 3   | `workflow_repositories`          | Junction: workflows to repositories |
| 4   | `worktrees`                      | Git worktree tracking               |
| 5   | `workflows`                      | Planning/implementation executions  |
| 6   | `workflow_steps`                 | Individual steps within workflows   |
| 7   | `discovered_files`               | File discovery results (editable)   |
| 8   | `agents`                         | Specialist agents                   |
| 9   | `agent_tools`                    | Agent tool permissions              |
| 10  | `agent_skills`                   | Agent skill references              |
| 11  | `templates`                      | Feature request templates           |
| 12  | `template_placeholders`          | Template placeholder definitions    |
| 13  | `implementation_plans`           | Parsed implementation plans         |
| 14  | `implementation_plan_steps`      | Plan step definitions               |
| 15  | `implementation_plan_step_files` | Files per plan step                 |
| 16  | `audit_logs`                     | Comprehensive event trail           |
| 17  | `settings`                       | Application configuration           |

---

## Detailed Table Definitions

### 1. `projects`

Project groupings containing repositories and workflows.

```typescript
// db/schema/projects.schema.ts
export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    archivedAt: text("archived_at"), // null = active, datetime = archived
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("projects_archived_at_idx").on(table.archivedAt),
    index("projects_created_at_idx").on(table.createdAt),
  ]
);
```

### 2. `repositories`

Git repositories within projects.

```typescript
// db/schema/repositories.schema.ts
export const repositories = sqliteTable(
  "repositories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    path: text("path").notNull(), // Absolute filesystem path
    name: text("name").notNull(), // Display name
    remoteUrl: text("remote_url"), // Git remote URL
    defaultBranch: text("default_branch").notNull().default("main"),
    setAsDefaultAt: text("set_as_default_at"), // null = not default, datetime = when set as default
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("repositories_project_id_idx").on(table.projectId),
    index("repositories_path_idx").on(table.path),
  ]
);
```

### 3. `workflows`

Planning or implementation workflow executions.

```typescript
// db/schema/workflows.schema.ts
export const workflowTypes = ["planning", "implementation"] as const;
export const workflowStatuses = [
  "created",
  "running",
  "paused",
  "editing",
  "completed",
  "failed",
  "cancelled",
] as const;
export const pauseBehaviors = [
  "continuous",
  "auto_pause",
  "gates_only",
] as const;

export const workflows = sqliteTable(
  "workflows",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    worktreeId: integer("worktree_id").references(() => worktrees.id, {
      onDelete: "set null",
    }),
    parentWorkflowId: integer("parent_workflow_id").references(
      () => workflows.id,
      { onDelete: "set null" }
    ),
    type: text("type").notNull(), // 'planning' | 'implementation'
    status: text("status").notNull().default("created"),
    featureName: text("feature_name").notNull(),
    featureRequest: text("feature_request").notNull(),
    pauseBehavior: text("pause_behavior").notNull().default("auto_pause"),
    currentStepNumber: integer("current_step_number").default(0),
    totalSteps: integer("total_steps"),
    errorMessage: text("error_message"),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    durationMs: integer("duration_ms"),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("workflows_project_id_idx").on(table.projectId),
    index("workflows_worktree_id_idx").on(table.worktreeId),
    index("workflows_parent_workflow_id_idx").on(table.parentWorkflowId),
    index("workflows_type_idx").on(table.type),
    index("workflows_status_idx").on(table.status),
    index("workflows_status_type_created_idx").on(
      table.status,
      table.type,
      table.createdAt
    ),
  ]
);
```

### 4. `workflow_repositories`

Junction table: workflows can span multiple repositories.

```typescript
// db/schema/workflow-repositories.schema.ts
export const workflowRepositories = sqliteTable(
  "workflow_repositories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workflowId: integer("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    setPrimaryAt: text("set_primary_at"), // null = secondary, datetime = primary repository
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("workflow_repositories_workflow_id_idx").on(table.workflowId),
    index("workflow_repositories_repository_id_idx").on(table.repositoryId),
    uniqueIndex("workflow_repositories_unique_idx").on(
      table.workflowId,
      table.repositoryId
    ),
  ]
);
```

### 5. `worktrees`

Git worktrees for concurrent implementation workflows.

```typescript
// db/schema/worktrees.schema.ts
export const worktreeStatuses = ["active", "cleaning", "removed"] as const;

export const worktrees = sqliteTable(
  "worktrees",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    workflowId: integer("workflow_id")
      .unique()
      .references(() => workflows.id, { onDelete: "set null" }),
    path: text("path").notNull().unique(),
    branchName: text("branch_name").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("worktrees_repository_id_idx").on(table.repositoryId),
    index("worktrees_status_idx").on(table.status),
  ]
);
```

### 6. `workflow_steps`

Individual steps within a workflow.

```typescript
// db/schema/workflow-steps.schema.ts
export const stepTypes = [
  "clarification",
  "refinement",
  "discovery",
  "planning",
  "routing",
  "implementation",
  "quality_gate",
  "gemini_review",
] as const;
export const stepStatuses = [
  "pending",
  "running",
  "paused",
  "editing",
  "completed",
  "failed",
  "skipped",
] as const;

export const workflowSteps = sqliteTable(
  "workflow_steps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workflowId: integer("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    agentId: integer("agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    stepType: text("step_type").notNull(),
    stepNumber: integer("step_number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("pending"),
    inputText: text("input_text"),
    outputText: text("output_text"),
    outputStructured: text("output_structured", { mode: "json" }),
    originalOutputText: text("original_output_text"),
    outputEditedAt: text("output_edited_at"), // null = not edited, datetime = when edited
    cliOutput: text("cli_output"),
    cliExitCode: integer("cli_exit_code"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    durationMs: integer("duration_ms"),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("workflow_steps_workflow_id_idx").on(table.workflowId),
    index("workflow_steps_agent_id_idx").on(table.agentId),
    index("workflow_steps_status_idx").on(table.status),
    index("workflow_steps_workflow_step_number_idx").on(
      table.workflowId,
      table.stepNumber
    ),
  ]
);
```

### 7. `discovered_files`

Files found during discovery, editable by users.

```typescript
// db/schema/discovered-files.schema.ts
export const filePriorities = ["high", "medium", "low"] as const;
export const fileActions = ["create", "modify", "delete"] as const;

export const discoveredFiles = sqliteTable(
  "discovered_files",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workflowStepId: integer("workflow_step_id")
      .notNull()
      .references(() => workflowSteps.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    priority: text("priority").notNull().default("medium"),
    originalPriority: text("original_priority"),
    description: text("description"),
    action: text("action").notNull().default("modify"),
    orderIndex: integer("order_index").notNull().default(0),
    fileExistsAt: text("file_exists_at"), // null = to be created, datetime = confirmed exists
    includedAt: text("included_at"), // null = excluded, datetime = when included
    userAddedAt: text("user_added_at"), // null = AI discovered, datetime = user added
    userModifiedAt: text("user_modified_at"), // null = unchanged, datetime = user changed priority/inclusion
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("discovered_files_workflow_step_id_idx").on(table.workflowStepId),
    index("discovered_files_priority_idx").on(table.priority),
  ]
);
```

### 8. `agents`

Specialist agents for different domains.

```typescript
// db/schema/agents.schema.ts
export const agentTypes = ["planning", "specialist", "review"] as const;
export const agentColors = ["green", "blue", "yellow", "cyan", "red"] as const;

export const agents = sqliteTable(
  "agents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    parentAgentId: integer("parent_agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    type: text("type").notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt").notNull(),
    color: text("color"),
    version: integer("version").notNull().default(1),
    builtInAt: text("built_in_at"), // null = custom, datetime = bundled with app
    deactivatedAt: text("deactivated_at"), // null = active, datetime = deactivated
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("agents_project_id_idx").on(table.projectId),
    index("agents_parent_agent_id_idx").on(table.parentAgentId),
    index("agents_type_idx").on(table.type),
  ]
);
```

### 9. `agent_tools`

Tool permissions for agents.

```typescript
// db/schema/agent-tools.schema.ts
export const agentTools = sqliteTable(
  "agent_tools",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(), // Read, Write, Edit, Glob, Grep, Bash, Skill
    toolPattern: text("tool_pattern").notNull().default("*"), // e.g., '*' or 'pnpm lint'
    orderIndex: integer("order_index").notNull().default(0),
    disallowedAt: text("disallowed_at"), // null = allowed, datetime = disallowed
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("agent_tools_agent_id_idx").on(table.agentId),
    uniqueIndex("agent_tools_unique_idx").on(
      table.agentId,
      table.toolName,
      table.toolPattern
    ),
  ]
);
```

### 10. `agent_skills`

Skills referenced by agents.

```typescript
// db/schema/agent-skills.schema.ts
export const agentSkills = sqliteTable(
  "agent_skills",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    skillName: text("skill_name").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    requiredAt: text("required_at"), // null = optional, datetime = required
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("agent_skills_agent_id_idx").on(table.agentId),
    uniqueIndex("agent_skills_unique_idx").on(table.agentId, table.skillName),
  ]
);
```

### 11. `templates`

Feature request templates.

```typescript
// db/schema/templates.schema.ts
export const templateCategories = [
  "data",
  "ui",
  "backend",
  "security",
  "electron",
] as const;

export const templates = sqliteTable(
  "templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    category: text("category").notNull(),
    description: text("description"),
    templateText: text("template_text").notNull(), // Template with {{placeholders}}
    usageCount: integer("usage_count").notNull().default(0),
    builtInAt: text("built_in_at"), // null = custom, datetime = bundled
    deactivatedAt: text("deactivated_at"), // null = active, datetime = deactivated
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [index("templates_category_idx").on(table.category)]
);
```

### 12. `template_placeholders`

Placeholder definitions within templates.

```typescript
// db/schema/template-placeholders.schema.ts
export const templatePlaceholders = sqliteTable(
  "template_placeholders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    templateId: integer("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g., 'entityName'
    displayName: text("display_name").notNull(), // e.g., 'Entity Name'
    description: text("description"),
    defaultValue: text("default_value"),
    validationPattern: text("validation_pattern"), // Regex
    orderIndex: integer("order_index").notNull().default(0),
    requiredAt: text("required_at"), // null = optional, datetime = required
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("template_placeholders_template_id_idx").on(table.templateId),
    uniqueIndex("template_placeholders_unique_idx").on(
      table.templateId,
      table.name
    ),
  ]
);
```

### 13. `implementation_plans`

Parsed implementation plans from planning workflows.

```typescript
// db/schema/implementation-plans.schema.ts
export const implementationPlans = sqliteTable(
  "implementation_plans",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workflowId: integer("workflow_id")
      .notNull()
      .unique()
      .references(() => workflows.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    rawPlanText: text("raw_plan_text").notNull(),
    estimatedDurationMs: integer("estimated_duration_ms"),
    approvedAt: text("approved_at"), // null = pending, datetime = approved
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("implementation_plans_workflow_id_idx").on(table.workflowId),
  ]
);
```

### 14. `implementation_plan_steps`

Steps within an implementation plan.

```typescript
// db/schema/implementation-plan-steps.schema.ts
export const implementationPlanSteps = sqliteTable(
  "implementation_plan_steps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planId: integer("plan_id")
      .notNull()
      .references(() => implementationPlans.id, { onDelete: "cascade" }),
    agentId: integer("agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    agentOverrideId: integer("agent_override_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    stepNumber: integer("step_number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    estimatedDurationMs: integer("estimated_duration_ms"),
    orderIndex: integer("order_index").notNull().default(0),
    qualityGateAt: text("quality_gate_at"), // null = not a gate, datetime = is quality gate
    geminiReviewAt: text("gemini_review_at"), // null = not a review, datetime = is gemini review
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("implementation_plan_steps_plan_id_idx").on(table.planId),
    index("implementation_plan_steps_agent_id_idx").on(table.agentId),
    uniqueIndex("implementation_plan_steps_unique_idx").on(
      table.planId,
      table.stepNumber
    ),
  ]
);
```

### 15. `implementation_plan_step_files`

Files associated with plan steps.

```typescript
// db/schema/implementation-plan-step-files.schema.ts
export const implementationPlanStepFiles = sqliteTable(
  "implementation_plan_step_files",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planStepId: integer("plan_step_id")
      .notNull()
      .references(() => implementationPlanSteps.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    action: text("action").notNull().default("modify"), // create, modify, delete
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("impl_plan_step_files_plan_step_id_idx").on(table.planStepId),
  ]
);
```

### 16. `audit_logs`

Comprehensive audit trail.

```typescript
// db/schema/audit-logs.schema.ts
export const eventCategories = [
  "workflow",
  "step",
  "file",
  "worktree",
  "quality",
  "user_action",
] as const;
export const severities = ["debug", "info", "warning", "error"] as const;
export const eventSources = ["system", "user", "cli"] as const;

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workflowId: integer("workflow_id").references(() => workflows.id, {
      onDelete: "cascade",
    }),
    workflowStepId: integer("workflow_step_id").references(
      () => workflowSteps.id,
      { onDelete: "cascade" }
    ),
    eventType: text("event_type").notNull(),
    eventCategory: text("event_category").notNull(),
    severity: text("severity").notNull().default("info"),
    message: text("message").notNull(),
    eventData: text("event_data", { mode: "json" }),
    beforeState: text("before_state", { mode: "json" }),
    afterState: text("after_state", { mode: "json" }),
    source: text("source").notNull().default("system"),
    timestamp: text("timestamp")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index("audit_logs_workflow_id_idx").on(table.workflowId),
    index("audit_logs_workflow_step_id_idx").on(table.workflowStepId),
    index("audit_logs_event_type_idx").on(table.eventType),
    index("audit_logs_event_category_idx").on(table.eventCategory),
    index("audit_logs_timestamp_idx").on(table.timestamp),
    index("audit_logs_workflow_timestamp_idx").on(
      table.workflowId,
      table.timestamp
    ),
  ]
);
```

### 17. `settings`

Application configuration key-value store.

```typescript
// db/schema/settings.schema.ts
export const settingCategories = [
  "workflow",
  "worktree",
  "logging",
  "ui",
  "advanced",
] as const;
export const settingValueTypes = [
  "string",
  "number",
  "boolean",
  "json",
] as const;

export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    valueType: text("value_type").notNull().default("string"),
    category: text("category").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    defaultValue: text("default_value"),
    userModifiedAt: text("user_modified_at"), // null = default, datetime = user changed
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [index("settings_category_idx").on(table.category)]
);
```

---

## Entity Relationships

```
projects (1) ─────< (N) repositories
    │                      │
    │                      │
    └──────< (N) workflows >─────< (N) workflow_repositories >───── (N) repositories
                    │
                    ├──────< (1) worktrees
                    │
                    ├──────< (1) implementation_plans ───< (N) implementation_plan_steps
                    │                                              │
                    │                                              └──< (N) implementation_plan_step_files
                    │
                    ├──────< (N) workflow_steps ───< (N) discovered_files
                    │               │
                    │               └─────> agents
                    │
                    └──────< (N) audit_logs

agents (1) ─────< (N) agent_tools
    │
    └──────< (N) agent_skills

templates (1) ─────< (N) template_placeholders
```

---

## Cascade Delete Behaviors

| Parent                    | Child                          | On Delete | Rationale                                |
| ------------------------- | ------------------------------ | --------- | ---------------------------------------- |
| projects                  | repositories                   | CASCADE   | Project delete removes all repos         |
| projects                  | workflows                      | CASCADE   | Project delete removes workflows         |
| projects                  | agents                         | CASCADE   | Project delete removes custom agents     |
| repositories              | worktrees                      | CASCADE   | Repo delete removes worktrees            |
| workflows                 | workflow_repositories          | CASCADE   | Workflow delete removes junction entries |
| workflows                 | workflow_steps                 | CASCADE   | Workflow delete removes steps            |
| workflows                 | audit_logs                     | CASCADE   | Workflow delete removes audit trail      |
| workflows                 | implementation_plans           | CASCADE   | Workflow delete removes plan             |
| workflows                 | worktrees.workflow_id          | SET NULL  | Worktree survives for cleanup            |
| workflow_steps            | discovered_files               | CASCADE   | Step delete removes files                |
| workflow_steps            | audit_logs                     | CASCADE   | Step delete removes audit entries        |
| agents                    | agent_tools                    | CASCADE   | Agent delete removes tool permissions    |
| agents                    | agent_skills                   | CASCADE   | Agent delete removes skill refs          |
| agents                    | workflow_steps.agent_id        | SET NULL  | Step survives agent delete               |
| templates                 | template_placeholders          | CASCADE   | Template delete removes placeholders     |
| implementation_plans      | implementation_plan_steps      | CASCADE   | Plan delete removes steps                |
| implementation_plan_steps | implementation_plan_step_files | CASCADE   | Step delete removes files                |

---

## Default Settings Seed Data

| Key                                     | Value                                    | Category | Description                     |
| --------------------------------------- | ---------------------------------------- | -------- | ------------------------------- |
| `workflow.defaultPauseBehavior`         | `"auto_pause"`                           | workflow | Default pause mode              |
| `workflow.maxConcurrentImplementations` | `3`                                      | workflow | Max parallel workflows          |
| `workflow.clarificationTimeout`         | `60`                                     | workflow | Clarification timeout (seconds) |
| `workflow.refinementTimeout`            | `30`                                     | workflow | Refinement timeout (seconds)    |
| `workflow.discoveryTimeout`             | `120`                                    | workflow | Discovery timeout (seconds)     |
| `workflow.planningTimeout`              | `180`                                    | workflow | Planning timeout (seconds)      |
| `workflow.implementationTimeout`        | `300`                                    | workflow | Per-step implementation timeout |
| `workflow.qualityGateTimeout`           | `120`                                    | workflow | Quality gate timeout            |
| `workflow.geminiReviewTimeout`          | `180`                                    | workflow | Gemini review timeout           |
| `worktree.locationPattern`              | `".worktrees/{feature-slug}"`            | worktree | Worktree location pattern       |
| `worktree.autoCleanup`                  | `true`                                   | worktree | Auto-cleanup after completion   |
| `worktree.autoCreateBranch`             | `true`                                   | worktree | Auto-create feature branch      |
| `worktree.pushOnCompletion`             | `false`                                  | worktree | Push branch when done           |
| `logging.retentionDays`                 | `30`                                     | logging  | Log retention period            |
| `logging.includeCliOutput`              | `true`                                   | logging  | Include raw CLI output          |
| `logging.exportLocation`                | `"~/Documents/claude-orchestrator-logs"` | logging  | Export location                 |

---

## File Structure

```
db/
  index.ts                                    # Database initialization
  schema/
    index.ts                                  # Barrel export
    projects.schema.ts
    repositories.schema.ts
    workflow-repositories.schema.ts
    worktrees.schema.ts
    workflows.schema.ts
    workflow-steps.schema.ts
    discovered-files.schema.ts
    agents.schema.ts
    agent-tools.schema.ts
    agent-skills.schema.ts
    templates.schema.ts
    template-placeholders.schema.ts
    implementation-plans.schema.ts
    implementation-plan-steps.schema.ts
    implementation-plan-step-files.schema.ts
    audit-logs.schema.ts
    settings.schema.ts
  repositories/
    index.ts                                  # Barrel export
    projects.repository.ts
    repositories.repository.ts
    worktrees.repository.ts
    workflows.repository.ts
    workflow-steps.repository.ts
    discovered-files.repository.ts
    agents.repository.ts
    templates.repository.ts
    implementation-plans.repository.ts
    audit-logs.repository.ts
    settings.repository.ts
```

---

## Verification Steps

After implementation, verify:

1. **Run migrations**: `pnpm db:generate && pnpm db:migrate`
2. **Check foreign keys**: Ensure all references work correctly
3. **Test cascade deletes**: Delete a project and verify all children are removed
4. **Test archiving**: Archive a project and verify it's queryable but hidden by default
5. **Test datetime pattern**: Verify `archived_at`, `user_modified_at` etc. work as boolean substitutes
6. **Seed settings**: Verify default settings are created
7. **Run typecheck**: `pnpm typecheck` to ensure type exports are correct
