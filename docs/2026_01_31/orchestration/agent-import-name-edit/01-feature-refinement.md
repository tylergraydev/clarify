# Step 1: Feature Request Refinement

**Started**: 2026-01-31T00:00:30Z
**Completed**: 2026-01-31T00:01:00Z
**Duration**: ~30 seconds
**Status**: Completed

## Original Request

The agent import dialog can run into a situation where the agent the user is trying to import has the same internal name as an existing agent and the app will just return an error toast - "Import Failed: name: An agent with the name 'test-project-agent' already exists" - this forces the user to go to the actual agent file they are importing and change the name there and then re-import which is annoying. The user should be able to edit the name (internal name) of the agent they are uploading as they upload it so they can just change the name if an agent with that name already exists.

## Clarification Context

None - clarification was skipped (request scored 4/5 for clarity).

## Project Context Provided

- Clarify: Electron desktop application for orchestrating Claude Code CLI workflows
- Tech Stack: Next.js 16.1.6, React 19.2.4, Base UI, TanStack Form, Zod, Drizzle ORM, SQLite
- Relevant components: ImportAgentDialog, use-agent-import-export hook
- IPC handler: agent.handlers.ts with duplicate name validation
- Validation: lib/validations/agent-import.ts with kebab-case requirements

## Agent Prompt Sent

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections):

**Original Request:**
[Original request text]

**Project Context:**
[Project context details]

**Your Task:**
Using this context, expand the feature request with relevant technical details while maintaining its core intent. Output ONLY the refined paragraph (200-500 words), nothing else.
```

## Agent Response (Refined Feature Request)

When users attempt to import an agent whose internal name already exists in the application, the system currently rejects the import with an error toast message, requiring users to manually edit the agent's YAML file, save it, and attempt the import again. This creates unnecessary friction in the workflow, particularly for users working with agent templates or migrating agents between projects. The feature should enable users to edit the agent's internal name (kebab-case identifier) directly within the `ImportAgentDialog` component before confirming the import, allowing them to resolve naming conflicts inline without leaving the application or modifying source files. The implementation should add an editable name field to the import preview that validates against existing agent names in real-time, updating the validation error state as the user types. When the import dialog is triggered, it should parse the agent YAML to extract the current name and display it in a text input field alongside other agent metadata. The validation should reuse the existing kebab-case pattern validation from `lib/validations/agent-import.ts` while adding a duplicate-name check using the existing IPC handler in `agent.handlers.ts`. Once the user confirms the import with a modified name, the import hook should update the agent YAML payload with the new name before sending it to the IPC handler, ensuring the database and file system are consistent. This change should be limited to the UI flow and validation layer—no changes to the IPC handler, database schema, or core import logic are needed. The feature maintains the existing error handling for other validation failures while specifically addressing the common case of name conflicts, reducing user friction and keeping the workflow within the application's UI.

## Length Analysis

| Metric | Value |
|--------|-------|
| Original word count | ~115 words |
| Refined word count | ~280 words |
| Expansion ratio | 2.4x |
| Target range | 2-4x |
| Status | Within target |

## Scope Analysis

| Aspect | Assessment |
|--------|------------|
| Core intent preserved | Yes - editing name during import |
| Feature creep | None detected |
| Technical context added | Appropriate - references specific files and patterns |
| Format compliance | Single paragraph, no headers/bullets |

## Validation Results

- Format Check: PASSED (single paragraph)
- Length Check: PASSED (280 words, 2.4x expansion)
- Scope Check: PASSED (core intent preserved)
- Quality Check: PASSED (essential technical context only)

---
**Progress Marker**: MILESTONE:STEP_1_COMPLETE
