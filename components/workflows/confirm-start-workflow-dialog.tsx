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
  const title = 'Start Workflow';
  const description = `Are you sure you want to start "${workflowFeatureName}"? This will begin the workflow execution process.`;
  const confirmButtonText = 'Start Workflow';

  const handleConfirmClick = () => {
    onConfirm();
  };

  const confirmButtonLabel = `Start ${workflowFeatureName} workflow`;

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'alertdialog'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={'confirm-start-workflow-title'}>{title}</DialogTitle>
            <DialogDescription id={'confirm-start-workflow-description'}>{description}</DialogDescription>
          </DialogHeader>

          {/* Actions */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button disabled={isLoading} variant={'outline'}>
                {'Cancel'}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={'confirm-start-workflow-description'}
              aria-label={confirmButtonLabel}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={'default'}
            >
              {isLoading ? 'Starting...' : confirmButtonText}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
