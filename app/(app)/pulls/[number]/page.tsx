'use client';

import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { use } from 'react';

import { PrDetailLayout } from '@/components/pulls/detail/pr-detail-layout';
import { useRepository } from '@/hooks/queries/use-repositories';

import type { PrDetailTab } from './route-type';

interface PrDetailPageProps {
  params: Promise<{ number: string }>;
}

export default function PrDetailPage({ params }: PrDetailPageProps) {
  const resolvedParams = use(params);
  const prNumber = Number(resolvedParams.number);
  const [repoId] = useQueryState('repo', parseAsInteger);
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('overview'));

  const { data: repo } = useRepository(repoId ?? 0);
  const repoPath = repo?.path;

  if (!repoPath || !prNumber) {
    return (
      <div className={'flex items-center justify-center py-16 text-sm text-muted-foreground'}>
        {'Missing repository or PR number.'}
      </div>
    );
  }

  return (
    <PrDetailLayout
      activeTab={tab as PrDetailTab}
      onTabChange={(t) => void setTab(t)}
      prNumber={prNumber}
      repoPath={repoPath}
    />
  );
}
