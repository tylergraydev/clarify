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

interface ConfirmDeleteTemplateDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The template display name to show in the dialog */
  templateName: string;
}

export const ConfirmDeleteTemplateDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  templateName,
}: ConfirmDeleteTemplateDialogProps) => {
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
            <DialogTitle id={'confirm-delete-template-title'}>Delete Template</DialogTitle>
            <DialogDescription id={'confirm-delete-template-description'}>
              {`Are you sure you want to delete "${templateName}"?`}
            </DialogDescription>
          </DialogHeader>

          {/* Warning */}
          <div
            aria-live={'polite'}
            className={'mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3'}
            role={'alert'}
          >
            <p className={'text-sm text-destructive'}>
              This action is permanent and cannot be undone. The template and all its configuration will be permanently
              removed.
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
              aria-describedby={'confirm-delete-template-description'}
              aria-label={`Delete ${templateName} template permanently`}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={'destructive'}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
