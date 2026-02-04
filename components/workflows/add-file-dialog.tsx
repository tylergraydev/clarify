'use client';

import type { ReactNode } from 'react';

import { useState } from 'react';

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
  DialogTrigger,
} from '@/components/ui/dialog';
import { fileActions, filePriorities } from '@/db/schema/discovered-files.schema';
import { useAddDiscoveredFile } from '@/hooks/queries/use-discovered-files';
import { useToast } from '@/hooks/use-toast';
import { useAppForm } from '@/lib/forms/form-hook';
import { addDiscoveredFileSchema } from '@/lib/validations/discovered-file';

interface AddFileDialogProps {
  /** Callback when open state changes (required when using controlled mode) */
  onOpenChange?: (isOpen: boolean) => void;
  /** Callback when file is successfully added */
  onSuccess?: () => void;
  /** Controlled open state (optional - if provided, dialog becomes controlled) */
  open?: boolean;
  /** The workflow step ID to add the file to */
  stepId: number;
  /** The trigger element that opens the dialog (optional when using controlled mode) */
  trigger?: ReactNode;
}

const priorityOptions = filePriorities.map((priority) => ({
  label: priority.charAt(0).toUpperCase() + priority.slice(1),
  value: priority,
}));

const actionOptions = fileActions.map((action) => ({
  label: action.charAt(0).toUpperCase() + action.slice(1),
  value: action,
}));

export const AddFileDialog = ({ onOpenChange, onSuccess, open, stepId, trigger }: AddFileDialogProps) => {
  const [isInternalOpen, setIsInternalOpen] = useState(false);

  // Determine if dialog is controlled or uncontrolled
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : isInternalOpen;

  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setIsInternalOpen(value);
    }
  };

  const toast = useToast();
  const addFileMutation = useAddDiscoveredFile();

  const isSubmitting = addFileMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      action: 'modify' as (typeof fileActions)[number],
      filePath: '',
      priority: 'medium' as (typeof filePriorities)[number],
      relevanceExplanation: '',
      role: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await addFileMutation.mutateAsync({
          data: {
            action: value.action,
            filePath: value.filePath,
            priority: value.priority,
            relevanceExplanation: value.relevanceExplanation || null,
            role: value.role || null,
            workflowStepId: stepId,
          },
          stepId,
        });

        toast.success({
          description: 'File has been added to the discovery list.',
          title: 'File Added',
        });

        handleClose();
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add file. Please try again.';
        toast.error({
          description: message,
          title: 'Error',
        });
      }
    },
    validators: {
      onSubmit: addDiscoveredFileSchema,
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const handleOpenChangeInternal = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <DialogRoot onOpenChange={handleOpenChangeInternal} open={isOpen}>
      {/* Trigger (only rendered when provided) */}
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup size={'lg'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>Add File</DialogTitle>
            <DialogDescription>Manually add a file to the discovery list.</DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form
            className={'mt-6'}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className={'flex flex-col gap-4'}>
              {/* File Path Field */}
              <form.AppField name={'filePath'}>
                {(field) => (
                  <field.TextField
                    autoFocus
                    description={'Enter the file path relative to the repository root'}
                    isDisabled={isSubmitting}
                    isRequired
                    label={'File Path'}
                    placeholder={'src/components/example.tsx'}
                  />
                )}
              </form.AppField>

              {/* Priority Field */}
              <form.AppField name={'priority'}>
                {(field) => (
                  <field.SelectField
                    description={'Set the priority level for this file'}
                    isDisabled={isSubmitting}
                    label={'Priority'}
                    options={priorityOptions}
                    placeholder={'Select priority'}
                  />
                )}
              </form.AppField>

              {/* Action Field */}
              <form.AppField name={'action'}>
                {(field) => (
                  <field.SelectField
                    description={'The intended action for this file'}
                    isDisabled={isSubmitting}
                    label={'Action'}
                    options={actionOptions}
                    placeholder={'Select action'}
                  />
                )}
              </form.AppField>

              {/* Role Field */}
              <form.AppField name={'role'}>
                {(field) => (
                  <field.TextareaField
                    description={'Describe the role this file plays in the feature'}
                    isDisabled={isSubmitting}
                    isRequired
                    label={'Role'}
                    placeholder={'Describe the role of this file...'}
                    rows={3}
                  />
                )}
              </form.AppField>

              {/* Relevance Explanation Field */}
              <form.AppField name={'relevanceExplanation'}>
                {(field) => (
                  <field.TextareaField
                    description={'Explain why this file is relevant to the feature'}
                    isDisabled={isSubmitting}
                    isRequired
                    label={'Relevance Explanation'}
                    placeholder={'Explain why this file is relevant...'}
                    rows={3}
                  />
                )}
              </form.AppField>
            </div>

            {/* Action Buttons */}
            <DialogFooter sticky={false}>
              <DialogClose>
                <Button disabled={isSubmitting} type={'button'} variant={'outline'}>
                  Cancel
                </Button>
              </DialogClose>
              <form.AppForm>
                <form.SubmitButton>{isSubmitting ? 'Adding...' : 'Add File'}</form.SubmitButton>
              </form.AppForm>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
