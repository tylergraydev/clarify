# Claude Agent SDK Skill

This skill provides comprehensive documentation for the Claude Agent SDK (TypeScript).

## Reference Documentation Index

Use this table of contents to find the documentation you need for the Claude Agent SDK.

### Core API & Types

| Reference File | Purpose | Key Contents |
|:---------------|:--------|:-------------|
| **core-api.md** | Primary SDK functions | `query()`, `tool()`, `createSdkMcpServer()`, installation |
| **options-configuration.md** | Query configuration | `Options` type, `AgentDefinition`, `SettingSource`, `SdkPluginConfig`, `SdkBeta` |
| **query-interface.md** | Query control methods | `Query` interface methods, `SlashCommand`, `ModelInfo`, `McpServerStatus`, `AccountInfo` |
| **message-types.md** | SDK message types | `SDKMessage`, `SDKAssistantMessage`, `SDKUserMessage`, `SDKResultMessage`, `SDKSystemMessage`, `SDKPartialAssistantMessage`, `SDKCompactBoundaryMessage`, `ModelUsage` |
| **utility-types.md** | Utility types & patterns | `ConfigScope`, `AbortError`, type guards, common patterns |

### Tool Types

| Reference File | Purpose | Key Contents |
|:---------------|:--------|:-------------|
| **tool-inputs.md** | Tool input schemas | Input types for all built-in tools (Task, Bash, Edit, Read, Write, Grep, Glob, WebFetch, etc.) |
| **tool-outputs.md** | Tool output schemas | Output types for all built-in tools (TaskOutput, BashOutput, EditOutput, ReadOutput, etc.) |
| **custom-tools.md** | Building custom tools | Creating MCP tools with `tool()` and `createSdkMcpServer()`, tool best practices |

### Hooks & Permissions

| Reference File | Purpose | Key Contents |
|:---------------|:--------|:-------------|
| **hook-types.md** | Hook type definitions | `HookEvent`, `HookCallback`, `HookCallbackMatcher`, all hook input types (`PreToolUseHookInput`, etc.), `HookJSONOutput` |
| **hooks.md** | Hooks implementation guide | Intercepting tool execution, validation, logging, security controls, blocking dangerous operations |
| **permission-types.md** | Permission type definitions | `PermissionMode`, `CanUseTool`, `PermissionResult`, `PermissionUpdate`, `PermissionBehavior`, `PermissionUpdateDestination` |
| **handling-permissions.md** | Permission configuration guide | Permission modes, permission rules, `canUseTool` callback integration |

### Input/Output & Streaming

| Reference File | Purpose | Key Contents |
|:---------------|:--------|:-------------|
| **streaming-input.md** | Input modes | Streaming input mode vs single message input, `AsyncGenerator` patterns, image uploads |
| **streaming-responses.md** | Response streaming | `includePartialMessages`, `StreamEvent`, streaming text and tool calls |
| **user-input-and-approvals.md** | User input handling | Surfacing approval requests, clarifying questions, `AskUserQuestion` tool, `canUseTool` callback |
| **structure-output.md** | Structured outputs | JSON Schema validation, Zod/Pydantic integration, type-safe output |

### Configuration

| Reference File | Purpose | Key Contents |
|:---------------|:--------|:-------------|
| **mcp-configuration.md** | MCP server config | `McpServerConfig`, `McpStdioServerConfig`, `McpSSEServerConfig`, `McpHttpServerConfig`, `McpSdkServerConfigWithInstance`, `CallToolResult` |
| **sandbox-configuration.md** | Sandbox settings | `SandboxSettings`, `NetworkSandboxSettings`, `SandboxIgnoreViolations` |

### Sessions & Agents

| Reference File | Purpose | Key Contents |
|:---------------|:--------|:-------------|
| **agent-sdk-v2-reference.md** | V2 SDK preview | `unstable_v2_createSession()`, `unstable_v2_resumeSession()`, `unstable_v2_prompt()`, Session interface |
| **session-management.md** | Session handling | Session IDs, resuming sessions, session state management |
| **subagents.md** | Subagent implementation | Defining subagents programmatically, `agents` parameter, parallel execution |
| **agent-skills.md** | Agent skills system | SKILL.md files, skill discovery, skill invocation |

### Utilities & Features

| Reference File | Purpose | Key Contents |
|:---------------|:--------|:-------------|
| **slash-commands.md** | Slash commands | `/clear`, `/compact`, discovering available commands |
| **todo-list.md** | Todo tracking | Todo lifecycle, creating and updating todos, progress tracking |
| **tracking-costs-usage.md** | Cost & usage tracking | Token usage, billing, cost calculation |

---

## Quick Reference by Task

### Starting a Query
- **File:** core-api.md
- **Key function:** `query({ prompt, options })`

### Configuring Options
- **File:** options-configuration.md
- **Key type:** `Options`

### Handling Messages
- **File:** message-types.md
- **Key types:** `SDKMessage`, `SDKResultMessage`, `SDKAssistantMessage`

### Creating Custom Tools (MCP)
- **Files:** core-api.md, mcp-configuration.md, custom-tools.md
- **Key functions:** `tool()`, `createSdkMcpServer()`

### Implementing Hooks
- **Files:** hook-types.md, hooks.md
- **Key types:** `HookEvent`, `HookCallback`, hook input/output types

### Controlling Permissions
- **Files:** permission-types.md, handling-permissions.md
- **Key types:** `PermissionMode`, `CanUseTool`, `PermissionResult`

### Handling User Input & Approvals
- **File:** user-input-and-approvals.md
- **Key concepts:** `canUseTool` callback, `AskUserQuestion` tool

### Understanding Tool I/O
- **Files:** tool-inputs.md, tool-outputs.md
- **Key types:** `ToolInput`, `ToolOutput`, individual tool schemas

### Streaming Responses
- **File:** streaming-responses.md
- **Key option:** `includePartialMessages: true`

### Multi-turn Conversations
- **Files:** streaming-input.md, agent-sdk-v2-reference.md, session-management.md
- **Key patterns:** `AsyncIterable<SDKUserMessage>`, V2 Session interface, session resumption

### Subagents & Parallel Execution
- **File:** subagents.md
- **Key option:** `agents` parameter

### Structured Outputs
- **File:** structure-output.md
- **Key option:** `outputFormat`

### Sandbox Configuration
- **File:** sandbox-configuration.md
- **Key type:** `SandboxSettings`

### Cost Tracking
- **File:** tracking-costs-usage.md
- **Key fields:** `total_cost_usd`, `usage`, `modelUsage`
