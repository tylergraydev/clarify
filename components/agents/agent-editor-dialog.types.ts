import type { ReactNode } from 'react';

import type { Agent } from '@/types/electron';

import { agentColors, agentTypes } from '@/db/schema/agents.schema';

export type AgentColor = (typeof agentColors)[number];

export interface AgentEditorDialogProps {
  /** The agent to edit (required for edit mode) */
  agent?: Agent;
  /** Initial data for pre-filling the form (used in create mode for duplicating) */
  initialData?: AgentInitialData;
  /** Controlled open state (optional - if provided, component is controlled) */
  isOpen?: boolean;
  /** The mode of the editor */
  mode: EditorMode;
  /** Callback when open state changes (optional - for controlled mode) */
  onOpenChange?: (open: boolean) => void;
  /** Callback when agent is successfully saved */
  onSuccess?: () => void;
  /** Optional project ID for creating project-scoped agents (create mode only) */
  projectId?: number;
  /** The trigger element that opens the dialog (optional when using controlled mode) */
  trigger?: ReactNode;
}

/**
 * Initial data for creating an agent, typically used when duplicating.
 * Differs from Agent in that it doesn't include id, timestamps, or version.
 */
export interface AgentInitialData {
  color?: AgentColor | null;
  description?: string;
  displayName: string;
  extendedThinkingEnabled?: boolean;
  maxThinkingTokens?: null | number;
  name: string;
  systemPrompt: string;
  type: AgentType;
}

export type AgentType = (typeof agentTypes)[number];

export type EditorMode = 'create' | 'edit';

export const AGENT_TYPE_OPTIONS = agentTypes.map((type) => ({
  label: type.charAt(0).toUpperCase() + type.slice(1),
  value: type,
}));

export const MODEL_OPTIONS = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' },
];

export const PERMISSION_MODE_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: "Don't Ask", value: 'dontAsk' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
];
