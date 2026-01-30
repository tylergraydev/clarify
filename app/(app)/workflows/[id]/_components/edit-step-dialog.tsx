'use client';

import { useState } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import { useEditStep } from '@/hooks/queries/use-steps';

interface EditStepDialogProps {
  /** Current output text to edit */
  currentOutput: null | string;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Original output for reference (if previously edited) */
  originalOutput?: null | string;
  /** Step ID to edit */
  stepId: number;
  /** Step title for display */
  stepTitle: string;
}

export const EditStepDialog = ({
  currentOutput,
  isOpen,
  onOpenChange,
  originalOutput,
  stepId,
  stepTitle,
}: EditStepDialogProps) => {
  const [editedOutput, setEditedOutput] = useState(currentOutput ?? '');
  const editStepMutation = useEditStep();

  const isSubmitting = editStepMutation.isPending;
  const hasChanges = editedOutput !== (currentOutput ?? '');

  const handleSave = () => {
    editStepMutation.mutate(
      { editedOutput, id: stepId },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset to current output when closing
      setEditedOutput(currentOutput ?? '');
    }
    onOpenChange(open);
  };

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'max-w-2xl'}>
          {/* Header */}
          <DialogTitle>{'Edit Step Output'}</DialogTitle>
          <DialogDescription>
            {`Modify the output for "${stepTitle}". This will update the step's output and mark it as edited.`}
          </DialogDescription>

          {/* Content */}
          <div className={'mt-4 flex flex-col gap-4'}>
            {/* Current/Edited Output */}
            <div className={'flex flex-col gap-2'}>
              <label className={'text-sm font-medium'} htmlFor={'edited-output'}>
                {'Output'}
              </label>
              <Textarea
                className={'min-h-[200px] font-mono text-sm'}
                id={'edited-output'}
                onChange={(e) => setEditedOutput(e.target.value)}
                placeholder={'Enter the edited output...'}
                value={editedOutput}
              />
            </div>

            {/* Original Output Reference */}
            {originalOutput && (
              <div className={'flex flex-col gap-2'}>
                <span className={'text-sm font-medium text-muted-foreground'}>{'Original Output (Reference)'}</span>
                <div
                  className={
                    'max-h-32 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap'
                  }
                >
                  {originalOutput}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={'mt-6 flex justify-end gap-3'}>
            <DialogClose>
              <Button disabled={isSubmitting} variant={'outline'}>
                {'Cancel'}
              </Button>
            </DialogClose>
            <Button disabled={isSubmitting || !hasChanges} onClick={handleSave}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
