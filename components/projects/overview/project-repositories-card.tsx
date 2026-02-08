'use client';

import { FolderGit2 } from 'lucide-react';
import { Fragment } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

interface ProjectRepositoriesCardProps {
  onManageClick: () => void;
  repositories: Array<{
    defaultBranch: string;
    id: number;
    name: string;
    path: string;
    remoteUrl: null | string;
    setAsDefaultAt: null | string;
  }>;
}

/** Displays a "Repositories" card showing repository details with branch info and default status in the project overview. */
export const ProjectRepositoriesCard = ({ onManageClick, repositories }: ProjectRepositoriesCardProps) => {
  const hasRepositories = repositories.length > 0;

  const repositoryCountText = hasRepositories
    ? `${repositories.length} ${repositories.length === 1 ? 'repository' : 'repositories'} connected`
    : 'No repositories connected';

  return (
    <Card>
      {/* Header */}
      <CardHeader>
        <div className={'flex items-center gap-2'}>
          <FolderGit2 aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Repositories</CardTitle>
        </div>
        <CardDescription>{repositoryCountText}</CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent>
        {hasRepositories ? (
          <Fragment>
            {/* Repository List */}
            <div className={'space-y-2'}>
              {repositories.map((repository) => {
                const isDefault = repository.setAsDefaultAt !== null;
                const displayUrl = repository.remoteUrl ?? repository.path;

                return (
                  <div className={'rounded-lg border border-card-border bg-muted/30 p-3'} key={repository.id}>
                    {/* Top Line */}
                    <div className={'flex items-center gap-2'}>
                      <span className={'min-w-0 flex-1 truncate text-sm font-medium'}>{repository.name}</span>
                      <div className={'flex shrink-0 items-center gap-1.5'}>
                        <Badge size={'sm'} variant={'default'}>
                          {repository.defaultBranch}
                        </Badge>
                        {isDefault && (
                          <Badge size={'sm'} variant={'completed'}>
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Bottom Line */}
                    <p className={'mt-1 truncate text-xs text-muted-foreground'}>{displayUrl}</p>
                  </div>
                );
              })}
            </div>

            {/* Manage Link */}
            <div className={'mt-4 flex justify-center'}>
              <button
                className={'cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground'}
                onClick={onManageClick}
                type={'button'}
              >
                Manage repositories
              </button>
            </div>
          </Fragment>
        ) : (
          <EmptyState
            description={'Add a repository to get started.'}
            icon={<FolderGit2 aria-hidden={'true'} className={'size-6'} />}
            title={'No repositories'}
          />
        )}
      </CardContent>
    </Card>
  );
};
