'use client';

import { CheckCircle, Circle, ExternalLink, Loader2, RefreshCw, XCircle } from 'lucide-react';

import type { GitHubCheckRun, GitHubPullRequest } from '@/types/github';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { usePrChecks, useRerunFailedChecks } from '@/hooks/queries/use-github';

interface PrChecksTabProps {
  pr: GitHubPullRequest;
  repoPath: string;
}

const getCheckIcon = (check: GitHubCheckRun) => {
  if (check.status === 'in_progress' || check.status === 'queued') {
    return <Loader2 aria-hidden={'true'} className={'size-4 animate-spin text-amber-500'} />;
  }
  if (check.conclusion === 'success') {
    return <CheckCircle aria-hidden={'true'} className={'size-4 text-green-500'} />;
  }
  if (check.conclusion === 'failure' || check.conclusion === 'timed_out') {
    return <XCircle aria-hidden={'true'} className={'size-4 text-red-500'} />;
  }
  return <Circle aria-hidden={'true'} className={'size-4 text-muted-foreground'} />;
};

const getConclusionVariant = (conclusion: null | string) => {
  if (conclusion === 'success') return 'completed' as const;
  if (conclusion === 'failure' || conclusion === 'timed_out') return 'failed' as const;
  return 'pending' as const;
};

export const PrChecksTab = ({ pr, repoPath }: PrChecksTabProps) => {
  const { data: checks = [], isLoading } = usePrChecks(repoPath, pr.headRefOid);
  const rerunFailedMutation = useRerunFailedChecks();

  if (isLoading) {
    return (
      <div className={'flex items-center justify-center py-16 text-sm text-muted-foreground'}>
        {'Loading checks...'}
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
        <CheckCircle className={'size-10'} />
        <p className={'text-sm'}>{'No check runs found for this pull request.'}</p>
      </div>
    );
  }

  const failedChecks = checks.filter((c) => c.conclusion === 'failure' || c.conclusion === 'timed_out');
  const passed = checks.filter((c) => c.conclusion === 'success').length;
  const pending = checks.filter((c) => c.status === 'in_progress' || c.status === 'queued').length;

  return (
    <div className={'space-y-4 p-4'}>
      {/* Summary */}
      <div className={'flex items-center justify-between'}>
        <div className={'flex items-center gap-4 text-sm'}>
          <span className={'text-green-600 dark:text-green-400'}>{passed} {'passed'}</span>
          {failedChecks.length > 0 && (
            <span className={'text-red-600 dark:text-red-400'}>{failedChecks.length} {'failed'}</span>
          )}
          {pending > 0 && (
            <span className={'text-amber-600 dark:text-amber-400'}>{pending} {'pending'}</span>
          )}
        </div>
        {failedChecks.length > 0 && (
          <Button
            disabled={rerunFailedMutation.isPending}
            onClick={() => {
              // Re-run the first failed check's run
              const firstFailed = failedChecks[0];
              if (firstFailed?.detailsUrl) {
                const runIdMatch = firstFailed.detailsUrl.match(/\/runs\/(\d+)/);
                if (runIdMatch?.[1]) {
                  rerunFailedMutation.mutate({
                    ref: pr.headRefOid,
                    repoPath,
                    runId: Number(runIdMatch[1]),
                  });
                }
              }
            }}
            size={'sm'}
            variant={'outline'}
          >
            <RefreshCw aria-hidden={'true'} className={'size-4'} />
            {'Re-run failed'}
          </Button>
        )}
      </div>

      {/* Check list */}
      <div className={'divide-y divide-border rounded-md border border-border'}>
        {checks.map((check, idx) => (
          <div className={'flex items-center gap-3 px-4 py-3'} key={`${check.name}-${idx}`}>
            {getCheckIcon(check)}
            <div className={'flex-1'}>
              <p className={'text-sm font-medium'}>{check.name}</p>
              {check.workflowName && (
                <p className={'text-xs text-muted-foreground'}>{check.workflowName}</p>
              )}
            </div>
            {check.conclusion && (
              <Badge size={'sm'} variant={getConclusionVariant(check.conclusion)}>
                {check.conclusion}
              </Badge>
            )}
            {check.detailsUrl && (
              <Tooltip content={'View details'}>
                <a
                  className={'text-muted-foreground transition-colors hover:text-foreground'}
                  href={check.detailsUrl}
                  rel={'noopener noreferrer'}
                  target={'_blank'}
                >
                  <ExternalLink className={'size-3.5'} />
                </a>
              </Tooltip>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
