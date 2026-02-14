'use client';

import type { ReactNode } from 'react';

import { AlertTriangle, Globe, Loader2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

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
import { useElectronProjects } from '@/hooks/electron/domains/use-electron-projects';
import { useAddRepositoryToProject } from '@/hooks/queries/use-projects';
import { useAppForm } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';
import { addRepositorySchema } from '@/lib/validations/repository';

interface AddRepositoryDialogProps {
  /** Callback when repository is successfully added */
  onSuccess?: () => void;
  /** The ID of the project to add the repository to */
  projectId: number;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

export const AddRepositoryDialog = ({ onSuccess, projectId, trigger }: AddRepositoryDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [gitWarning, setGitWarning] = useState<null | string>(null);

  const { repositories } = useElectronProjects();
  const addRepositoryMutation = useAddRepositoryToProject();
  const detectAbortRef = useRef(0);

  const isSubmitting = addRepositoryMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      defaultBranch: 'main',
      name: '',
      path: '',
      remoteUrl: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await addRepositoryMutation.mutateAsync({
          projectId,
          repoData: {
            defaultBranch: value.defaultBranch,
            name: value.name,
            path: value.path,
            projectId,
            remoteUrl: value.remoteUrl || null,
          },
        });
        handleClose();
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add repository. Please try again.';
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: addRepositorySchema,
    },
  });

  const detectGitInfo = useCallback(
    async (dirPath: string) => {
      if (!dirPath.trim()) {
        setGitWarning(null);
        return;
      }

      const callId = ++detectAbortRef.current;
      setIsDetecting(true);
      setGitWarning(null);

      try {
        const result = await repositories.detectGitInfo(dirPath);

        // Ignore stale results
        if (callId !== detectAbortRef.current) return;

        if (result.isGitRepo) {
          if (result.name) {
            form.setFieldValue('name', result.name);
          }
          if (result.defaultBranch) {
            form.setFieldValue('defaultBranch', result.defaultBranch);
          }
          form.setFieldValue('remoteUrl', result.remoteUrl ?? '');
          setGitWarning(null);
        } else {
          setGitWarning('Not a Git repository. You can still add it manually.');
        }
      } catch (error) {
        if (callId !== detectAbortRef.current) return;
        const detail = error instanceof Error ? error.message : String(error);
        setGitWarning(`Could not detect Git information: ${detail}`);
      } finally {
        if (callId === detectAbortRef.current) {
          setIsDetecting(false);
        }
      }
    },
    [form, repositories]
  );

  const handleClose = () => {
    setIsOpen(false);
    setGitWarning(null);
    setIsDetecting(false);
    detectAbortRef.current++;
    form.reset();
  };

  const handleOpenChangeInternal = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setGitWarning(null);
      setIsDetecting(false);
      detectAbortRef.current++;
      form.reset();
    }
  };

  return (
    <DialogRoot onOpenChange={handleOpenChangeInternal} open={isOpen}>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>Add Repository</DialogTitle>
            <DialogDescription>Add a repository to this project for workflow management.</DialogDescription>
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
              {/* Path Field */}
              <form.AppField
                listeners={{
                  onChange: ({ value }) => {
                    void detectGitInfo(value);
                  },
                }}
                name={'path'}
              >
                {(field) => (
                  <field.PathInputField
                    description={'Select the local directory containing the repository'}
                    isDisabled={isSubmitting}
                    isRequired
                    label={'Repository Path'}
                    placeholder={'Select or enter repository path'}
                  />
                )}
              </form.AppField>

              {/* Git Detection Status */}
              {isDetecting && (
                <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
                  <Loader2 aria-hidden={'true'} className={'size-3 animate-spin'} />
                  <span>Detecting Git repository...</span>
                </div>
              )}

              {/* Git Warning */}
              {gitWarning && !isDetecting && (
                <div className={'flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400'}>
                  <AlertTriangle aria-hidden={'true'} className={'size-3 shrink-0'} />
                  <span>{gitWarning}</span>
                </div>
              )}

              {/* Name Field */}
              <form.AppField name={'name'}>
                {(field) => (
                  <field.TextField
                    autoFocus
                    isDisabled={isSubmitting}
                    isRequired
                    label={'Repository Name'}
                    placeholder={'Enter repository name'}
                  />
                )}
              </form.AppField>

              {/* Default Branch Field */}
              <form.AppField name={'defaultBranch'}>
                {(field) => (
                  <field.TextField
                    description={'The default branch to use for workflows'}
                    isDisabled={isSubmitting}
                    isRequired
                    label={'Default Branch'}
                    placeholder={'main'}
                  />
                )}
              </form.AppField>

              {/* Remote URL (read-only info) */}
              <form.AppField name={'remoteUrl'}>
                {(field) => {
                  const value = field.state.value;
                  if (!value) return null;
                  return (
                    <div className={'flex flex-col gap-1'}>
                      <span className={'text-xs font-medium text-muted-foreground'}>Remote URL</span>
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground'
                        )}
                      >
                        <Globe aria-hidden={'true'} className={'size-3.5 shrink-0'} />
                        <span className={'truncate'}>{value}</span>
                      </div>
                    </div>
                  );
                }}
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
                <form.SubmitButton>{isSubmitting ? 'Adding...' : 'Add Repository'}</form.SubmitButton>
              </form.AppForm>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
