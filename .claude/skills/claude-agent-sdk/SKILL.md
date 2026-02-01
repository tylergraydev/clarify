# Claude Agent SDK - Comprehensive Implementation Guide

## Overview

This skill provides complete documentation for implementing the Claude Agent SDK (formerly Claude Code SDK) in your projects. The Claude Agent SDK enables developers to build AI agents that autonomously read files, run commands, search the web, edit code, and more - using the same tools, agent loop, and context management that power Claude Code.

## Purpose

Use this skill when implementing Claude Agent SDK functionality in your project. It covers installation, configuration, and all major SDK components needed to build production-ready AI agents.

## Key Capabilities

The Claude Agent SDK provides:

- **Built-in Tools**: Read files, run commands, edit code without custom implementation
- **Agent Loop**: Autonomous gather context → take action → verify results workflow
- **Streaming & Single-Shot Modes**: Real-time interactive sessions or one-off queries
- **Custom Tools**: Extend with your own functionality via MCP servers
- **Skills System**: Package specialized expertise into reusable components
- **Hooks**: Intercept and control agent behavior at key execution points
- **Permission Controls**: Fine-grained safety and approval workflows
- **Subagents**: Parallel task execution with isolated contexts
- **Session Management**: Persistent conversations with state preservation

## Architecture

The SDK is built directly on top of Claude Code, giving programmatic access to:
- The same tool execution environment
- The agent loop (context gathering, action, verification)
- Built-in tools (Read, Write, Bash, Grep, Glob, etc.)
- MCP server integrations
- Permission and security systems

## Reference Documentation

### Core Components

1. **[Installation & Setup](./references/installation-setup.md)**
   - Installing Claude Code CLI (required runtime)
   - SDK installation (Python/TypeScript)
   - API key configuration
   - Third-party provider setup (Bedrock, Vertex, Foundry)

2. **[Agents](./references/agents.md)**
   - Creating agents with `query()` function
   - Agent options and configuration
   - System prompts and behavior customization
   - Subagents for parallel task execution
   - Built-in agents (Explore, Plan, General-purpose)

3. **[Tools](./references/tools.md)**
   - Built-in tool capabilities (Read, Write, Bash, etc.)
   - Custom tool implementation via MCP servers
   - Tool permissions with `allowedTools`
   - Tool naming conventions (`mcp__{server}__{tool}`)

4. **[Skills](./references/skills.md)**
   - Creating SKILL.md files
   - Skill directory structure (`.claude/skills/`)
   - Loading skills with `settingSources`
   - Skill invocation and discovery
   - Tool restrictions for skills

5. **[Hooks](./references/hooks.md)**
   - Hook events (PreToolUse, PostToolUse, Stop, etc.)
   - Hook callbacks and matchers
   - Input data and return values
   - Permission decisions (allow/deny/ask)
   - Validation, logging, and security controls

6. **[Streaming Output](./references/streaming-output.md)**
   - Streaming vs single message input modes
   - Real-time feedback and progress
   - Multi-turn conversations
   - Async generator patterns
   - Event types and message handling

7. **[MCP Servers](./references/mcp-servers.md)**
   - Model Context Protocol integration
   - Server configuration (stdio, HTTP, SSE)
   - Authentication and credentials
   - Custom MCP server creation
   - Tool discovery and permissions

8. **[Permission Modes](./references/permission-modes.md)**
   - Permission evaluation flow
   - Available modes (default, acceptEdits, bypassPermissions, plan)
   - Permission rules in settings.json
   - Runtime permission handling with `canUseTool`
   - Security best practices

## Quick Start Example

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix bugs in utils.py",
        options=ClaudeAgentOptions(
            cwd="/path/to/project",
            allowed_tools=["Read", "Write", "Grep"],
            permission_mode="default"
        )
    ):
        if message.type == "result" and message.subtype == "success":
            print(message.result)

asyncio.run(main())
```

## When to Use This Skill

- Implementing autonomous code analysis and editing agents
- Building agents that interact with file systems and run commands
- Creating custom AI assistants with specialized tools
- Integrating Claude into development workflows and CI/CD pipelines
- Building agents that require approval workflows and permission controls
- Developing multi-agent systems with task delegation
- Creating domain-specific agents with custom Skills

## Key Concepts

### Agent Loop
The SDK implements a gather → act → verify loop:
1. **Gather Context**: Use tools like Read, Grep, Search to understand the task
2. **Take Action**: Execute tools (Bash scripts, file edits, API calls)
3. **Verify Results**: Check outputs and iterate if needed

### Tool Execution
Unlike traditional tool-calling APIs, the SDK **executes tools directly**. You don't implement tool handlers - Claude runs commands, edits files, and performs actions autonomously.

### Context Management
- Subagents use isolated context windows
- Only relevant information returns to orchestrator
- Prevents context pollution from diverse tasks
- Enables parallel task execution

### Permission Philosophy
- Default: Ask before risky operations
- Accept Edits: Auto-approve file operations
- Bypass: Full autonomy (use with caution)
- Plan: No execution, planning only

## Version Information

- SDK renamed from "Claude Code SDK" to "Claude Agent SDK" (October 2025)
- Requires Claude Code CLI v2.0+ for streaming support
- Compatible with Claude Sonnet 4.5, Opus, and Haiku models
- See [migration guide](https://platform.claude.com/docs/en/agent-sdk/migration) if upgrading from old SDK

## Additional Resources

- [Official Documentation](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Quickstart Tutorial](https://platform.claude.com/docs/en/agent-sdk/quickstart)
- [GitHub Examples](https://github.com/anthropics/claude-agent-sdk-python/tree/main/examples)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## Best Practices

1. **Start with streaming mode** - Provides full capabilities and interactivity
2. **Use minimal tool sets** - Only grant access to tools needed for the task
3. **Implement hooks for security** - Validate operations before execution
4. **Test permission modes** - Start with default, relax only when safe
5. **Leverage subagents** - Isolate context for complex multi-step workflows
6. **Create Skills for reusable expertise** - Package domain knowledge
7. **Monitor with hooks** - Log tool usage and track agent behavior

## Support

For issues, questions, or contributions:
- [Anthropic Console](https://console.anthropic.com/) - API keys and account management
- [Documentation](https://platform.claude.com/docs) - Complete API reference
- [Community](https://discord.gg/anthropic) - Discord for developer support