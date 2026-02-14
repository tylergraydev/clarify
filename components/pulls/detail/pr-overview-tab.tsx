'use client';

import { formatDistanceToNow } from 'date-fns';
import { Calendar, FileCode, GitBranch, Minus, Plus, User } from 'lucide-react';
import { Fragment } from 'react';

import type { GitHubPullRequest } from '@/types/github';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConvertToReady } from '@/hooks/queries/use-github';

import { PrDescriptionEditor } from './pr-description-editor';
import { PrTitleEditor } from './pr-title-editor';

interface PrOverviewTabProps {
  pr: GitHubPullRequest;
  repoPath: string;
}

export const PrOverviewTab = ({ pr, repoPath }: PrOverviewTabProps) => {
  const convertToReadyMutation = useConvertToReady();

  const _isDraftOpen = pr.isDraft && pr.state === 'OPEN';
  const _isMerged = pr.state === 'MERGED' && pr.mergedAt;

  return (
    <div className={'space-y-6 p-6'}>
      {/* Title Editor */}
      <PrTitleEditor prNumber={pr.number} repoPath={repoPath} title={pr.title} />

      {/* Metadata */}
      <div className={'grid grid-cols-2 gap-4 text-sm'}>
        <div className={'flex items-center gap-2 text-muted-foreground'}>
          <User aria-hidden={'true'} className={'size-4'} />
          <span>{'Author:'}</span>
          <span className={'text-foreground'}>{pr.author}</span>
        </div>
        <div className={'flex items-center gap-2 text-muted-foreground'}>
          <Calendar aria-hidden={'true'} className={'size-4'} />
          <span>{'Created:'}</span>
          <span className={'text-foreground'}>
            {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className={'flex items-center gap-2 text-muted-foreground'}>
          <GitBranch aria-hidden={'true'} className={'size-4'} />
          <span className={'font-mono text-xs text-foreground'}>{pr.headRefName}</span>
          <span>{'→'}</span>
          <span className={'font-mono text-xs text-foreground'}>{pr.baseRefName}</span>
        </div>
        <div className={'flex items-center gap-2 text-muted-foreground'}>
          <FileCode aria-hidden={'true'} className={'size-4'} />
          <span>{pr.changedFiles} {'files changed'}</span>
        </div>
      </div>

      {/* Diff stats */}
      <div className={'flex items-center gap-4 text-sm'}>
        <span className={'flex items-center gap-1 text-green-600 dark:text-green-400'}>
          <Plus aria-hidden={'true'} className={'size-3.5'} />
          {pr.additions}
        </span>
        <span className={'flex items-center gap-1 text-red-600 dark:text-red-400'}>
          <Minus aria-hidden={'true'} className={'size-3.5'} />
          {pr.deletions}
        </span>
      </div>

      {/* Draft notice */}
      {_isDraftOpen && (
        <div className={'flex items-center justify-between rounded-md border border-border bg-muted/50 px-4 py-3'}>
          <div>
            <p className={'text-sm font-medium'}>{'This is a draft pull request'}</p>
            <p className={'text-xs text-muted-foreground'}>{'Mark as ready for review when you\'re done.'}</p>
          </div>
          <Button
            disabled={convertToReadyMutation.isPending}
            onClick={() => convertToReadyMutation.mutate({ prNumber: pr.number, repoPath })}
            size={'sm'}
          >
            {convertToReadyMutation.isPending ? 'Converting...' : 'Ready for review'}
          </Button>
        </div>
      )}

      {/* Merge info */}
      {_isMerged && (
        <div className={'rounded-md border border-purple-500/30 bg-purple-500/10 px-4 py-3'}>
          <p className={'text-sm'}>
            {'Merged '}
            {formatDistanceToNow(new Date(pr.mergedAt!), { addSuffix: true })}
            {pr.mergedBy && (
              <Fragment>
                {' by '}
                <span className={'font-medium'}>{pr.mergedBy}</span>
              </Fragment>
            )}
          </p>
        </div>
      )}

      {/* Review decision */}
      {pr.reviewDecision && (
        <div className={'flex items-center gap-2'}>
          <span className={'text-sm text-muted-foreground'}>{'Review:'}</span>
          <Badge
            variant={
              pr.reviewDecision === 'APPROVED'
                ? 'completed'
                : pr.reviewDecision === 'CHANGES_REQUESTED'
                  ? 'failed'
                  : 'pending'
            }
          >
            {pr.reviewDecision.replace('_', ' ')}
          </Badge>
        </div>
      )}

      {/* Description */}
      <PrDescriptionEditor body={pr.body} prNumber={pr.number} repoPath={repoPath} />
    </div>
  );
};
