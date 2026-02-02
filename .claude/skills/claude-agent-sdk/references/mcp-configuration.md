# MCP Server Configuration

Types for configuring MCP (Model Context Protocol) servers.

## `McpServerConfig`

Union type for all MCP server configuration options.

```typescript
type McpServerConfig =
  | McpStdioServerConfig
  | McpSSEServerConfig
  | McpHttpServerConfig
  | McpSdkServerConfigWithInstance;
```

## `McpStdioServerConfig`

Configuration for stdio-based MCP servers (external processes).

```typescript
type McpStdioServerConfig = {
  type?: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}
```

| Field | Type | Description |
|:------|:-----|:------------|
| `type` | `'stdio'` | Server type (optional, defaults to stdio) |
| `command` | `string` | Command to execute |
| `args` | `string[]` | Arguments to pass to the command |
| `env` | `Record<string, string>` | Environment variables |

### Example

```typescript
const mcpServers = {
  filesystem: {
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user/project'],
    env: { DEBUG: 'true' }
  }
};
```

## `McpSSEServerConfig`

Configuration for Server-Sent Events (SSE) based MCP servers.

```typescript
type McpSSEServerConfig = {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
}
```

| Field | Type | Description |
|:------|:-----|:------------|
| `type` | `'sse'` | Server type |
| `url` | `string` | SSE endpoint URL |
| `headers` | `Record<string, string>` | HTTP headers to include |

### Example

```typescript
const mcpServers = {
  remote: {
    type: 'sse',
    url: 'https://api.example.com/mcp/sse',
    headers: { Authorization: 'Bearer token123' }
  }
};
```

## `McpHttpServerConfig`

Configuration for HTTP-based MCP servers.

```typescript
type McpHttpServerConfig = {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}
```

| Field | Type | Description |
|:------|:-----|:------------|
| `type` | `'http'` | Server type |
| `url` | `string` | HTTP endpoint URL |
| `headers` | `Record<string, string>` | HTTP headers to include |

### Example

```typescript
const mcpServers = {
  api: {
    type: 'http',
    url: 'https://api.example.com/mcp',
    headers: { 'X-API-Key': 'key123' }
  }
};
```

## `McpSdkServerConfigWithInstance`

Configuration for in-process SDK MCP servers created with `createSdkMcpServer()`.

```typescript
type McpSdkServerConfigWithInstance = {
  type: 'sdk';
  name: string;
  instance: McpServer;
}
```

| Field | Type | Description |
|:------|:-----|:------------|
| `type` | `'sdk'` | Server type |
| `name` | `string` | Server name |
| `instance` | `McpServer` | Server instance |

### Example

```typescript
import { tool, createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const greetTool = tool(
  "greet",
  "Greets a user",
  { name: z.string() },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }]
  })
);

const myServer = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [greetTool]
});

for await (const message of query({
  prompt: "Greet John",
  options: {
    mcpServers: { myTools: myServer }
  }
})) {
  // Handle messages
}
```

## `CallToolResult`

MCP tool result type (from `@modelcontextprotocol/sdk/types.js`).

```typescript
type CallToolResult = {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    // Additional fields vary by type
  }>;
  isError?: boolean;
}
```

### Content Types

**Text content:**
```typescript
{ type: 'text', text: string }
```

**Image content:**
```typescript
{ type: 'image', data: string, mimeType: string }
```

**Resource content:**
```typescript
{ type: 'resource', resource: { uri: string, mimeType?: string, text?: string } }
```

## Usage Example

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Use the filesystem tools to list files",
  options: {
    mcpServers: {
      // External stdio server
      fs: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '.']
      },
      // Remote SSE server
      remote: {
        type: 'sse',
        url: 'https://api.example.com/mcp/sse'
      }
    }
  }
})) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```
