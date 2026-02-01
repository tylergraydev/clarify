# Tools - Claude Agent SDK

## Overview

Tools are how agents interact with the environment - reading files, executing commands, calling APIs, and performing actions. The Claude Agent SDK includes powerful built-in tools and supports custom tools via MCP (Model Context Protocol) servers.

## Built-in Tools

The SDK provides ready-to-use tools without custom implementation:

### File System Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| **Read** | Read file contents | Analyze code, review docs |
| **Write** | Create or modify files | Generate code, update configs |
| **Edit** | Make targeted file edits | Apply code changes |
| **Glob** | List files matching patterns | Find all Python files |
| **LS** | List directory contents | Explore project structure |

### Search Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| **Grep** | Search file contents | Find function definitions |
| **Search** | Advanced codebase search | Locate API usage |

### Execution Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| **Bash** | Execute shell commands | Run tests, install packages |

### Git Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| **Git** | Git operations | Commit, branch, status, diff |

### Special Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| **Skill** | Invoke packaged expertise | Use specialized capabilities |
| **Task** | Delegate to subagent | Parallel task execution |
| **Explore** | Read-only analysis | Understand codebase |
| **AskUserQuestion** | Request user input | Clarify requirements |

## Using Built-in Tools

### Allow All Tools (Default)

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Analyze and fix bugs in the codebase",
    options=ClaudeAgentOptions()
    # No allowed_tools = all tools available
):
    print(message)
```

### Restrict to Specific Tools

```python
options = ClaudeAgentOptions(
    allowed_tools=[
        "Read",    # Allow reading files
        "Grep",    # Allow searching
        "Glob",    # Allow listing files
        # Write and Bash excluded = no modifications
    ]
)
```

### Tool Combinations by Use Case

**Read-only analysis:**

```python
allowed_tools=["Read", "Grep", "Glob", "LS"]
```

**Safe code generation:**

```python
allowed_tools=["Read", "Grep", "Write"]  # No Bash execution
```

**Full development workflow:**

```python
allowed_tools=["Read", "Write", "Edit", "Bash", "Git", "Grep", "Glob"]
```

## Custom Tools via MCP Servers

Extend agent capabilities with custom tools through MCP (Model Context Protocol) servers.

### Creating Custom Tools

Use `createSdkMcpServer` and `tool` helpers:

**TypeScript:**

```typescript
import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

// Define custom MCP server with tools
const customServer = createSdkMcpServer({
  name: "my-custom-tools",
  version: "1.0.0",
  tools: [
    tool(
      "get_weather",
      "Get current weather for a location",
      {
        latitude: z.number().describe("Latitude"),
        longitude: z.number().describe("Longitude")
      },
      async (args) => {
        const response = await fetch(
          `https://api.weather.com?lat=${args.latitude}&lon=${args.longitude}`
        );
        const data = await response.json();
        return {
          content: [{
            type: "text",
            text: `Temperature: ${data.temperature}°F`
          }]
        };
      }
    )
  ]
});
```

**Python:**

```python
from claude_agent_sdk import create_sdk_mcp_server, tool
from pydantic import BaseModel

class WeatherArgs(BaseModel):
    latitude: float
    longitude: float

async def get_weather_handler(args: WeatherArgs):
    # Implement weather API call
    return {
        "content": [{
            "type": "text",
            "text": f"Temperature: {temperature}°F"
        }]
    }

custom_server = create_sdk_mcp_server(
    name="my-custom-tools",
    version="1.0.0",
    tools=[
        tool(
            name="get_weather",
            description="Get current weather",
            input_schema=WeatherArgs,
            handler=get_weather_handler
        )
    ]
)
```

### Using Custom Tools

**IMPORTANT**: Custom MCP tools require streaming input mode (async generator).

```typescript
// Define message generator for streaming
async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "What's the weather in San Francisco?"
    }
  };
}

// Use custom tools with streaming prompt
for await (const message of query({
  prompt: generateMessages(),  // Must be async generator
  options: {
    mcpServers: {
      "my-custom-tools": customServer  // Pass as object
    },
    allowedTools: [
      "mcp__my-custom-tools__get_weather"  // Allow specific tool
    ],
    maxTurns: 5
  }
})) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```

### Tool Naming Convention

MCP tools follow this naming pattern:

```
mcp__{server_name}__{tool_name}
```

Examples:
- `mcp__my-custom-tools__get_weather`
- `mcp__github__create_issue`
- `mcp__database__query`

### Selective Tool Access

Allow all tools from a server using wildcards:

```typescript
options: {
  mcpServers: {
    "github": githubServer,
    "database": dbServer
  },
  allowedTools: [
    "mcp__github__*",           // All GitHub tools
    "mcp__database__query",     // Only query from database
    "Read", "Write", "Grep"     // Built-in tools
  ]
}
```

## Tool Schemas and Descriptions

### Schema Definition with Zod (TypeScript)

```typescript
import { z } from 'zod';

const calculatorTool = tool(
  "calculate",
  "Perform mathematical calculations",
  {
    expression: z.string().describe("Math expression to evaluate"),
    precision: z.number().optional().default(2).describe("Decimal places")
  },
  async (args) => {
    const result = eval(args.expression);  // Simplified example
    return {
      content: [{
        type: "text",
        text: result.toFixed(args.precision).toString()
      }]
    };
  }
);
```

### Schema Definition with Pydantic (Python)

```python
from pydantic import BaseModel, Field

class CalculateArgs(BaseModel):
    expression: str = Field(description="Math expression to evaluate")
    precision: int = Field(default=2, description="Decimal places")

async def calculate_handler(args: CalculateArgs):
    result = eval(args.expression)  # Simplified example
    return {
        "content": [{
            "type": "text",
            "text": f"{result:.{args.precision}f}"
        }]
    }
```

### Good Tool Descriptions

Claude uses descriptions to decide when to invoke tools. Write clear, specific descriptions:

**✅ Good:**

```
"Search GitHub issues for a repository by keywords, labels, or state (open/closed)"
```

**❌ Vague:**

```
"GitHub tool"
```

**✅ Good:**

```
"Execute SQL query against PostgreSQL database. Returns JSON results. Read-only."
```

**❌ Vague:**

```
"Database access"
```

## Tool Execution Lifecycle

### 1. Tool Discovery

When a session starts, Claude receives available tools:

```typescript
for await (const message of query({ prompt, options })) {
  if (message.type === "system" && message.subtype === "init") {
    console.log("Available tools:", message.mcp_servers);
  }
}
```

### 2. Tool Selection

Claude analyzes the prompt and chooses appropriate tools based on descriptions.

### 3. Permission Check

SDK evaluates permissions (see [Permission Modes](./permission-modes.md)):
- Check hooks
- Check permission rules
- Apply permission mode
- Call `canUseTool` callback

### 4. Tool Execution

If approved, SDK executes the tool and returns results to Claude.

### 5. Result Processing

Claude receives tool output and continues the agent loop.

## Tool Best Practices

### 1. Principle of Least Privilege

Only grant tools needed for the task:

```python
# Security analysis - read-only
allowed_tools=["Read", "Grep", "Glob"]

# Code generation - no execution
allowed_tools=["Read", "Write", "Edit"]

# Full development - carefully considered
allowed_tools=["Read", "Write", "Bash", "Git"]
```

### 2. Descriptive Tool Names

Use clear, action-oriented names:

- ✅ `search_slack_messages`
- ❌ `slack_tool`
- ✅ `create_jira_ticket`
- ❌ `jira`

### 3. Comprehensive Schemas

Provide complete parameter descriptions:

```typescript
{
  query: z.string().describe("SQL query to execute (SELECT only, no mutations)"),
  timeout: z.number().optional().describe("Query timeout in seconds (default 30)"),
  format: z.enum(["json", "csv"]).describe("Output format")
}
```

### 4. Error Handling in Tools

Return informative errors:

```typescript
async (args) => {
  try {
    const result = await performOperation(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error.message}. Please check parameters.`
      }],
      isError: true
    };
  }
}
```

### 5. Idempotent Operations

Design tools to be safely retried:

```typescript
// ✅ Idempotent - safe to retry
tool("get_user", "Fetch user data", ...)

// ⚠️ Not idempotent - creates duplicate data
tool("create_user", "Create new user", ...)
// Better: Check if exists first, or use upsert
```

## Tool Examples

### API Integration Tool

```typescript
const apiTool = tool(
  "call_api",
  "Call external REST API with authentication",
  {
    endpoint: z.string().describe("API endpoint path"),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]),
    body: z.record(z.any()).optional(),
    headers: z.record(z.string()).optional()
  },
  async (args) => {
    const response = await fetch(`https://api.example.com${args.endpoint}`, {
      method: args.method,
      headers: { ...args.headers, "Authorization": `Bearer ${API_KEY}` },
      body: args.body ? JSON.stringify(args.body) : undefined
    });
    const data = await response.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);
```

### Database Query Tool

```typescript
const dbTool = tool(
  "query_database",
  "Execute read-only SQL query against production database",
  {
    query: z.string().describe("SQL SELECT query"),
    limit: z.number().optional().default(100).describe("Max rows")
  },
  async (args) => {
    // Validate SELECT only
    if (!args.query.trim().toUpperCase().startsWith("SELECT")) {
      return {
        content: [{ type: "text", text: "Error: Only SELECT queries allowed" }],
        isError: true
      };
    }
    
    const results = await db.query(args.query, { limit: args.limit });
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
    };
  }
);
```

### File Processing Tool

```typescript
const csvTool = tool(
  "process_csv",
  "Parse CSV file and return structured data",
  {
    file_path: z.string().describe("Path to CSV file"),
    delimiter: z.string().optional().default(",")
  },
  async (args) => {
    const fs = require('fs').promises;
    const content = await fs.readFile(args.file_path, 'utf-8');
    const rows = content.split('\n').map(row => row.split(args.delimiter));
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ rows, count: rows.length }, null, 2)
      }]
    };
  }
);
```

## Tool Debugging

### Enable MCP Logging

```typescript
options: {
  mcpServers: {
    "my-server": {
      ...serverConfig,
      logLevel: "debug"  // Enable detailed logging
    }
  }
}
```

### Monitor Tool Calls with Hooks

```python
from claude_agent_sdk import HookMatcher

async def log_tool_use(input_data, tool_use_id, context):
    if input_data['hook_event_name'] == 'PreToolUse':
        print(f"Tool: {input_data['tool_name']}")
        print(f"Args: {input_data['tool_input']}")
    return {}

options = ClaudeAgentOptions(
    hooks={
        'PreToolUse': [HookMatcher(hooks=[log_tool_use])]
    }
)
```

## Next Steps

- **[MCP Servers](./mcp-servers.md)** - Detailed MCP configuration
- **[Permission Modes](./permission-modes.md)** - Control tool access
- **[Hooks](./hooks.md)** - Intercept tool execution
- **[Skills](./skills.md)** - Package tools into reusable Skills