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

interface ConfirmResetAgentDialogProps {
  /** The agent display name to show in the dialog */
  agentName: string;
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Confirmation dialog for resetting a customized agent to its default configuration.
 * Displays a warning about data loss and requires explicit confirmation.
 *
 * @param props - Component props
 * @param props.agentName - The agent display name to show in the dialog
 * @param props.isLoading - Whether the mutation is in progress
 * @param props.isOpen - Whether the dialog is open (controlled)
 * @param props.onConfirm - Callback when the user confirms the action
 * @param props.onOpenChange - Callback when the dialog open state changes
 */
export const ConfirmResetAgentDialog = ({
  agentName,
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
}: ConfirmResetAgentDialogProps) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'alertdialog'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={'confirm-reset-title'}>{'Reset Agent'}</DialogTitle>
            <DialogDescription id={'confirm-reset-description'}>
              {`Are you sure you want to reset "${agentName}" to its default configuration?`}
            </DialogDescription>
          </DialogHeader>

          {/* Warning */}
          <div
            aria-live={'polite'}
            className={'mt-4 rounded-md border border-warning-border bg-warning-bg p-3'}
            role={'alert'}
          >
            <p className={'text-sm text-warning-text'}>
              This will discard all your customizations including display name, description, system prompt, and color.
              This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button disabled={isLoading} variant={'outline'}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              aria-describedby={'confirm-reset-description'}
              aria-label={`Reset ${agentName} agent to default`}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={'destructive'}
            >
              {isLoading ? 'Resetting...' : 'Reset to Default'}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
