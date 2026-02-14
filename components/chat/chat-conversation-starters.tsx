'use client';

import { CodeIcon, FileSearchIcon, LightbulbIcon, WrenchIcon } from 'lucide-react';
import { memo } from 'react';

interface ChatConversationStartersProps {
  onSelect: (prompt: string) => void;
}

const STARTERS = [
  {
    icon: LightbulbIcon,
    label: 'Explain the codebase',
    prompt: 'Give me a high-level overview of this codebase. What are the main modules and how do they fit together?',
  },
  {
    icon: FileSearchIcon,
    label: 'Find relevant files',
    prompt: 'What files are most relevant to the core functionality of this project?',
  },
  {
    icon: WrenchIcon,
    label: 'Suggest improvements',
    prompt: 'What are some potential improvements or refactoring opportunities in this codebase?',
  },
  {
    icon: CodeIcon,
    label: 'Help with a task',
    prompt: 'I need help implementing a new feature. Let me describe what I need...',
  },
] as const;

export const ChatConversationStarters = memo(({ onSelect }: ChatConversationStartersProps) => {
  return (
    <div className={'grid grid-cols-2 gap-3 p-4'}>
      {STARTERS.map((starter) => {
        const Icon = starter.icon;
        return (
          <button
            className={
              'flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50'
            }
            key={starter.label}
            onClick={() => onSelect(starter.prompt)}
            type={'button'}
          >
            <Icon className={'mt-0.5 size-4 shrink-0 text-muted-foreground'} />
            <span className={'text-xs text-foreground'}>{starter.label}</span>
          </button>
        );
      })}
    </div>
  );
});

ChatConversationStarters.displayName = 'ChatConversationStarters';
