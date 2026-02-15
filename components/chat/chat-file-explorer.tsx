'use client';

import { ChevronsDownUpIcon, FolderIcon, SearchIcon, XIcon } from 'lucide-react';
import { memo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useDirectoryListing } from '@/hooks/queries/use-file-explorer';
import { useFileExplorerStore } from '@/lib/stores/file-explorer-store';

import { FileExplorerTreeNode } from './file-explorer-tree-node';

interface ChatFileExplorerProps {
  onClose: () => void;
  repoPath: string;
}

export const ChatFileExplorer = memo(({ onClose, repoPath }: ChatFileExplorerProps) => {
  const { collapseAll, selectedFiles } = useFileExplorerStore();
  const [filterQuery, setFilterQuery] = useState('');

  // Load root directory
  const { data: rootEntries = [], isLoading } = useDirectoryListing(repoPath);

  // Filter entries if there's a filter query
  const filteredEntries = filterQuery
    ? rootEntries.filter((e) => e.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : rootEntries;

  return (
    <div className={'flex w-72 shrink-0 flex-col border-l border-border bg-muted/30'}>
      {/* Header */}
      <div className={'flex items-center justify-between border-b border-border p-3'}>
        <div className={'flex items-center gap-2'}>
          <FolderIcon className={'size-4 text-muted-foreground'} />
          <h3 className={'text-sm font-medium'}>{'Files'}</h3>
          {selectedFiles.length > 0 && (
            <span className={'rounded-full bg-accent px-1.5 py-0.5 text-[10px] leading-none font-medium'}>
              {selectedFiles.length}
            </span>
          )}
        </div>
        <div className={'flex items-center gap-0.5'}>
          <Button onClick={collapseAll} size={'icon-sm'} title={'Collapse all'} type={'button'} variant={'ghost'}>
            <ChevronsDownUpIcon className={'size-3.5'} />
          </Button>
          <Button onClick={onClose} size={'icon-sm'} type={'button'} variant={'ghost'}>
            <XIcon className={'size-3.5'} />
          </Button>
        </div>
      </div>

      {/* Search filter */}
      <div className={'border-b border-border px-3 py-2'}>
        <div className={'relative'}>
          <SearchIcon className={'absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground'} />
          <input
            className={'w-full rounded-sm border border-border bg-transparent py-1 pr-2 pl-7 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none'}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={'Filter files...'}
            type={'text'}
            value={filterQuery}
          />
        </div>
      </div>

      {/* Tree */}
      <div className={'flex-1 overflow-y-auto p-1'}>
        {isLoading ? (
          <p className={'p-2 text-xs text-muted-foreground'}>{'Loading...'}</p>
        ) : filteredEntries.length === 0 ? (
          <p className={'p-2 text-xs text-muted-foreground'}>{'No files found'}</p>
        ) : (
          filteredEntries.map((entry) => (
            <FileExplorerTreeNode
              depth={0}
              key={entry.relativePath}
              name={entry.name}
              relativePath={entry.relativePath}
              repoPath={repoPath}
              type={entry.type}
            />
          ))
        )}
      </div>

      {/* Selected files footer */}
      {selectedFiles.length > 0 && (
        <div className={'border-t border-border px-3 py-2'}>
          <div className={'flex items-center justify-between'}>
            <span className={'text-xs text-muted-foreground'}>
              {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}{' selected'}
            </span>
            <Button
              onClick={() => useFileExplorerStore.getState().clearFileSelections()}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              {'Clear'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

ChatFileExplorer.displayName = 'ChatFileExplorer';
