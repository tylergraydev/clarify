/**
 * Agent Tools Types
 *
 * Type definitions for managing tool selection state in the agent editor.
 */

/**
 * Tool data for creating a new agent tool
 */
export interface CreateToolData {
  /** The pattern for tool arguments */
  pattern: string;
  /** The name of the tool */
  toolName: string;
}

/**
 * Represents a tool selection in the agent editor
 */
export interface ToolSelection {
  /** Whether this tool is enabled for the agent */
  enabled: boolean;
  /** The pattern for tool arguments (defaults to "*" for all) */
  pattern: string;
  /** The name of the tool */
  toolName: string;
}

/**
 * Props for components that manage tool selections
 */
export interface ToolSelectionProps {
  /** Whether the inputs are disabled */
  disabled?: boolean;
  /** Callback when tool selections change */
  onChange: (tools: Array<ToolSelection>) => void;
  /** Current tool selections */
  value: Array<ToolSelection>;
}
