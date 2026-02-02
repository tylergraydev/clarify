# Utility Types

Miscellaneous utility types used throughout the Claude Agent SDK.

## `ConfigScope`

Configuration scope for settings.

```typescript
type ConfigScope = 'local' | 'user' | 'project';
```

| Value | Description |
|:------|:------------|
| `local` | Local settings (gitignored) |
| `user` | User-level settings |
| `project` | Project-level settings (version controlled) |

## `AbortError`

Custom error class for abort operations.

```typescript
class AbortError extends Error {}
```

### Usage

```typescript
import { query, AbortError } from "@anthropic-ai/claude-agent-sdk";

const controller = new AbortController();

try {
  for await (const message of query({
    prompt: "Long running task",
    options: { abortController: controller }
  })) {
    // Handle messages
  }
} catch (error) {
  if (error instanceof AbortError) {
    console.log("Query was aborted");
  } else {
    throw error;
  }
}

// Abort from elsewhere
controller.abort();
```

## `UUID`

UUID string type alias.

```typescript
type UUID = string;
```

## `Dict`

Dictionary type helper.

```typescript
type Dict<T> = Record<string, T>;
```

## `ExitReason`

Reasons why a session may have ended.

```typescript
type ExitReason = string; // From EXIT_REASONS array
```

Common exit reasons:
- `'user_interrupt'` - User interrupted the session
- `'completed'` - Task completed successfully
- `'max_turns'` - Maximum turns reached
- `'max_budget'` - Budget limit reached
- `'error'` - An error occurred

## Type Guards

### Checking Message Types

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({ prompt: "Hello" })) {
  // Check by type field
  if (message.type === 'assistant') {
    // SDKAssistantMessage
    console.log('Assistant:', message.message);
  } else if (message.type === 'user') {
    // SDKUserMessage
    console.log('User:', message.message);
  } else if (message.type === 'result') {
    // SDKResultMessage
    if (message.subtype === 'success') {
      console.log('Success:', message.result);
    } else {
      console.log('Error:', message.errors);
    }
  } else if (message.type === 'system') {
    if (message.subtype === 'init') {
      // SDKSystemMessage
      console.log('Session initialized:', message.session_id);
    } else if (message.subtype === 'compact_boundary') {
      // SDKCompactBoundaryMessage
      console.log('Compaction occurred');
    }
  } else if (message.type === 'stream_event') {
    // SDKPartialAssistantMessage (only with includePartialMessages: true)
    console.log('Streaming event:', message.event);
  }
}
```

### Checking Result Subtypes

```typescript
for await (const message of query({ prompt: "Hello" })) {
  if (message.type === 'result') {
    switch (message.subtype) {
      case 'success':
        console.log('Result:', message.result);
        if (message.structured_output) {
          console.log('Structured:', message.structured_output);
        }
        break;
      case 'error_max_turns':
        console.log('Hit max turns');
        break;
      case 'error_max_budget_usd':
        console.log('Hit budget limit');
        break;
      case 'error_during_execution':
        console.log('Errors:', message.errors);
        break;
      case 'error_max_structured_output_retries':
        console.log('Structured output validation failed');
        break;
    }
  }
}
```

## Common Patterns

### Extracting Text from Assistant Messages

```typescript
function getAssistantText(message: SDKAssistantMessage): string {
  return message.message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');
}
```

### Getting Total Cost

```typescript
for await (const message of query({ prompt: "Hello" })) {
  if (message.type === 'result') {
    console.log(`Total cost: $${message.total_cost_usd.toFixed(4)}`);
    console.log(`Duration: ${message.duration_ms}ms`);
    console.log(`Turns: ${message.num_turns}`);

    // Per-model breakdown
    for (const [model, usage] of Object.entries(message.modelUsage)) {
      console.log(`${model}: $${usage.costUSD.toFixed(4)}`);
    }
  }
}
```

### Handling Permission Denials

```typescript
for await (const message of query({ prompt: "Do something" })) {
  if (message.type === 'result' && message.permission_denials.length > 0) {
    console.log('Some tools were denied:');
    for (const denial of message.permission_denials) {
      console.log(`- ${denial.tool_name}: ${JSON.stringify(denial.tool_input)}`);
    }
  }
}
```
