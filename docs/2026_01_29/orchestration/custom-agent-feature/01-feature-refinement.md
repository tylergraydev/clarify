# Step 1: Feature Request Refinement

**Started**: 2026-01-29T00:01:00Z
**Completed**: 2026-01-29T00:01:30Z
**Status**: Completed
**Duration**: ~30 seconds

## Original Request

"Create new custom agent feature from the design document needs to be implemented"

## Context Provided to Agent

- Project: Clarify (Electron + Next.js desktop application)
- Tech Stack: React 19.2.4, TypeScript, Tailwind CSS 4, SQLite/Drizzle ORM, TanStack Query/Form, Base UI + CVA
- Design Document: docs/clarify-design-document.md (Sections 2.4, 4.6, 8.1)
- Current Implementation: Database schema, IPC handlers, editor dialog, agents page, agent cards

## Agent Prompt

Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections): "Create new custom agent feature from the design document needs to be implemented"

[Full context provided about project stack, design document specifications, and current implementation]

## Agent Response

The Clarify application requires implementation of a complete "Create New Custom Agent" feature that enables users to define entirely new specialist agents from scratch, distinct from the existing functionality that only allows customization of built-in agents. This feature should add a prominent "Create Agent" button to the agents page (`app/(app)/agents/page.tsx`) that opens an `AgentCreatorDialog` component (or repurposes the existing `agent-editor-dialog.tsx` in creation mode) presenting a comprehensive form following the Section 4.6 Agent Editor UI specifications: a required name field with uniqueness validation, an optional description textarea, a color tag picker supporting the six defined colors (green, blue, yellow, cyan, red, and a default/neutral option), a multi-select checklist for allowed Claude Code CLI tools, a syntax-highlighted system prompt editor for defining the agent's behavior and instructions, and a referenced skills section for linking to project-specific skills or conventions. The form must integrate with TanStack Form following project patterns, include Zod schema validation matching the `agentInsertSchema` from the database layer, and provide appropriate error states and user feedback via the toast notification system. On the backend, the existing `agent.handlers.ts` already includes a `createAgent` IPC handler, but verification is needed that it properly handles user-created agents with `isBuiltIn: false`, generates appropriate versioning (starting at version 1), sets `isActive: true` by default, and stores the complete agent configuration including the `allowedTools` JSON array and full `systemPrompt` text. The TanStack Query layer in `hooks/queries/use-agents.ts` needs a `useCreateAgent` mutation hook that calls the IPC channel, handles optimistic updates to the agents list cache, and invalidates relevant query keys on success. The UI should provide clear visual distinction between user-created custom agents and built-in agents throughout the agents page, agent cards, and any agent selection interfaces used in workflow configuration. Additionally, custom agents should support full CRUD operations including the ability to duplicate an existing agent (built-in or custom) as a starting point for a new custom agent, edit all fields of user-created agents without restriction, and permanently delete custom agents with appropriate confirmation dialogs, while built-in agents remain protected and can only be customized through the existing overlay/reset mechanism.

## Validation Results

| Check                     | Result           |
| ------------------------- | ---------------- |
| Format (single paragraph) | PASS             |
| Length (200-500 words)    | PASS (398 words) |
| Intent preservation       | PASS             |
| Scope control             | PASS             |

## Length Analysis

- **Original**: 14 words
- **Refined**: 398 words
- **Expansion ratio**: 28x (acceptable for feature request with implementation details)

## Scope Analysis

The refined request maintains the core intent (create new custom agents) while adding:

- Specific UI component requirements (Create Agent button, dialog)
- Form field specifications matching design document
- Backend verification requirements
- TanStack Query mutation hook requirements
- Visual distinction requirements
- CRUD operation specifications
- Agent duplication capability
- Protection for built-in agents

All additions are directly derived from the design document specifications and existing codebase patterns.
