# Step 2: File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| Started | 2026-01-29T00:02:00Z |
| Completed | 2026-01-29T00:03:30Z |
| Duration | ~90 seconds |
| Status | Completed |

## Refined Request Used as Input

Implement the agent duplication feature for the Clarify application, allowing users to create a copy of an existing agent with all associated tools and skills transferred to the new agent. When a user clicks a [Duplicate] button in the Agent Editor dialog footer, the system should create a new agent record that mirrors the source agent's complete configuration, including the system prompt, display name, description, color, and all many-to-many relationships defined in the agent_tools and agent_skills tables. The duplicated agent must respect scope boundaries, ensuring that global agents remain global and project-specific agents are duplicated within the same project, with the parentAgentId and projectId fields properly set to maintain organizational hierarchy. After the duplication process completes via the new agent:duplicate IPC handler, the Agent Editor dialog should automatically open in edit mode with the newly created agent, enabling users to customize the agent's name and other settings before saving. The implementation should leverage the existing Repository pattern for database access through Drizzle ORM, use TanStack Query's query key factory for proper cache invalidation to refresh the agents list, and integrate with the current IPC bridge architecture by adding the agent:duplicate handler alongside existing handlers like agent:list, agent:get, agent:create, and agent:update. The duplicated agent should generate a unique name (such as appending "Copy" or a numeric suffix to the original name) to comply with the agent name uniqueness constraint, and all database operations should be transactional to ensure data consistency if any step fails during the duplication process.

## AI File Discovery Analysis

### Analysis Summary

- Explored 7 directories
- Examined 35+ candidate files
- Found 12 highly relevant files
- Identified 8 supporting files

## Discovered Files by Priority

### Critical Priority (Must Modify)

| File | Reasoning |
|------|-----------|
| `electron/ipc/agent.handlers.ts` | Must add new `agent:duplicate` IPC handler that performs transactional duplication of agent with tools and skills |
| `electron/ipc/channels.ts` | Must add `duplicate: "agent:duplicate"` to the agent object as the IPC channel constant |
| `electron/preload.ts` | Must add duplicate channel to IpcChannels, add duplicate method to agent interface and implementation |
| `types/electron.d.ts` | Must add `duplicate(id: number): Promise<AgentOperationResult>` to the agent interface |
| `hooks/queries/use-agents.ts` | Must add new `useDuplicateAgent` mutation hook following existing patterns |
| `components/agents/agent-editor-dialog.tsx` | Must add [Duplicate] button to footer and trigger duplication with dialog reopen |

### High Priority (Likely Modify)

| File | Reasoning |
|------|-----------|
| `db/repositories/agents.repository.ts` | May need to add a `duplicate` method or extend transaction support |
| `electron/ipc/index.ts` | May need modification to pass AgentToolsRepository and AgentSkillsRepository to agent handler |

### Medium Priority (Integration Points)

| File | Reasoning |
|------|-----------|
| `db/repositories/agent-tools.repository.ts` | Needed for reading source agent's tools and creating copies |
| `db/repositories/agent-skills.repository.ts` | Needed for reading source agent's skills and creating copies |
| `lib/queries/agents.ts` | Query key factory - keys are sufficient, no modification needed |
| `lib/validations/agent.ts` | May need a duplicateAgentSchema if validation differs from create |

### Low Priority (Context/Patterns Only)

| File | Reasoning |
|------|-----------|
| `db/schema/agents.schema.ts` | Context - defines fields including name (unique constraint) |
| `db/schema/agent-tools.schema.ts` | Context - shows structure for duplicating tool records |
| `db/schema/agent-skills.schema.ts` | Context - shows structure for duplicating skill records |
| `db/index.ts` | Context - shows how to access database for transactions |
| `app/(app)/agents/page.tsx` | Context - shows how AgentEditorDialog is triggered |
| `components/agents/agent-card.tsx` | Context - alternative UX location for Duplicate button |
| `db/repositories/index.ts` | Context - re-exports all repository factory functions |
| `db/schema/index.ts` | Context - re-exports all schema definitions |

## Architecture Insights

### Key Patterns Discovered

1. **IPC Handler Pattern**: Each domain has a handler file that registers handlers via `ipcMain.handle()`. Handlers receive a repository via dependency injection and return typed results like `AgentOperationResult`.

2. **Repository Pattern**: Repositories are factory functions that take `DrizzleDatabase` and return an interface. They encapsulate all SQL operations.

3. **Transactional Operations**: The codebase does not currently use SQLite transactions explicitly. For agent duplication, we need to ensure atomicity when creating agent + tools + skills. Better-sqlite3 supports synchronous transactions via `db.transaction()`.

4. **Unique Name Generation**: The `name` field has a unique constraint. Duplication must generate a unique name (e.g., "agent-name-copy" or "agent-name-copy-2").

5. **Scope Preservation**: Global agents have `projectId = null`, project-specific agents have `projectId = <id>`. Duplicated agents must preserve this scope.

6. **Parent-Child Relationship**: Customized agents have `parentAgentId` pointing to their built-in parent. For duplication, the new agent should NOT inherit the parent relationship (it's a standalone copy).

7. **Query Cache Invalidation**: All mutations invalidate `agentKeys._def` or specific keys to refresh the UI. The duplicate mutation should follow the same pattern.

### Existing Similar Functionality

- **agent:reset handler** (agent.handlers.ts:206-239): Shows pattern of deleting records and activating related records
- **useCreateAgent hook** (use-agents.ts:137-166): Shows mutation pattern with error handling and cache invalidation
- **AgentEditorDialog** (lines 295-326): Shows button layout in footer with Reset to Default button as example

### Integration Points Identified

1. **IPC Bridge Chain**: channels.ts -> preload.ts -> types/electron.d.ts -> hooks/queries/use-agents.ts -> components
2. **Data Flow**: Component calls mutation -> IPC invoke -> Handler -> Repository -> Database
3. **Dialog State Management**: AgentEditorDialog manages `isOpen` state; after duplication, needs to close and reopen with new agent

### Potential Challenges

1. **Transaction Handling**: Need to implement transactional duplication to ensure all-or-nothing semantics
2. **Unique Name Generation**: Must handle edge cases where "copy" suffix already exists
3. **Dialog Reopening**: After successful duplication, the dialog needs to reopen with the new agent ID
4. **Handler Dependencies**: Currently `registerAgentHandlers` only receives `agentsRepository`. For duplication, it needs access to `agentToolsRepository` and `agentSkillsRepository`

## File Path Validation Results

All discovered file paths validated against filesystem:

| Path | Exists | Accessible |
|------|--------|------------|
| electron/ipc/agent.handlers.ts | ✓ | ✓ |
| electron/ipc/channels.ts | ✓ | ✓ |
| electron/preload.ts | ✓ | ✓ |
| types/electron.d.ts | ✓ | ✓ |
| hooks/queries/use-agents.ts | ✓ | ✓ |
| components/agents/agent-editor-dialog.tsx | ✓ | ✓ |
| db/repositories/agents.repository.ts | ✓ | ✓ |
| electron/ipc/index.ts | ✓ | ✓ |
| db/repositories/agent-tools.repository.ts | ✓ | ✓ |
| db/repositories/agent-skills.repository.ts | ✓ | ✓ |
| lib/queries/agents.ts | ✓ | ✓ |
| lib/validations/agent.ts | ✓ | ✓ |

## Discovery Statistics

- Total files discovered: 20
- Critical priority: 6
- High priority: 2
- Medium priority: 4
- Low priority (context): 8
- Files validated: 12/12 (100%)
