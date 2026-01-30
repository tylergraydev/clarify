"use client";

import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmCancelDialogProps {
  /** Whether the cancel mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the cancellation */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The workflow name to display in the dialog */
  workflowName: string;
}

export const ConfirmCancelDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  workflowName,
}: ConfirmCancelDialogProps) => {
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
          <DialogTitle id={"confirm-cancel-title"}>
            {"Cancel Workflow"}
          </DialogTitle>
          <DialogDescription id={"confirm-cancel-description"}>
            {`Are you sure you want to cancel "${workflowName}"? This action cannot be undone and all progress will be lost.`}
          </DialogDescription>

          {/* Actions */}
          <div
            aria-label={"Confirm cancellation actions"}
            className={"mt-6 flex justify-end gap-3"}
            role={"group"}
          >
            <DialogClose>
              <Button disabled={isLoading} variant={"outline"}>
                {"Keep Running"}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={"confirm-cancel-description"}
              aria-label={`Cancel ${workflowName} workflow permanently`}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={"destructive"}
            >
              {isLoading ? "Cancelling..." : "Cancel Workflow"}
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
