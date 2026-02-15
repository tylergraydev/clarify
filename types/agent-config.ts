/**
 * Shared Agent Configuration Type
 *
 * Canonical agent configuration interface used across all workflow step types.
 * Replaces step-specific duplicates (ClarificationAgentConfig, RefinementAgentConfig,
 * FileDiscoveryAgentConfig) with a single shared definition.
 */

/**
 * Configuration for a loaded agent, used across all workflow steps.
 * Captures the full agent configuration needed for SDK execution.
 */
export interface AgentConfig {
  /** Whether extended thinking is enabled */
  extendedThinkingEnabled: boolean;
  /** Array of hooks for agent events */
  hooks: Array<{
    body: string;
    eventType: string;
    matcher: null | string;
  }>;
  /** The unique identifier of the agent */
  id: number;
  /** Maximum thinking tokens budget for extended thinking */
  maxThinkingTokens: null | number;
  /** The model to use (e.g., 'claude-sonnet-4-20250514') */
  model: null | string;
  /** The display name of the agent */
  name: string;
  /** The permission mode for the agent */
  permissionMode: null | string;
  /** The provider for this agent (e.g., 'claude', 'openai') */
  provider: null | string;
  /** Array of skills the agent can use */
  skills: Array<{
    isRequired: boolean;
    skillName: string;
  }>;
  /** The system prompt that defines agent behavior */
  systemPrompt: string;
  /** Array of tools the agent can use */
  tools: Array<{
    toolName: string;
    toolPattern: string;
  }>;
}
