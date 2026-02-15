'use client';

import { FileIcon, XIcon } from 'lucide-react';
import { memo } from 'react';

interface ChatFileChipsProps {
  files: Array<{ relativePath: string }>;
  onRemove: (relativePath: string) => void;
}

export const ChatFileChips = memo(({ files, onRemove }: ChatFileChipsProps) => {
  if (files.length === 0) return null;

  return (
    <div className={'flex flex-wrap gap-1 px-1 pb-1.5'}>
      {files.map((file) => {
        const fileName = file.relativePath.split('/').pop() ?? file.relativePath;
        return (
          <span
            className={'inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-xs'}
            key={file.relativePath}
            title={file.relativePath}
          >
            <FileIcon className={'size-3 shrink-0 text-muted-foreground'} />
            <span className={'max-w-[120px] truncate'}>{fileName}</span>
            <button
              className={'ml-0.5 rounded-sm p-0.5 hover:bg-muted'}
              onClick={() => onRemove(file.relativePath)}
              type={'button'}
            >
              <XIcon className={'size-2.5'} />
            </button>
          </span>
        );
      })}
    </div>
  );
});

ChatFileChips.displayName = 'ChatFileChips';
