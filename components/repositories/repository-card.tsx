'use client';

import type { ComponentPropsWithRef } from 'react';

import { format } from 'date-fns';
import { FolderGit2, Pencil, Star, StarOff, Trash2 } from 'lucide-react';

import type { Repository } from '@/db/schema';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RepositoryCardProps extends Omit<ComponentPropsWithRef<'div'>, 'onClick'> {
  isDefault?: boolean;
  onClearDefault?: (repositoryId: number) => void;
  onDelete?: (repositoryId: number) => void;
  onEdit?: (repository: Repository) => void;
  onSetDefault?: (repositoryId: number) => void;
  repository: Repository;
}

export const RepositoryCard = ({
  className,
  isDefault = false,
  onClearDefault,
  onDelete,
  onEdit,
  onSetDefault,
  ref,
  repository,
  ...props
}: RepositoryCardProps) => {
  const handleClearDefaultClick = () => {
    onClearDefault?.(repository.id);
  };

  const handleDeleteClick = () => {
    onDelete?.(repository.id);
  };

  const handleEditClick = () => {
    onEdit?.(repository);
  };

  const handleSetDefaultClick = () => {
    onSetDefault?.(repository.id);
  };

  const formattedDate = format(new Date(repository.createdAt), 'MMM d, yyyy');
  const titleId = `repository-title-${repository.id}`;

  return (
    <Card
      aria-label={`${repository.name} repository`}
      className={cn('flex flex-col transition-opacity', className)}
      ref={ref}
      role={'article'}
      {...props}
    >
      {/* Header */}
      <CardHeader>
        <div className={'flex items-start justify-between gap-2'}>
          <div className={'flex items-center gap-2'}>
            <FolderGit2 aria-hidden={'true'} className={'size-4 shrink-0 text-muted-foreground'} />
            <CardTitle className={'line-clamp-1'} id={titleId}>
              {repository.name}
            </CardTitle>
          </div>
          {isDefault && (
            <Badge aria-label={'Repository is default'} variant={'default'}>
              Default
            </Badge>
          )}
        </div>
        <CardDescription className={'line-clamp-1 font-mono text-xs'}>{repository.path}</CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent className={'flex flex-1 flex-col gap-2'}>
        {/* Branch Info */}
        <div aria-label={'Branch information'} className={'flex items-center gap-2'} role={'group'}>
          <span className={'text-sm text-muted-foreground'}>{'Default branch:'}</span>
          <code className={'rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground'}>
            {repository.defaultBranch}
          </code>
        </div>

        {/* Created Date */}
        <div aria-label={'Creation date'} role={'group'}>
          <p className={'text-xs text-muted-foreground'}>
            Created
            {formattedDate}
          </p>
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter aria-label={'Repository actions'} className={'gap-2'} role={'group'}>
        {isDefault ? (
          <Button
            aria-describedby={titleId}
            aria-label={`Clear default status for ${repository.name}`}
            onClick={handleClearDefaultClick}
            size={'sm'}
            variant={'outline'}
          >
            <StarOff aria-hidden={'true'} className={'size-4'} />
            Clear Default
          </Button>
        ) : (
          <Button
            aria-describedby={titleId}
            aria-label={`Set ${repository.name} as default`}
            onClick={handleSetDefaultClick}
            size={'sm'}
            variant={'outline'}
          >
            <Star aria-hidden={'true'} className={'size-4'} />
            Set Default
          </Button>
        )}
        <Button
          aria-describedby={titleId}
          aria-label={`Edit ${repository.name} repository`}
          onClick={handleEditClick}
          size={'sm'}
          variant={'ghost'}
        >
          <Pencil aria-hidden={'true'} className={'size-4'} />
          Edit
        </Button>
        <Button
          aria-describedby={titleId}
          aria-label={`Remove ${repository.name} repository`}
          onClick={handleDeleteClick}
          size={'sm'}
          variant={'ghost'}
        >
          <Trash2 aria-hidden={'true'} className={'size-4'} />
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
};
