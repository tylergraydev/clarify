'use client';

import type { ReactElement } from 'react';

import { ChevronDown, ChevronUp, Plus, TerminalSquare, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTerminal } from '@/hooks/use-terminal';
import { useTerminalStore } from '@/lib/stores/terminal-store';
import { cn } from '@/lib/utils';

interface TerminalTabBarProps {
  className?: string;
}

export const TerminalTabBar = ({ className }: TerminalTabBarProps): ReactElement => {
  const { activeTabId, isOpen, setActiveTab, tabs, toggle } = useTerminalStore();
  const { closeTerminal, createTerminal } = useTerminal();

  return (
    <div
      className={cn(
        'flex h-9 shrink-0 items-center border-t border-border bg-muted/50',
        className
      )}
    >
      {/* Terminal label */}
      <div className={'flex items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground'}>
        <TerminalSquare className={'size-3.5'} />
        <span>{'Terminal'}</span>
      </div>

      {/* Tab list */}
      <div className={'flex flex-1 items-center gap-0.5 overflow-x-auto px-1'}>
        {tabs.map((tab) => (
          <button
            className={cn(
              'group flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors',
              activeTabId === tab.terminalId
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            key={tab.terminalId}
            onClick={() => {
              setActiveTab(tab.terminalId);
              if (!isOpen) toggle();
            }}
          >
            <span className={'max-w-[120px] truncate'}>{tab.title}</span>
            <button
              aria-label={`Close ${tab.title}`}
              className={cn(
                'ml-0.5 rounded-sm p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted',
                activeTabId === tab.terminalId && 'opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation();
                closeTerminal(tab.terminalId);
              }}
            >
              <X className={'size-3'} />
            </button>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className={'flex items-center gap-0.5 px-2'}>
        <Button
          aria-label={'New terminal'}
          className={'size-6'}
          onClick={() => createTerminal()}
          size={'icon'}
          variant={'ghost'}
        >
          <Plus className={'size-3.5'} />
        </Button>
        <Button
          aria-label={isOpen ? 'Collapse terminal' : 'Expand terminal'}
          className={'size-6'}
          onClick={toggle}
          size={'icon'}
          variant={'ghost'}
        >
          {isOpen ? <ChevronDown className={'size-3.5'} /> : <ChevronUp className={'size-3.5'} />}
        </Button>
      </div>
    </div>
  );
};
