# Hooks - Claude Agent SDK

## Overview

Hooks let you intercept agent execution at key points to add validation, logging, security controls, or custom logic. With hooks, you can monitor tool usage, enforce policies, modify tool inputs, and control agent behavior without changing core agent code.

## Hook Capabilities

Hooks enable you to:
- **Block dangerous operations** - Prevent writing to system directories
- **Log all tool usage** - Track what the agent does
- **Modify tool inputs** - Redirect file paths, sanitize data
- **Add context to conversations** - Inject system messages
- **Validate operations** - Check parameters before execution
- **Implement custom approval flows** - Ask user before risky actions

## Hook Events

### Available Hook Events

| Hook Event | Blocking? | Modifiable? | Triggers When | Common Use Cases |
|------------|-----------|-------------|---------------|------------------|
| `PreToolUse` | Yes | Yes | Before tool execution | Validation, blocking, input modification |
| `PostToolUse` | No | Yes | After tool succeeds | Logging, result processing |
| `PostToolUseFailure` | No | Yes | After tool fails | Error handling, logging failures |
| `UserPromptSubmit` | Yes | Yes | User submits prompt | Context injection, prompt modification |
| `Stop` | Yes | Yes | Agent wants to stop | Prevent premature stopping |
| `SubagentStart` | No | Yes | Subagent initializes | Track parallel tasks |
| `SubagentStop` | Yes | Yes | Subagent wants to stop | Control subagent lifecycle |
| `PreCompact` | Yes | Yes | Before context compaction | Preserve important context |

### Blocking Hooks

Blocking hooks can **prevent** the operation:
- `PreToolUse` - Block tool from executing
- `UserPromptSubmit` - Block prompt submission
- `Stop` - Prevent agent from stopping
- `SubagentStop` - Prevent subagent from stopping

### Modifiable Hooks

Modifiable hooks can **change** inputs or add context:
- `PreToolUse` - Modify tool arguments
- All hooks - Inject system messages

## Hook Structure

### Hook Callback Function

Hooks are callback functions that receive event data:

**Python:**

```python
async def my_hook_callback(input_data, tool_use_id, context):
    # input_data: dict with event details
    # tool_use_id: string identifying this tool use
    # context: additional context data
    
    # Your logic here
    
    # Return decision
    return {
        # Top-level fields
        "continue": True,  # Continue execution?
        "systemMessage": "Optional message for Claude",
        
        # Hook-specific output
        "hookSpecificOutput": {
            "hookEventName": input_data['hook_event_name'],
            "permissionDecision": "allow"  # or "deny" or "ask"
        }
    }
```

**TypeScript:**

```typescript
import { HookCallback } from '@anthropic-ai/claude-agent-sdk';

const myHookCallback: HookCallback = async (input, toolUseId, context) => {
  // input: HookInput with event details
  // toolUseId: string
  // context: additional data
  
  // Your logic here
  
  return {
    continue: true,
    systemMessage: "Optional message",
    hookSpecificOutput: {
      hookEventName: input.hook_event_name,
      permissionDecision: 'allow'
    }
  };
};
```

### Hook Matcher

Matchers filter which events trigger your callbacks:

**Python:**

```python
from claude_agent_sdk import HookMatcher

# Match specific tools
matcher = HookMatcher(
    matcher='Write|Edit',  # Regex pattern
    hooks=[my_callback]
)

# Match all
matcher = HookMatcher(hooks=[my_callback])  # No matcher = all
```

**TypeScript:**

```typescript
import { HookMatcher } from '@anthropic-ai/claude-agent-sdk';

const matcher = new HookMatcher({
  matcher: 'Write|Edit',  // Regex pattern
  hooks: [myCallback]
});
```

### Registering Hooks

Pass hooks to `ClaudeAgentOptions`:

**Python:**

```python
from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher

options = ClaudeAgentOptions(
    hooks={
        'PreToolUse': [
            HookMatcher(matcher='Write|Edit', hooks=[protect_files])
        ],
        'PostToolUse': [
            HookMatcher(hooks=[log_tool_use])
        ]
    }
)

async for message in query(prompt="...", options=options):
    print(message)
```

**TypeScript:**

```typescript
const options = {
  hooks: {
    PreToolUse: [
      new HookMatcher({
        matcher: 'Write|Edit',
        hooks: [protectFiles]
      })
    ],
    PostToolUse: [
      new HookMatcher({ hooks: [logToolUse] })
    ]
  }
};
```

## Hook Input Data

### Common Fields (All Hooks)

| Field | Type | Description |
|-------|------|-------------|
| `hook_event_name` | `string` | Hook type (PreToolUse, etc.) |
| `session_id` | `string` | Current session identifier |
| `transcript_path` | `string` | Path to conversation transcript |

### PreToolUse Fields

| Field | Type | Description |
|-------|------|-------------|
| `tool_name` | `string` | Name of tool being called |
| `tool_input` | `object` | Tool arguments/parameters |

### PostToolUse Fields

| Field | Type | Description |
|-------|------|-------------|
| `tool_name` | `string` | Name of tool that executed |
| `tool_output` | `any` | Tool return value |
| `tool_result` | `object` | Full result object |

### UserPromptSubmit Fields

| Field | Type | Description |
|-------|------|-------------|
| `prompt` | `string` | The user's prompt text |

### Stop/SubagentStop Fields

| Field | Type | Description |
|-------|------|-------------|
| `stop_hook_active` | `boolean` | Whether stop hook is processing |

## Hook Return Values

### Top-Level Return Fields

```python
return {
    "continue": True,  # Continue execution? (default: True)
    "stopReason": "Why stopping",  # Message if continue=False
    "suppressOutput": False,  # Hide stdout? (default: False)
    "systemMessage": "Message for Claude"  # Inject into conversation
}
```

### Hook-Specific Output (PreToolUse)

For `PreToolUse`, return `hookSpecificOutput` with permission decision:

```python
return {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",  # or "deny" or "ask"
        "permissionDecisionReason": "Why this decision",
        "updatedInput": {...}  # Modified tool input (requires "allow")
    }
}
```

### Permission Decisions

| Decision | Effect |
|----------|--------|
| `"allow"` | Automatically approve tool execution |
| `"deny"` | Block tool execution |
| `"ask"` | Prompt user for approval |

## Hook Examples

### Example 1: Block Dangerous File Operations

Prevent writing to system directories:

```python
async def protect_system_dirs(input_data, tool_use_id, context):
    if input_data['hook_event_name'] != 'PreToolUse':
        return {}
    
    # Check file path in Write/Edit operations
    file_path = input_data.get('tool_input', {}).get('file_path', '')
    
    dangerous_paths = ['/etc', '/usr', '/bin', '/sys']
    if any(file_path.startswith(path) for path in dangerous_paths):
        return {
            "systemMessage": "System directories are protected.",
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Cannot write to system directories"
            }
        }
    
    # Allow operation
    return {}

# Register hook
options = ClaudeAgentOptions(
    hooks={
        'PreToolUse': [
            HookMatcher(matcher='Write|Edit', hooks=[protect_system_dirs])
        ]
    }
)
```

### Example 2: Log All Tool Usage

Track every tool call:

```python
import logging

logger = logging.getLogger(__name__)

async def log_all_tools(input_data, tool_use_id, context):
    event = input_data['hook_event_name']
    
    if event == 'PreToolUse':
        logger.info(f"Tool: {input_data['tool_name']}")
        logger.info(f"Args: {input_data['tool_input']}")
    
    elif event == 'PostToolUse':
        logger.info(f"Success: {input_data['tool_name']}")
        logger.info(f"Output: {input_data['tool_output']}")
    
    elif event == 'PostToolUseFailure':
        logger.error(f"Failed: {input_data['tool_name']}")
    
    return {}

# Register for multiple events
options = ClaudeAgentOptions(
    hooks={
        'PreToolUse': [HookMatcher(hooks=[log_all_tools])],
        'PostToolUse': [HookMatcher(hooks=[log_all_tools])],
        'PostToolUseFailure': [HookMatcher(hooks=[log_all_tools])]
    }
)
```

### Example 3: Redirect File Paths

Sandbox file operations to a safe directory:

```python
async def redirect_to_sandbox(input_data, tool_use_id, context):
    if input_data['hook_event_name'] != 'PreToolUse':
        return {}
    
    if input_data['tool_name'] not in ['Write', 'Edit']:
        return {}
    
    # Modify file path to sandbox
    original_path = input_data['tool_input'].get('file_path', '')
    sandbox_path = f'/sandbox{original_path}'
    
    return {
        "systemMessage": f"Redirected to sandbox: {sandbox_path}",
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow",
            "updatedInput": {
                **input_data['tool_input'],
                'file_path': sandbox_path
            }
        }
    }

options = ClaudeAgentOptions(
    hooks={
        'PreToolUse': [
            HookMatcher(matcher='Write|Edit', hooks=[redirect_to_sandbox])
        ]
    }
)
```

### Example 4: Inject Context on User Input

Add helpful context when user submits prompts:

```python
async def inject_context(input_data, tool_use_id, context):
    if input_data['hook_event_name'] != 'UserPromptSubmit':
        return {}
    
    prompt = input_data.get('prompt', '')
    
    # Add context for security-related prompts
    if 'security' in prompt.lower() or 'vulnerability' in prompt.lower():
        return {
            "systemMessage": """Security context: Focus on OWASP Top 10:
1. Injection flaws
2. Broken authentication
3. Sensitive data exposure
4. XML external entities
5. Broken access control"""
        }
    
    return {}

options = ClaudeAgentOptions(
    hooks={
        'UserPromptSubmit': [HookMatcher(hooks=[inject_context])]
    }
)
```

### Example 5: Track Subagent Activity

Monitor when subagents start and stop:

```python
subagent_count = 0

async def track_subagents(input_data, tool_use_id, context):
    global subagent_count
    
    if input_data['hook_event_name'] == 'SubagentStart':
        subagent_count += 1
        print(f"Subagent #{subagent_count} started")
        print(f"Type: {input_data.get('agent_type')}")
    
    elif input_data['hook_event_name'] == 'SubagentStop':
        print(f"Subagent completed")
        print(f"Transcript: {input_data.get('agent_transcript_path')}")
    
    return {}

options = ClaudeAgentOptions(
    hooks={
        'SubagentStart': [HookMatcher(hooks=[track_subagents])],
        'SubagentStop': [HookMatcher(hooks=[track_subagents])]
    }
)
```

### Example 6: Prevent Premature Stopping

Keep agent working until task is complete:

```python
async def prevent_early_stop(input_data, tool_use_id, context):
    if input_data['hook_event_name'] != 'Stop':
        return {}
    
    # Check if critical task is complete
    task_complete = check_task_status()  # Your logic
    
    if not task_complete:
        return {
            "hookSpecificOutput": {
                "hookEventName": "Stop",
                "decision": "block",
                "reason": "Must complete file analysis before stopping"
            }
        }
    
    return {}  # Allow stopping

options = ClaudeAgentOptions(
    hooks={
        'Stop': [HookMatcher(hooks=[prevent_early_stop])]
    }
)
```

## Advanced Hook Patterns

### Multiple Hooks for Same Event

Hooks execute in array order:

```python
async def hook1(input_data, tool_use_id, context):
    print("Hook 1")
    return {}

async def hook2(input_data, tool_use_id, context):
    print("Hook 2")
    return {}

options = ClaudeAgentOptions(
    hooks={
        'PreToolUse': [
            HookMatcher(hooks=[hook1, hook2])  # Executes hook1, then hook2
        ]
    }
)
```

### Conditional Hook Logic

Different behavior based on context:

```python
async def conditional_hook(input_data, tool_use_id, context):
    event = input_data['hook_event_name']
    
    if event == 'PreToolUse':
        tool = input_data['tool_name']
        
        # Different logic per tool
        if tool == 'Bash':
            return validate_bash_command(input_data)
        elif tool == 'Write':
            return validate_file_write(input_data)
    
    return {}
```

### Stateful Hooks

Track state across hook calls:

```python
class HookState:
    def __init__(self):
        self.tool_count = 0
        self.blocked_count = 0

state = HookState()

async def stateful_hook(input_data, tool_use_id, context):
    if input_data['hook_event_name'] == 'PreToolUse':
        state.tool_count += 1
        
        # Block after 100 tool calls
        if state.tool_count > 100:
            state.blocked_count += 1
            return {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": "Tool limit reached"
                }
            }
    
    return {}
```

## Hook Best Practices

### 1. Keep Hooks Fast

Hooks run synchronously in the agent loop. Slow hooks slow down the agent:

```python
# ✅ Good - quick validation
async def fast_hook(input_data, tool_use_id, context):
    if dangerous_pattern in input_data['tool_input']:
        return {"permissionDecision": "deny"}
    return {}

# ❌ Bad - expensive operation
async def slow_hook(input_data, tool_use_id, context):
    result = await query_large_database()  # Slow!
    # Process result...
    return {}
```

### 2. Use Specific Matchers

Filter to relevant tools only:

```python
# ✅ Good - only file operations
HookMatcher(matcher='Write|Edit|Read', hooks=[file_hook])

# ❌ Bad - triggers on every tool
HookMatcher(hooks=[file_hook])  # No matcher = all tools
```

### 3. Return Empty Object for Allow

Simplify "allow" decisions:

```python
# ✅ Good - implicit allow
async def my_hook(input_data, tool_use_id, context):
    if should_block:
        return {"hookSpecificOutput": {"permissionDecision": "deny"}}
    return {}  # Allow

# ❌ Verbose - unnecessary
async def my_hook(input_data, tool_use_id, context):
    return {"hookSpecificOutput": {"permissionDecision": "allow"}}
```

### 4. Log Appropriately

Balance visibility with noise:

```python
# ✅ Good - log important events
if input_data['hook_event_name'] == 'PreToolUse':
    if input_data['tool_name'] == 'Bash':
        logger.info(f"Bash command: {input_data['tool_input']['command']}")

# ❌ Bad - log everything
logger.debug(f"Hook data: {input_data}")  # Too noisy
```

### 5. Handle All Event Types

Check `hook_event_name` to handle different events:

```python
async def multi_event_hook(input_data, tool_use_id, context):
    event = input_data['hook_event_name']
    
    if event == 'PreToolUse':
        # Handle before execution
        pass
    elif event == 'PostToolUse':
        # Handle after success
        pass
    elif event == 'PostToolUseFailure':
        # Handle errors
        pass
    
    return {}
```

## Debugging Hooks

### Print Hook Input

```python
async def debug_hook(input_data, tool_use_id, context):
    print(f"Event: {input_data['hook_event_name']}")
    print(f"Tool: {input_data.get('tool_name')}")
    print(f"Input: {input_data.get('tool_input')}")
    print(f"Tool Use ID: {tool_use_id}")
    return {}
```

### Test Hooks Independently

```python
# Simulate hook input
test_input = {
    'hook_event_name': 'PreToolUse',
    'tool_name': 'Write',
    'tool_input': {'file_path': '/etc/passwd', 'content': 'test'}
}

result = await my_hook(test_input, 'test-id', {})
print(f"Hook result: {result}")
```

## Common Issues

### Hook Not Triggering

**Causes:**
- Hook not registered in `options.hooks`
- Matcher pattern doesn't match tool name
- Event type misspelled

**Solutions:**
- Verify hook in `ClaudeAgentOptions`
- Test matcher pattern: `re.match(pattern, tool_name)`
- Check event name spelling

### Input Modification Not Applied

**Causes:**
- `permissionDecision` not "allow"
- `updatedInput` at wrong level
- Missing `hookSpecificOutput`

**Solution:**

```python
return {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",  # Required!
        "updatedInput": {...}
    }
}
```

## Next Steps

- **[Permission Modes](./permission-modes.md)** - Global permission control
- **[Tools](./tools.md)** - Understand tools hooks intercept
- **[Agents](./agents.md)** - Configure agents with hooks