'use client';

import { GitCommitHorizontal, PenLine } from 'lucide-react';

import type { DiffViewMode } from '@/lib/stores/diff-view-store';
import type { FileDiff } from '@/types/diff';

import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { ChangeStats } from './change-stats';
import { DiffFile } from './diff-file';

interface DiffSectionsProps {
  collapsedFiles: Set<string>;
  committedFiles: Array<FileDiff>;
  onToggleFileCollapse: (path: string) => void;
  repoPath?: string;
  uncommittedFiles: Array<FileDiff>;
  viewMode: DiffViewMode;
}

function computeSectionStats(files: Array<FileDiff>): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const file of files) {
    additions += file.stats.additions;
    deletions += file.stats.deletions;
  }
  return { additions, deletions };
}

export const DiffSections = ({
  collapsedFiles,
  committedFiles,
  onToggleFileCollapse,
  repoPath,
  uncommittedFiles,
  viewMode,
}: DiffSectionsProps) => {
  const isHasCommitted = committedFiles.length > 0;
  const isHasUncommitted = uncommittedFiles.length > 0;

  const committedStats = computeSectionStats(committedFiles);
  const uncommittedStats = computeSectionStats(uncommittedFiles);

  const defaultOpenValues: Array<number> = [];
  if (isHasCommitted) defaultOpenValues.push(0);
  if (isHasUncommitted) defaultOpenValues.push(1);

  return (
    <AccordionRoot defaultValue={defaultOpenValues}>
      {/* Committed Changes */}
      {isHasCommitted && (
        <AccordionItem value={0}>
          <AccordionHeader>
            <AccordionTrigger>
              <GitCommitHorizontal aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
              <span className={'text-sm font-medium'}>Committed Changes</span>
              <span className={'text-xs text-muted-foreground'}>
                ({committedFiles.length} file{committedFiles.length !== 1 ? 's' : ''})
              </span>
              <ChangeStats
                additions={committedStats.additions}
                className={'ml-1'}
                deletions={committedStats.deletions}
              />
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <div className={'flex flex-col gap-3 p-3'}>
              {committedFiles.map((file) => (
                <DiffFile
                  file={file}
                  isCollapsed={collapsedFiles.has(file.path)}
                  key={file.path}
                  onToggleCollapse={() => onToggleFileCollapse(file.path)}
                  repoPath={repoPath}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </AccordionPanel>
        </AccordionItem>
      )}
      {/* Uncommitted Changes */}
      {isHasUncommitted && (
        <AccordionItem value={1}>
          <AccordionHeader>
            <AccordionTrigger>
              <PenLine aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
              <span className={'text-sm font-medium'}>Uncommitted Changes</span>
              <span className={'text-xs text-muted-foreground'}>
                ({uncommittedFiles.length} file{uncommittedFiles.length !== 1 ? 's' : ''})
              </span>
              <ChangeStats
                additions={uncommittedStats.additions}
                className={'ml-1'}
                deletions={uncommittedStats.deletions}
              />
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <div className={'flex flex-col gap-3 p-3'}>
              {uncommittedFiles.map((file) => (
                <DiffFile
                  file={file}
                  isCollapsed={collapsedFiles.has(file.path)}
                  key={file.path}
                  onToggleCollapse={() => onToggleFileCollapse(file.path)}
                  repoPath={repoPath}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </AccordionPanel>
        </AccordionItem>
      )}
    </AccordionRoot>
  );
};
