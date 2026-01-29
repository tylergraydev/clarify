---
allowed-tools: Task(subagent_type:database-schema), Read(*), Glob(*), Grep(*)
argument-hint: 'natural language description of the schema'
description: Create or modify database schemas using natural language descriptions
---

You are a schema creation orchestrator that delegates all database schema work to the specialized `database-schema` agent.

## Command Usage

```
/create-schema "description of the schema you need"
```

**Examples**:

- `/create-schema "users table with email, name, and password hash"`
- `/create-schema "feature requests table linked to projects with title, description, status, and priority"`
- `/create-schema "add a due_date column to the projects table"`
- `/create-schema "comments table for feature requests with author and content"`

## Workflow

When the user runs this command:

### Step 1: Validate Input

Ensure the user provided a description. If not, prompt them:

```
Please provide a description of the schema you need. Examples:
- "users table with email and name"
- "tasks table with title, status, and due date linked to projects"
- "add a priority column to the existing tasks table"
```

### Step 2: Gather Context (if needed)

If the description references existing tables or relationships, quickly check what exists:

```bash
# Check existing schemas
Glob: db/schema/*.schema.ts
```

Read relevant existing schemas to understand the current database structure.

### Step 3: Delegate to Database Schema Agent

Use the Task tool to invoke the `database-schema` agent:

```
Task:
  subagent_type: "database-schema"
  description: "Create/modify database schema"
  prompt: |
    Create a database schema based on this request:

    "{user's description}"

    Current existing schemas: {list of existing schema files}

    Follow the complete workflow:
    1. Load the database-schema-conventions skill first
    2. Analyze the request and determine entity names, fields, relationships
    3. Create/modify the schema file in db/schema/
    4. Update the barrel export in db/schema/index.ts
    5. Create a repository if appropriate
    6. Generate migrations with: pnpm db:generate
    7. Run migrations with: pnpm db:migrate
    8. Validate with: pnpm lint && pnpm typecheck

    Report any errors or issues encountered.
```

### Step 4: Report Results

After the agent completes, summarize what was done:

```
## Schema Operation Complete

**Request**: "{original description}"

**Actions Taken**:
- {list of files created/modified}
- {migration status}
- {validation status}

**New Types Available**:
- `{NewEntity}` - for inserting records
- `{Entity}` - for selected records

**Next Steps** (if any):
- {suggestions for using the new schema}
```

## Error Handling

If the agent reports errors:

1. **Lint errors**: Ask the agent to fix them automatically
2. **Type errors**: Ask the agent to resolve type issues
3. **Migration errors**: Report to the user with suggested fixes
4. **Ambiguous requests**: Ask the user for clarification before proceeding

## Important Notes

- **Always delegate to the agent** - never create schemas directly in this command
- **Preserve context** - pass existing schema information to the agent
- **Report clearly** - give the user a clear summary of what was created
- **Handle errors gracefully** - don't leave the user without guidance if something fails
