/**
 * Claude Code Built-in Tools
 *
 * Defines the core tools available in Claude Code CLI for agent configuration.
 * These tools are displayed in the agent editor for users to enable/disable.
 */

/**
 * Built-in Claude Code tools with descriptions
 */
export const CLAUDE_BUILTIN_TOOLS = [
  { description: "Read file contents", name: "Read" },
  { description: "Create new files", name: "Write" },
  { description: "Modify existing files", name: "Edit" },
  { description: "File pattern matching", name: "Glob" },
  { description: "Content search with regex", name: "Grep" },
  { description: "Execute shell commands", name: "Bash" },
  { description: "Fetch web content", name: "WebFetch" },
  { description: "Search the web", name: "WebSearch" },
  { description: "Spawn sub-agents", name: "Task" },
] as const;

/**
 * Tool name type derived from built-in tools
 */
export type BuiltinToolName = (typeof CLAUDE_BUILTIN_TOOLS)[number]["name"];

/**
 * Agent type for tool defaults
 */
export type AgentToolType = "planning" | "review" | "specialist";

/**
 * Default tools enabled by agent type
 *
 * - planning: Read-only tools for research and analysis
 * - specialist: Full tool access for implementation work
 * - review: Read-only tools for code review
 */
export const DEFAULT_TOOLS_BY_AGENT_TYPE: Record<
  AgentToolType,
  ReadonlyArray<BuiltinToolName>
> = {
  planning: ["Read", "Glob", "Grep", "WebFetch", "WebSearch"],
  review: ["Read", "Glob", "Grep"],
  specialist: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
} as const;

/**
 * Get default tools for an agent type
 */
export function getDefaultToolsForAgentType(
  type: AgentToolType
): ReadonlyArray<BuiltinToolName> {
  return DEFAULT_TOOLS_BY_AGENT_TYPE[type] ?? [];
}

/**
 * Check if a tool name is a built-in tool
 */
export function isBuiltinTool(toolName: string): toolName is BuiltinToolName {
  return CLAUDE_BUILTIN_TOOLS.some((tool) => tool.name === toolName);
}
