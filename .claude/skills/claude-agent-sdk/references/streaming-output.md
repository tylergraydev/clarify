# Streaming Output - Claude Agent SDK

## Overview

The Claude Agent SDK supports two distinct input modes: **streaming input mode** (recommended) and **single message input mode**. Streaming mode enables real-time, interactive agent sessions with multi-turn conversations, permission requests, and live progress updates.

## Streaming vs Single Message Modes

### Streaming Input Mode (Recommended)

**Characteristics:**
- Persistent agent session
- Send multiple messages sequentially
- Real-time feedback and progress
- Permission requests surface to user
- Full tool and MCP server access
- Image attachments supported
- Ability to interrupt agent

**Use Cases:**
- Interactive chat applications
- Long-running development tasks
- Multi-step workflows
- User-supervised agent operations

### Single Message Input Mode

**Characteristics:**
- One-shot query and response
- No multi-turn conversation
- Simpler API, less control
- Limited permission handling
- Basic tool access

**Use Cases:**
- Simple automation scripts
- Non-interactive batch processing
- Stateless operations

**Note:** This document focuses on **streaming mode** (recommended approach).

## Basic Streaming Pattern

### Python Example

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    # Streaming mode - iterate through messages
    async for message in query(
        prompt="Analyze the security of auth.py",
        options=ClaudeAgentOptions(
            cwd="/path/to/project",
            allowed_tools=["Read", "Grep"],
            max_turns=20
        )
    ):
        # Handle different message types
        if message.type == "text":
            print(message.text, end='', flush=True)
        
        elif message.type == "result":
            if message.subtype == "success":
                print(f"\n\n✓ Complete: {message.result}")
            elif message.subtype == "error":
                print(f"\n\n✗ Error: {message.error}")

asyncio.run(main())
```

### TypeScript Example

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  for await (const message of query({
    prompt: "Analyze the security of auth.py",
    options: {
      cwd: "/path/to/project",
      allowedTools: ["Read", "Grep"],
      maxTurns: 20
    }
  })) {
    // Handle different message types
    if (message.type === "text") {
      process.stdout.write(message.text);
    }
    
    else if (message.type === "result") {
      if (message.subtype === "success") {
        console.log(`\n\n✓ Complete: ${message.result}`);
      }
    }
  }
}

main();
```

## Message Types

### Text Messages

Streaming text output as Claude generates response:

```python
if message.type == "text":
    print(message.text, end='', flush=True)  # Real-time typewriter effect
```

**Fields:**
- `type`: `"text"`
- `text`: String content

### Text Delta Messages

Character-by-character updates (when `--include-partial-messages` enabled):

```python
if message.type == "text_delta":
    print(message.text, end='', flush=True)  # Character-level streaming
```

**Fields:**
- `type`: `"text_delta"`
- `text`: Single character or small chunk

### System Messages

Initialization and system events:

```python
if message.type == "system":
    if message.subtype == "init":
        print(f"Session ID: {message.session_id}")
        print(f"Available tools: {message.tools}")
        print(f"MCP servers: {message.mcp_servers}")
```

**Fields:**
- `type`: `"system"`
- `subtype`: `"init"`, `"status"`, etc.
- `session_id`: Unique session identifier
- `tools`: Available tools list
- `mcp_servers`: Configured MCP servers

### Tool Use Messages

When agent invokes a tool:

```python
if message.type == "tool_use":
    print(f"Tool: {message.tool_name}")
    print(f"Args: {message.tool_input}")
```

**Fields:**
- `type`: `"tool_use"`
- `tool_name`: Name of tool being called
- `tool_input`: Tool arguments
- `tool_use_id`: Unique identifier

### Tool Result Messages

When tool execution completes:

```python
if message.type == "tool_result":
    print(f"Tool output: {message.output}")
```

**Fields:**
- `type`: `"tool_result"`
- `output`: Tool return value
- `tool_use_id`: Matches tool_use message

### Result Messages

Final task completion:

```python
if message.type == "result":
    if message.subtype == "success":
        print(f"Success: {message.result}")
    elif message.subtype == "error":
        print(f"Error: {message.error}")
    elif message.subtype == "max_turns":
        print("Hit turn limit")
    elif message.subtype == "budget_exceeded":
        print("Budget limit reached")
```

**Fields:**
- `type`: `"result"`
- `subtype`: `"success"`, `"error"`, `"max_turns"`, `"budget_exceeded"`
- `result`: Task result (success)
- `error`: Error message (error)

### Permission Request Messages

When agent needs approval (in `default` permission mode):

```python
if message.type == "permission_request":
    print(f"Agent wants to: {message.tool_name}")
    print(f"With args: {message.tool_input}")
    # User would approve/deny here
```

**Fields:**
- `type`: `"permission_request"`
- `tool_name`: Tool requiring permission
- `tool_input`: Tool arguments

## Multi-Turn Conversations

### Async Generator Pattern

Send multiple messages sequentially using async generators:

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
            "content": "Now add rate limiting"
        }
    }
    
    # Third message
    await asyncio.sleep(2)
    yield {
        "type": "user",
        "message": {
            "role": "user",
            "content": "Write tests for the rate limiter"
        }
    }

# Use generator as prompt
async for message in query(
    prompt=generate_messages(),
    options=ClaudeAgentOptions(max_turns=50)
):
    process_message(message)
```

### Interactive Chat Loop

Build interactive CLI chat:

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def chat_session():
    async def message_generator():
        while True:
            user_input = input("\nYou: ")
            if user_input.lower() in ['exit', 'quit']:
                break
            
            yield {
                "type": "user",
                "message": {
                    "role": "user",
                    "content": user_input
                }
            }
    
    options = ClaudeAgentOptions(
        cwd="/path/to/project",
        allowed_tools=["Read", "Write", "Bash", "Grep"],
        permission_mode="default",
        max_turns=100
    )
    
    async for message in query(prompt=message_generator(), options=options):
        if message.type == "text":
            print(message.text, end='', flush=True)
        elif message.type == "result":
            print(f"\n[Task complete]")

asyncio.run(chat_session())
```

## Image Attachments

### Sending Images with Messages

Attach images for visual analysis:

```python
import base64
from pathlib import Path

async def generate_with_image():
    # Load image as base64
    image_path = Path("architecture.png")
    image_data = base64.b64encode(image_path.read_bytes()).decode('utf-8')
    
    yield {
        "type": "user",
        "message": {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Review this architecture diagram"
                },
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_data
                    }
                }
            ]
        }
    }

async for message in query(
    prompt=generate_with_image(),
    options=options
):
    print(message)
```

### Supported Image Formats

- PNG (`image/png`)
- JPEG (`image/jpeg`)
- GIF (`image/gif`)
- WebP (`image/webp`)

## Interrupting Agent Execution

### Graceful Interruption

Stop agent mid-execution:

```python
import asyncio

async def interruptible_agent():
    query_task = None
    
    try:
        async for message in query(prompt="Long running task", options=options):
            # Process messages
            if message.type == "text":
                print(message.text, end='')
            
            # User can send interrupt signal
            if should_stop():
                break
    
    except asyncio.CancelledError:
        print("\nAgent interrupted")
    
    except KeyboardInterrupt:
        print("\nUser cancelled")
```

### Timeout Pattern

Set maximum execution time:

```python
import asyncio

async def with_timeout():
    try:
        async with asyncio.timeout(300):  # 5 minute timeout
            async for message in query(prompt="Task", options=options):
                process_message(message)
    
    except asyncio.TimeoutError:
        print("Agent execution timed out")
```

## Session Management

### Session IDs

Track and reference sessions:

```python
current_session_id = None

async for message in query(prompt="Task", options=options):
    if message.type == "system" and message.subtype == "init":
        current_session_id = message.session_id
        print(f"Session: {current_session_id}")
```

### Transcript Paths

Access conversation history:

```python
async for message in query(prompt="Task", options=options):
    if hasattr(message, 'transcript_path'):
        print(f"Transcript: {message.transcript_path}")
        # ~/.claude/projects/<project>/sessions/<session_id>.jsonl
```

### Reading Transcripts

```python
import json
from pathlib import Path

def read_transcript(transcript_path: str):
    """Read and parse session transcript"""
    transcript_file = Path(transcript_path)
    if transcript_file.exists():
        with open(transcript_file) as f:
            for line in f:
                event = json.loads(line)
                print(event)
```

## Real-Time Progress Tracking

### Progress Indicators

Show agent activity:

```python
import sys

async def with_progress():
    current_tool = None
    
    async for message in query(prompt="Complex task", options=options):
        if message.type == "tool_use":
            current_tool = message.tool_name
            print(f"\n[{current_tool}]", end='', flush=True)
        
        elif message.type == "text":
            if current_tool:
                print(f"\n{message.text}", end='', flush=True)
            else:
                print(message.text, end='', flush=True)
        
        elif message.type == "tool_result":
            print(f" ✓", flush=True)
            current_tool = None
```

### Live Status Updates

```python
from datetime import datetime

async def with_status():
    start_time = datetime.now()
    tool_count = 0
    
    async for message in query(prompt="Task", options=options):
        if message.type == "tool_use":
            tool_count += 1
            elapsed = (datetime.now() - start_time).seconds
            print(f"\r[{elapsed}s] Tools: {tool_count}", end='', flush=True)
        
        elif message.type == "text":
            print(f"\n{message.text}", end='', flush=True)
```

## Error Handling

### Graceful Error Recovery

```python
async def with_error_handling():
    try:
        async for message in query(prompt="Task", options=options):
            if message.type == "result":
                if message.subtype == "error":
                    print(f"Agent error: {message.error}")
                    # Handle error, maybe retry
                elif message.subtype == "success":
                    print(f"Success: {message.result}")
    
    except Exception as e:
        print(f"SDK error: {e}")
```

### Retry Pattern

```python
async def with_retry(max_retries=3):
    for attempt in range(max_retries):
        try:
            async for message in query(prompt="Task", options=options):
                if message.type == "result":
                    if message.subtype == "success":
                        return message.result
                    elif message.subtype == "error":
                        if attempt < max_retries - 1:
                            print(f"Retry {attempt + 1}/{max_retries}")
                            break
                        else:
                            raise Exception(message.error)
        
        except Exception as e:
            if attempt == max_retries - 1:
                raise
```

## Best Practices

### 1. Always Handle Result Messages

Check for completion status:

```python
async for message in query(prompt="...", options=options):
    if message.type == "result":
        if message.subtype == "success":
            # Handle success
            pass
        elif message.subtype == "error":
            # Handle error
            pass
        elif message.subtype == "max_turns":
            # Hit turn limit
            pass
```

### 2. Use Flush for Real-Time Output

Enable typewriter effect:

```python
if message.type == "text":
    print(message.text, end='', flush=True)  # flush=True is key
```

### 3. Track Session IDs

Save session IDs for debugging:

```python
session_ids = []
if message.type == "system" and message.subtype == "init":
    session_ids.append(message.session_id)
```

### 4. Set Reasonable Limits

Prevent runaway execution:

```python
options = ClaudeAgentOptions(
    max_turns=50,          # Limit conversation length
    max_budget_usd=5.0     # Limit API spend
)
```

### 5. Clean Up Resources

```python
try:
    async for message in query(prompt="...", options=options):
        # Process messages
        pass
finally:
    # Clean up if needed
    pass
```

## Advanced Patterns

### Streaming with Hooks

Combine streaming with hooks for monitoring:

```python
async def logging_hook(input_data, tool_use_id, context):
    if input_data['hook_event_name'] == 'PreToolUse':
        print(f"\n[Hook] Tool: {input_data['tool_name']}")
    return {}

options = ClaudeAgentOptions(
    hooks={'PreToolUse': [HookMatcher(hooks=[logging_hook])]}
)

async for message in query(prompt="Task", options=options):
    # Messages and hook output interleaved
    print(message)
```

### Streaming with MCP Servers

```typescript
async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "Query the database"
    }
  };
}

for await (const message of query({
  prompt: generateMessages(),  // Required for MCP
  options: {
    mcpServers: { "db": dbServer },
    allowedTools: ["mcp__db__query"]
  }
})) {
  console.log(message);
}
```

## Next Steps

- **[Agents](./agents.md)** - Configure agent behavior
- **[Hooks](./hooks.md)** - Intercept streaming events
- **[MCP Servers](./mcp-servers.md)** - Requires streaming mode