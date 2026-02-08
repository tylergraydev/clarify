---
name: distill-feature
allowed-tools: Read(*), Glob(*), Grep(*), Task(subagent_type:Explore), AskUserQuestion
argument-hint: "rambling feature idea or description"
description: Distill a rambling feature idea into a precise prompt for /plan-feature
disable-model-invocation: true
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
7. Identify any ambiguities that need resolution through codebase exploration or user clarification

### Phase 2: Clarify Ambiguities with the User

**Do NOT make assumptions.** If the raw idea contains ambiguities, unclear scope, conflicting requirements, or missing details that cannot be resolved through codebase exploration alone, use the `AskUserQuestion` tool to ask the user directly.

Common situations that warrant clarifying questions:
- **Unclear scope**: The user mentions multiple possible features but it's unclear which are in scope
- **Missing behavioral details**: How should something behave in edge cases? What happens on error?
- **Conflicting requirements**: Two stated goals seem to conflict
- **Vague terms**: The user says "better", "improved", "smarter" without specifying what that means concretely
- **Architectural ambiguity**: Multiple valid approaches exist and the user hasn't indicated a preference
- **Unclear priority**: Multiple features mentioned but unclear which are must-haves vs nice-to-haves
- **Missing context**: References to concepts, features, or decisions that aren't clear from the description alone

Guidelines for asking questions:
1. **Ask before exploring** — if you can't tell what to explore without clarification, ask first
2. **Batch questions** — group related questions into a single `AskUserQuestion` call (up to 4 questions) rather than asking one at a time
3. **Provide options** — when possible, offer concrete choices rather than open-ended questions so the user can quickly select
4. **Be specific** — don't ask "can you clarify?" — ask exactly what you need to know
5. **Don't over-ask** — if something can be reasonably inferred from context or resolved through codebase exploration, do that instead of bothering the user
6. **Incorporate answers** — use the user's responses to refine your understanding before proceeding to codebase exploration

### Phase 3: Codebase Exploration

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
### Phase 4: Post-Discovery Clarification

**This phase is mandatory.** After codebase exploration, you now have concrete technical context that the user lacked when describing their feature. Use this knowledge to ask a focused round of clarifying questions before synthesizing requirements.

1. **Review what you discovered** — compare what the user described with what actually exists in the codebase
2. **Identify new ambiguities** that only became visible after seeing the actual code:
   - **Integration points**: Multiple valid places to hook in the feature — ask which the user prefers
   - **Existing patterns**: Discovered conventions or patterns that could shape the implementation — confirm the user wants to follow them or diverge
   - **Scope implications**: The codebase reveals the feature is larger or smaller than the user likely imagined — confirm adjusted scope
   - **Conflicting approaches**: Existing code suggests one approach but the user's description implies another — resolve the conflict
   - **Missing pieces**: Infrastructure the feature needs that doesn't exist yet (e.g., no IPC channel for a domain, no schema table) — confirm the user wants these created
   - **Side effects**: Changes that would ripple into other features or break existing behavior — confirm the user is aware and accepts them
3. **Ask the user** using `AskUserQuestion`:
   - Batch related questions (up to 4 per call)
   - Reference specific files, types, and patterns you discovered so the user understands the technical context behind each question
   - Provide concrete options grounded in what you found in the codebase rather than abstract choices
   - Frame questions around decisions that would meaningfully change the implementation plan
4. **Do NOT skip this phase** even if you think everything is clear — the goal is to surface assumptions you're making based on the codebase that the user may not agree with
5. **Incorporate answers** into your mental model before proceeding to synthesis

### Phase 5: Synthesize Requirements

Organize everything discovered into clear categories:

1. **Core Requirements**: What must this feature do?
2. **Technical Context**: What exists today that this builds on or modifies?
3. **Architectural Impact**: What layers are affected? (schema, services, IPC, hooks, components, pages)
4. **Constraints**: What should NOT change? What must be preserved?
5. **Scope Boundaries**: What is explicitly in scope vs out of scope based on the user's description?

### Phase 6: Craft the Prompt

Generate a single, dense paragraph (200-500 words) that:

1. **Opens with the core action** — what is being added/changed/created
2. **Names specific files, types, hooks, and services** discovered during exploration
3. **Describes the current state** briefly so the planner understands the starting point
4. **States all requirements** clearly and unambiguously
5. **Specifies what changes are needed at each architectural layer** (schema, repository, IPC, hooks, components)
6. **Includes constraints** — what to preserve, what not to change
7. **Avoids fluff** — no motivational language, no "it would be nice if", no hedging
8. **Uses precise technical language** matching the project's conventions

### Phase 7: Output

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

1. **Be self-contained** — ambiguities were resolved with the user via `AskUserQuestion` rather than assumed away, so the `/plan-feature` skill should not need to ask further clarification (target ambiguity score >= 4/5)
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
- **Making assumptions**: Don't guess at unclear requirements — use `AskUserQuestion` to ask the user directly rather than filling in gaps with your own assumptions
