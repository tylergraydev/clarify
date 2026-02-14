'use client';

import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Globe, Rocket } from 'lucide-react';

import type { GitHubPullRequest } from '@/types/github';

import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { usePrDeployments } from '@/hooks/queries/use-github';

interface PrDeploymentsTabProps {
  pr: GitHubPullRequest;
  repoPath: string;
}

const getStateVariant = (state: string) => {
  if (state === 'success' || state === 'active') return 'completed' as const;
  if (state === 'failure' || state === 'error') return 'failed' as const;
  if (state === 'pending' || state === 'queued' || state === 'in_progress') return 'pending' as const;
  return 'default' as const;
};

const getStateIcon = (state: string) => {
  if (state === 'success' || state === 'active') {
    return <Globe aria-hidden={'true'} className={'size-4 text-green-500'} />;
  }
  if (state === 'failure' || state === 'error') {
    return <Globe aria-hidden={'true'} className={'size-4 text-red-500'} />;
  }
  return <Globe aria-hidden={'true'} className={'size-4 text-muted-foreground'} />;
};

export const PrDeploymentsTab = ({ pr, repoPath }: PrDeploymentsTabProps) => {
  const { data: deployments = [], isLoading } = usePrDeployments(repoPath, pr.number);

  if (isLoading) {
    return (
      <div className={'flex items-center justify-center py-16 text-sm text-muted-foreground'}>
        {'Loading deployments...'}
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
        <Rocket className={'size-10'} />
        <p className={'text-sm'}>{'No deployments found for this pull request.'}</p>
      </div>
    );
  }

  return (
    <div className={'space-y-4 p-4'}>
      {/* Deployment list */}
      <div className={'divide-y divide-border rounded-md border border-border'}>
        {deployments.map((deployment) => (
          <div className={'flex items-center gap-3 px-4 py-3'} key={deployment.id}>
            {getStateIcon(deployment.state)}
            <div className={'flex-1'}>
              <p className={'text-sm font-medium'}>{deployment.environment}</p>
              {deployment.description && (
                <p className={'text-xs text-muted-foreground'}>{deployment.description}</p>
              )}
              <p className={'text-xs text-muted-foreground'}>
                {formatDistanceToNow(new Date(deployment.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Badge size={'sm'} variant={getStateVariant(deployment.state)}>
              {deployment.state}
            </Badge>
            {deployment.url && (
              <Tooltip content={'View deployment'}>
                <a
                  className={'text-muted-foreground transition-colors hover:text-foreground'}
                  href={deployment.url}
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
