'use client';

import { useEffect, useState } from 'react';

import type { DiscoveredFile } from '@/db/schema/discovered-files.schema';

import { ConfirmDiscardDialog } from '@/components/agents/confirm-discard-dialog';
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
import { fileActions, filePriorities } from '@/db/schema/discovered-files.schema';
import { useUpdateDiscoveredFile } from '@/hooks/queries/use-discovered-files';
import { useToast } from '@/hooks/use-toast';
import { useAppForm } from '@/lib/forms/form-hook';
import { type EditDiscoveredFileFormValues, editDiscoveredFileSchema } from '@/lib/validations/discovered-file';

interface EditDiscoveredFileDialogProps {
  /** The discovered file to edit */
  file: DiscoveredFile;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Callback when file is successfully updated */
  onSuccess?: () => void;
}

const priorityOptions = filePriorities.map((priority) => ({
  label: priority.charAt(0).toUpperCase() + priority.slice(1),
  value: priority,
}));

const actionOptions = fileActions.map((action) => ({
  label: action.charAt(0).toUpperCase() + action.slice(1),
  value: action,
}));

export const EditDiscoveredFileDialog = ({
  file,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditDiscoveredFileDialogProps) => {
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const toast = useToast();
  const updateFileMutation = useUpdateDiscoveredFile();

  const isSubmitting = updateFileMutation.isPending;

  const defaultValues: EditDiscoveredFileFormValues = {
    action: file.action as (typeof fileActions)[number],
    priority: file.priority as (typeof filePriorities)[number],
    relevanceExplanation: file.relevanceExplanation ?? '',
    role: file.role ?? '',
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await updateFileMutation.mutateAsync({
          data: {
            action: value.action,
            priority: value.priority,
            relevanceExplanation: value.relevanceExplanation || null,
            role: value.role || null,
          },
          id: file.id,
        });

        toast.success({
          description: 'File metadata has been updated successfully.',
          title: 'File Updated',
        });

        handleClose();
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update file. Please try again.';
        toast.error({
          description: message,
          title: 'Error',
        });
      }
    },
    validators: {
      onSubmit: editDiscoveredFileSchema,
    },
  });

  // Reset form when file changes
  useEffect(() => {
    const resetValues: EditDiscoveredFileFormValues = {
      action: file.action as (typeof fileActions)[number],
      priority: file.priority as (typeof filePriorities)[number],
      relevanceExplanation: file.relevanceExplanation ?? '',
      role: file.role ?? '',
    };
    form.reset(resetValues);
  }, [file, form]);

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChangeInternal = (open: boolean) => {
    if (!open && form.state.isDirty) {
      // Show discard confirmation if form has unsaved changes
      setIsDiscardDialogOpen(true);
      return;
    }
    onOpenChange(open);
    if (!open) {
      form.reset();
    }
  };

  const handleConfirmDiscard = () => {
    setIsDiscardDialogOpen(false);
    onOpenChange(false);
    form.reset();
  };

  return (
    <DialogRoot onOpenChange={handleOpenChangeInternal} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup size={'lg'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>Edit File Details</DialogTitle>
            <DialogDescription>Update the metadata for this discovered file.</DialogDescription>
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
              {/* File Path (Read-only display) */}
              <div className={'flex flex-col gap-1.5'}>
                <label className={'text-sm font-medium text-foreground'}>File Path</label>
                <div className={'rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground'}>
                  {file.filePath}
                </div>
              </div>

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
                <form.SubmitButton>{isSubmitting ? 'Saving...' : 'Save Changes'}</form.SubmitButton>
              </form.AppForm>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>

      {/* Confirm Discard Dialog */}
      <ConfirmDiscardDialog
        isOpen={isDiscardDialogOpen}
        onConfirm={handleConfirmDiscard}
        onOpenChange={setIsDiscardDialogOpen}
      />
    </DialogRoot>
  );
};
