---
name: claude-code-frontmatter
description: Claude Code frontmatter reference for skills, subagents, and slash commands. Use when creating or modifying SKILL.md files, subagent definitions in .claude/agents/, or custom slash commands. Provides the correct YAML frontmatter properties, their types, and usage patterns.
user-invocable: false
---

# Claude Code Frontmatter Reference

Comprehensive reference for YAML frontmatter properties in Claude Code skills, subagents, and slash commands. Use this guide when creating or modifying these files.

## When to Apply

Reference these guidelines when:
- Creating new skills in `.claude/skills/*/SKILL.md`
- Defining subagents in `.claude/agents/` or `~/.claude/agents/`
- Writing custom slash commands
- Configuring tool permissions or lifecycle hooks
- Setting up invocation controls or model selection

## Skills and Slash Commands (SKILL.md)

Skills use YAML frontmatter at the top of `SKILL.md` files. Custom slash commands in `.claude/commands/` continue to work, but skills are the recommended approach.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Recommended | Display name for the skill. If omitted, uses directory name. Lowercase letters, numbers, and hyphens only (max 64 chars). |
| `description` | string | Recommended | What the skill does and when to use it. Claude uses this for automatic invocation decisions. If omitted, uses first paragraph of content. |
| `argument-hint` | string | No | Hint shown during autocomplete. Example: `[issue-number]` or `[filename] [format]`. |
| `disable-model-invocation` | boolean | No | Set `true` to prevent Claude from auto-loading. Use for manual-only workflows. Default: `false`. |
| `user-invocable` | boolean | No | Set `false` to hide from `/` menu. Use for background knowledge. Default: `true`. |
| `allowed-tools` | string | No | Comma-separated tools Claude can use without permission. Example: `Read, Grep, Bash`. |
| `model` | string | No | Model to use: `haiku`, `sonnet`, `opus`, or omit to inherit session model. |
| `context` | string | No | Set to `fork` to run in isolated subagent context. |
| `agent` | string | No | Subagent type when `context: fork`. Options: `Explore`, `Plan`, `general-purpose`, or custom names. |
| `hooks` | object | No | Lifecycle hooks. Supports `PreToolUse`, `PostToolUse` (matcher-based), and `Stop` events. |

### Skill Example

```yaml
---
name: my-skill
description: Description of when Claude should use this skill automatically.
allowed-tools: Read, Grep, Glob
model: sonnet
---

# Skill Title

Instructions for Claude when this skill is active...
```

## Subagents (.claude/agents/)

Subagents are Markdown files with YAML frontmatter in `.claude/agents/` (project-level) or `~/.claude/agents/` (user-level).

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Unique identifier using lowercase letters and hyphens. |
| `description` | string | Yes | When Claude should delegate to this subagent. Used for automatic delegation. |
| `tools` | string[] | No | Allowlist of tools. Examples: `Read`, `Write`, `Bash`. If omitted, inherits all parent tools. |
| `disallowedTools` | string[] | No | Denylist of tools. Removed from inherited or specified list. |
| `model` | string | No | Model: `sonnet`, `opus`, `haiku`, or `inherit`. Default: `inherit`. |
| `permissionMode` | string | No | Options: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan`. |
| `skills` | string[] | No | Skills to preload into context at startup. Full content is injected. |
| `hooks` | object | No | Lifecycle hooks: `PreToolUse`, `PostToolUse`, `Stop` events. |

### Subagent Example

```yaml
---
name: code-reviewer
description: Expert code reviewer. Use proactively after code changes to ensure quality.
tools:
  - Read
  - Grep
  - Glob
model: sonnet
---

You are a senior code reviewer. Focus on code quality and security...
```

## CLI-Defined Subagents (--agents flag)

When creating subagents via CLI with JSON:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `description` | string | Yes | When the subagent should be invoked. |
| `prompt` | string | Yes | System prompt (equivalent to markdown body in file-based). |
| `tools` | string[] | No | Array of allowed tools. If omitted, inherits all. |
| `model` | string | No | Model alias: `sonnet`, `opus`, `haiku`, `inherit`. Default: `inherit`. |

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality and security.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

## String Substitutions in Skills

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking. If not present, appended as `ARGUMENTS: <value>`. |
| `$ARGUMENTS[N]` | Access specific argument by 0-based index (e.g., `$ARGUMENTS[0]`). |
| `$N` | Shorthand for `$ARGUMENTS[N]` (e.g., `$0` for first, `$1` for second). |
| `${CLAUDE_SESSION_ID}` | Current session ID. Useful for logging or session-specific files. |

## Hook Events

Both skills and subagents support hooks for automation:

| Event | Matcher Input | When It Fires |
|-------|---------------|---------------|
| `PreToolUse` | Tool name | Before using a tool |
| `PostToolUse` | Tool name | After using a tool |
| `Stop` | (none) | When finished |
| `SubagentStart` | Agent type name | When a subagent begins (project-level only) |
| `SubagentStop` | Agent type name | When a subagent completes (project-level only) |

## Invocation Control Matrix

| Configuration | You Can Invoke | Claude Can Invoke | When Loaded |
|---------------|----------------|-------------------|-------------|
| (default) | ✓ Yes | ✓ Yes | Description in context, full skill loads when invoked |
| `disable-model-invocation: true` | ✓ Yes | ✗ No | Not in context, loads only when user invokes |
| `user-invocable: false` | ✗ No | ✓ Yes | Description in context, Claude loads when needed |

## Best Practices

1. **Use descriptive names**: Lowercase letters, numbers, hyphens only. Max 64 characters.

2. **Write clear descriptions**: Claude uses descriptions to decide when to apply skills automatically. Be specific about trigger conditions.

3. **Minimize tool permissions**: Only grant tools that are actually needed. Use `tools` allowlist for subagents.

4. **Consider invocation patterns**:
   - Default: Both user and Claude can invoke
   - `disable-model-invocation: true`: Manual-only workflows
   - `user-invocable: false`: Background knowledge Claude applies automatically

5. **Context budget awareness**: Many skills may exceed the 15,000 character budget. Check with `/context` and adjust via `SLASH_COMMAND_TOOL_CHAR_BUDGET` if needed.

6. **Skill vs Subagent choice**:
   - Skills: Reusable instructions loaded into various contexts
   - Subagents: Specialized Claude instances for parallel or isolated work
