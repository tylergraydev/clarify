'use client';

import { DiffEmptyState } from '@/components/diff/diff-empty-state';
import { DiffLoadingSkeleton } from '@/components/diff/diff-loading-skeleton';
import { DiffViewer } from '@/components/diff/diff-viewer';
import { usePrDiff } from '@/hooks/queries/use-github';

interface PrChangesTabProps {
  prNumber: number;
  repoPath: string;
}

export const PrChangesTab = ({ prNumber, repoPath }: PrChangesTabProps) => {
  const { data: diffResult, isLoading } = usePrDiff(repoPath, prNumber);

  if (isLoading) {
    return <DiffLoadingSkeleton />;
  }

  if (!diffResult || diffResult.files.length === 0) {
    return <DiffEmptyState description={'No changes found in this pull request.'} />;
  }

  return <DiffViewer files={diffResult.files} />;
};
