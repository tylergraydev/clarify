# Step 1: Feature Request Refinement

## Step Metadata

| Field | Value |
|-------|-------|
| Started | 2026-01-29T00:01:00Z |
| Completed | 2026-01-29T00:02:00Z |
| Duration | ~30 seconds |
| Status | Completed |

## Original Request

"Duplicate agent feature from the design document needs to be implemented"

## Clarification Context

- When duplicating an agent, copy all associated tools and skills to the new agent
- The duplicated agent should match the source agent's scope (global agents stay global, project-specific agents stay in the same project)
- After clicking Duplicate, the agent editor dialog should open immediately with the duplicated agent so the user can customize the name and settings

## Agent Prompt Sent

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections):

"Duplicate agent feature from the design document needs to be implemented"

Additional context from clarification:
- When duplicating an agent, copy all associated tools and skills to the new agent
- The duplicated agent should match the source agent's scope (global agents stay global, project-specific agents stay in the same project)
- After clicking Duplicate, the agent editor dialog should open immediately with the duplicated agent so the user can customize the name and settings

Using the project context:
- This is an Electron + Next.js desktop app called Clarify for orchestrating Claude Code CLI workflows
- Tech stack: React 19, TypeScript, Drizzle ORM with SQLite, TanStack Query for data fetching, Base UI + CVA for components
- Architecture uses: IPC bridge pattern for Electron communication, Repository pattern for database access, Query Key Factory pattern for TanStack Query
- Existing agent functionality includes: agent:list, agent:get, agent:create, agent:update, agent:reset IPC handlers
- Agent schema includes: id, name (unique), displayName, systemPrompt, type, description, color, projectId (optional for project-specific), parentAgentId, builtInAt, deactivatedAt, version, timestamps
- Agent relations: agents have many-to-many relationships with agent_tools and agent_skills tables
- The Agent Editor dialog exists at components/agents/agent-editor-dialog.tsx
- Design document section 4.6 shows [Duplicate] button in Agent Editor footer alongside [Test Agent], [Export], [Reset to Default]

Output ONLY the refined paragraph (200-500 words), nothing else.
```

## Agent Response

Implement the agent duplication feature for the Clarify application, allowing users to create a copy of an existing agent with all associated tools and skills transferred to the new agent. When a user clicks a [Duplicate] button in the Agent Editor dialog footer, the system should create a new agent record that mirrors the source agent's complete configuration, including the system prompt, display name, description, color, and all many-to-many relationships defined in the agent_tools and agent_skills tables. The duplicated agent must respect scope boundaries, ensuring that global agents remain global and project-specific agents are duplicated within the same project, with the parentAgentId and projectId fields properly set to maintain organizational hierarchy. After the duplication process completes via the new agent:duplicate IPC handler, the Agent Editor dialog should automatically open in edit mode with the newly created agent, enabling users to customize the agent's name and other settings before saving. The implementation should leverage the existing Repository pattern for database access through Drizzle ORM, use TanStack Query's query key factory for proper cache invalidation to refresh the agents list, and integrate with the current IPC bridge architecture by adding the agent:duplicate handler alongside existing handlers like agent:list, agent:get, agent:create, and agent:update. The duplicated agent should generate a unique name (such as appending "Copy" or a numeric suffix to the original name) to comply with the agent name uniqueness constraint, and all database operations should be transactional to ensure data consistency if any step fails during the duplication process.

## Length Analysis

| Metric | Value |
|--------|-------|
| Original Word Count | ~11 words |
| Refined Word Count | ~277 words |
| Expansion Ratio | ~25x |

## Scope Analysis

The refined request:
- Preserves core intent: Implement duplicate agent feature from design document ✓
- Adds essential technical context: IPC handler, repository pattern, TanStack Query ✓
- Specifies behavior from clarification: copy tools/skills, match scope, open editor ✓
- No feature creep detected ✓

## Validation Results

- Format Check: PASS (single paragraph, no headers/sections)
- Length Check: PASS (277 words, within 200-500 range)
- Scope Check: PASS (core intent preserved)
- Quality Check: PASS (essential technical context added)
