# Permission Modes - Claude Agent SDK

## Overview

The Claude Agent SDK provides fine-grained permission controls to manage how agents use tools. Permission modes offer global policies, while rules and hooks provide granular control. This layered approach balances safety with automation.

## Permission Evaluation Flow

When an agent requests a tool, the SDK evaluates permissions in this order:

```
1. Hooks (PreToolUse)
   ↓ (allow/deny/continue)
2. Permission Rules (settings.json)
   ↓ deny rules → allow rules → ask rules
3. Permission Mode
   ↓ (default/acceptEdits/bypassPermissions/plan)
4. canUseTool Callback
   ↓ (custom runtime logic)
5. Default Behavior
```

**First match wins** - If any step allows or denies, evaluation stops.

## Permission Modes

Permission modes provide global control over tool usage:

### Available Modes

| Mode | Description | Tool Behavior | Use Cases |
|------|-------------|---------------|-----------|
| `default` | Standard permission behavior | No auto-approvals; unmatched tools trigger `canUseTool` callback | Development, testing, supervised workflows |
| `acceptEdits` | Auto-accept file edits | File operations (`Write`, `Edit`, `mkdir`, `rm`, `mv`, `cp`) auto-approved; other tools follow default behavior | Code generation, file management tasks |
| `bypassPermissions` | Bypass all permission checks | All tools run without prompts (hooks still execute) | Trusted environments, automated pipelines |
| `plan` | Planning mode only | No tool execution; agent creates plans without making changes | Code review, proposal generation |

### Setting Permission Mode

**Python:**

```python
from claude_agent_sdk import query, ClaudeAgentOptions

# Default mode - ask for permission
options = ClaudeAgentOptions(
    permission_mode="default"
)

# Accept edits - auto-approve file operations
options = ClaudeAgentOptions(
    permission_mode="acceptEdits"
)

# Bypass all permissions (use with caution!)
options = ClaudeAgentOptions(
    permission_mode="bypassPermissions"
)

# Plan mode - no execution
options = ClaudeAgentOptions(
    permission_mode="plan"
)

async for message in query(prompt="Task", options=options):
    print(message)
```

**TypeScript:**

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const options = {
  permissionMode: "acceptEdits"  // or "default", "bypassPermissions", "plan"
};

for await (const message of query({ prompt: "Task", options })) {
  console.log(message);
}
```

## Mode Details

### default Mode

**Behavior:**
- No automatic approvals
- Unmatched tools trigger `canUseTool` callback
- User can approve/deny at runtime
- Safest mode for interactive use

**Example:**

```python
options = ClaudeAgentOptions(
    permission_mode="default",
    allowed_tools=["Read", "Write", "Bash"]
)

async for message in query(prompt="Update config.json", options=options):
    if message.type == "permission_request":
        # Agent asks for permission to use Write
        print(f"Agent wants to: {message.tool_name}")
        print(f"With args: {message.tool_input}")
        # User approves/denies here
```

### acceptEdits Mode

**Behavior:**
- Auto-approves: `Write`, `Edit`, `mkdir`, `touch`, `rm`, `mv`, `cp`
- Other tools (e.g., `Bash`) still require permission
- Good balance between automation and safety

**Auto-approved operations:**
- File creation and modification
- Directory operations
- File system organization

**Still requires permission:**
- Shell command execution (`Bash`)
- Network operations
- Database queries

**Example:**

```python
options = ClaudeAgentOptions(
    permission_mode="acceptEdits",
    allowed_tools=["Read", "Write", "Edit", "Bash"]
)

async for message in query(
    prompt="Refactor the authentication module",
    options=options
):
    # File edits happen automatically
    # Bash commands still prompt for approval
    print(message)
```

**Use cases:**
- Code refactoring
- File generation
- Configuration updates
- Documentation writing

### bypassPermissions Mode

**Behavior:**
- All tools execute without prompts
- Hooks still run (can still block operations)
- Maximum automation, maximum risk
- Use only in controlled environments

**⚠️ Security Warning:**
- Agent has full system access
- No safety prompts
- Propagates to all subagents (cannot be overridden)
- Only use in sandboxed/isolated environments

**Example:**

```python
options = ClaudeAgentOptions(
    permission_mode="bypassPermissions",
    allowed_tools=["Read", "Write", "Bash", "Git"]
)

# Run in sandboxed environment only!
async for message in query(
    prompt="Implement the entire feature",
    options=options
):
    # All operations execute automatically
    print(message)
```

**Use cases:**
- CI/CD pipelines (sandboxed)
- Automated testing (isolated environment)
- Batch processing (trusted tasks)
- Development containers

**Important:** Hooks still execute and can block operations even in `bypassPermissions` mode.

### plan Mode

**Behavior:**
- No tool execution
- Agent analyzes and creates plans
- Can use `AskUserQuestion` to clarify requirements
- Review before execution

**Example:**

```python
options = ClaudeAgentOptions(
    permission_mode="plan",
    allowed_tools=["Read", "Grep", "Glob"]  # Only read operations
)

async for message in query(
    prompt="Plan the database migration",
    options=options
):
    if message.type == "result":
        plan = message.result
        print("Migration plan:", plan)
        
        # Review plan, then execute with different mode
        if approve_plan(plan):
            await execute_plan(plan, permission_mode="acceptEdits")
```

**Use cases:**
- Code review proposals
- Architecture planning
- Risk assessment
- Change preview

## Permission Rules (settings.json)

Define declarative permission rules in `settings.json`:

### Rule Types

**deny** - Block operations (highest priority):

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Write(/etc/*)"
    ]
  }
}
```

**allow** - Auto-approve operations:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(git status:*)",
      "Read",
      "Glob"
    ]
  }
}
```

**ask** - Prompt for approval:

```json
{
  "permissions": {
    "ask": [
      "Bash(npm install:*)",
      "Write(/src/*)"
    ]
  }
}
```

### Complete settings.json Example

```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Bash(curl:*)",
      "Write(/etc/*)",
      "Write(/usr/*)"
    ],
    "allow": [
      "Bash(npm run:*)",
      "Bash(npm test:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git branch:*)",
      "Read",
      "Glob",
      "Grep",
      "LS"
    ],
    "ask": [
      "Bash(npm install:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)"
    ]
  },
  "preferences": {
    "model": "sonnet",
    "maxBudgetUsd": 20
  }
}
```

### Loading Rules from settings.json

Rules load automatically when `settingSources` configured:

```python
options = ClaudeAgentOptions(
    cwd="/path/to/project",
    setting_sources=["user", "project"],  # Load from filesystem
    permission_mode="default"
)
```

Looks for:
- User-level: `~/.claude/settings.json`
- Project-level: `<cwd>/.claude/settings.json`

## Runtime Permission Handling

### canUseTool Callback

Implement custom approval logic:

```python
async def can_use_tool(tool_name: str, tool_input: dict) -> bool:
    """Custom permission logic"""
    
    # Always allow read operations
    if tool_name in ["Read", "Grep", "Glob"]:
        return True
    
    # Ask user for write operations
    if tool_name in ["Write", "Edit"]:
        file_path = tool_input.get("file_path", "")
        response = input(f"Allow writing to {file_path}? (y/n): ")
        return response.lower() == 'y'
    
    # Block dangerous bash commands
    if tool_name == "Bash":
        command = tool_input.get("command", "")
        if any(dangerous in command for dangerous in ["rm -rf", "sudo", "curl"]):
            print(f"Blocked dangerous command: {command}")
            return False
        
        # Ask for other commands
        response = input(f"Allow command '{command}'? (y/n): ")
        return response.lower() == 'y'
    
    # Default: deny unknown tools
    return False

options = ClaudeAgentOptions(
    permission_mode="default",
    can_use_tool=can_use_tool
)
```

### Permission Requests in Streaming

Handle permission requests interactively:

```python
async for message in query(prompt="Task", options=options):
    if message.type == "permission_request":
        print(f"\nPermission requested:")
        print(f"  Tool: {message.tool_name}")
        print(f"  Args: {message.tool_input}")
        
        # Get user approval
        response = input("Approve? (y/n): ")
        
        if response.lower() == 'y':
            # Approve the operation
            # (Implementation depends on SDK version)
            pass
        else:
            # Deny the operation
            # (Implementation depends on SDK version)
            pass
```

## Permission Best Practices

### 1. Start Restrictive, Relax Carefully

```python
# ✅ Good progression
# Phase 1: Analyze (read-only)
permission_mode="default"
allowed_tools=["Read", "Grep", "Glob"]

# Phase 2: Generate (file edits)
permission_mode="acceptEdits"
allowed_tools=["Read", "Write", "Edit"]

# Phase 3: Execute (with supervision)
permission_mode="default"  # Still ask for Bash
allowed_tools=["Read", "Write", "Bash"]
```

### 2. Use Hooks for Security

Layer hooks over permission modes:

```python
async def block_system_dirs(input_data, tool_use_id, context):
    if input_data['hook_event_name'] != 'PreToolUse':
        return {}
    
    file_path = input_data.get('tool_input', {}).get('file_path', '')
    
    if file_path.startswith(('/etc', '/usr', '/bin')):
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "System directories protected"
            }
        }
    
    return {}

options = ClaudeAgentOptions(
    permission_mode="acceptEdits",  # Auto-approve most edits
    hooks={
        'PreToolUse': [HookMatcher(matcher='Write|Edit', hooks=[block_system_dirs])]
    }
)
```

### 3. Sandbox Dangerous Operations

Combine permission mode with environment isolation:

```python
# Run in Docker container or sandbox
options = ClaudeAgentOptions(
    permission_mode="bypassPermissions",
    cwd="/sandbox/workspace",  # Isolated directory
    allowed_tools=["Read", "Write", "Bash"]
)
```

### 4. Log Permission Decisions

Track what gets approved/denied:

```python
import logging

async def log_permissions(input_data, tool_use_id, context):
    if input_data['hook_event_name'] == 'PreToolUse':
        logging.info(f"Tool: {input_data['tool_name']}")
        logging.info(f"Args: {input_data['tool_input']}")
    
    return {}

options = ClaudeAgentOptions(
    hooks={'PreToolUse': [HookMatcher(hooks=[log_permissions])]}
)
```

### 5. Use Plan Mode for Review

Generate plan first, execute after approval:

```python
# Step 1: Generate plan
plan_options = ClaudeAgentOptions(
    permission_mode="plan",
    allowed_tools=["Read", "Grep"]
)

async for message in query(prompt="Plan the refactor", options=plan_options):
    if message.type == "result":
        plan = message.result

# Step 2: Review plan (human checks it)
print("Review this plan:", plan)
approved = input("Execute plan? (y/n): ") == 'y'

# Step 3: Execute if approved
if approved:
    exec_options = ClaudeAgentOptions(
        permission_mode="acceptEdits",
        allowed_tools=["Read", "Write", "Edit", "Bash"]
    )
    
    async for message in query(prompt=f"Execute: {plan}", options=exec_options):
        print(message)
```

## Subagent Permission Inheritance

**Critical:** `bypassPermissions` propagates to all subagents and **cannot be overridden**.

```python
options = ClaudeAgentOptions(
    permission_mode="bypassPermissions"
)

# Main agent and ALL subagents have full access
# No way to restrict subagent permissions
```

**Why this matters:**
- Subagents may have different system prompts
- Subagents can spawn with less constrained behavior
- Full autonomous system access without prompts

**Recommendation:** Use `bypassPermissions` only in isolated/sandboxed environments.

## Common Permission Patterns

### Read-Only Analysis

```python
ClaudeAgentOptions(
    permission_mode="default",
    allowed_tools=["Read", "Grep", "Glob", "LS"]
)
```

### Code Generation (No Execution)

```python
ClaudeAgentOptions(
    permission_mode="acceptEdits",
    allowed_tools=["Read", "Write", "Edit", "Grep"]
)
```

### Full Development (Supervised)

```python
ClaudeAgentOptions(
    permission_mode="acceptEdits",  # Auto file edits
    allowed_tools=["Read", "Write", "Edit", "Bash", "Git"]
    # Bash still prompts for approval
)
```

### Automated CI/CD (Sandboxed)

```python
ClaudeAgentOptions(
    permission_mode="bypassPermissions",
    cwd="/ci/sandbox",
    allowed_tools=["Read", "Write", "Bash", "Git"],
    max_budget_usd=5.0
)
```

## Debugging Permissions

### Check Permission Mode

```python
async for message in query(prompt="...", options=options):
    if message.type == "system" and message.subtype == "init":
        print(f"Permission mode: {options.permission_mode}")
```

### Log Denied Operations

```python
async for message in query(prompt="...", options=options):
    if message.type == "result" and message.subtype == "error":
        if "permission" in message.error.lower():
            print(f"Permission denied: {message.error}")
```

### Test Permissions

```python
# Test specific tool access
test_options = ClaudeAgentOptions(
    permission_mode="default",
    allowed_tools=["Write"]
)

async for message in query(
    prompt="Write a test file",
    options=test_options
):
    if message.type == "permission_request":
        print("✓ Permission request working")
    elif message.type == "result":
        print(f"Result: {message.subtype}")
```

## Common Issues

### Tool Not Executing

**Causes:**
- Not in `allowed_tools`
- Permission mode too restrictive
- Blocked by hooks or rules

**Solution:**
```python
# Add tool explicitly
allowed_tools=["Read", "Write", "ToolName"]

# Or use more permissive mode
permission_mode="acceptEdits"
```

### Unwanted Permission Prompts

**Cause:** `permission_mode="default"` asks for everything

**Solution:**
```python
# Use acceptEdits for file operations
permission_mode="acceptEdits"

# Or add to allow rules in settings.json
```

### Hooks Not Blocking

**Cause:** Not returning proper denial

**Solution:**
```python
return {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",  # Must be explicit
        "permissionDecisionReason": "Reason here"
    }
}
```

## Next Steps

- **[Hooks](./hooks.md)** - Implement custom permission logic
- **[Tools](./tools.md)** - Understand what tools need permissions
- **[Agents](./agents.md)** - Configure agent permission modes