'use client';

import { useMemo } from 'react';

import type { Agent } from '@/types/electron';

export interface AgentEditorDerivedFlags {
  /** Whether the agent is a built-in agent */
  isBuiltIn: boolean;
  /** Whether collapsible sections should be disabled */
  isCollapsibleDisabled: boolean;
  /** Whether the agent has been customized from a parent */
  isCustomized: boolean;
  /** Whether we're duplicating an existing agent */
  isDuplicateMode: boolean;
  /** Whether we're editing an existing agent (with valid agent data) */
  isEditAgent: boolean;
  /** Whether we're in edit mode */
  isEditMode: boolean;
  /** Whether the move mutation is in progress */
  isMoving: boolean;
  /** Whether the agent is scoped to a project (create mode only) */
  isProjectScoped: boolean;
  /** Whether the project selector should be disabled */
  isProjectSelectorDisabled: boolean;
  /** Whether the reset button should be visible */
  isResetButtonVisible: boolean;
  /** Whether the reset mutation is in progress */
  isResetting: boolean;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Whether we're in view-only mode (built-in, non-customized agents) */
  isViewMode: boolean;
}

type EditorMode = 'create' | 'edit';

interface UseAgentEditorStateOptions {
  /** The agent being edited (required for edit mode) */
  agent?: Agent;
  /** Initial data for pre-filling the form (used for duplicating) */
  hasInitialData: boolean;
  /** Whether the create agent mutation is pending */
  isCreatePending: boolean;
  /** Whether the move agent mutation is pending */
  isMovePending: boolean;
  /** Whether the reset agent mutation is pending */
  isResetPending: boolean;
  /** Whether the update agent mutation is pending */
  isUpdatePending: boolean;
  /** The current mode of the editor */
  mode: EditorMode;
  /** Optional project ID for project-scoped agents */
  projectId?: number;
}

/**
 * Hook for deriving state flags from agent editor props and mutation states.
 * Provides memoized boolean flags used throughout the agent editor dialog.
 *
 * @param options - Configuration options for the hook
 * @returns Memoized derived state flags
 */
export const useAgentEditorState = ({
  agent,
  hasInitialData,
  isCreatePending,
  isMovePending,
  isResetPending,
  isUpdatePending,
  mode,
  projectId,
}: UseAgentEditorStateOptions): AgentEditorDerivedFlags => {
  return useMemo(() => {
    const isSubmitting = isCreatePending || isUpdatePending;
    const isMoving = isMovePending;
    const isResetting = isResetPending;
    const isEditMode = mode === 'edit';
    const isBuiltIn = agent?.builtInAt !== null;
    const isCustomized = agent?.parentAgentId !== null;
    const isDuplicateMode = mode === 'create' && hasInitialData;
    const isProjectScoped = !isEditMode && projectId !== undefined;
    // View-only mode for built-in agents in edit mode
    const isViewMode = isEditMode && isBuiltIn && !isCustomized;
    // Show reset button only for customized agents in edit mode, but not in view mode
    const isResetButtonVisible = isEditMode && isCustomized && !isViewMode;
    // Disabled state for project selector
    const isProjectSelectorDisabled = isEditMode
      ? isSubmitting || isResetting || isMoving || isViewMode
      : isSubmitting || isResetting;
    // Check if we're in edit mode with a valid agent
    const isEditAgent = isEditMode && agent !== undefined;
    // Disabled state for collapsible sections
    const isCollapsibleDisabled = isSubmitting || isResetting || isViewMode;

    return {
      isBuiltIn,
      isCollapsibleDisabled,
      isCustomized,
      isDuplicateMode,
      isEditAgent,
      isEditMode,
      isMoving,
      isProjectScoped,
      isProjectSelectorDisabled,
      isResetButtonVisible,
      isResetting,
      isSubmitting,
      isViewMode,
    };
  }, [
    agent,
    hasInitialData,
    isCreatePending,
    isMovePending,
    isResetPending,
    isUpdatePending,
    mode,
    projectId,
  ]);
};
