'use client';

import type { KeyboardEvent } from 'react';

import { Star } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';

import type { Project } from '@/db/schema';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useFavoriteProjects } from '@/hooks/queries/use-projects';
import { cn } from '@/lib/utils';

type FavoriteProjectCardProps = ClassName<{
  onClick: () => void;
  project: Project;
}>;

type FavoritesWidgetProps = ClassName;

/**
 * Truncates text to a maximum length with ellipsis
 */
const truncateText = (text: null | string | undefined, maxLength: number): string => {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
};

const FavoriteProjectCardSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading favorite project'}
      className={`
        animate-pulse rounded-lg border border-card-border bg-card p-4
      `}
      role={'article'}
    >
      {/* Project Name */}
      <div className={'h-5 w-32 rounded-sm bg-muted'} />

      {/* Description */}
      <div className={'mt-2 h-4 w-full rounded-sm bg-muted'} />
      <div className={'mt-1 h-4 w-3/4 rounded-sm bg-muted'} />
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div
      aria-busy={'true'}
      aria-label={'Loading favorite projects'}
      aria-live={'polite'}
      className={'space-y-3'}
      role={'status'}
    >
      <FavoriteProjectCardSkeleton />
      <FavoriteProjectCardSkeleton />
      <FavoriteProjectCardSkeleton />
    </div>
  );
};

const FavoriteProjectCard = ({ className, onClick, project }: FavoriteProjectCardProps) => {
  const truncatedDescription = truncateText(project.description, 80);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      aria-label={`View project: ${project.name}`}
      className={cn(
        `
          cursor-pointer rounded-lg border border-card-border bg-card p-4
          transition-all duration-150 hover:border-accent hover:bg-card/80 hover:shadow-sm
          focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset
          active:scale-[0.99]
        `,
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={'button'}
      tabIndex={0}
    >
      {/* Project Name */}
      <h4 className={'truncate font-medium'}>{project.name}</h4>

      {/* Description */}
      {truncatedDescription && <p className={'mt-1 text-sm text-muted-foreground'}>{truncatedDescription}</p>}
    </div>
  );
};

const FavoritesContent = () => {
  const router = useRouter();
  const { data: favoriteProjects = [], isLoading } = useFavoriteProjects();

  const handleProjectClick = (projectId: number) => {
    router.push(
      $path({
        route: '/projects/[id]',
        routeParams: { id: String(projectId) },
      })
    );
  };

  const isFavoritesEmpty = favoriteProjects.length === 0;

  // Loading State
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Empty State
  if (isFavoritesEmpty) {
    return (
      <EmptyState
        description={'Star a project to add it here.'}
        icon={<Star aria-hidden={'true'} className={'size-6'} />}
        title={'No favorite projects'}
      />
    );
  }

  // Favorites List
  return (
    <div aria-live={'polite'} className={'space-y-3'}>
      {favoriteProjects.map((project) => (
        <FavoriteProjectCard key={project.id} onClick={() => handleProjectClick(project.id)} project={project} />
      ))}
    </div>
  );
};

export const FavoritesWidget = ({ className }: FavoritesWidgetProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className={'flex items-center gap-2'}>
          <Star aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Favorite Projects</CardTitle>
        </div>
        <CardDescription>Quick access to your starred projects</CardDescription>
      </CardHeader>
      <CardContent>
        <QueryErrorBoundary>
          <FavoritesContent />
        </QueryErrorBoundary>
      </CardContent>
    </Card>
  );
};
