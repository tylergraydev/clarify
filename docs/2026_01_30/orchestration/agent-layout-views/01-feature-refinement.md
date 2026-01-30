# Step 1: Feature Request Refinement

**Status**: Completed
**Timestamp**: 2026-01-30

## Input

### Original Request

> The agent management screen should support different layouts. The only layout currently supported is the card layout. The user should have at least 2 other layout options, list and table. The users preference should be saved and reloaded so that if the user sets it to the table view then it will always be the table view until they come back and change it.

### Project Context

- Electron desktop app with Next.js App Router
- Uses electron-store for persistent key-value storage
- Uses Zustand for client state management
- UI built with Base UI primitives and CVA patterns
- TanStack Query for server state management

## Agent Prompt

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections):

"The agent management screen should support different layouts. The only layout currently supported is the card layout. The user should have at least 2 other layout options, list and table. The users preference should be saved and reloaded so that if the user sets it to the table view then it will always be the table view until they come back and change it."

**Project Context from CLAUDE.md:**
- Electron desktop app with Next.js App Router
- Uses electron-store for persistent key-value storage
- Uses Zustand for client state management
- UI built with Base UI primitives and CVA (class-variance-authority) for variants
- Components in components/agents/ directory
- TanStack Query for server state management

**Existing Patterns:**
- Theme persistence uses electron-store via IPC
- WorkflowTable component exists in components/workflows/workflow-table.tsx
- AgentCard component exists in components/agents/agent-card.tsx
- Shell store (Zustand) manages sidebar state persistence

Output ONLY the refined paragraph (200-500 words), nothing else.
```

## Refined Feature Request

The agent management screen currently displays agents exclusively in a card layout and needs to support multiple view layouts to accommodate different user preferences and use cases. This feature will add two additional layout options—list view and table view—alongside the existing card layout, giving users three distinct ways to visualize their agents. The list view should provide a compact, vertically-stacked presentation of agents with key information displayed inline, similar to file explorer list modes, while the table view should present agents in a structured grid format with sortable columns, following the established pattern already implemented in the WorkflowTable component at components/workflows/workflow-table.tsx. A layout toggle control should be added to the agents page header, using icon buttons or a segmented control built with Base UI primitives and styled via CVA variants for consistent theming. The user's layout preference must persist across application sessions, which should be implemented using the existing electron-store mechanism accessed through the IPC bridge (specifically the store namespace methods), following the same pattern used for theme persistence. On the client side, a Zustand store similar to the shell-store pattern should manage the current layout state and hydrate from the persisted value on application load. The AgentCard component at components/agents/agent-card.tsx will remain the foundation for the card layout, while new AgentList and AgentTable components should be created in the components/agents/ directory to handle the list and table layouts respectively. These components should share a common data interface and accept the same agent data props to ensure consistent behavior across layouts. The parent agents page component should conditionally render the appropriate layout component based on the current layout state, and any layout switch should be immediate without requiring page reload. The implementation should ensure that all three layouts maintain feature parity for agent interactions such as viewing details, editing, or other actions currently available in the card layout.

## Validation

- **Length Check**: ~400 words (within 200-500 range) ✓
- **Format Check**: Single paragraph, no headers or sections ✓
- **Scope Check**: Core intent preserved, no feature creep ✓
