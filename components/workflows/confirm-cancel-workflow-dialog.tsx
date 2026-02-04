'use client';

import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const title = 'Cancel Workflow';
  const description = `Are you sure you want to cancel "${workflowFeatureName}"? This action cannot be undone and all progress will be stopped.`;
  const confirmButtonText = 'Cancel Workflow';

  const handleConfirmClick = () => {
    onConfirm();
  };

  const confirmButtonLabel = `Cancel ${workflowFeatureName} workflow`;

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'alertdialog'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={'confirm-cancel-workflow-title'}>{title}</DialogTitle>
            <DialogDescription id={'confirm-cancel-workflow-description'}>{description}</DialogDescription>
          </DialogHeader>

          {/* Actions */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button disabled={isLoading} variant={'outline'}>
                {'Keep Running'}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={'confirm-cancel-workflow-description'}
              aria-label={confirmButtonLabel}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={'destructive'}
            >
              {isLoading ? 'Cancelling...' : confirmButtonText}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
