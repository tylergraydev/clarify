'use client';

import { useState } from 'react';

import type { GitHubPullRequest } from '@/types/github';
import type { MergeStrategy } from '@/types/github';

import { Badge } from '@/components/ui/badge';
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
import { useMergePullRequest } from '@/hooks/queries/use-github';
import { cn } from '@/lib/utils';

interface MergePrDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pr: GitHubPullRequest;
  repoPath: string;
}

const MERGE_STRATEGIES: Array<{ description: string; label: string; value: MergeStrategy }> = [
  { description: 'All commits will be added to the base branch via a merge commit.', label: 'Merge', value: 'merge' },
  { description: 'All commits will be combined into a single commit on the base branch.', label: 'Squash', value: 'squash' },
  { description: 'All commits will be rebased onto the base branch.', label: 'Rebase', value: 'rebase' },
];

export const MergePrDialog = ({ isOpen, onOpenChange, pr, repoPath }: MergePrDialogProps) => {
  const [strategy, setStrategy] = useState<MergeStrategy>('squash');
  const mergeMutation = useMergePullRequest();

  const hasFailingChecks = pr.reviewDecision === 'CHANGES_REQUESTED';

  const handleMerge = () => {
    mergeMutation.mutate(
      { prNumber: pr.number, repoPath, strategy },
      {
        onSuccess: (result) => {
          if (result.success) {
            onOpenChange(false);
          }
        },
      }
    );
  };

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'max-w-md'}>
          <DialogTitle>{'Merge Pull Request'}</DialogTitle>
          <DialogDescription>
            {'Merge '}
            <span className={'font-medium'}>{'#'}{pr.number}</span>
            {' into '}
            <span className={'font-mono text-xs'}>{pr.baseRefName}</span>
          </DialogDescription>

          {hasFailingChecks && (
            <div className={'mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400'}>
              {'This PR has changes requested. Merging is not recommended.'}
            </div>
          )}

          {mergeMutation.data && !mergeMutation.data.success && (
            <div className={'mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400'}>
              {mergeMutation.data.message}
            </div>
          )}

          {/* Strategy selector */}
          <div className={'mt-4 space-y-2'}>
            {MERGE_STRATEGIES.map((s) => (
              <button
                className={cn(
                  'w-full rounded-md border p-3 text-left transition-colors',
                  strategy === s.value
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                )}
                key={s.value}
                onClick={() => setStrategy(s.value)}
                type={'button'}
              >
                <div className={'flex items-center gap-2'}>
                  <span className={'text-sm font-medium'}>{s.label}</span>
                  {strategy === s.value && <Badge size={'sm'} variant={'completed'}>{'Selected'}</Badge>}
                </div>
                <p className={'mt-0.5 text-xs text-muted-foreground'}>{s.description}</p>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className={'mt-4 flex justify-end gap-2'}>
            <DialogClose>
              <Button size={'sm'} type={'button'} variant={'outline'}>
                {'Cancel'}
              </Button>
            </DialogClose>
            <Button
              disabled={mergeMutation.isPending}
              onClick={handleMerge}
              size={'sm'}
            >
              {mergeMutation.isPending ? 'Merging...' : `Merge (${strategy})`}
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
