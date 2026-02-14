'use client';

import { formatDistanceToNow } from 'date-fns';
import { GitBranch } from 'lucide-react';
import Link from 'next/link';

import type { GitHubPullRequest } from '@/types/github';

import { cn } from '@/lib/utils';

import { PrStatusBadge } from './pr-status-badge';

interface PrTableProps {
  className?: string;
  prs: Array<GitHubPullRequest>;
  repoId: number;
}

export const PrTable = ({ className, prs, repoId }: PrTableProps) => {
  if (prs.length === 0) {
    return (
      <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
        <p className={'text-sm'}>{'No pull requests found.'}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-auto', className)}>
      <table className={'w-full text-sm'}>
        <thead>
          <tr className={'border-b border-border text-left text-xs text-muted-foreground'}>
            <th className={'px-4 py-2 font-medium'}>{'#'}</th>
            <th className={'px-4 py-2 font-medium'}>{'Title'}</th>
            <th className={'px-4 py-2 font-medium'}>{'Author'}</th>
            <th className={'px-4 py-2 font-medium'}>{'Branch'}</th>
            <th className={'px-4 py-2 font-medium'}>{'Status'}</th>
            <th className={'px-4 py-2 text-right font-medium'}>{'Updated'}</th>
          </tr>
        </thead>
        <tbody>
          {prs.map((pr) => (
            <tr
              className={'border-b border-border/50 transition-colors hover:bg-muted/50'}
              key={pr.number}
            >
              <td className={'px-4 py-3 text-muted-foreground'}>
                {pr.number}
              </td>
              <td className={'px-4 py-3'}>
                <Link
                  className={'font-medium text-foreground hover:text-accent hover:underline'}
                  href={`/pulls/${pr.number}?repo=${repoId}`}
                >
                  {pr.title}
                </Link>
              </td>
              <td className={'px-4 py-3 text-muted-foreground'}>
                {pr.author}
              </td>
              <td className={'px-4 py-3'}>
                <span className={'inline-flex items-center gap-1 text-xs text-muted-foreground'}>
                  <GitBranch aria-hidden={'true'} className={'size-3'} />
                  <span className={'font-mono'}>{pr.headRefName}</span>
                  <span>{'→'}</span>
                  <span className={'font-mono'}>{pr.baseRefName}</span>
                </span>
              </td>
              <td className={'px-4 py-3'}>
                <PrStatusBadge isDraft={pr.isDraft} state={pr.state} />
              </td>
              <td className={'px-4 py-3 text-right text-xs text-muted-foreground'}>
                {formatDistanceToNow(new Date(pr.updatedAt), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
