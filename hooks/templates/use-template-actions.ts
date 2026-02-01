'use client';

import { useCallback, useMemo } from 'react';

import type { Template } from '@/types/electron';

import { useCreateTemplate, useDeleteTemplate, useUpdateTemplate } from '@/hooks/queries/use-templates';

// ============================================================================
// Types
// ============================================================================

/**
 * Consolidated loading state for all template mutations.
 */
export interface TemplateActionsLoadingState {
  /** Whether delete operation is pending */
  isDeleting: boolean;
  /** Whether duplicate operation is pending */
  isDuplicating: boolean;
  /** Whether activate/deactivate operation is pending */
  isToggling: boolean;
}

/**
 * Options for the useTemplateActions hook.
 */
export interface UseTemplateActionsOptions {
  /** Callback to close the delete dialog */
  onCloseDeleteDialog: () => void;
  /** Callback to open the delete dialog */
  onOpenDeleteDialog: (template: Template) => void;
  /** Array of all templates for lookup purposes */
  templates: Array<Template> | undefined;
}

/**
 * Return type for the useTemplateActions hook.
 */
export interface UseTemplateActionsReturn {
  /** Consolidated loading states for all mutations */
  loadingState: TemplateActionsLoadingState;
  /** Handle clicking delete (opens dialog) */
  onDeleteClick: (templateId: number) => void;
  /** Handle confirming delete */
  onDeleteConfirm: (template: null | Template) => void;
  /** Handle duplicating a template */
  onDuplicate: (template: Template) => void;
  /** Handle toggling template active state */
  onToggleActive: (templateId: number, isActive: boolean) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing template action handlers and mutations.
 *
 * Consolidates all template mutation hooks and provides stable action handlers
 * with a unified loading state object.
 *
 * @param options - Options including templates array and dialog callbacks
 * @returns Action handlers and loading state
 *
 * @example
 * ```tsx
 * const {
 *   loadingState,
 *   onToggleActive,
 *   onDuplicate,
 *   onDeleteClick,
 *   onDeleteConfirm,
 * } = useTemplateActions({
 *   templates: allTemplates,
 *   onOpenDeleteDialog: (template) => dispatchDialog({ type: 'OPEN_DELETE', template }),
 *   onCloseDeleteDialog: () => dispatchDialog({ type: 'CLOSE_DELETE_DIALOG' }),
 * });
 * ```
 */
export const useTemplateActions = ({
  onCloseDeleteDialog,
  onOpenDeleteDialog,
  templates,
}: UseTemplateActionsOptions): UseTemplateActionsReturn => {
  // Mutations
  const createMutation = useCreateTemplate();
  const deleteMutation = useDeleteTemplate();
  const updateMutation = useUpdateTemplate();

  // Toggle active handler - uses update mutation to set/clear deactivatedAt
  const handleToggleActive = useCallback(
    (templateId: number, isActive: boolean) => {
      updateMutation.mutate({
        data: {
          deactivatedAt: isActive ? null : new Date().toISOString(),
        },
        id: templateId,
      });
    },
    [updateMutation]
  );

  // Duplicate handler - creates a copy of the template with a new name
  const handleDuplicate = useCallback(
    (template: Template) => {
      createMutation.mutate({
        category: template.category,
        description: template.description,
        name: `${template.name} (Copy)`,
        templateText: template.templateText,
      });
    },
    [createMutation]
  );

  // Delete click handler (opens dialog)
  const handleDeleteClick = useCallback(
    (templateId: number) => {
      const template = templates?.find((t) => t.id === templateId);
      if (template) {
        onOpenDeleteDialog(template);
      }
    },
    [templates, onOpenDeleteDialog]
  );

  // Delete confirm handler
  const handleDeleteConfirm = useCallback(
    (templateToDelete: null | Template) => {
      if (templateToDelete) {
        deleteMutation.mutate(templateToDelete.id, {
          onSettled: () => {
            onCloseDeleteDialog();
          },
        });
      }
    },
    [deleteMutation, onCloseDeleteDialog]
  );

  // Consolidated loading state
  const loadingState = useMemo<TemplateActionsLoadingState>(
    () => ({
      isDeleting: deleteMutation.isPending,
      isDuplicating: createMutation.isPending,
      isToggling: updateMutation.isPending,
    }),
    [createMutation.isPending, deleteMutation.isPending, updateMutation.isPending]
  );

  return {
    loadingState,
    onDeleteClick: handleDeleteClick,
    onDeleteConfirm: handleDeleteConfirm,
    onDuplicate: handleDuplicate,
    onToggleActive: handleToggleActive,
  };
};
