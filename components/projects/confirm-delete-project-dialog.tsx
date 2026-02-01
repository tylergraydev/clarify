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

interface ConfirmDeleteProjectDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The project display name to show in the dialog */
  projectName: string;
}

export const ConfirmDeleteProjectDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  projectName,
}: ConfirmDeleteProjectDialogProps) => {
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
            <DialogTitle id={'confirm-delete-project-title'}>{'Delete Project'}</DialogTitle>
            <DialogDescription id={'confirm-delete-project-description'}>
              {`Are you sure you want to delete "${projectName}"?`}
            </DialogDescription>
          </DialogHeader>

          {/* Warning */}
          <div
            aria-live={'polite'}
            className={'mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3'}
            role={'alert'}
          >
            <p className={'text-sm text-destructive'}>
              This action is permanent and cannot be undone. The project and all its data (repositories, workflows, and
              agents) will be permanently removed.
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
              aria-describedby={'confirm-delete-project-description'}
              aria-label={`Delete ${projectName} project permanently`}
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
