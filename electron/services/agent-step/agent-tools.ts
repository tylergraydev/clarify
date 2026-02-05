/**
 * Agent Step Tool Constants
 *
 * Defines the complete list of built-in Claude Code tools
 * that may be allowed or restricted in agent configurations.
 */

/**
 * All built-in Claude Code tools that can be allowed or blocked
 * in agent step configurations.
 *
 * This list is used to explicitly disallow tools NOT in the agent's
 * allowed tools list, ensuring proper tool restriction enforcement.
 */
export const CLAUDE_CODE_TOOL_NAMES = [
  'Task',
  'AskUserQuestion',
  'Bash',
  'BashOutput',
  'Edit',
  'Read',
  'Write',
  'Glob',
  'Grep',
  'KillBash',
  'NotebookEdit',
  'WebFetch',
  'WebSearch',
  'TodoWrite',
  'ExitPlanMode',
  'ListMcpResources',
  'ReadMcpResource',
] as const;

/**
 * Type representing a valid Claude Code tool name.
 */
export type ClaudeCodeToolName = (typeof CLAUDE_CODE_TOOL_NAMES)[number];
