'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';

import type { GitHubCheckRun } from '@/types/github';

import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PrChecksSummaryProps {
  checks: Array<GitHubCheckRun>;
  className?: string;
}

export const PrChecksSummary = ({ checks, className }: PrChecksSummaryProps) => {
  if (checks.length === 0) return null;

  const passed = checks.filter((c) => c.conclusion === 'success').length;
  const failed = checks.filter((c) => c.conclusion === 'failure' || c.conclusion === 'timed_out').length;
  const pending = checks.filter((c) => c.status === 'in_progress' || c.status === 'queued').length;

  const Icon = failed > 0 ? XCircle : pending > 0 ? Loader2 : CheckCircle;
  const color = failed > 0 ? 'text-red-500' : pending > 0 ? 'text-amber-500' : 'text-green-500';
  const tooltipText = `${passed} passed, ${failed} failed, ${pending} pending`;

  return (
    <Tooltip content={tooltipText}>
      <span className={cn('inline-flex items-center gap-1 text-xs', className)}>
        <Icon
          aria-hidden={'true'}
          className={cn('size-3.5', color, pending > 0 && failed === 0 && 'animate-spin')}
        />
        <span className={'text-muted-foreground'}>
          {checks.length}
        </span>
      </span>
    </Tooltip>
  );
};
