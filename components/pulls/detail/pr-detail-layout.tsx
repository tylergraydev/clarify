'use client';

import { ArrowLeft, ExternalLink, GitMerge } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { PrDetailTab } from '@/app/(app)/pulls/[number]/route-type';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePullRequest } from '@/hooks/queries/use-github';
import { cn } from '@/lib/utils';

import { MergePrDialog } from '../merge-pr-dialog';
import { PrStatusBadge } from '../pr-status-badge';
import { PrChangesTab } from './pr-changes-tab';
import { PrChecksTab } from './pr-checks-tab';
import { PrCommentsTab } from './pr-comments-tab';
import { PrDeploymentsTab } from './pr-deployments-tab';
import { PrOverviewTab } from './pr-overview-tab';

interface PrDetailLayoutProps {
  activeTab: PrDetailTab;
  onTabChange: (tab: PrDetailTab) => void;
  prNumber: number;
  repoPath: string;
}

const TABS: Array<{ label: string; value: PrDetailTab }> = [
  { label: 'Overview', value: 'overview' },
  { label: 'Changes', value: 'changes' },
  { label: 'Comments', value: 'comments' },
  { label: 'Checks', value: 'checks' },
  { label: 'Deployments', value: 'deployments' },
];

export const PrDetailLayout = ({ activeTab, onTabChange, prNumber, repoPath }: PrDetailLayoutProps) => {
  const { data: pr, isLoading } = usePullRequest(repoPath, prNumber);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={'flex items-center justify-center py-16 text-sm text-muted-foreground'}>
        {'Loading pull request...'}
      </div>
    );
  }

  if (!pr) {
    return (
      <div className={'flex items-center justify-center py-16 text-sm text-muted-foreground'}>
        {'Pull request not found.'}
      </div>
    );
  }

  const isOpen = pr.state === 'OPEN';

  return (
    <div className={'flex h-[calc(100vh-6rem)] flex-col'}>
      {/* Header */}
      <div className={'space-y-3 px-6 py-4'}>
        <div className={'flex items-center gap-2'}>
          <Link
            className={'text-muted-foreground transition-colors hover:text-foreground'}
            href={'/pulls'}
          >
            <ArrowLeft className={'size-4'} />
          </Link>
          <h1 className={'text-lg font-semibold'}>{pr.title}</h1>
          <span className={'text-muted-foreground'}>{'#'}{pr.number}</span>
          <PrStatusBadge isDraft={pr.isDraft} state={pr.state} />
          {pr.reviewDecision && (
            <Badge size={'sm'} variant={pr.reviewDecision === 'APPROVED' ? 'completed' : 'pending'}>
              {pr.reviewDecision.replace('_', ' ')}
            </Badge>
          )}
        </div>

        <div className={'flex items-center justify-between'}>
          <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
            <span>{pr.author}</span>
            <span>{'wants to merge'}</span>
            <span className={'font-mono'}>{pr.headRefName}</span>
            <span>{'→'}</span>
            <span className={'font-mono'}>{pr.baseRefName}</span>
          </div>
          <div className={'flex items-center gap-2'}>
            {isOpen && !pr.isDraft && (
              <Button onClick={() => setIsMergeDialogOpen(true)} size={'sm'}>
                <GitMerge aria-hidden={'true'} className={'size-4'} />
                {'Merge'}
              </Button>
            )}
            <a
              className={`
                inline-flex items-center gap-1.5 rounded-md border border-border bg-background
                px-3 py-1.5 text-sm font-medium transition-colors
                hover:bg-muted
              `}
              href={pr.url}
              rel={'noopener noreferrer'}
              target={'_blank'}
            >
              <ExternalLink aria-hidden={'true'} className={'size-4'} />
              {'GitHub'}
            </a>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tab bar */}
      <div className={'flex gap-1 border-b border-border px-6'}>
        {TABS.map((tab) => (
          <button
            className={cn(
              'relative px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent'
                : 'text-muted-foreground hover:text-foreground'
            )}
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            type={'button'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={'min-h-0 flex-1 overflow-auto'}>
        {activeTab === 'overview' && <PrOverviewTab pr={pr} repoPath={repoPath} />}
        {activeTab === 'changes' && <PrChangesTab prNumber={prNumber} repoPath={repoPath} />}
        {activeTab === 'comments' && <PrCommentsTab prNumber={prNumber} repoPath={repoPath} />}
        {activeTab === 'checks' && <PrChecksTab pr={pr} repoPath={repoPath} />}
        {activeTab === 'deployments' && <PrDeploymentsTab pr={pr} repoPath={repoPath} />}
      </div>

      {/* Merge dialog */}
      {isOpen && (
        <MergePrDialog
          isOpen={isMergeDialogOpen}
          onOpenChange={setIsMergeDialogOpen}
          pr={pr}
          repoPath={repoPath}
        />
      )}
    </div>
  );
};
