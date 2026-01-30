"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConfirmArchiveDialogProps {
  /** Whether the project is currently archived (determines action direction) */
  isArchived: boolean;
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** The project name to display in the dialog */
  projectName: string;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

export const ConfirmArchiveDialog = ({
  isArchived,
  isLoading = false,
  onConfirm,
  projectName,
  trigger,
}: ConfirmArchiveDialogProps) => {
  const title = isArchived ? "Unarchive Project" : "Archive Project";
  const description = isArchived
    ? `Are you sure you want to unarchive "${projectName}"? The project will be restored to your active projects list.`
    : `Are you sure you want to archive "${projectName}"? Archived projects can be restored later.`;
  const confirmButtonText = isArchived ? "Unarchive" : "Archive";

  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <DialogRoot>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          {/* Header */}
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>

          {/* Actions */}
          <div className={"mt-6 flex justify-end gap-3"}>
            <DialogClose>
              <Button disabled={isLoading} variant={"outline"}>
                {"Cancel"}
              </Button>
            </DialogClose>
            <Button
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={"destructive"}
            >
              {isLoading ? "Processing..." : confirmButtonText}
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
