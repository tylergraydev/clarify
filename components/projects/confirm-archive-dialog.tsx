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

interface ConfirmArchiveDialogProps {
  /** Whether the project is currently archived (determines action direction) */
  isArchived: boolean;
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

export const ConfirmArchiveDialog = ({
  isArchived,
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  projectName,
}: ConfirmArchiveDialogProps) => {
  const title = isArchived ? 'Unarchive Project' : 'Archive Project';
  const description = isArchived
    ? `Are you sure you want to unarchive "${projectName}"? The project will be restored to your active projects list.`
    : `Are you sure you want to archive "${projectName}"? Archived projects can be restored later.`;
  const confirmButtonText = isArchived ? 'Unarchive' : 'Archive';

  const handleConfirmClick = () => {
    onConfirm();
  };

  const confirmButtonLabel = isArchived
    ? `Unarchive ${projectName} project`
    : `Archive ${projectName} project`;

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'alertdialog'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={'confirm-archive-project-title'}>{title}</DialogTitle>
            <DialogDescription id={'confirm-archive-project-description'}>{description}</DialogDescription>
          </DialogHeader>

          {/* Actions */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button disabled={isLoading} variant={'outline'}>
                {'Cancel'}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={'confirm-archive-project-description'}
              aria-label={confirmButtonLabel}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={'default'}
            >
              {isLoading ? 'Processing...' : confirmButtonText}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
