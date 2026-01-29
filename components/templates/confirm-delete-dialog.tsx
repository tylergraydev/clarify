'use client';

import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDeleteDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The template name to display in the dialog */
  templateName: string;
  /** The template usage count to display a warning if > 0 */
  usageCount: number;
}

export const ConfirmDeleteDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  templateName,
  usageCount,
}: ConfirmDeleteDialogProps) => {
  const hasUsage = usageCount > 0;

  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={"true"} role={"alertdialog"}>
          {/* Header */}
          <DialogTitle id={"confirm-delete-title"}>{'Delete Template'}</DialogTitle>
          <DialogDescription id={"confirm-delete-description"}>
            {`Are you sure you want to delete "${templateName}"? This action cannot be undone.`}
          </DialogDescription>

          {/* Usage Warning */}
          {hasUsage && (
            <div
              aria-live={"polite"}
              className={
                'mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30'
              }
              role={"alert"}
            >
              <p className={'text-sm text-amber-800 dark:text-amber-200'}>
                {`This template has been used ${usageCount} ${usageCount === 1 ? 'time' : 'times'}. Deleting it will not affect existing workflows that used this template.`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div aria-label={"Confirm deletion actions"} className={'mt-6 flex justify-end gap-3'} role={"group"}>
            <DialogClose>
              <Button disabled={isLoading} variant={'outline'}>
                {'Cancel'}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={"confirm-delete-description"}
              aria-label={`Delete ${templateName} template permanently`}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={'destructive'}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
