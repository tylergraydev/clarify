'use client';

import type { ComponentPropsWithRef } from 'react';

import { format } from 'date-fns';
import { Archive, ArchiveRestore, ExternalLink } from 'lucide-react';

import type { Project } from '@/db/schema/projects.schema';

import { ConfirmArchiveDialog } from '@/components/projects/confirm-archive-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectTableProps extends ComponentPropsWithRef<'div'> {
  /** Whether an archive mutation is in progress */
  isArchiving?: boolean;
  /** Callback when the user confirms archiving a project */
  onArchive?: (projectId: number) => void;
  /** Callback when the user confirms unarchiving a project */
  onUnarchive?: (projectId: number) => void;
  /** Callback when the user clicks view details on a project */
  onViewDetails?: (projectId: number) => void;
  /** Array of projects to display */
  projects: Array<Project>;
}

export const ProjectTable = ({
  className,
  isArchiving = false,
  onArchive,
  onUnarchive,
  onViewDetails,
  projects,
  ref,
  ...props
}: ProjectTableProps) => {
  const handleArchiveConfirm = (projectId: number) => {
    onArchive?.(projectId);
  };

  const handleUnarchiveConfirm = (projectId: number) => {
    onUnarchive?.(projectId);
  };

  const handleViewDetailsClick = (projectId: number) => {
    onViewDetails?.(projectId);
  };

  const handleRowClick = (projectId: number) => {
    onViewDetails?.(projectId);
  };

  return (
    <div
      className={cn('overflow-x-auto rounded-lg border border-border', className)}
      ref={ref}
      {...props}
    >
      <table className={'w-full border-collapse text-sm'}>
        {/* Table Header */}
        <thead className={'border-b border-border bg-muted/50'}>
          <tr>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Name'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Description'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Created'}
            </th>
            <th
              className={'px-4 py-3 text-left font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Status'}
            </th>
            <th
              className={'px-4 py-3 text-right font-medium text-muted-foreground'}
              scope={'col'}
            >
              {'Actions'}
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className={'divide-y divide-border'}>
          {projects.map((project) => {
            const isArchived = project.archivedAt !== null;
            const formattedDate = format(new Date(project.createdAt), 'MMM d, yyyy');

            return (
              <tr
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/30',
                  isArchived && 'opacity-60'
                )}
                key={project.id}
                onClick={() => handleRowClick(project.id)}
              >
                {/* Name Cell */}
                <td className={'px-4 py-3'}>
                  <button
                    className={cn(
                      'text-left font-medium text-foreground hover:text-accent',
                      'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
                      'focus-visible:outline-none'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetailsClick(project.id);
                    }}
                    type={'button'}
                  >
                    {project.name}
                  </button>
                </td>

                {/* Description Cell */}
                <td className={'max-w-xs truncate px-4 py-3 text-muted-foreground'}>
                  {project.description || '-'}
                </td>

                {/* Created Cell */}
                <td className={'px-4 py-3 whitespace-nowrap text-muted-foreground'}>
                  {formattedDate}
                </td>

                {/* Status Cell */}
                <td className={'px-4 py-3'}>
                  <Badge variant={isArchived ? 'stale' : 'completed'}>
                    {isArchived ? 'Archived' : 'Active'}
                  </Badge>
                </td>

                {/* Actions Cell */}
                <td className={'px-4 py-3'}>
                  <div
                    className={'flex items-center justify-end gap-2'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View Details */}
                    <Button
                      aria-label={`View details for ${project.name}`}
                      onClick={() => handleViewDetailsClick(project.id)}
                      size={'sm'}
                      variant={'ghost'}
                    >
                      <ExternalLink aria-hidden={'true'} className={'size-4'} />
                      {'View'}
                    </Button>

                    {/* Archive/Unarchive */}
                    {isArchived ? (
                      <ConfirmArchiveDialog
                        isArchived={true}
                        isLoading={isArchiving}
                        onConfirm={() => handleUnarchiveConfirm(project.id)}
                        projectName={project.name}
                        trigger={
                          <Button
                            aria-label={`Unarchive ${project.name}`}
                            size={'sm'}
                            variant={'ghost'}
                          >
                            <ArchiveRestore aria-hidden={'true'} className={'size-4'} />
                            {'Unarchive'}
                          </Button>
                        }
                      />
                    ) : (
                      <ConfirmArchiveDialog
                        isArchived={false}
                        isLoading={isArchiving}
                        onConfirm={() => handleArchiveConfirm(project.id)}
                        projectName={project.name}
                        trigger={
                          <Button
                            aria-label={`Archive ${project.name}`}
                            size={'sm'}
                            variant={'ghost'}
                          >
                            <Archive aria-hidden={'true'} className={'size-4'} />
                            {'Archive'}
                          </Button>
                        }
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
