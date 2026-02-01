'use client';

import { Fragment } from 'react';

import type { Template } from '@/db/schema';

import { ConfirmDeleteTemplateDialog } from '@/components/templates/confirm-delete-template-dialog';

// ============================================================================
// Types
// ============================================================================

interface TemplatesDialogsProps {
  /** Delete dialog state */
  deleteDialog: {
    isOpen: boolean;
    template: null | Template;
  };
  /** Whether delete operation is in progress */
  isDeleting: boolean;
  /** Callback when delete is confirmed */
  onDeleteConfirm: () => void;
  /** Callback when delete dialog open state changes */
  onDeleteDialogOpenChange: (isOpen: boolean) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Container component for all template-related dialogs.
 *
 * Renders:
 * - ConfirmDeleteTemplateDialog for delete confirmation
 *
 * @example
 * ```tsx
 * <TemplatesDialogs
 *   deleteDialog={dialogState.delete}
 *   isDeleting={isDeleting}
 *   onDeleteConfirm={handleDeleteConfirm}
 *   onDeleteDialogOpenChange={handleDeleteDialogOpenChange}
 * />
 * ```
 */
export const TemplatesDialogs = ({
  deleteDialog,
  isDeleting,
  onDeleteConfirm,
  onDeleteDialogOpenChange,
}: TemplatesDialogsProps) => {
  return (
    <Fragment>
      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteTemplateDialog
        isLoading={isDeleting}
        isOpen={deleteDialog.isOpen}
        onConfirm={onDeleteConfirm}
        onOpenChange={onDeleteDialogOpenChange}
        templateName={deleteDialog.template?.name ?? ''}
      />
    </Fragment>
  );
};
