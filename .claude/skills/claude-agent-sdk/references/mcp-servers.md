# MCP Servers - Claude Agent SDK

## Overview

The Model Context Protocol (MCP) is an open standard for connecting AI agents to external tools and data sources. With MCP, agents can query databases, integrate with APIs like Slack and GitHub, and connect to services without writing custom tool implementations.

## What is MCP?

MCP provides a standardized way to:
- **Expose tools** - Define callable functions for agents
- **Provide context** - Share data and resources
- **Connect services** - Integrate databases, APIs, file systems
- **Extend capabilities** - Add custom functionality

### MCP Server Types

| Type | Description | Use Cases |
|------|-------------|-----------|
| **Stdio** | Local process communication | CLI tools, local scripts |
| **HTTP** | Remote HTTP endpoints | Cloud services, APIs |
| **SSE** | Server-sent events | Real-time updates |
| **In-process (SDK)** | Embedded in application | Custom tools, no subprocess |

## Configuring MCP Servers

### In-Code Configuration

Pass MCP servers directly to `query()`:

**Python:**

```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    mcp_servers={
        "filesystem": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
        },
        "github": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "env": {
                "GITHUB_TOKEN": "your-token"
            }
        }
    },
    allowed_tools=[
        "mcp__filesystem__*",
        "mcp__github__*"
    ]
)

async for message in query(prompt="List project files", options=options):
    print(message)
```

**TypeScript:**

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const options = {
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
    },
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN
      }
    }
  },
  allowedTools: [
    "mcp__filesystem__*",
    "mcp__github__*"
  ]
};

for await (const message of query({ prompt: "List project files", options })) {
  console.log(message);
}
```

### File-Based Configuration

Create `.mcp.json` at project root:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
```

SDK loads this automatically if present.

## Transport Types

### Stdio Transport (Local Process)

Run MCP server as subprocess:

```python
mcp_servers={
    "server-name": {
        "command": "npx",  # or "python", "node", etc.
        "args": ["-y", "@modelcontextprotocol/server-package", "arg1"],
        "env": {
            "API_KEY": "your-key"
        }
    }
}
```

**Common patterns:**

```python
# Node.js MCP server
"command": "node"
"args": ["path/to/server.js"]

# Python MCP server
"command": "python"
"args": ["path/to/server.py"]

# NPX for npm packages
"command": "npx"
"args": ["-y", "@org/package"]
```

### HTTP Transport (Remote Server)

Connect to HTTP MCP endpoint:

```python
mcp_servers={
    "api-server": {
        "type": "http",
        "url": "https://api.example.com/mcp",
        "headers": {
            "Authorization": "Bearer your-token",
            "Custom-Header": "value"
        }
    }
}
```

**TypeScript:**

```typescript
mcpServers: {
  "api-server": {
    type: "http",
    url: "https://api.example.com/mcp",
    headers: {
      "Authorization": `Bearer ${process.env.API_TOKEN}`
    }
  }
}
```

### SSE Transport (Server-Sent Events)

Connect to SSE endpoint:

```python
mcp_servers={
    "sse-server": {
        "type": "sse",
        "url": "https://api.example.com/sse",
        "headers": {
            "Authorization": "Bearer your-token"
        }
    }
}
```

## Tool Permissions

### Explicit Tool Allowlist

Specify which MCP tools are permitted:

```python
allowed_tools=[
    "mcp__github__*",              # All tools from github server
    "mcp__postgres__query",        # Only query tool from postgres
    "mcp__slack__send_message",    # Only send_message from slack
    "Read", "Write"                # Built-in tools
]
```

### Wildcard Permissions

Allow all tools from a server:

```python
allowed_tools=["mcp__server-name__*"]
```

### Permission Modes for MCP

Instead of explicit `allowed_tools`, use permission modes:

```python
options = ClaudeAgentOptions(
    mcp_servers={...},
    permission_mode="acceptEdits"  # Auto-approve tools
    # or "bypassPermissions" for full access
)
```

See [Permission Modes](./permission-modes.md) for details.

## Authentication

### Environment Variables

Pass credentials via `env`:

```python
mcp_servers={
    "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
            "GITHUB_TOKEN": os.environ["GITHUB_TOKEN"]
        }
    },
    "database": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres"],
        "env": {
            "DATABASE_URL": os.environ["DATABASE_URL"]
        }
    }
}
```

### HTTP Headers

Authenticate HTTP/SSE servers:

```python
mcp_servers={
    "api": {
        "type": "http",
        "url": "https://api.example.com/mcp",
        "headers": {
            "Authorization": f"Bearer {api_token}",
            "X-API-Key": api_key
        }
    }
}
```

### OAuth 2.1

Handle OAuth flows in your application, then pass access token:

```typescript
// After completing OAuth flow
const accessToken = await getAccessTokenFromOAuthFlow();

const options = {
  mcpServers: {
    "oauth-api": {
      type: "http",
      url: "https://api.example.com/mcp",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    }
  }
};
```

SDK doesn't handle OAuth flows automatically - implement in your app.

## Popular MCP Servers

### Filesystem Server

Access local file system:

```python
mcp_servers={
    "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
    }
}

allowed_tools=[
    "mcp__filesystem__read_file",
    "mcp__filesystem__write_file",
    "mcp__filesystem__list_directory"
]
```

### PostgreSQL Server

Query databases:

```python
connection_string = "postgresql://user:password@localhost:5432/database"

mcp_servers={
    "postgres": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres", connection_string]
    }
}

allowed_tools=[
    "mcp__postgres__query"  # Read-only queries
]
```

**Example usage:**

```python
async for message in query(
    prompt="Show me the top 10 users by signup date",
    options=ClaudeAgentOptions(
        mcp_servers={...},
        allowed_tools=["mcp__postgres__query"]
    )
):
    if message.type == "result":
        print(message.result)
```

### GitHub Server

Interact with GitHub:

```python
mcp_servers={
    "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
            "GITHUB_TOKEN": github_token
        }
    }
}

allowed_tools=[
    "mcp__github__create_issue",
    "mcp__github__list_issues",
    "mcp__github__search_repositories"
]
```

### Slack Server

Send Slack messages:

```python
mcp_servers={
    "slack": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-slack"],
        "env": {
            "SLACK_BOT_TOKEN": slack_token
        }
    }
}

allowed_tools=[
    "mcp__slack__send_message",
    "mcp__slack__list_channels"
]
```

## Creating Custom MCP Servers

### In-Process SDK MCP Server

Create custom tools without subprocess overhead:

**TypeScript:**

```typescript
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const weatherServer = createSdkMcpServer({
  name: "weather",
  version: "1.0.0",
  tools: [
    tool(
      "get_weather",
      "Get current weather for a location",
      {
        latitude: z.number().describe("Latitude coordinate"),
        longitude: z.number().describe("Longitude coordinate")
      },
      async (args) => {
        const response = await fetch(
          `https://api.weather.gov/points/${args.latitude},${args.longitude}`
        );
        const data = await response.json();
        
        return {
          content: [{
            type: "text",
            text: `Temperature: ${data.properties.temperature.value}°F`
          }]
        };
      }
    ),
    
    tool(
      "forecast",
      "Get weather forecast",
      {
        latitude: z.number(),
        longitude: z.number(),
        days: z.number().optional().default(7)
      },
      async (args) => {
        // Implement forecast logic
        return {
          content: [{
            type: "text",
            text: "Forecast data..."
          }]
        };
      }
    )
  ]
});

// Use in query
async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "What's the weather in San Francisco?"
    }
  };
}

for await (const message of query({
  prompt: generateMessages(),  // Required for MCP
  options: {
    mcpServers: {
      "weather": weatherServer
    },
    allowedTools: ["mcp__weather__*"]
  }
})) {
  console.log(message);
}
```

**Python:**

```python
from claude_agent_sdk import create_sdk_mcp_server, tool
from pydantic import BaseModel

class WeatherArgs(BaseModel):
    latitude: float
    longitude: float

async def get_weather_handler(args: WeatherArgs):
    # Fetch weather data
    response = await fetch_weather(args.latitude, args.longitude)
    
    return {
        "content": [{
            "type": "text",
            "text": f"Temperature: {response.temperature}°F"
        }]
    }

weather_server = create_sdk_mcp_server(
    name="weather",
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

# Use in query (requires async generator)
async def generate_messages():
    yield {
        "type": "user",
        "message": {
            "role": "user",
            "content": "What's the weather?"
        }
    }

async for message in query(
    prompt=generate_messages(),
    options=ClaudeAgentOptions(
        mcp_servers={"weather": weather_server},
        allowed_tools=["mcp__weather__*"]
    )
):
    print(message)
```

### Standalone MCP Server (Stdio)

Create independent MCP server process:

**Python server (`weather_server.py`):**

```python
#!/usr/bin/env python3
import asyncio
import json
import sys

async def handle_request(request):
    """Handle MCP requests"""
    if request["method"] == "tools/list":
        return {
            "tools": [
                {
                    "name": "get_weather",
                    "description": "Get weather for location",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "latitude": {"type": "number"},
                            "longitude": {"type": "number"}
                        },
                        "required": ["latitude", "longitude"]
                    }
                }
            ]
        }
    
    elif request["method"] == "tools/call":
        tool_name = request["params"]["name"]
        args = request["params"]["arguments"]
        
        if tool_name == "get_weather":
            # Implement weather fetching
            result = await fetch_weather(args["latitude"], args["longitude"])
            return {
                "content": [{
                    "type": "text",
                    "text": f"Temperature: {result['temp']}°F"
                }]
            }

async def main():
    """MCP server main loop"""
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        
        request = json.loads(line)
        response = await handle_request(request)
        
        print(json.dumps(response))
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())
```

**Use the server:**

```python
mcp_servers={
    "weather": {
        "command": "python",
        "args": ["weather_server.py"]
    }
}
```

## Tool Discovery

### Listing Available MCP Tools

Query what tools are available:

```python
async for message in query(
    prompt="What MCP tools are available?",
    options=ClaudeAgentOptions(
        mcp_servers={...},
        allowed_tools=["Skill"]  # Or any tool to enable query
    )
):
    if message.type == "system" and message.subtype == "init":
        print("MCP servers:", message.mcp_servers)
```

### Inspecting Tool Schemas

See tool parameters and descriptions:

```python
async for message in query(prompt="...", options=options):
    if message.type == "system" and message.subtype == "init":
        for server_name, server_info in message.mcp_servers.items():
            print(f"\nServer: {server_name}")
            for tool in server_info.get("tools", []):
                print(f"  Tool: {tool['name']}")
                print(f"  Description: {tool['description']}")
                print(f"  Schema: {tool['inputSchema']}")
```

## Debugging MCP Servers

### Enable Debug Logging

```python
options = ClaudeAgentOptions(
    mcp_servers={
        "myserver": {
            "command": "python",
            "args": ["server.py"],
            "log_level": "debug"  # Enable detailed logs
        }
    }
)
```

### Check Server Connection

```python
async for message in query(
    prompt="Test MCP connection",
    options=options
):
    if message.type == "system" and message.subtype == "init":
        if "myserver" in message.mcp_servers:
            print("✓ Server connected")
        else:
            print("✗ Server not found")
```

### Monitor Tool Calls

Use hooks to see MCP tool invocations:

```python
async def log_mcp_tools(input_data, tool_use_id, context):
    if input_data['hook_event_name'] == 'PreToolUse':
        tool_name = input_data['tool_name']
        if tool_name.startswith('mcp__'):
            print(f"MCP Tool: {tool_name}")
            print(f"Args: {input_data['tool_input']}")
    return {}

options = ClaudeAgentOptions(
    mcp_servers={...},
    hooks={
        'PreToolUse': [HookMatcher(matcher='mcp__.*', hooks=[log_mcp_tools])]
    }
)
```

## Best Practices

### 1. Principle of Least Privilege

Only allow necessary tools:

```python
# ✅ Good - specific tools
allowed_tools=[
    "mcp__postgres__query",  # Read-only
    "mcp__github__list_issues"
]

# ❌ Risky - too broad
allowed_tools=["mcp__postgres__*"]  # Includes write operations
```

### 2. Secure Credential Management

Never hardcode secrets:

```python
# ✅ Good - from environment
mcp_servers={
    "github": {
        "command": "npx",
        "args": ["..."],
        "env": {"GITHUB_TOKEN": os.environ["GITHUB_TOKEN"]}
    }
}

# ❌ Bad - hardcoded
mcp_servers={
    "github": {
        "env": {"GITHUB_TOKEN": "ghp_hardcoded_token"}  # Never do this!
    }
}
```

### 3. Use Streaming Mode for MCP

MCP tools require streaming input:

```python
# ✅ Correct - async generator
async def generate_messages():
    yield {"type": "user", "message": {...}}

async for message in query(
    prompt=generate_messages(),  # Required for MCP
    options=ClaudeAgentOptions(mcp_servers={...})
):
    pass

# ❌ Wrong - string prompt doesn't work with MCP
async for message in query(
    prompt="Use MCP tools",  # Won't work
    options=ClaudeAgentOptions(mcp_servers={...})
):
    pass
```

### 4. Validate MCP Tool Schemas

Ensure tool schemas are well-defined:

```typescript
// ✅ Good schema
tool(
  "query_db",
  "Execute read-only SQL query",
  {
    query: z.string().describe("SELECT query (read-only)"),
    limit: z.number().optional().default(100).describe("Max rows")
  },
  handler
)

// ❌ Vague schema
tool(
  "query",
  "Query",
  { q: z.string() },  // No description, unclear parameter
  handler
)
```

### 5. Handle MCP Errors Gracefully

```python
async for message in query(prompt=..., options=options):
    if message.type == "tool_result":
        if hasattr(message, 'is_error') and message.is_error:
            print(f"MCP tool error: {message.output}")
    
    elif message.type == "result":
        if message.subtype == "error":
            print(f"Agent error: {message.error}")
```

## Common Issues

### MCP Server Not Found

**Cause:** Server configuration incorrect

**Solution:**
- Check command and args are correct
- Verify NPM package installed
- Test command manually: `npx -y @package`

### Tool Not Invoked

**Cause:** Tool not in `allowed_tools`

**Solution:**
```python
allowed_tools=["mcp__server__tool"]  # Explicit permission
```

### Authentication Failed

**Cause:** Missing or invalid credentials

**Solution:**
- Verify environment variables set
- Check token hasn't expired
- Test credentials outside SDK

## Next Steps

- **[Tools](./tools.md)** - Understand MCP tool integration
- **[Custom Tools Guide](https://platform.claude.com/docs/en/agent-sdk/custom-tools)** - Detailed MCP server creation
- **[MCP Specification](https://modelcontextprotocol.io/)** - Official protocol docs