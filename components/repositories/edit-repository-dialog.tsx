'use client';

import { useEffect } from 'react';

import type { Repository } from '@/types/electron';

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
import { useUpdateRepository } from '@/hooks/queries/use-repositories';
import { useAppForm } from '@/lib/forms/form-hook';
import { updateRepositorySchema } from '@/lib/validations/repository';

interface EditRepositoryDialogProps {
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Callback when repository is successfully updated */
  onSuccess?: () => void;
  /** The repository to edit */
  repository: Repository;
}

export const EditRepositoryDialog = ({ isOpen, onOpenChange, onSuccess, repository }: EditRepositoryDialogProps) => {
  const updateRepositoryMutation = useUpdateRepository();

  const isSubmitting = updateRepositoryMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      defaultBranch: repository.defaultBranch,
      name: repository.name,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateRepositoryMutation.mutateAsync({
          data: {
            defaultBranch: value.defaultBranch,
            name: value.name,
          },
          id: repository.id,
        });
        handleClose();
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update repository. Please try again.';
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: updateRepositorySchema,
    },
  });

  // Reset form when repository changes
  useEffect(() => {
    form.reset({
      defaultBranch: repository.defaultBranch,
      name: repository.name,
    });
  }, [repository, form]);

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChangeInternal = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <DialogRoot onOpenChange={handleOpenChangeInternal} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>Edit Repository</DialogTitle>
            <DialogDescription>Update your repository&#39;s name and default branch.</DialogDescription>
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
              {/* Name Field */}
              <form.AppField name={'name'}>
                {(field) => (
                  <field.TextField
                    autoFocus
                    isRequired
                    label={'Repository Name'}
                    placeholder={'Enter repository name'}
                  />
                )}
              </form.AppField>

              {/* Path Field (Read-only) */}
              <div className={'flex flex-col gap-1.5'}>
                <label className={'text-sm font-medium text-foreground'}>{'Repository Path'}</label>
                <div
                  className={
                    'rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground'
                  }
                >
                  {repository.path}
                </div>
                <p className={'text-xs text-muted-foreground'}>The repository path cannot be changed after creation.</p>
              </div>

              {/* Default Branch Field */}
              <form.AppField name={'defaultBranch'}>
                {(field) => (
                  <field.TextField
                    description={'The default branch to use for workflows'}
                    isRequired
                    label={'Default Branch'}
                    placeholder={'main'}
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
    </DialogRoot>
  );
};
