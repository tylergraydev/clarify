'use client';

import { Eye, Plus, RotateCcw, Search, SkipForward } from 'lucide-react';
import { Fragment } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Separator } from '@/components/ui/separator';

const DISCOVERED_FILES = [
  {
    action: 'modify' as const,
    filePath: 'db/schema/users.schema.ts',
    priority: 'critical' as const,
    relevance: 'Defines user table schema that needs new columns for the feature',
  },
  {
    action: 'create' as const,
    filePath: 'components/features/users/user-card.tsx',
    priority: 'high' as const,
    relevance: 'New component to display user profile summary cards',
  },
  {
    action: 'modify' as const,
    filePath: 'electron/ipc/users.ipc.ts',
    priority: 'high' as const,
    relevance: 'IPC handlers need new endpoints for user data queries',
  },
  {
    action: 'create' as const,
    filePath: 'hooks/queries/use-users.ts',
    priority: 'medium' as const,
    relevance: 'React Query hooks for fetching and caching user data',
  },
  {
    action: 'modify' as const,
    filePath: 'db/repositories/users.repository.ts',
    priority: 'critical' as const,
    relevance: 'Repository needs new query methods for user lookups',
  },
] as const;

const ACTION_VARIANT_MAP: Record<string, 'completed' | 'researching'> = {
  create: 'completed',
  modify: 'researching',
};

const PRIORITY_VARIANT_MAP: Record<string, 'anthropic' | 'failed' | 'pending'> = {
  critical: 'failed',
  high: 'pending',
  medium: 'anthropic',
};

const handleAddFile = () => {
  // No-op: placeholder
};

const handleViewFile = () => {
  // No-op: placeholder
};

const handleRerun = () => {
  // No-op: placeholder
};

const handleDiscoverMore = () => {
  // No-op: placeholder
};

const handleSkip = () => {
  // No-op: placeholder
};

export const FileDiscoveryStepContent = () => {
  return (
    <div className={'flex flex-col gap-6'}>
      {/* Add File Action */}
      <div className={'flex items-center justify-between'}>
        <h3 className={'text-sm font-medium text-foreground'}>Discovered Files</h3>
        <Button onClick={handleAddFile} size={'sm'} variant={'outline'}>
          <Plus aria-hidden={'true'} className={'size-4'} />
          Add File
        </Button>
      </div>

      {/* File Discovery Table */}
      <div className={'overflow-auto rounded-md border border-border'}>
        <table className={'w-full border-collapse'}>
          <thead>
            <tr>
              <th
                className={
                  'border-b border-border bg-muted/50 px-4 py-2.5 text-left text-sm font-medium text-muted-foreground'
                }
              >
                File Path
              </th>
              <th
                className={
                  'border-b border-border bg-muted/50 px-4 py-2.5 text-left text-sm font-medium text-muted-foreground'
                }
              >
                Action
              </th>
              <th
                className={
                  'border-b border-border bg-muted/50 px-4 py-2.5 text-left text-sm font-medium text-muted-foreground'
                }
              >
                Priority
              </th>
              <th
                className={
                  'border-b border-border bg-muted/50 px-4 py-2.5 text-left text-sm font-medium text-muted-foreground'
                }
              >
                Relevance
              </th>
              <th
                className={
                  'border-b border-border bg-muted/50 px-4 py-2.5 text-right text-sm font-medium text-muted-foreground'
                }
              >
                <span className={'sr-only'}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {DISCOVERED_FILES.map((file) => (
              <tr className={'transition-colors hover:bg-muted/50'} key={file.filePath}>
                <td className={'border-b border-border px-4 py-3 font-mono text-sm text-foreground'}>
                  {file.filePath}
                </td>
                <td className={'border-b border-border px-4 py-3'}>
                  <Badge size={'sm'} variant={ACTION_VARIANT_MAP[file.action]}>
                    {file.action}
                  </Badge>
                </td>
                <td className={'border-b border-border px-4 py-3'}>
                  <Badge size={'sm'} variant={PRIORITY_VARIANT_MAP[file.priority]}>
                    {file.priority}
                  </Badge>
                </td>
                <td className={'border-b border-border px-4 py-3 text-sm text-muted-foreground'}>{file.relevance}</td>
                <td className={'border-b border-border px-4 py-3 text-right'}>
                  <IconButton aria-label={'View file'} onClick={handleViewFile}>
                    <Eye aria-hidden={'true'} className={'size-4'} />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Text */}
      <p className={'text-sm text-muted-foreground'}>5 files discovered across 3 directories</p>

      <Separator />

      {/* Action Bar */}
      <div className={'flex items-center gap-2'}>
        <Button onClick={handleRerun} variant={'outline'}>
          <RotateCcw aria-hidden={'true'} className={'size-4'} />
          Re-run
        </Button>

        <Button onClick={handleDiscoverMore} variant={'outline'}>
          <Search aria-hidden={'true'} className={'size-4'} />
          Discover More
        </Button>

        <Button onClick={handleSkip} variant={'ghost'}>
          <SkipForward aria-hidden={'true'} className={'size-4'} />
          Skip
        </Button>

        {/* Agent Dropdown Placeholder */}
        <Fragment>
          <div className={'ml-auto'}>
            <Button disabled variant={'outline'}>
              Agent: Default
            </Button>
          </div>
        </Fragment>
      </div>
    </div>
  );
};
