'use client';

import { useCallback, useMemo } from 'react';

import type { AgentWithRelations } from '@/components/agents/agent-table';

import {
  useActivateAgent,
  useCopyAgentToProject,
  useDeactivateAgent,
  useDeleteAgent,
  useDuplicateAgent,
  useMoveAgent,
  useResetAgent,
} from '@/hooks/queries/use-agents';

// ============================================================================
// Types
// ============================================================================

/**
 * Consolidated loading state for all agent mutations.
 */
export interface AgentActionsLoadingState {
  /** Whether copy to project operation is pending */
  isCopyingToProject: boolean;
  /** Whether delete operation is pending */
  isDeleting: boolean;
  /** Whether duplicate operation is pending */
  isDuplicating: boolean;
  /** Whether move operation is pending */
  isMovingToProject: boolean;
  /** Whether reset operation is pending */
  isResetting: boolean;
  /** Whether activate/deactivate operation is pending */
  isToggling: boolean;
}

/**
 * Options for the useAgentActions hook.
 */
export interface UseAgentActionsOptions {
  /** Array of all agents for lookup purposes */
  agents: Array<AgentWithRelations> | undefined;
  /** Callback to close the delete dialog */
  onCloseDeleteDialog: () => void;
  /** Callback to close the project dialog */
  onCloseProjectDialog: () => void;
  /** Callback to open the project dialog for copy action */
  onOpenCopyDialog: (agent: AgentWithRelations) => void;
  /** Callback to open the delete dialog */
  onOpenDeleteDialog: (agent: AgentWithRelations) => void;
  /** Callback to open the project dialog for move action */
  onOpenMoveDialog: (agent: AgentWithRelations) => void;
}

/**
 * Return type for the useAgentActions hook.
 */
export interface UseAgentActionsReturn {
  /** Consolidated loading states for all mutations */
  loadingState: AgentActionsLoadingState;
  /** Handle copying an agent to another project */
  onCopyToProject: (agent: AgentWithRelations) => void;
  /** Handle clicking delete (opens dialog) */
  onDeleteClick: (agentId: number) => void;
  /** Handle confirming delete */
  onDeleteConfirm: (agent: AgentWithRelations | null) => void;
  /** Handle duplicating an agent */
  onDuplicate: (agent: AgentWithRelations) => void;
  /** Handle moving an agent to another project */
  onMoveToProject: (agent: AgentWithRelations) => void;
  /** Handle selecting a project in the project dialog */
  onProjectDialogSelect: (
    agent: AgentWithRelations | null,
    mode: 'copy' | 'move',
    targetProjectId: null | number
  ) => void;
  /** Handle resetting an agent to defaults */
  onReset: (agentId: number) => void;
  /** Handle toggling agent active state */
  onToggleActive: (agentId: number, isActive: boolean) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing agent action handlers and mutations.
 *
 * Consolidates all agent mutation hooks and provides stable action handlers
 * with a unified loading state object.
 *
 * @param options - Options including agents array and dialog callbacks
 * @returns Action handlers and loading state
 *
 * @example
 * ```tsx
 * const {
 *   loadingState,
 *   onToggleActive,
 *   onDuplicate,
 *   onReset,
 *   onDeleteClick,
 *   onDeleteConfirm,
 *   onMoveToProject,
 *   onCopyToProject,
 *   onProjectDialogSelect,
 * } = useAgentActions({
 *   agents: allAgents,
 *   onOpenDeleteDialog,
 *   onCloseDeleteDialog: () => dispatchDialog({ type: 'CLOSE_DELETE_DIALOG' }),
 *   onOpenMoveDialog: (agent) => dispatchDialog({ ... }),
 *   onOpenCopyDialog: (agent) => dispatchDialog({ ... }),
 *   onCloseProjectDialog: () => dispatchDialog({ type: 'CLOSE_PROJECT_DIALOG' }),
 * });
 * ```
 */
export const useAgentActions = ({
  agents,
  onCloseDeleteDialog,
  onCloseProjectDialog,
  onOpenCopyDialog,
  onOpenDeleteDialog,
  onOpenMoveDialog,
}: UseAgentActionsOptions): UseAgentActionsReturn => {
  // Mutations
  const activateMutation = useActivateAgent();
  const copyToProjectMutation = useCopyAgentToProject();
  const deactivateMutation = useDeactivateAgent();
  const deleteMutation = useDeleteAgent();
  const duplicateMutation = useDuplicateAgent();
  const moveAgentMutation = useMoveAgent();
  const resetMutation = useResetAgent();

  // Toggle active handler
  const handleToggleActive = useCallback(
    (agentId: number, isActive: boolean) => {
      if (isActive) {
        activateMutation.mutate(agentId);
      } else {
        deactivateMutation.mutate(agentId);
      }
    },
    [activateMutation, deactivateMutation]
  );

  // Duplicate handler
  const handleDuplicate = useCallback(
    (agent: AgentWithRelations) => {
      duplicateMutation.mutate(agent.id);
    },
    [duplicateMutation]
  );

  // Reset handler
  const handleReset = useCallback(
    (agentId: number) => {
      const agent = agents?.find((a) => a.id === agentId);
      resetMutation.mutate({
        id: agentId,
        projectId: agent?.projectId ?? undefined,
      });
    },
    [agents, resetMutation]
  );

  // Delete click handler (opens dialog)
  const handleDeleteClick = useCallback(
    (agentId: number) => {
      const agent = agents?.find((a) => a.id === agentId);
      if (agent) {
        onOpenDeleteDialog(agent);
      }
    },
    [agents, onOpenDeleteDialog]
  );

  // Delete confirm handler
  const handleDeleteConfirm = useCallback(
    (agentToDelete: AgentWithRelations | null) => {
      if (agentToDelete) {
        deleteMutation.mutate(
          { id: agentToDelete.id, projectId: agentToDelete.projectId ?? undefined },
          {
            onSettled: () => {
              onCloseDeleteDialog();
            },
          }
        );
      }
    },
    [deleteMutation, onCloseDeleteDialog]
  );

  // Move to project handler (opens dialog)
  const handleMoveToProject = useCallback(
    (agent: AgentWithRelations) => {
      onOpenMoveDialog(agent);
    },
    [onOpenMoveDialog]
  );

  // Copy to project handler (opens dialog)
  const handleCopyToProject = useCallback(
    (agent: AgentWithRelations) => {
      onOpenCopyDialog(agent);
    },
    [onOpenCopyDialog]
  );

  // Project dialog select handler
  const handleProjectDialogSelect = useCallback(
    (agent: AgentWithRelations | null, mode: 'copy' | 'move', targetProjectId: null | number) => {
      if (!agent) return;

      if (mode === 'move') {
        moveAgentMutation.mutate({ agentId: agent.id, targetProjectId }, { onSettled: onCloseProjectDialog });
      } else {
        // Copy mode - targetProjectId cannot be null for copy
        if (targetProjectId !== null) {
          copyToProjectMutation.mutate({ agentId: agent.id, targetProjectId }, { onSettled: onCloseProjectDialog });
        }
      }
    },
    [copyToProjectMutation, moveAgentMutation, onCloseProjectDialog]
  );

  // Consolidated loading state
  const loadingState = useMemo<AgentActionsLoadingState>(
    () => ({
      isCopyingToProject: copyToProjectMutation.isPending,
      isDeleting: deleteMutation.isPending,
      isDuplicating: duplicateMutation.isPending,
      isMovingToProject: moveAgentMutation.isPending,
      isResetting: resetMutation.isPending,
      isToggling: activateMutation.isPending || deactivateMutation.isPending,
    }),
    [
      activateMutation.isPending,
      copyToProjectMutation.isPending,
      deactivateMutation.isPending,
      deleteMutation.isPending,
      duplicateMutation.isPending,
      moveAgentMutation.isPending,
      resetMutation.isPending,
    ]
  );

  return {
    loadingState,
    onCopyToProject: handleCopyToProject,
    onDeleteClick: handleDeleteClick,
    onDeleteConfirm: handleDeleteConfirm,
    onDuplicate: handleDuplicate,
    onMoveToProject: handleMoveToProject,
    onProjectDialogSelect: handleProjectDialogSelect,
    onReset: handleReset,
    onToggleActive: handleToggleActive,
  };
};
