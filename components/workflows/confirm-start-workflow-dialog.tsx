'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmStartWorkflowDialogProps {
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

export const ConfirmStartWorkflowDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  workflowFeatureName,
}: ConfirmStartWorkflowDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const title = 'Start Workflow';
  const description = `Are you sure you want to start "${workflowFeatureName}"? This will begin the workflow execution process.`;
  const confirmButtonLabel = `Start ${workflowFeatureName} workflow`;

  return (
    <ConfirmActionDialog
      confirmAriaDescribedById={'confirm-start-workflow-description'}
      confirmAriaLabel={confirmButtonLabel}
      confirmLabel={'Start Workflow'}
      confirmVariant={'default'}
      description={description}
      descriptionId={'confirm-start-workflow-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Starting...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={title}
      titleId={'confirm-start-workflow-title'}
    />
  );
};
