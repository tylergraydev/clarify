'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmCancelWorkflowDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The workflow feature name to show in the dialog */
  workflowFeatureName: string;
}

export const ConfirmCancelWorkflowDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  workflowFeatureName,
}: ConfirmCancelWorkflowDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const title = 'Cancel Workflow';
  const description = `Are you sure you want to cancel "${workflowFeatureName}"? This action cannot be undone and all progress will be stopped.`;
  const confirmButtonLabel = `Cancel ${workflowFeatureName} workflow`;

  return (
    <ConfirmActionDialog
      cancelLabel={'Keep Running'}
      confirmAriaDescribedById={'confirm-cancel-workflow-description'}
      confirmAriaLabel={confirmButtonLabel}
      confirmLabel={'Cancel Workflow'}
      description={description}
      descriptionId={'confirm-cancel-workflow-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Cancelling...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={title}
      titleId={'confirm-cancel-workflow-title'}
    />
  );
};
