'use client';

import { GitCompare } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';

import type { GitDiffResult } from '@/types/diff';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { DiffEmptyState } from '@/components/diff/diff-empty-state';
import { DiffLoadingSkeleton } from '@/components/diff/diff-loading-skeleton';
import { DiffViewer } from '@/components/diff/diff-viewer';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDiff, useGitBranches } from '@/hooks/queries/use-diff';
import { useProjects } from '@/hooks/queries/use-projects';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { optionsToItems } from '@/lib/utils';

interface ChangesContentProps {
  baseBranch: string;
  diffResult: GitDiffResult | undefined;
  isDiffLoading: boolean;
  targetBranch: string;
}

export default function ChangesPage() {
  const [projectId, setProjectId] = useQueryState('project', parseAsInteger);
  const [repoId, setRepoId] = useQueryState('repo', parseAsInteger);
  const [baseBranch, setBaseBranch] = useQueryState('base', parseAsString.withDefault(''));
  const [targetBranch, setTargetBranch] = useQueryState('target', parseAsString.withDefault(''));

  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.archivedAt),
    [projects]
  );

  const { data: repositories = [] } = useRepositoriesByProject(projectId ?? 0);

  const selectedRepo = useMemo(
    () => repositories.find((r) => r.id === repoId),
    [repositories, repoId]
  );

  const repoPath = selectedRepo?.path;

  const { data: branches = [] } = useGitBranches(repoPath);

  const { data: diffResult, isLoading: isDiffLoading } = useDiff(
    repoPath,
    baseBranch && targetBranch
      ? { base: baseBranch, target: targetBranch }
      : undefined
  );

  // Auto-select first project
  useEffect(() => {
    if (projectId === null && activeProjects.length > 0 && activeProjects[0]) {
      void setProjectId(activeProjects[0].id);
    }
  }, [projectId, activeProjects, setProjectId]);

  // Auto-select first repository when project changes
  useEffect(() => {
    if (repositories.length > 0 && repositories[0] && !repoId) {
      void setRepoId(repositories[0].id);
    }
  }, [repositories, repoId, setRepoId]);

  // Auto-select branches when repo changes
  useEffect(() => {
    if (branches.length > 0 && !baseBranch) {
      const mainBranch = branches.find((b) => b.name === 'main' || b.name === 'master');
      if (mainBranch) {
        void setBaseBranch(mainBranch.name);
      } else if (branches[0]) {
        void setBaseBranch(branches[0].name);
      }
    }
  }, [branches, baseBranch, setBaseBranch]);

  // Build select options
  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ label: p.name, value: String(p.id) })),
    [activeProjects]
  );
  const projectItems = useMemo(() => optionsToItems(projectOptions), [projectOptions]);

  const repoOptions = useMemo(
    () => repositories.map((r) => ({ label: r.name, value: String(r.id) })),
    [repositories]
  );
  const repoItems = useMemo(() => optionsToItems(repoOptions), [repoOptions]);

  const localBranches = useMemo(
    () => branches.filter((b) => !b.isRemote),
    [branches]
  );
  const branchOptions = useMemo(
    () => localBranches.map((b) => ({ label: b.name, value: b.name })),
    [localBranches]
  );
  const branchItems = useMemo(() => optionsToItems(branchOptions), [branchOptions]);

  if (isProjectsLoading) {
    return (
      <div className={'space-y-6'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Changes'}</h1>
          <p className={'text-muted-foreground'}>{'Loading projects...'}</p>
        </div>
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <div className={'space-y-6'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Changes'}</h1>
          <p className={'text-muted-foreground'}>{'View code changes across your projects.'}</p>
        </div>
        <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
          <GitCompare className={'size-10'} />
          <p className={'text-sm'}>{'Create a project first to view changes.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={'flex h-[calc(100vh-6rem)] flex-col gap-4'}>
      {/* Page Header */}
      <div className={'flex items-center justify-between'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Changes'}</h1>
          <p className={'text-muted-foreground'}>{'View code changes across your projects.'}</p>
        </div>
      </div>

      {/* Selectors */}
      <div className={'flex items-center gap-3'}>
        {/* Project Selector */}
        <div className={'w-48'}>
          <SelectRoot
            items={projectItems}
            onValueChange={(val) => {
              void setProjectId(Number(val));
              void setRepoId(null);
              void setBaseBranch('');
              void setTargetBranch('');
            }}
            value={projectId !== null ? String(projectId) : ''}
          >
            <SelectTrigger aria-label={'Select project'} size={'sm'}>
              <SelectValue placeholder={'Select project'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {projectOptions.map((option) => (
                      <SelectItem key={option.value} size={'sm'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>
        </div>

        {/* Repository Selector */}
        <div className={'w-48'}>
          <SelectRoot
            items={repoItems}
            onValueChange={(val) => {
              void setRepoId(Number(val));
              void setBaseBranch('');
              void setTargetBranch('');
            }}
            value={repoId !== null ? String(repoId) : ''}
          >
            <SelectTrigger aria-label={'Select repository'} size={'sm'}>
              <SelectValue placeholder={'Select repository'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {repoOptions.map((option) => (
                      <SelectItem key={option.value} size={'sm'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>
        </div>

        {/* Base Branch */}
        <div className={'w-40'}>
          <SelectRoot
            items={branchItems}
            onValueChange={(val) => void setBaseBranch(val)}
            value={baseBranch}
          >
            <SelectTrigger aria-label={'Base branch'} size={'sm'}>
              <SelectValue placeholder={'Base branch'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {branchOptions.map((option) => (
                      <SelectItem key={option.value} size={'sm'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>
        </div>

        <span className={'text-xs text-muted-foreground'}>{'→'}</span>

        {/* Target Branch */}
        <div className={'w-40'}>
          <SelectRoot
            items={branchItems}
            onValueChange={(val) => void setTargetBranch(val)}
            value={targetBranch}
          >
            <SelectTrigger aria-label={'Target branch'} size={'sm'}>
              <SelectValue placeholder={'Target branch'} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {branchOptions.map((option) => (
                      <SelectItem key={option.value} size={'sm'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>
        </div>
      </div>

      {/* Diff Content */}
      <QueryErrorBoundary>
        <div className={'min-h-0 flex-1 overflow-hidden rounded-lg border border-border'}>
          <ChangesContent
            baseBranch={baseBranch}
            diffResult={diffResult}
            isDiffLoading={isDiffLoading}
            targetBranch={targetBranch}
          />
        </div>
      </QueryErrorBoundary>
    </div>
  );
}

const ChangesContent = ({ baseBranch, diffResult, isDiffLoading, targetBranch }: ChangesContentProps) => {
  if (isDiffLoading) {
    return <DiffLoadingSkeleton />;
  }

  const isHasResults = diffResult && diffResult.files.length > 0;
  const isBranchesSelected = Boolean(baseBranch && targetBranch);

  if (!isHasResults) {
    return (
      <DiffEmptyState
        description={
          isBranchesSelected
            ? 'No differences found between the selected branches.'
            : 'Select a base and target branch to compare changes.'
        }
      />
    );
  }

  return <DiffViewer files={diffResult.files} />;
};
