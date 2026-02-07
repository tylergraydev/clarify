'use client';

import { Archive, ArchiveRestore, FolderGit2, Pencil, Plus, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ProjectQuickActionsCardProps = {
  isArchived: boolean;
  onAddRepository: () => void;
  onArchiveToggle: () => void;
  onCreateWorkflow: () => void;
  onEditProject: () => void;
};

/**
 * Displays a "Quick Actions" card with buttons for common project operations
 * such as creating workflows, adding repositories, editing, and archiving.
 */
export const ProjectQuickActionsCard = ({
  isArchived,
  onAddRepository,
  onArchiveToggle,
  onCreateWorkflow,
  onEditProject,
}: ProjectQuickActionsCardProps) => {
  return (
    <Card>
      {/* Header */}
      <CardHeader>
        <div className={'flex items-center gap-2'}>
          <Zap aria-hidden={'true'} className={'size-5 text-muted-foreground'} />
          <CardTitle>Quick Actions</CardTitle>
        </div>
      </CardHeader>

      {/* Actions */}
      <CardContent className={'space-y-2'}>
        {/* Create Workflow */}
        <Button className={'w-full'} onClick={onCreateWorkflow} variant={'default'}>
          <Plus aria-hidden={'true'} className={'mr-2 size-4'} />
          Create Workflow
        </Button>

        {/* Add Repository */}
        <Button className={'w-full'} onClick={onAddRepository} variant={'outline'}>
          <FolderGit2 aria-hidden={'true'} className={'mr-2 size-4'} />
          Add Repository
        </Button>

        {/* Edit Project */}
        <Button className={'w-full'} onClick={onEditProject} variant={'outline'}>
          <Pencil aria-hidden={'true'} className={'mr-2 size-4'} />
          Edit Project
        </Button>

        {/* Archive / Unarchive */}
        <Button className={'w-full'} onClick={onArchiveToggle} variant={'outline'}>
          {isArchived ? (
            <ArchiveRestore aria-hidden={'true'} className={'mr-2 size-4'} />
          ) : (
            <Archive aria-hidden={'true'} className={'mr-2 size-4'} />
          )}
          {isArchived ? 'Unarchive Project' : 'Archive Project'}
        </Button>
      </CardContent>
    </Card>
  );
};
