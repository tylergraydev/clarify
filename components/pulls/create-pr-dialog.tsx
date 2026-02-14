'use client';

import { useForm } from '@tanstack/react-form';
import { useState } from 'react';

import type { GitBranch } from '@/types/diff';

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
import { useCreatePullRequest, usePrTemplate } from '@/hooks/queries/use-github';

interface CreatePrDialogProps {
  branches: Array<GitBranch>;
  defaultBody?: string;
  defaultTitle?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  repoPath: string;
}

export const CreatePrDialog = ({
  branches,
  defaultBody,
  defaultTitle,
  isOpen,
  onOpenChange,
  repoPath,
}: CreatePrDialogProps) => {
  const createPrMutation = useCreatePullRequest();
  const { data: prTemplate } = usePrTemplate(repoPath);
  const [isDraft, setIsDraft] = useState(false);

  const localBranches = branches.filter((b) => !b.isRemote);
  const currentBranch = localBranches.find((b) => b.isCurrent);
  const mainBranch = localBranches.find((b) => b.name === 'main' || b.name === 'master');

  const form = useForm({
    defaultValues: {
      base: mainBranch?.name ?? '',
      body: defaultBody ?? prTemplate ?? '',
      head: currentBranch?.name ?? '',
      title: defaultTitle ?? '',
    },
    onSubmit: async ({ value }) => {
      createPrMutation.mutate(
        {
          input: {
            base: value.base,
            body: value.body,
            draft: isDraft,
            head: value.head,
            title: value.title,
          },
          repoPath,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    },
  });

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'max-w-lg'}>
          <DialogTitle>{'Create Pull Request'}</DialogTitle>
          <DialogDescription>{'Create a new pull request on GitHub.'}</DialogDescription>

          <form
            className={'mt-4 space-y-4'}
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
          >
            {/* Title */}
            <div className={'space-y-1.5'}>
              <label className={'text-sm font-medium'} htmlFor={'pr-title'}>
                {'Title'}
              </label>
              <form.Field name={'title'}>
                {(field) => (
                  <input
                    className={`
                      w-full rounded-md border border-border bg-background px-3 py-2
                      text-sm focus:ring-2 focus:ring-accent focus:outline-none
                    `}
                    id={'pr-title'}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={'PR title'}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </div>

            {/* Branch selectors */}
            <div className={'flex items-center gap-3'}>
              <div className={'flex-1 space-y-1.5'}>
                <label className={'text-sm font-medium'} htmlFor={'pr-base'}>
                  {'Base'}
                </label>
                <form.Field name={'base'}>
                  {(field) => (
                    <select
                      className={`
                        w-full rounded-md border border-border bg-background px-3 py-2
                        text-sm focus:ring-2 focus:ring-accent focus:outline-none
                      `}
                      id={'pr-base'}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    >
                      {localBranches.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </form.Field>
              </div>
              <span className={'mt-6 text-muted-foreground'}>{'←'}</span>
              <div className={'flex-1 space-y-1.5'}>
                <label className={'text-sm font-medium'} htmlFor={'pr-head'}>
                  {'Head'}
                </label>
                <form.Field name={'head'}>
                  {(field) => (
                    <select
                      className={`
                        w-full rounded-md border border-border bg-background px-3 py-2
                        text-sm focus:ring-2 focus:ring-accent focus:outline-none
                      `}
                      id={'pr-head'}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    >
                      {localBranches.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </form.Field>
              </div>
            </div>

            {/* Body */}
            <div className={'space-y-1.5'}>
              <label className={'text-sm font-medium'} htmlFor={'pr-body'}>
                {'Description'}
              </label>
              <form.Field name={'body'}>
                {(field) => (
                  <textarea
                    className={`
                      h-40 w-full resize-y rounded-md border border-border
                      bg-background px-3 py-2 font-mono text-sm
                      focus:ring-2 focus:ring-accent focus:outline-none
                    `}
                    id={'pr-body'}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={'Describe your changes...'}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </div>

            {/* Draft toggle */}
            <div className={'flex items-center gap-2'}>
              <input
                checked={isDraft}
                id={'pr-draft'}
                onChange={(e) => setIsDraft(e.target.checked)}
                type={'checkbox'}
              />
              <label className={'text-sm text-muted-foreground'} htmlFor={'pr-draft'}>
                {'Create as draft'}
              </label>
            </div>

            {/* Actions */}
            <div className={'flex justify-end gap-2 pt-2'}>
              <DialogClose>
                <Button size={'sm'} type={'button'} variant={'outline'}>
                  {'Cancel'}
                </Button>
              </DialogClose>
              <Button
                disabled={createPrMutation.isPending}
                size={'sm'}
                type={'submit'}
              >
                {createPrMutation.isPending ? 'Creating...' : 'Create Pull Request'}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
