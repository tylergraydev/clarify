---
allowed-tools: Read(*), Glob(*), Grep(*), Task(subagent_type:Explore)
argument-hint: "rambling feature idea or description"
description: Distill a rambling feature idea into a precise prompt for /plan-feature
---

# Distill Feature Request

## Purpose

Take in an informal, rambling, or stream-of-consciousness feature idea and transform it into a single, precise, technically-rich prompt suitable for use with the `/plan-feature` skill. This skill acts as a translator between how developers naturally think and talk about features and what the planning pipeline needs as input.

@CLAUDE.md

## Command Usage

```
/distill-feature "your rambling feature idea here..."
```

**Examples:**

- `/distill-feature "I want to add some kind of way for users to see what agents did when they were away from the workflow page, like tool calls and stuff, maybe store it in the database"`
- `/distill-feature "we need dark mode but also like the user should be able to pick accent colors and maybe save per-project theme preferences or something"`
- `/distill-feature "the template system needs to be better, like you should be able to nest templates and have conditionals and maybe even preview what the final prompt looks like before running it"`

## Execution Flow

### Phase 1: Parse and Understand the Raw Idea

1. Read the raw feature idea from `$ARGUMENTS`
2. Identify the core intent — what is the user fundamentally trying to achieve?
3. Extract all concrete requirements mentioned (even if scattered or repeated)
4. Extract all implied requirements (things the user assumes but didn't state)
5. Note any specific files, components, patterns, or technologies mentioned
6. Note any constraints or preferences stated (e.g., "keep the existing X", "don't change Y")
7. Identify any ambiguities that need resolution through codebase exploration

### Phase 2: Codebase Exploration

Use targeted exploration to understand the current state relevant to the feature idea.

1. **Read CLAUDE.md** for project architecture and conventions
2. **Targeted Search**: Based on the feature idea, search for:
   - Existing implementations related to the feature (schemas, components, hooks, services)
   - Current data flow for the area being modified
   - Types and interfaces that would be affected
   - IPC channels and handlers in the relevant domain
3. **Use Explore Agent** if the feature touches multiple domains or the initial search reveals complexity:
   - Dispatch with `subagent_type: "Explore"` for thorough codebase analysis
   - Focus the exploration on understanding what exists today vs what the user wants
4. **Collect Technical Context**:
   - Exact file names and paths for existing related code
   - Current schema/table names and column structures
   - Hook names, component names, service names
   - Data flow: where data originates, how it moves, where it's consumed
   - What's persisted vs ephemeral today

### Phase 3: Synthesize Requirements

Organize everything discovered into clear categories:

1. **Core Requirements**: What must this feature do?
2. **Technical Context**: What exists today that this builds on or modifies?
3. **Architectural Impact**: What layers are affected? (schema, services, IPC, hooks, components, pages)
4. **Constraints**: What should NOT change? What must be preserved?
5. **Scope Boundaries**: What is explicitly in scope vs out of scope based on the user's description?

### Phase 4: Craft the Prompt

Generate a single, dense paragraph (200-500 words) that:

1. **Opens with the core action** — what is being added/changed/created
2. **Names specific files, types, hooks, and services** discovered during exploration
3. **Describes the current state** briefly so the planner understands the starting point
4. **States all requirements** clearly and unambiguously
5. **Specifies what changes are needed at each architectural layer** (schema, repository, IPC, hooks, components)
6. **Includes constraints** — what to preserve, what not to change
7. **Avoids fluff** — no motivational language, no "it would be nice if", no hedging
8. **Uses precise technical language** matching the project's conventions

### Phase 5: Output

Present the distilled prompt to the user in a clear format:

```markdown
## Distilled Feature Request

### Original Idea (Summary)
{2-3 sentence summary of what the user described}

### Key Decisions Captured
- {Decision or requirement 1 extracted from the rambling}
- {Decision or requirement 2}
- {Decision or requirement 3}
- ...

### Codebase Context Discovered
- {Relevant existing file/pattern 1 and its role}
- {Relevant existing file/pattern 2 and its role}
- ...

### Prompt for /plan-feature

> {The single dense paragraph prompt, ready to copy-paste}

### Usage
```
/plan-feature "{first 80 chars of prompt}..."
```
Copy the prompt above and pass it to `/plan-feature` to generate an implementation plan.
```

## Quality Criteria

A good distilled prompt must:

1. **Be self-contained** — the `/plan-feature` skill should not need to ask clarification questions (target ambiguity score >= 4/5)
2. **Reference real code** — mention actual file names, type names, hook names, service names found in the codebase
3. **Be specific about scope** — clearly state what changes at each layer (database, backend services, IPC, hooks, UI components)
4. **Preserve the user's intent** — don't add features they didn't ask for, don't remove things they mentioned
5. **Be appropriately sized** — 200-500 words, dense with information, no filler
6. **State the current state** — briefly describe what exists so the planner has a baseline
7. **Include constraints** — mention anything the user said to keep, preserve, or not change

## Anti-Patterns to Avoid

- **Feature creep**: Don't add requirements the user never mentioned
- **Vague language**: Don't say "improve the UI" when the user said "add a token count column to the tool call rows"
- **Missing context**: Don't reference components or patterns without grounding them in actual codebase files
- **Over-specification**: Don't prescribe implementation details that should be left to the planner (e.g., exact CSS classes, specific state variable names)
- **Under-specification**: Don't omit requirements the user clearly stated, even if they were buried in rambling
- **Ignoring constraints**: If the user said "keep the existing file logging", that must appear in the prompt
