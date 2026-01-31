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

interface ConfirmDiscardDialogProps {
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Confirmation dialog for discarding unsaved changes.
 * Displays a warning and requires explicit confirmation before discarding.
 *
 * @param props - Component props
 * @param props.isOpen - Whether the dialog is open (controlled)
 * @param props.onConfirm - Callback when the user confirms the action
 * @param props.onOpenChange - Callback when the dialog open state changes
 */
export const ConfirmDiscardDialog = ({ isOpen, onConfirm, onOpenChange }: ConfirmDiscardDialogProps) => {
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
            <DialogTitle id={'confirm-discard-title'}>{'Discard changes?'}</DialogTitle>
            <DialogDescription id={'confirm-discard-description'}>
              {'You have unsaved changes that will be lost if you close this dialog.'}
            </DialogDescription>
          </DialogHeader>

          {/* Actions */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button variant={'outline'}>{'Keep editing'}</Button>
            </DialogClose>
            <Button
              aria-describedby={'confirm-discard-description'}
              aria-label={'Discard unsaved changes'}
              onClick={handleConfirmClick}
              variant={'destructive'}
            >
              {'Discard'}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
