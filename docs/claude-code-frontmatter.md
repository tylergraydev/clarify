# Claude Code Frontmatter Properties Reference

This comprehensive reference documents all YAML frontmatter properties available for custom slash commands, subagents, and skills in Claude Code.

---

## Table of Contents

- [Skills and Slash Commands](#skills-and-slash-commands-skillmd)
- [Subagents](#subagents-markdown-files-in-claudeagents)
- [CLI-Defined Subagents](#cli-defined-subagents---agents-flag)
- [String Substitutions](#string-substitutions-in-skills)
- [Hooks](#hooks)
- [Environment Variables](#environment-variables)
- [Invocation Control](#invocation-control-behavior-matrix)
- [Skill Directory Structure](#skill-directory-structure)
- [Best Practices](#best-practices)

---

## Skills and Slash Commands (SKILL.md)

Skills are modular, self-contained packages that extend Claude's capabilities by providing specialized knowledge, workflows, and tools. They use YAML frontmatter at the top of `SKILL.md` files to configure behavior.

> **Note:** Custom slash commands (files in `.claude/commands/`) continue to work, but skills are now the recommended approach. Commands and skills share the same frontmatter properties.

### Frontmatter Properties

| Property | Type | Required | Default | Description |
| :-- | :-- | :-- | :-- | :-- |
| `name` | string | Recommended | Directory name | Display name for the skill. Lowercase letters, numbers, and hyphens only (max 64 characters). Must start and end with alphanumeric. |
| `description` | string | Recommended | First paragraph of markdown | What the skill does and when to use it. Claude uses this to decide when to apply the skill automatically. Use third-person ("This skill should be used when..."). |
| `argument-hint` | string | No | None | Hint shown during autocomplete indicating expected arguments. Example: `[issue-number]` or `[filename] [format]`. |
| `allowed-tools` | string or array | No | Inherits from conversation | Tools Claude can use when this skill is active. Example: `Read, Write, Bash(git:*)`. |
| `model` | string | No | Inherits from session | Model to use: `haiku`, `sonnet`, `opus`. |
| `disable-model-invocation` | boolean | No | `false` | Set to `true` to prevent Claude from automatically invoking this skill. Use for manual-only workflows. |
| `user-invocable` | boolean | No | `true` | Set to `false` to hide from the `/` menu. Use for background knowledge users shouldn't invoke directly. |
| `context` | string | No | None | Set to `fork` to run in a forked subagent context with isolated environment. |
| `agent` | string | No | None | Which subagent type to use when `context: fork` is set. Options: `Explore`, `Plan`, `general-purpose`, or custom subagent names. |
| `hooks` | object | No | None | Lifecycle hooks for this skill. Supports `PreToolUse`, `PostToolUse` (matcher-based), and `Stop` events. |

### Property Details

#### description

The most critical field for automatic skill invocation. Be specific about:
- What the skill does
- When to use it (triggering conditions)
- When NOT to use it

**Best practices:**
- Keep under 60 characters for clean `/help` display
- Start with a verb (Review, Deploy, Generate)
- Use third-person voice
- Be specific, not generic

```yaml
# Good
description: Review code for security vulnerabilities and OWASP compliance

# Bad
description: This skill reviews code  # Unnecessary "This skill"
description: Review  # Too vague
```

#### allowed-tools

Restrict which tools the skill can use for security and clarity.

**Formats:**

```yaml
# Single tool
allowed-tools: Read

# Multiple tools (comma-separated string)
allowed-tools: Read, Write, Edit

# Multiple tools (array)
allowed-tools:
  - Read
  - Write
  - Bash(git:*)

# Bash with command filter (recommended)
allowed-tools: Bash(git:*)    # Only git commands
allowed-tools: Bash(npm:*)    # Only npm commands
allowed-tools: Bash(docker:*) # Only docker commands
```

**Common tool sets:**
- Read-only analysis: `Read, Grep, Glob`
- Code generation: `Read, Write, Edit, Grep`
- Testing: `Read, Bash(npm test:*), Grep`

#### model

Specify which Claude model executes the skill.

| Value | Use Case |
| :-- | :-- |
| `haiku` | Fast, simple tasks. Frequent invocations. Low complexity. |
| `sonnet` | Standard workflows. Balanced speed/quality. Most common use cases. |
| `opus` | Complex analysis. Architectural decisions. Deep code understanding. |
| (omit) | Inherit from conversation (recommended default). |

```yaml
---
description: Quick code formatting
model: haiku
---
```

#### argument-hint

Document expected arguments for users and autocomplete.

```yaml
---
argument-hint: [pr-number]
---
Fix issue #$1...

---
argument-hint: [source-branch] [target-branch] [commit-message]
---
Merge $1 into $2 with message: $3
```

**Best practices:**
- Use square brackets `[]` for each argument
- Use descriptive names (not `arg1`, `arg2`)
- Match order to positional arguments in skill body

#### disable-model-invocation

Prevents the SlashCommand tool from programmatically invoking the skill.

**Use when:**
- Command requires user judgment (approval workflows)
- Destructive operations with irreversible effects
- Interactive workflows needing user input

```yaml
---
description: Approve deployment to production
disable-model-invocation: true
---
```

### Complete Skill Example

```yaml
---
name: security-review
description: Review code for security vulnerabilities including OWASP Top 10. Use proactively after authentication or API changes.
argument-hint: [file-path]
allowed-tools: Read, Grep, Glob
model: sonnet
---

Review @$1 for security vulnerabilities including:
- SQL injection
- XSS attacks
- Authentication bypass
- Insecure data handling
- CSRF vulnerabilities

Provide specific line numbers and severity ratings (Critical, High, Medium, Low).
```

---

## Subagents (Markdown files in .claude/agents/)

Subagents are specialized Claude instances for parallel or isolated work. They maintain separate context from the main agent, enabling focused tasks without polluting the main conversation.

### Storage Locations

| Location | Scope | Use Case |
| :-- | :-- | :-- |
| `.claude/agents/*.md` | Project-level | Team workflows, project-specific agents |
| `~/.claude/agents/*.md` | User-level | Personal agents, cross-project utilities |

### Frontmatter Properties

| Property | Type | Required | Default | Description |
| :-- | :-- | :-- | :-- | :-- |
| `name` | string | Yes | — | Unique identifier. Lowercase letters, numbers, hyphens only. 3-50 characters. Must start and end with alphanumeric. |
| `description` | string | Yes | — | Natural language description of when Claude should delegate to this subagent. **Most critical field.** |
| `model` | string | Yes | `inherit` | Model to use: `inherit`, `sonnet`, `opus`, `haiku`. |
| `color` | string | Yes | — | Visual identifier in UI: `blue`, `cyan`, `green`, `yellow`, `magenta`, `red`. |
| `tools` | string array | No | Inherits all | Tools the subagent can use (allowlist). Examples: `["Read", "Write", "Bash", "Grep", "Glob"]`. |
| `disallowedTools` | string array | No | None | Tools to deny the subagent (denylist). Removed from inherited or specified tool list. |
| `permissionMode` | string | No | `default` | Permission mode: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan`. |
| `skills` | string array | No | None | Skills to preload into the subagent's context at startup. Full skill content is injected. |
| `hooks` | object | No | None | Lifecycle hooks for this subagent. Supports `PreToolUse`, `PostToolUse`, and `Stop` events. |

### Property Details

#### name

Agent identifier used for namespacing and invocation.

```yaml
# Good examples
name: code-reviewer
name: test-generator
name: api-docs-writer
name: security-analyzer

# Bad examples
name: helper        # Too generic
name: -agent-       # Starts/ends with hyphen
name: my_agent      # Underscores not allowed
name: ag            # Too short (< 3 chars)
```

#### description

**The most critical field.** Defines when Claude should trigger this agent.

**Must include:**
1. Triggering conditions ("Use this agent when...")
2. Multiple `<example>` blocks showing usage (2-4 recommended)
3. Context, user request, and assistant response in each example
4. `<commentary>` explaining why agent triggers

```yaml
description: |
  Use this agent when reviewing code changes for quality, security, and maintainability.
  Use PROACTIVELY after significant code modifications.

  <example>
  Context: User just finished implementing a new authentication feature
  user: "I'm done with the login changes"
  assistant: "Let me use the code-reviewer agent to check your authentication implementation."
  <commentary>
  Proactively triggered because authentication changes are security-sensitive.
  </commentary>
  </example>

  <example>
  Context: User explicitly requests review
  user: "Review my changes to the API endpoints"
  assistant: "I'll use the code-reviewer agent to analyze your API changes."
  <commentary>
  Explicitly requested by user for code review task.
  </commentary>
  </example>
```

#### color

Visual identifier for the agent in the UI. Choose distinct colors for different agents.

| Color | Suggested Use |
| :-- | :-- |
| `blue` | Analysis, review |
| `cyan` | Information gathering, exploration |
| `green` | Success-oriented tasks, generation |
| `yellow` | Caution, validation, warnings |
| `magenta` | Creative, generation |
| `red` | Critical, security, destructive |

#### tools

Restrict agent to specific tools (principle of least privilege).

```yaml
# Read-only analysis
tools: ["Read", "Grep", "Glob"]

# Code generation
tools: ["Read", "Write", "Edit", "Grep"]

# Testing
tools: ["Read", "Bash", "Grep"]

# Full access (omit field or use)
tools: ["*"]
```

#### permissionMode

Controls how permission prompts are handled.

| Value | Behavior |
| :-- | :-- |
| `default` | Normal permission prompts for sensitive operations |
| `acceptEdits` | Auto-accept file edit operations |
| `dontAsk` | Skip most permission prompts |
| `bypassPermissions` | Bypass all permissions (use with caution) |
| `plan` | Plan mode - research only, no modifications |

### Complete Subagent Example

```markdown
---
name: code-reviewer
description: |
  Expert code review specialist. Use PROACTIVELY after code changes for quality, security, and maintainability reviews.

  <example>
  Context: User completed a feature implementation
  user: "Done with the user authentication feature"
  assistant: "Let me use the code-reviewer agent to review your authentication code for security issues."
  <commentary>Security-sensitive code change triggers proactive review.</commentary>
  </example>
model: sonnet
color: blue
tools: ["Read", "Grep", "Glob", "Bash"]
---

You are an expert code reviewer focused on:

## Review Areas
1. **Code Quality**: Readability, maintainability, DRY principles
2. **Security**: OWASP Top 10, authentication, authorization
3. **Performance**: Algorithmic complexity, resource usage
4. **Testing**: Coverage gaps, edge cases

## Process
1. Understand the context and scope of changes
2. Review each file systematically
3. Identify issues with severity ratings
4. Provide actionable suggestions

## Output Format
For each issue:
- File and line number
- Severity (Critical/High/Medium/Low)
- Description
- Suggested fix
```

---

## CLI-Defined Subagents (--agents flag)

When creating subagents via the `--agents` CLI flag with JSON, a subset of fields is supported.

### Supported Fields

| Property | Type | Required | Description |
| :-- | :-- | :-- | :-- |
| `description` | string | Yes | When the subagent should be invoked. |
| `prompt` | string | Yes | The system prompt guiding the subagent's behavior (equivalent to markdown body in file-based subagents). |
| `tools` | string array | No | Array of specific tools the subagent can use. If omitted, inherits all tools. |
| `model` | string | No | Model alias: `sonnet`, `opus`, `haiku`, or `inherit`. Defaults to `inherit`. |

### Example

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security vulnerabilities, and performance issues. Provide specific line numbers and actionable feedback.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "test-generator": {
    "description": "Generate comprehensive tests for code changes.",
    "prompt": "You are a test generation specialist. Create unit tests, integration tests, and edge case coverage. Follow the projects existing test patterns.",
    "tools": ["Read", "Write", "Bash"],
    "model": "sonnet"
  }
}'
```

---

## String Substitutions in Skills

Skills support dynamic string substitutions in their content for flexible argument handling.

| Variable | Description | Example |
| :-- | :-- | :-- |
| `$ARGUMENTS` | All arguments passed when invoking the skill as a single string. If not present in the skill body, appended as `ARGUMENTS: <value>`. | `/review src/api.ts --strict` → `$ARGUMENTS` = `src/api.ts --strict` |
| `$ARGUMENTS[N]` | Access specific argument by 0-based index. | `$ARGUMENTS[0]` = first argument |
| `$N` | Shorthand for `$ARGUMENTS[N]`. | `$0` = first argument, `$1` = second |
| `${CLAUDE_SESSION_ID}` | Current session ID. Useful for logging or creating session-specific files. | `session_abc123` |

### Examples

**Single argument:**
```yaml
---
argument-hint: [issue-number]
---
Fix issue #$ARGUMENTS following our coding standards.
```

**Multiple positional arguments:**
```yaml
---
argument-hint: [source-branch] [target-branch] [commit-message]
---
Merge $1 into $2 with message: "$3"
```

**File references with arguments:**
```yaml
---
argument-hint: [file-path]
---
Review @$1 for security vulnerabilities.
```

**Combined patterns:**
```yaml
---
argument-hint: [app-name] [environment] [options]
---
Deploy $1 to $2 environment with options: $3
```

---

## Hooks

Hooks are event-driven automation scripts that execute in response to Claude Code events. They can validate operations, enforce policies, add context, and integrate external tools.

### Hook Types

#### Prompt-Based Hooks (Recommended)

Use LLM-driven decision making for context-aware validation.

```json
{
  "type": "prompt",
  "prompt": "Evaluate if this tool use is appropriate: $TOOL_INPUT",
  "timeout": 30
}
```

**Benefits:** Context-aware decisions, flexible evaluation logic, better edge case handling, easier to maintain.

**Supported events:** `Stop`, `SubagentStop`, `UserPromptSubmit`, `PreToolUse`

#### Command Hooks

Execute bash commands for deterministic checks.

```json
{
  "type": "command",
  "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh",
  "timeout": 60
}
```

**Use for:** Fast deterministic validations, file system operations, external tool integrations, performance-critical checks.

### Hook Events

| Event | Matcher Input | When It Fires | Use For |
| :-- | :-- | :-- | :-- |
| `PreToolUse` | Tool name | Before tool runs | Validation, modification, approval/denial |
| `PostToolUse` | Tool name | After tool completes | Feedback, logging, reactions |
| `UserPromptSubmit` | `*` | When user submits prompt | Context injection, validation |
| `Stop` | `*` | When main agent considers stopping | Completeness validation |
| `SubagentStop` | Agent type name | When subagent completes | Task validation |
| `SubagentStart` | Agent type name | When subagent begins | Context setup (project-level only) |
| `SessionStart` | `*` | When session begins | Context loading, environment setup |
| `SessionEnd` | `*` | When session ends | Cleanup, logging, state preservation |
| `PreCompact` | `*` | Before context compaction | Preserve critical information |
| `Notification` | `*` | When Claude sends notifications | Logging, external integrations |

### Hook Configuration Formats

#### Plugin Format (hooks/hooks.json)

For plugin hooks, use wrapper format:

```json
{
  "description": "Validation hooks for code quality",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Validate file write safety. Check: system paths, credentials, path traversal. Return 'approve' or 'deny'."
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Verify task completion: tests run, build succeeded. Return 'approve' to stop or 'block' with reason."
          }
        ]
      }
    ]
  }
}
```

#### Settings Format (.claude/settings.json)

For user settings, use direct format (no wrapper):

```json
{
  "PreToolUse": [
    {
      "matcher": "Write",
      "hooks": [
        {
          "type": "command",
          "command": "bash scripts/validate-write.sh"
        }
      ]
    }
  ]
}
```

#### Inline Format (Skill/Subagent Frontmatter)

For inline hooks in skills or subagents:

```yaml
---
name: my-skill
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: prompt
          prompt: "Validate this file operation is safe"
  Stop:
    - matcher: "*"
      hooks:
        - type: prompt
          prompt: "Verify all requirements are met"
---
```

### Matchers

**Exact match:**
```json
"matcher": "Write"
```

**Multiple tools (OR):**
```json
"matcher": "Read|Write|Edit"
```

**Wildcard (all):**
```json
"matcher": "*"
```

**Regex patterns:**
```json
"matcher": "mcp__.*__delete.*"
```

**Common patterns:**
- All MCP tools: `mcp__.*`
- Specific plugin MCP tools: `mcp__plugin_name_.*`
- All file operations: `Read|Write|Edit`
- Bash only: `Bash`

### Hook Output Format

#### Standard Output (All Hooks)

```json
{
  "continue": true,
  "suppressOutput": false,
  "systemMessage": "Message for Claude"
}
```

#### PreToolUse Decision Output

```json
{
  "hookSpecificOutput": {
    "permissionDecision": "allow|deny|ask",
    "updatedInput": {"field": "modified_value"}
  },
  "systemMessage": "Explanation for Claude"
}
```

#### Stop/SubagentStop Decision Output

```json
{
  "decision": "approve|block",
  "reason": "Explanation",
  "systemMessage": "Additional context"
}
```

### Exit Codes

| Code | Meaning |
| :-- | :-- |
| `0` | Success (stdout shown in transcript) |
| `2` | Blocking error (stderr fed back to Claude) |
| Other | Non-blocking error |

### Hook Input Format

All hooks receive JSON via stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.txt",
  "cwd": "/current/working/dir",
  "permission_mode": "ask|allow",
  "hook_event_name": "PreToolUse"
}
```

**Event-specific fields:**
- **PreToolUse/PostToolUse:** `tool_name`, `tool_input`, `tool_result`
- **UserPromptSubmit:** `user_prompt`
- **Stop/SubagentStop:** `reason`

Access in prompts: `$TOOL_INPUT`, `$TOOL_RESULT`, `$USER_PROMPT`

---

## Environment Variables

Available in all command hooks:

| Variable | Description |
| :-- | :-- |
| `$CLAUDE_PROJECT_DIR` | Project root path |
| `$CLAUDE_PLUGIN_ROOT` | Plugin directory (use for portable paths) |
| `$CLAUDE_ENV_FILE` | SessionStart only: persist env vars here |
| `$CLAUDE_CODE_REMOTE` | Set if running in remote context |
| `$CLAUDE_SESSION_ID` | Current session identifier |

**Always use `${CLAUDE_PLUGIN_ROOT}` for portable paths:**

```json
{
  "type": "command",
  "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh"
}
```

**Persisting environment variables (SessionStart only):**

```bash
echo "export PROJECT_TYPE=nodejs" >> "$CLAUDE_ENV_FILE"
```

---

## Invocation Control Behavior Matrix

How frontmatter fields affect who can invoke a skill:

| Configuration | User Can Invoke | Claude Can Invoke | Behavior |
| :-- | :-- | :-- | :-- |
| (default) | ✓ Yes | ✓ Yes | Description always in context, full skill loads when invoked |
| `disable-model-invocation: true` | ✓ Yes | ✗ No | Description not in context, full skill loads only when user invokes |
| `user-invocable: false` | ✗ No | ✓ Yes | Description always in context, hidden from `/` menu, full skill loads when Claude invokes |
| Both `true` / `false` | ✗ No | ✗ No | Skill is effectively disabled |

---

## Skill Directory Structure

Skills follow a structured directory layout:

```
skill-name/
├── SKILL.md              # Required: Frontmatter + instructions
└── (Optional Resources)
    ├── scripts/          # Executable code (Python/Bash/etc.)
    ├── references/       # Documentation loaded into context as needed
    └── assets/           # Files used in output (templates, icons, fonts)
```

### Resource Types

#### scripts/

Executable code for deterministic or repetitive tasks.

- **When to include:** Code rewritten repeatedly, deterministic reliability needed
- **Benefits:** Token efficient, deterministic, may execute without loading into context
- **Example:** `scripts/rotate_pdf.py`

#### references/

Documentation loaded into context as needed.

- **When to include:** Documentation Claude should reference while working
- **Use cases:** Database schemas, API docs, company policies, detailed workflow guides
- **Benefits:** Keeps SKILL.md lean, loaded only when needed
- **Best practice:** If files are large (>10k words), include grep search patterns in SKILL.md

#### assets/

Files used in output, not loaded into context.

- **When to include:** Files used in final output
- **Use cases:** Templates, images, icons, boilerplate code, fonts
- **Benefits:** Separates output resources from documentation

### Progressive Disclosure

Skills use three-level loading for context efficiency:

1. **Metadata (name + description)** — Always in context (~100 words)
2. **SKILL.md body** — When skill triggers (<5k words recommended)
3. **Bundled resources** — As needed by Claude (unlimited, scripts can execute without context loading)

---

## Best Practices

### Skills

**DO:**
- ✅ Write descriptions in third-person ("This skill should be used when...")
- ✅ Keep SKILL.md lean, move detailed reference to `references/`
- ✅ Use `allowed-tools` to restrict to minimum needed
- ✅ Provide `argument-hint` for skills with arguments
- ✅ Test skill triggering with various phrasings

**DON'T:**
- ❌ Include information in both SKILL.md and references (pick one)
- ❌ Use generic descriptions ("A useful skill")
- ❌ Grant unnecessary tool access
- ❌ Create overly long SKILL.md files (>5k words)

### Subagents

**DO:**
- ✅ Include 2-4 concrete examples in description
- ✅ Write specific triggering conditions
- ✅ Use `inherit` for model unless specific need
- ✅ Choose appropriate tools (least privilege)
- ✅ Write clear, structured system prompts
- ✅ Use distinct colors for different agents

**DON'T:**
- ❌ Use generic descriptions without examples
- ❌ Omit triggering conditions
- ❌ Give all agents the same color
- ❌ Grant unnecessary tool access
- ❌ Write vague system prompts

### Hooks

**DO:**
- ✅ Use prompt-based hooks for complex logic
- ✅ Use `${CLAUDE_PLUGIN_ROOT}` for portability
- ✅ Validate all inputs in command hooks
- ✅ Quote all bash variables
- ✅ Set appropriate timeouts (default: command 60s, prompt 30s)
- ✅ Return structured JSON output

**DON'T:**
- ❌ Use hardcoded paths
- ❌ Trust user input without validation
- ❌ Create long-running hooks
- ❌ Rely on hook execution order (hooks run in parallel)
- ❌ Modify global state unpredictably
- ❌ Log sensitive information

### Context Budget

If you have many skills, their descriptions may exceed the default 15,000 character budget for the slash command tool. Check with `/context` command and adjust using the `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable if needed.

---

## References

- [Official Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Official Subagents Documentation](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Official Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks)
- [CLI Reference](https://docs.claude.com/en/docs/claude-code/cli-reference)
- [Settings Reference](https://docs.claude.com/en/docs/claude-code/settings)
