# Agents - Claude Agent SDK

## Overview

Agents are the core execution units of the Claude Agent SDK. An agent autonomously gathers context, takes actions using tools, and verifies results to complete tasks. This document covers agent creation, configuration, system prompts, and subagent orchestration.

## Creating Agents

### Basic Agent with query()

The `query()` function is the primary interface for creating agents:

**Python:**

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Analyze the codebase for security issues",
        options=ClaudeAgentOptions(
            cwd="/path/to/project",
            allowed_tools=["Read", "Grep", "Glob"],
            max_turns=20
        )
    ):
        if message.type == "result" and message.subtype == "success":
            print(message.result)

asyncio.run(main())
```

**TypeScript:**

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  for await (const message of query({
    prompt: "Analyze the codebase for security issues",
    options: {
      cwd: "/path/to/project",
      allowedTools: ["Read", "Grep", "Glob"],
      maxTurns: 20
    }
  })) {
    if (message.type === "result" && message.subtype === "success") {
      console.log(message.result);
    }
  }
}

main();
```

## Agent Configuration Options

### ClaudeAgentOptions / Options Object

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `cwd` | `string` | Working directory for agent | Current directory |
| `model` | `string` | Model to use (sonnet/opus/haiku) | sonnet |
| `allowed_tools` / `allowedTools` | `string[]` | Tools agent can use | All tools |
| `permission_mode` / `permissionMode` | `string` | Permission mode (see Permissions) | default |
| `max_turns` / `maxTurns` | `number` | Maximum conversation turns | 50 |
| `max_budget_usd` / `maxBudgetUsd` | `number` | Budget limit in USD | No limit |
| `setting_sources` / `settingSources` | `string[]` | Config sources (user/project) | ["user"] |
| `hooks` | `object` | Hook callbacks for events | {} |
| `mcp_servers` / `mcpServers` | `object` | MCP server configurations | {} |
| `system_prompt` / `systemPrompt` | `string` | Custom system instructions | Default prompt |

### Model Selection

```python
options = ClaudeAgentOptions(
    model="sonnet",  # Claude Sonnet 4.5 (default, balanced)
    # model="opus"   # Claude Opus (most capable, slower)
    # model="haiku"  # Claude Haiku (fastest, lower cost)
)
```

### Working Directory

```python
options = ClaudeAgentOptions(
    cwd="/path/to/project",  # Agent operates in this directory
)
```

Agent has access to files in this directory and subdirectories.

### Tool Restrictions

```python
options = ClaudeAgentOptions(
    allowed_tools=[
        "Read",      # Read files
        "Write",     # Write files
        "Grep",      # Search file contents
        "Glob",      # List files
        "Bash",      # Run shell commands
        "Skill",     # Invoke Skills
    ]
)
```

Omit `allowed_tools` to allow all built-in tools.

## System Prompts

### Using Default System Prompt

By default, agents use Claude Code's system prompt optimized for development tasks.

### Custom System Prompts

Override system prompt for specialized agents:

**Python:**

```python
from claude_agent_sdk import query, ClaudeAgentOptions

custom_prompt = """You are a security-focused code reviewer.
Your role is to identify potential security vulnerabilities in code.
Focus on: SQL injection, XSS, authentication issues, data exposure.
Provide actionable recommendations with severity ratings."""

async for message in query(
    prompt="Review auth.py for security issues",
    options=ClaudeAgentOptions(
        system_prompt=custom_prompt,
        allowed_tools=["Read", "Grep"]
    )
):
    print(message)
```

**TypeScript:**

```typescript
const customPrompt = `You are a documentation expert.
Generate comprehensive API documentation from code.
Include: function signatures, parameters, return types, examples.`;

for await (const message of query({
  prompt: "Document the API in src/api.ts",
  options: {
    systemPrompt: customPrompt,
    allowedTools: ["Read"]
  }
})) {
  console.log(message);
}
```

### System Prompt Best Practices

1. **Define role and expertise** - Who is the agent?
2. **Specify focus areas** - What should it prioritize?
3. **Set guardrails** - What should it avoid?
4. **Describe expected output** - What format/style?
5. **Include domain knowledge** - Provide context

## Subagents

Subagents enable parallel task execution with isolated contexts. They're useful for:

- **Parallelization**: Multiple tasks simultaneously
- **Context management**: Isolated context windows
- **Information filtering**: Only relevant results return

### Automatic Subagents

Claude automatically spawns subagents when appropriate:

```python
async for message in query(
    prompt="Search web for AI trends AND analyze local codebase",
    options=ClaudeAgentOptions(max_turns=30)
):
    # Claude may spawn subagents for web search and code analysis
    if message.type == "subagent_start":
        print(f"Subagent started: {message.agent_type}")
```

### Built-in Agents

Claude Code includes these built-in agents:

| Agent | Purpose | When Used |
|-------|---------|-----------|
| **Explore** | Read-only codebase analysis | Searching, understanding code |
| **Plan** | Research for planning | Plan mode context gathering |
| **General-purpose** | Complex multi-step tasks | Exploration + modification |

### Subagent Hooks

Monitor subagent lifecycle with hooks:

```python
from claude_agent_sdk import HookMatcher

async def subagent_tracker(input_data, tool_use_id, context):
    if input_data['hook_event_name'] == 'SubagentStart':
        print(f"Subagent starting: {input_data.get('agent_type')}")
    elif input_data['hook_event_name'] == 'SubagentStop':
        print(f"Subagent completed")
    return {}

options = ClaudeAgentOptions(
    hooks={
        'SubagentStart': [HookMatcher(hooks=[subagent_tracker])],
        'SubagentStop': [HookMatcher(hooks=[subagent_tracker])]
    }
)
```

## Agent Loop Workflow

Agents follow a three-phase loop:

### 1. Gather Context

Agent uses tools to understand the task:
- Read relevant files
- Search codebase (Grep, Glob)
- Execute exploratory commands
- Review documentation

### 2. Take Action

Agent performs the requested work:
- Edit files (Write)
- Run commands (Bash)
- Generate code
- Call external APIs (via MCP)

### 3. Verify Results

Agent confirms success:
- Check command outputs
- Validate file changes
- Run tests
- Review error messages

This loop repeats until task completion or `max_turns` reached.

## Multi-Turn Conversations

### Streaming Input Mode (Recommended)

Send multiple messages sequentially:

```python
async def generate_messages():
    # First message
    yield {
        "type": "user",
        "message": {
            "role": "user",
            "content": "Analyze the authentication code"
        }
    }
    
    # Wait or gather user input
    await asyncio.sleep(2)
    
    # Follow-up message
    yield {
        "type": "user",
        "message": {
            "role": "user",
            "content": "Now add two-factor authentication"
        }
    }

async for message in query(
    prompt=generate_messages(),
    options=ClaudeAgentOptions(max_turns=30)
):
    print(message)
```

Context is preserved across messages in the same session.

## Session Management

### Session IDs

Track sessions for debugging and monitoring:

```python
async for message in query(
    prompt="Task description",
    options=ClaudeAgentOptions()
):
    if message.type == "system" and message.subtype == "init":
        session_id = message.session_id
        print(f"Session ID: {session_id}")
```

### Transcript Paths

Conversations are saved to disk:

```python
async for message in query(prompt="...", options=options):
    if hasattr(message, 'transcript_path'):
        print(f"Transcript: {message.transcript_path}")
        # ~/.claude/projects/<project>/sessions/<session_id>.jsonl
```

## Output Styles

Configure how agents present results:

```python
options = ClaudeAgentOptions(
    output_style="concise",  # Brief responses
    # output_style="detailed"  # Comprehensive explanations
    # output_style="technical" # Developer-focused
)
```

Note: Custom `system_prompt` overrides output style settings.

## Error Handling

### Result Messages

Check message types for success/failure:

```python
async for message in query(prompt="...", options=options):
    if message.type == "result":
        if message.subtype == "success":
            print(f"Success: {message.result}")
        elif message.subtype == "error":
            print(f"Error: {message.error}")
        elif message.subtype == "max_turns":
            print("Hit maximum turns limit")
        elif message.subtype == "budget_exceeded":
            print("Exceeded budget limit")
```

### Exception Handling

```python
try:
    async for message in query(prompt="...", options=options):
        # Process messages
        pass
except Exception as e:
    print(f"Agent error: {e}")
```

## Agent Best Practices

1. **Start with clear prompts** - Specific tasks get better results
2. **Use appropriate tools** - Only grant necessary permissions
3. **Set reasonable limits** - `max_turns`, `max_budget_usd` prevent runaway
4. **Monitor with hooks** - Track agent behavior and tool usage
5. **Iterate system prompts** - Refine based on agent performance
6. **Test permission modes** - Start restrictive, relax carefully
7. **Handle all message types** - Don't just check for success
8. **Save transcripts** - Enable debugging and improvement

## Advanced Patterns

### Chaining Multiple Agents

```python
# Agent 1: Analyze code
analysis_result = None
async for message in query(
    prompt="Analyze security of auth.py",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Grep"])
):
    if message.type == "result":
        analysis_result = message.result

# Agent 2: Fix issues
async for message in query(
    prompt=f"Fix these security issues: {analysis_result}",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Write"])
):
    print(message)
```

### Conditional Tool Access

```python
# Read-only analysis first
async for message in query(
    prompt="Understand the codebase structure",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob"]  # No Write/Bash
    )
):
    pass

# Then allow modifications
async for message in query(
    prompt="Implement the changes",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Write", "Bash"]
    )
):
    pass
```

## Next Steps

- **[Tools](./tools.md)** - Understand built-in and custom tools
- **[Skills](./skills.md)** - Package agent expertise
- **[Hooks](./hooks.md)** - Control agent behavior
- **[Streaming Output](./streaming-output.md)** - Handle real-time responses