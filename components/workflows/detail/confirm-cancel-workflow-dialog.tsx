'use client';

import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';

interface ConfirmCancelWorkflowDialogProps {
  /** The workflow feature name to display in the dialog */
  featureName: string;
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
}

export const ConfirmCancelWorkflowDialog = ({
  featureName,
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
}: ConfirmCancelWorkflowDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <ConfirmActionDialog
      alerts={[
        {
          containerClassName: 'dark:border-warning-border dark:bg-warning-bg',
          description:
            'The workflow will be stopped and marked as cancelled. Completed steps will be preserved.',
          tone: 'warning',
        },
      ]}
      confirmAriaDescribedById={'confirm-cancel-workflow-description'}
      confirmAriaLabel={`Cancel ${featureName} workflow`}
      confirmLabel={'Cancel Workflow'}
      description={`Are you sure you want to cancel "${featureName}"?`}
      descriptionId={'confirm-cancel-workflow-description'}
      isLoading={isLoading}
      isOpen={isOpen}
      loadingLabel={'Cancelling...'}
      onConfirm={handleConfirmClick}
      onOpenChange={onOpenChange}
      title={'Cancel Workflow'}
      titleId={'confirm-cancel-workflow-title'}
    />
  );
};
