## Claude Code Frontmatter Properties Reference

This comprehensive reference documents all YAML frontmatter properties available for custom slash commands, subagents, and skills in Claude Code as of January 2026.[^1_1][^1_2][^1_3][^1_4]

### Skills and Slash Commands (SKILL.md)

Skills use YAML frontmatter at the top of `SKILL.md` files to configure behavior. Custom slash commands have been merged into the skills system—files in `.claude/commands/` continue to work, but skills are now the recommended approach.[^1_2][^1_1]


| Property | Type | Required | Description |
| :-- | :-- | :-- | :-- |
| `name` | string | No* | Display name for the skill. If omitted, uses the directory name. Lowercase letters, numbers, and hyphens only (max 64 characters). |
| `description` | Recommended | Recommended | What the skill does and when to use it. Claude uses this to decide when to apply the skill automatically. If omitted, uses the first paragraph of markdown content.[^1_1] |
| `argument-hint` | string | No | Hint shown during autocomplete indicating expected arguments. Example: `[issue-number]` or `[filename] [format]`.[^1_1] |
| `disable-model-invocation` | boolean | No | Set to `true` to prevent Claude from automatically loading this skill. Use for workflows you want to trigger manually with `/name`. Default: `false`.[^1_1] |
| `user-invocable` | boolean | No | Set to `false` to hide from the `/` menu. Use for background knowledge users shouldn't invoke directly. Default: `true`.[^1_1] |
| `allowed-tools` | string (comma-separated) | No | Tools Claude can use without asking permission when this skill is active. Example: `Read, Grep, Bash`.[^1_1] |
| `model` | string | No | Model to use when this skill is active. Options: `haiku`, `sonnet`, `opus`, or omit to inherit the session model.[^1_1] |
| `context` | string | No | Set to `fork` to run in a forked subagent context with its own isolated environment.[^1_1] |
| `agent` | string | No | Which subagent type to use when `context: fork` is set. Options: `Explore`, `Plan`, `general-purpose`, or custom subagent names.[^1_1] |
| `hooks` | object | No | Lifecycle hooks for this skill. Supports `PreToolUse`, `PostToolUse` (matcher-based), and `Stop` events.[^1_2] |

*`name` is required for proper skill identification, though technically optional if the directory name is suitable.[^1_1]

### Subagents (Markdown files in .claude/agents/)

Subagents are defined as Markdown files with YAML frontmatter, stored in either `.claude/agents/` (project-level) or `~/.claude/agents/` (user-level).[^1_3][^1_4]


| Property | Type | Required | Description |
| :-- | :-- | :-- | :-- |
| `name` | string | Yes | Unique identifier using lowercase letters and hyphens. Used to reference the subagent.[^1_3] |
| `description` | string | Yes | Natural language description of when Claude should delegate to this subagent. Used for automatic delegation decisions.[^1_3] |
| `tools` | string array | No | Tools the subagent can use (allowlist). Examples: `Read, Write, Bash, Grep, Glob`. If omitted, inherits all tools from parent conversation.[^1_3] |
| `disallowedTools` | string array | No | Tools to deny the subagent (denylist). Removed from inherited or specified tool list.[^1_3] |
| `model` | string | No | Model to use: `sonnet`, `opus`, `haiku`, or `inherit`. If omitted, defaults to `inherit` (uses parent's model).[^1_3] |
| `permissionMode` | string | No | Permission mode: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, or `plan`. Controls how permission prompts are handled.[^1_3] |
| `skills` | string array | No | Skills to preload into the subagent's context at startup. Full skill content is injected, not just made available for invocation.[^1_3] |
| `hooks` | object | No | Lifecycle hooks for this subagent. Supports `PreToolUse`, `PostToolUse` (matcher-based), and `Stop` events.[^1_3] |

### CLI-Defined Subagents (--agents flag)

When creating subagents via the `--agents` CLI flag with JSON, only these fields are supported:[^1_4]


| Property | Type | Required | Description |
| :-- | :-- | :-- | :-- |
| `description` | string | Yes | When the subagent should be invoked (same as frontmatter).[^1_4] |
| `prompt` | string | Yes | The system prompt guiding the subagent's behavior (equivalent to markdown body in file-based subagents).[^1_4] |
| `tools` | string array | No | Array of specific tools the subagent can use (e.g., `["Read", "Edit", "Bash"]`). If omitted, inherits all tools.[^1_4] |
| `model` | string | No | Model alias: `sonnet`, `opus`, `haiku`, or `inherit`. Defaults to `inherit` if omitted.[^1_4] |

**Example:**

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


### String Substitutions in Skills

Skills support dynamic string substitutions in their content:[^1_1]


| Variable | Description |
| :-- | :-- |
| `$ARGUMENTS` | All arguments passed when invoking the skill. If not present, appended as `ARGUMENTS: <value>`. |
| `$ARGUMENTS[N]` | Access specific argument by 0-based index (e.g., `$ARGUMENTS[^1_0]` for first argument). |
| `$N` | Shorthand for `$ARGUMENTS[N]` (e.g., `$0` for first argument, `$1` for second). |
| `${CLAUDE_SESSION_ID}` | Current session ID. Useful for logging or creating session-specific files. |

### Hook Events

Both skills and subagents support hooks for automation around tool usage:[^1_2][^1_3]


| Event | Matcher Input | When It Fires |
| :-- | :-- | :-- |
| `PreToolUse` | Tool name | Before the skill/subagent uses a tool |
| `PostToolUse` | Tool name | After the skill/subagent uses a tool |
| `Stop` | (none) | When the skill/subagent finishes |
| `SubagentStart` | Agent type name | When a subagent begins (project-level hooks only) |
| `SubagentStop` | Agent type name | When a subagent completes (project-level hooks only) |

### Invocation Control Behavior Matrix

How frontmatter fields affect who can invoke a skill:[^1_1]


| Configuration | You Can Invoke | Claude Can Invoke | When Loaded |
| :-- | :-- | :-- | :-- |
| (default) | ✓ Yes | ✓ Yes | Description always in context, full skill loads when invoked |
| `disable-model-invocation: true` | ✓ Yes | ✗ No | Description not in context, full skill loads only when you invoke |
| `user-invocable: false` | ✗ No | ✓ Yes | Description always in context, full skill loads when invoked |

### Special Considerations

**Skill vs. Subagent Properties:** Skills and subagents have largely overlapping functionality but serve different purposes. Skills are reusable instructions that can be loaded into various contexts; subagents are specialized Claude instances for parallel or isolated work.[^1_3][^1_1]

**Context Budget:** If you have many skills, their descriptions may exceed the default 15,000 character budget for the slash command tool. Check with `/context` command and adjust using the `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable if needed.[^1_1]

**Hooks Format:** Both inline (skill/subagent frontmatter) and project-level (settings.json) hook configurations are supported. Inline hooks run only while that specific component is active; project-level hooks respond to subagent lifecycle events.[^1_2][^1_3]

### References

https://code.claude.com/docs/en/skills  https://code.claude.com/docs/en/sub-agents  https://code.claude.com/docs/en/cli-reference  Official Claude Code documentation and examples from community resources.[^1_4][^1_3][^1_2][^1_1]
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29][^1_30][^1_31][^1_32][^1_33][^1_34][^1_35][^1_36][^1_37][^1_5][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://m.academy/lessons/define-frontmatter-custom-slash-commands-claude-code/

[^1_2]: https://code.claude.com/docs/en/sub-agents

[^1_3]: https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/

[^1_4]: https://alexop.dev/prompts/claude/claude-create-slash-command/

[^1_5]: https://subagents.app

[^1_6]: https://mcpmarket.com/tools/skills/claude-code-frontmatter-schemas

[^1_7]: https://www.youtube.com/watch?v=52KBhQqqHuc

[^1_8]: https://shipyard.build/blog/claude-code-subagents-guide/

[^1_9]: https://mikhail.io/2025/10/claude-code-skills/

[^1_10]: https://www.reddit.com/r/ClaudeAI/comments/1noyvmq/claude_code_can_invoke_your_custom_slash_commands/

[^1_11]: https://www.reddit.com/r/ClaudeAI/comments/1obq6wq/understanding_claude_skills_vs_subagents_its_not/

[^1_12]: https://github.com/anthropics/skills

[^1_13]: https://rewire.it/blog/claude-code-agents-skills-slash-commands/

[^1_14]: https://wmedia.es/en/writing/claude-code-subagents-guide-ai

[^1_15]: https://www.reddit.com/r/ClaudeAI/comments/1qcwckg/the_complete_guide_to_claude_code_v2_claudemd_mcp/

[^1_16]: https://frontmatter.codes/docs/content-creation/fields

[^1_17]: https://code.claude.com/docs/en/headless

[^1_18]: https://ghostinthedata.info/posts/2025/2025-09-13-building-ai-agents-with-claude-code/

[^1_19]: https://code.claude.com/docs/en/settings

[^1_20]: https://code.claude.com/docs/en/cli-reference

[^1_21]: https://www.thetoolnerd.com/p/how-to-build-claude-skills-step-by-step-guide-thetoolnerd

[^1_22]: https://github.com/anthropics/claude-code/issues/19292

[^1_23]: https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf?hsLang=en

[^1_24]: https://nader.substack.com/p/the-complete-guide-to-building-agents

[^1_25]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices

[^1_26]: https://github.com/anthropics/claude-code/issues/8501

[^1_27]: https://www.anthropic.com/engineering/advanced-tool-use

[^1_28]: https://github.com/houseworthe/house-agents

[^1_29]: https://websearchapi.ai/blog/how-to-create-claude-code-skills

[^1_30]: https://www.youtube.com/watch?v=Phr7vBx9yFQ

[^1_31]: https://www.codecademy.com/article/how-to-build-claude-skills

[^1_32]: https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/

[^1_33]: https://colinmcnamara.com/blog/understanding-skills-agents-and-mcp-in-claude-code

[^1_34]: https://www.ascend.io/blog/custom-agents-with-claude-code-and-otto

[^1_35]: https://www.producttalk.org/how-to-use-claude-code-features/

[^1_36]: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

[^1_37]: https://github.com/anthropics/claude-code/issues/12378

