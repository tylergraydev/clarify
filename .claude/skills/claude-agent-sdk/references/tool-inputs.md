# Tool Input Types

Input schemas for all built-in Claude Code tools. These types are exported from `@anthropic-ai/claude-agent-sdk`.

## `ToolInput`

Union of all tool input types.

```typescript
type ToolInput =
  | AgentInput
  | AskUserQuestionInput
  | BashInput
  | BashOutputInput
  | FileEditInput
  | FileReadInput
  | FileWriteInput
  | GlobInput
  | GrepInput
  | KillShellInput
  | NotebookEditInput
  | WebFetchInput
  | WebSearchInput
  | TodoWriteInput
  | ExitPlanModeInput
  | ListMcpResourcesInput
  | ReadMcpResourceInput;
```

## Task (AgentInput)

**Tool name:** `Task`

Launches a new agent to handle complex, multi-step tasks autonomously.

```typescript
interface AgentInput {
  /** A short (3-5 word) description of the task */
  description: string;
  /** The task for the agent to perform */
  prompt: string;
  /** The type of specialized agent to use for this task */
  subagent_type: string;
}
```

## AskUserQuestion

**Tool name:** `AskUserQuestion`

Asks the user clarifying questions during execution.

```typescript
interface AskUserQuestionInput {
  /** Questions to ask the user (1-4 questions) */
  questions: Array<{
    /** The complete question to ask the user */
    question: string;
    /** Very short label displayed as a chip/tag (max 12 chars) */
    header: string;
    /** The available choices (2-4 options) */
    options: Array<{
      /** Display text for this option (1-5 words) */
      label: string;
      /** Explanation of what this option means */
      description: string;
    }>;
    /** Set to true to allow multiple selections */
    multiSelect: boolean;
  }>;
  /** User answers populated by the permission system */
  answers?: Record<string, string>;
}
```

## Bash

**Tool name:** `Bash`

Executes bash commands in a persistent shell session.

```typescript
interface BashInput {
  /** The command to execute */
  command: string;
  /** Optional timeout in milliseconds (max 600000) */
  timeout?: number;
  /** Clear, concise description of what this command does */
  description?: string;
  /** Set to true to run this command in the background */
  run_in_background?: boolean;
}
```

## BashOutput

**Tool name:** `BashOutput`

Retrieves output from a running or completed background bash shell.

```typescript
interface BashOutputInput {
  /** The ID of the background shell to retrieve output from */
  bash_id: string;
  /** Optional regex to filter output lines */
  filter?: string;
}
```

## Edit

**Tool name:** `Edit`

Performs exact string replacements in files.

```typescript
interface FileEditInput {
  /** The absolute path to the file to modify */
  file_path: string;
  /** The text to replace */
  old_string: string;
  /** The text to replace it with (must be different from old_string) */
  new_string: string;
  /** Replace all occurrences of old_string (default false) */
  replace_all?: boolean;
}
```

## Read

**Tool name:** `Read`

Reads files from the local filesystem.

```typescript
interface FileReadInput {
  /** The absolute path to the file to read */
  file_path: string;
  /** The line number to start reading from */
  offset?: number;
  /** The number of lines to read */
  limit?: number;
}
```

## Write

**Tool name:** `Write`

Writes a file to the local filesystem, overwriting if it exists.

```typescript
interface FileWriteInput {
  /** The absolute path to the file to write */
  file_path: string;
  /** The content to write to the file */
  content: string;
}
```

## Glob

**Tool name:** `Glob`

Fast file pattern matching.

```typescript
interface GlobInput {
  /** The glob pattern to match files against */
  pattern: string;
  /** The directory to search in (defaults to cwd) */
  path?: string;
}
```

## Grep

**Tool name:** `Grep`

Powerful search tool built on ripgrep.

```typescript
interface GrepInput {
  /** The regular expression pattern to search for */
  pattern: string;
  /** File or directory to search in (defaults to cwd) */
  path?: string;
  /** Glob pattern to filter files (e.g. "*.js") */
  glob?: string;
  /** File type to search (e.g. "js", "py", "rust") */
  type?: string;
  /** Output mode: "content", "files_with_matches", or "count" */
  output_mode?: 'content' | 'files_with_matches' | 'count';
  /** Case insensitive search */
  '-i'?: boolean;
  /** Show line numbers (for content mode) */
  '-n'?: boolean;
  /** Lines to show before each match */
  '-B'?: number;
  /** Lines to show after each match */
  '-A'?: number;
  /** Lines to show before and after each match */
  '-C'?: number;
  /** Limit output to first N lines/entries */
  head_limit?: number;
  /** Enable multiline mode */
  multiline?: boolean;
}
```

## KillBash

**Tool name:** `KillBash`

Kills a running background bash shell by its ID.

```typescript
interface KillShellInput {
  /** The ID of the background shell to kill */
  shell_id: string;
}
```

## NotebookEdit

**Tool name:** `NotebookEdit`

Edits cells in Jupyter notebook files.

```typescript
interface NotebookEditInput {
  /** The absolute path to the Jupyter notebook file */
  notebook_path: string;
  /** The ID of the cell to edit */
  cell_id?: string;
  /** The new source for the cell */
  new_source: string;
  /** The type of the cell (code or markdown) */
  cell_type?: 'code' | 'markdown';
  /** The type of edit (replace, insert, delete) */
  edit_mode?: 'replace' | 'insert' | 'delete';
}
```

## WebFetch

**Tool name:** `WebFetch`

Fetches content from a URL and processes it with an AI model.

```typescript
interface WebFetchInput {
  /** The URL to fetch content from */
  url: string;
  /** The prompt to run on the fetched content */
  prompt: string;
}
```

## WebSearch

**Tool name:** `WebSearch`

Searches the web and returns formatted results.

```typescript
interface WebSearchInput {
  /** The search query to use */
  query: string;
  /** Only include results from these domains */
  allowed_domains?: string[];
  /** Never include results from these domains */
  blocked_domains?: string[];
}
```

## TodoWrite

**Tool name:** `TodoWrite`

Creates and manages a structured task list.

```typescript
interface TodoWriteInput {
  /** The updated todo list */
  todos: Array<{
    /** The task description */
    content: string;
    /** The task status */
    status: 'pending' | 'in_progress' | 'completed';
    /** Active form of the task description */
    activeForm: string;
  }>;
}
```

## ExitPlanMode

**Tool name:** `ExitPlanMode`

Exits planning mode and prompts the user to approve the plan.

```typescript
interface ExitPlanModeInput {
  /** The plan to run by the user for approval */
  plan: string;
}
```

## ListMcpResources

**Tool name:** `ListMcpResources`

Lists available MCP resources from connected servers.

```typescript
interface ListMcpResourcesInput {
  /** Optional server name to filter resources by */
  server?: string;
}
```

## ReadMcpResource

**Tool name:** `ReadMcpResource`

Reads a specific MCP resource from a server.

```typescript
interface ReadMcpResourceInput {
  /** The MCP server name */
  server: string;
  /** The resource URI to read */
  uri: string;
}
```
