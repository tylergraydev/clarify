'use client';

import { useMemo } from 'react';

import { DiffEmptyState } from '@/components/diff/diff-empty-state';
import { DiffLoadingSkeleton } from '@/components/diff/diff-loading-skeleton';
import { DiffViewer } from '@/components/diff/diff-viewer';
import { useWorktreeDiff } from '@/hooks/queries/use-diff';
import { useWorktreeByWorkflowId } from '@/hooks/queries/use-worktrees';

interface WorkflowChangesTabProps {
  workflowId: number;
}

export const WorkflowChangesTab = ({ workflowId }: WorkflowChangesTabProps) => {
  const { data: worktree, isLoading: isWorktreeLoading } = useWorktreeByWorkflowId(workflowId);

  const worktreePath = useMemo(() => {
    if (worktree?.path && worktree.status === 'active') return worktree.path;
    return undefined;
  }, [worktree]);

  const { data: diffResult, isLoading: isDiffLoading } = useWorktreeDiff(worktreePath);

  const isLoading = isWorktreeLoading || isDiffLoading;

  if (isLoading) {
    return <DiffLoadingSkeleton />;
  }

  if (!worktree || !worktreePath) {
    return (
      <DiffEmptyState
        description={'This workflow does not have an active worktree. Start a workflow step to create one.'}
        title={'No worktree available'}
      />
    );
  }

  if (!diffResult) {
    return <DiffEmptyState />;
  }

  const committedFiles = diffResult.committed.files;
  const uncommittedFiles = diffResult.uncommitted.files;
  const allFiles = [...committedFiles, ...uncommittedFiles];

  if (allFiles.length === 0) {
    return <DiffEmptyState description={'The worktree has no changes compared to the base branch.'} />;
  }

  return (
    <DiffViewer
      className={'h-full'}
      committedFiles={committedFiles}
      files={allFiles}
      isSectioned={true}
      uncommittedFiles={uncommittedFiles}
    />
  );
};
