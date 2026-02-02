# Core API Functions

Primary functions for interacting with the Claude Agent SDK.

## Installation

```bash
npm install @anthropic-ai/claude-agent-sdk
```

## `query()`

The primary function for interacting with Claude Code. Creates an async generator that streams messages as they arrive.

```typescript
function query({
  prompt,
  options
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query
```

### Parameters

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `prompt` | `string \| AsyncIterable<SDKUserMessage>` | The input prompt as a string or async iterable for streaming mode |
| `options` | `Options` | Optional configuration object (see options-configuration.md) |

### Returns

Returns a `Query` object that extends `AsyncGenerator<SDKMessage, void>` with additional methods (see query-interface.md).

## `tool()`

Creates a type-safe MCP tool definition for use with SDK MCP servers.

```typescript
function tool<Schema extends ZodRawShape>(
  name: string,
  description: string,
  inputSchema: Schema,
  handler: (args: z.infer<ZodObject<Schema>>, extra: unknown) => Promise<CallToolResult>
): SdkMcpToolDefinition<Schema>
```

### Parameters

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `name` | `string` | The name of the tool |
| `description` | `string` | A description of what the tool does |
| `inputSchema` | `Schema extends ZodRawShape` | Zod schema defining the tool's input parameters |
| `handler` | `(args, extra) => Promise<CallToolResult>` | Async function that executes the tool logic |

### Example

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const greetTool = tool(
  "greet",
  "Greets a user by name",
  { name: z.string().describe("The name to greet") },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }]
  })
);
```

## `createSdkMcpServer()`

Creates an MCP server instance that runs in the same process as your application.

```typescript
function createSdkMcpServer(options: {
  name: string;
  version?: string;
  tools?: Array<SdkMcpToolDefinition<any>>;
}): McpSdkServerConfigWithInstance
```

### Parameters

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `options.name` | `string` | The name of the MCP server |
| `options.version` | `string` | Optional version string |
| `options.tools` | `Array<SdkMcpToolDefinition>` | Array of tool definitions created with `tool()` |

### Example

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

const myServer = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [greetTool, anotherTool]
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
