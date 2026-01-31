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

interface ConfirmArchiveDialogBaseProps {
  /** Whether the project is currently archived (determines action direction) */
  isArchived: boolean;
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** The project name to display in the dialog */
  projectName: string;
}

interface ConfirmArchiveDialogProps extends ConfirmArchiveDialogBaseProps {
  /** Controlled open state */
  isOpen: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Trigger - not used in controlled mode */
  trigger?: never;
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

  // Controlled mode (no trigger)
  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal - stopPropagation on backdrop and popup prevents clicks from bubbling to table row */}
      <DialogPortal>
        <DialogBackdrop onClick={(e) => e.stopPropagation()} />
        <DialogPopup onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {/* Actions */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button disabled={isLoading} variant={'outline'}>
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={isLoading} onClick={handleConfirmClick} variant={'destructive'}>
              {isLoading ? 'Processing...' : confirmButtonText}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
