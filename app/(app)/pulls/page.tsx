'use client';

import { GitPullRequest, Plus } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';

import type { PrListFilters } from '@/types/github';

import { CreatePrDialog } from '@/components/pulls/create-pr-dialog';
import { PrListFilters as PrListFiltersComponent } from '@/components/pulls/pr-list-filters';
import { PrTable } from '@/components/pulls/pr-table';
import { Button } from '@/components/ui/button';
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
import { useGitBranches } from '@/hooks/queries/use-diff';
import { useGitHubAuth, usePullRequests } from '@/hooks/queries/use-github';
import { useProjects } from '@/hooks/queries/use-projects';
import { useRepositoriesByProject } from '@/hooks/queries/use-repositories';
import { optionsToItems } from '@/lib/utils';
import { isGitHubRepo } from '@/lib/utils/github';

export default function PullsPage() {
  const [projectId, setProjectId] = useQueryState('project', parseAsInteger);
  const [repoId, setRepoId] = useQueryState('repo', parseAsInteger);
  const [stateFilter, setStateFilter] = useQueryState('state', parseAsString.withDefault('open'));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: authStatus } = useGitHubAuth();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.archivedAt),
    [projects]
  );

  const { data: repositories = [] } = useRepositoriesByProject(projectId ?? 0);

  // Only show GitHub repositories
  const githubRepos = useMemo(
    () => repositories.filter((r) => isGitHubRepo(r.remoteUrl)),
    [repositories]
  );

  const selectedRepo = useMemo(
    () => githubRepos.find((r) => r.id === repoId),
    [githubRepos, repoId]
  );

  const repoPath = selectedRepo?.path;

  const filters: PrListFilters = useMemo(
    () => ({ state: (stateFilter as PrListFilters['state']) ?? 'open' }),
    [stateFilter]
  );

  const { data: prs = [], isLoading: isPrsLoading } = usePullRequests(repoPath, filters);
  const { data: branches = [] } = useGitBranches(repoPath);

  // Auto-select first project
  useEffect(() => {
    if (projectId === null && activeProjects.length > 0 && activeProjects[0]) {
      void setProjectId(activeProjects[0].id);
    }
  }, [projectId, activeProjects, setProjectId]);

  // Auto-select first GitHub repo when project changes
  useEffect(() => {
    if (githubRepos.length > 0 && githubRepos[0] && !repoId) {
      void setRepoId(githubRepos[0].id);
    }
  }, [githubRepos, repoId, setRepoId]);

  // Build select options
  const projectOptions = useMemo(
    () => activeProjects.map((p) => ({ label: p.name, value: String(p.id) })),
    [activeProjects]
  );
  const projectItems = useMemo(() => optionsToItems(projectOptions), [projectOptions]);

  const repoOptions = useMemo(
    () => githubRepos.map((r) => ({ label: r.name, value: String(r.id) })),
    [githubRepos]
  );
  const repoItems = useMemo(() => optionsToItems(repoOptions), [repoOptions]);

  if (isProjectsLoading) {
    return (
      <div className={'space-y-6'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Pull Requests'}</h1>
          <p className={'text-muted-foreground'}>{'Loading projects...'}</p>
        </div>
      </div>
    );
  }

  if (!authStatus?.isAuthenticated) {
    return (
      <div className={'space-y-6'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Pull Requests'}</h1>
          <p className={'text-muted-foreground'}>{'Manage pull requests across your GitHub repositories.'}</p>
        </div>
        <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
          <GitPullRequest className={'size-10'} />
          <p className={'text-sm'}>{'GitHub CLI is not authenticated.'}</p>
          <p className={'text-xs'}>{'Run `gh auth login` in your terminal to authenticate.'}</p>
        </div>
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <div className={'space-y-6'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Pull Requests'}</h1>
          <p className={'text-muted-foreground'}>{'Manage pull requests across your GitHub repositories.'}</p>
        </div>
        <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
          <GitPullRequest className={'size-10'} />
          <p className={'text-sm'}>{'Create a project with a GitHub repository first.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={'flex h-[calc(100vh-6rem)] flex-col gap-4'}>
      {/* Page Header */}
      <div className={'flex items-center justify-between'}>
        <div className={'space-y-1'}>
          <h1 className={'text-2xl font-semibold tracking-tight'}>{'Pull Requests'}</h1>
          <p className={'text-muted-foreground'}>{'Manage pull requests across your GitHub repositories.'}</p>
        </div>
        {repoPath && (
          <Button onClick={() => setIsCreateDialogOpen(true)} size={'sm'}>
            <Plus aria-hidden={'true'} className={'size-4'} />
            {'New PR'}
          </Button>
        )}
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
            onValueChange={(val) => void setRepoId(Number(val))}
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

        {/* State filter tabs */}
        <PrListFiltersComponent
          className={'ml-auto'}
          filters={filters}
          onFiltersChange={(f) => void setStateFilter(f.state ?? 'open')}
        />
      </div>

      {/* PR List */}
      <div className={'min-h-0 flex-1 overflow-hidden rounded-lg border border-border'}>
        {isPrsLoading ? (
          <div className={'flex items-center justify-center py-16 text-sm text-muted-foreground'}>
            {'Loading pull requests...'}
          </div>
        ) : githubRepos.length === 0 ? (
          <div className={'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground'}>
            <GitPullRequest className={'size-10'} />
            <p className={'text-sm'}>{'No GitHub repositories found for this project.'}</p>
          </div>
        ) : (
          <PrTable prs={prs} repoId={repoId ?? 0} />
        )}
      </div>

      {/* Create PR Dialog */}
      {repoPath && (
        <CreatePrDialog
          branches={branches}
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          repoPath={repoPath}
        />
      )}
    </div>
  );
}
