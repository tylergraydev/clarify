'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * Represents a single hook entry with body and optional matcher.
 */
export interface AgentHookEntry {
  /** The command/script to run */
  body: string;
  /** Tool/pattern to match (optional for PreToolUse/PostToolUse, not used for Stop) */
  matcher?: string;
}

/**
 * Hook configuration data organized by event type.
 */
export interface AgentHooksData {
  /** Hooks that run after a tool is used */
  PostToolUse?: Array<AgentHookEntry>;
  /** Hooks that run before a tool is used */
  PreToolUse?: Array<AgentHookEntry>;
  /** Hooks that run when the agent stops */
  Stop?: Array<AgentHookEntry>;
}

interface AgentHooksSectionProps {
  /** Current hooks configuration */
  hooks: AgentHooksData;
  /** Whether the inputs are disabled */
  isDisabled?: boolean;
  /** Callback when hooks change */
  onHooksChange: (hooks: AgentHooksData) => void;
}

type HookEventType = 'PostToolUse' | 'PreToolUse' | 'Stop';

const HOOK_EVENT_TYPES: Array<{ label: string; value: HookEventType }> = [
  { label: 'PreToolUse', value: 'PreToolUse' },
  { label: 'PostToolUse', value: 'PostToolUse' },
  { label: 'Stop', value: 'Stop' },
];

/**
 * Section for managing agent lifecycle hooks.
 * Allows configuring hooks for PreToolUse, PostToolUse, and Stop events.
 */
export const AgentHooksSection = ({ hooks, isDisabled = false, onHooksChange }: AgentHooksSectionProps) => {
  const [activeTab, setActiveTab] = useState<HookEventType>('PreToolUse');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [newMatcher, setNewMatcher] = useState('');

  const currentEntries = useMemo(() => hooks[activeTab] ?? [], [hooks, activeTab]);

  const getTotalHooksCount = () => {
    return (hooks.PreToolUse?.length ?? 0) + (hooks.PostToolUse?.length ?? 0) + (hooks.Stop?.length ?? 0);
  };

  const handleAddEntry = useCallback(() => {
    const trimmedBody = newBody.trim();
    const trimmedMatcher = newMatcher.trim();

    if (!trimmedBody) {
      return;
    }

    const isStopEventLocal = activeTab === 'Stop';
    const newEntry: AgentHookEntry = {
      body: trimmedBody,
      ...(isStopEventLocal ? {} : { matcher: trimmedMatcher || undefined }),
    };

    onHooksChange({
      ...hooks,
      [activeTab]: [...currentEntries, newEntry],
    });

    // Reset form
    setNewBody('');
    setNewMatcher('');
    setIsAddingEntry(false);
  }, [activeTab, currentEntries, hooks, newBody, newMatcher, onHooksChange]);

  const handleDeleteEntry = useCallback(
    (index: number) => {
      const updatedEntries = currentEntries.filter((_, i) => i !== index);

      onHooksChange({
        ...hooks,
        [activeTab]: updatedEntries.length > 0 ? updatedEntries : undefined,
      });
    },
    [activeTab, currentEntries, hooks, onHooksChange]
  );

  const handleCancelAdd = useCallback(() => {
    setIsAddingEntry(false);
    setNewBody('');
    setNewMatcher('');
  }, []);

  const handleTabChange = useCallback((value: HookEventType | null | number | string) => {
    if (value === 'PreToolUse' || value === 'PostToolUse' || value === 'Stop') {
      setActiveTab(value);
      // Reset form state when switching tabs
      setIsAddingEntry(false);
      setNewBody('');
      setNewMatcher('');
    }
  }, []);

  // Derived boolean variables (after handlers per convention)
  const isStopEvent = activeTab === 'Stop';
  const isShowEmptyState = currentEntries.length === 0 && !isAddingEntry;
  const isHasEntries = currentEntries.length > 0;

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className={'w-full justify-start px-2 py-1.5'}>
        <span className={'text-sm font-medium'}>{'Hooks'}</span>
        <span className={'ml-auto text-xs text-muted-foreground'}>
          {getTotalHooksCount()}
          {' configured'}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={'flex flex-col gap-4 pt-3'}>
          {/* Tabs for event types */}
          <TabsRoot onValueChange={handleTabChange} value={activeTab}>
            <TabsList>
              {HOOK_EVENT_TYPES.map((eventType) => {
                const count = hooks[eventType.value]?.length ?? 0;

                return (
                  <TabsTrigger key={eventType.value} value={eventType.value}>
                    {eventType.label}
                    {count > 0 && (
                      <span className={'ml-1.5 text-xs text-muted-foreground'}>
                        {'('}
                        {count}
                        {')'}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
              <TabsIndicator />
            </TabsList>

            {/* Tab panels */}
            {HOOK_EVENT_TYPES.map((eventType) => (
              <TabsPanel key={eventType.value} value={eventType.value}>
                <div className={'flex flex-col gap-3'}>
                  {/* Hook description */}
                  <p className={'text-xs text-muted-foreground'}>
                    {eventType.value === 'PreToolUse' &&
                      'Runs before a tool is used. Use matcher to target specific tools.'}
                    {eventType.value === 'PostToolUse' &&
                      'Runs after a tool is used. Use matcher to target specific tools.'}
                    {eventType.value === 'Stop' && 'Runs when the agent stops execution.'}
                  </p>

                  {/* Entries list */}
                  {isHasEntries && (
                    <div className={'flex flex-col gap-2'}>
                      {currentEntries.map((entry, index) => (
                        <HookEntryCard
                          entry={entry}
                          index={index}
                          isDisabled={isDisabled}
                          isShowMatcher={!isStopEvent}
                          key={`${eventType.value}-${index}`}
                          onDelete={handleDeleteEntry}
                        />
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {isShowEmptyState && (
                    <div className={'py-4 text-center text-sm text-muted-foreground'}>
                      {'No hooks configured for this event'}
                    </div>
                  )}

                  {/* Add entry form */}
                  {isAddingEntry ? (
                    <div className={'flex flex-col gap-3 rounded-md border border-border p-3'}>
                      {!isStopEvent && (
                        <div className={'flex flex-col gap-1'}>
                          <label className={'text-xs font-medium text-muted-foreground'} htmlFor={'hook-matcher'}>
                            {'Matcher (tool name or pattern)'}
                          </label>
                          <Input
                            disabled={isDisabled}
                            id={'hook-matcher'}
                            onChange={(e) => setNewMatcher(e.target.value)}
                            placeholder={'e.g., Bash, Edit, mcp__*'}
                            size={'sm'}
                            value={newMatcher}
                          />
                        </div>
                      )}
                      <div className={'flex flex-col gap-1'}>
                        <label className={'text-xs font-medium text-muted-foreground'} htmlFor={'hook-body'}>
                          {'Body (command to run)'}
                        </label>
                        <Textarea
                          autoFocus
                          className={'font-mono text-xs'}
                          disabled={isDisabled}
                          id={'hook-body'}
                          onChange={(e) => setNewBody(e.target.value)}
                          placeholder={'Enter the command or script to run...'}
                          size={'sm'}
                          value={newBody}
                        />
                      </div>
                      <div className={'flex justify-end gap-2'}>
                        <Button disabled={isDisabled} onClick={handleCancelAdd} size={'sm'} variant={'ghost'}>
                          {'Cancel'}
                        </Button>
                        <Button disabled={isDisabled || !newBody.trim()} onClick={handleAddEntry} size={'sm'}>
                          {'Add Hook'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className={'w-full'}
                      disabled={isDisabled}
                      onClick={() => setIsAddingEntry(true)}
                      size={'sm'}
                      variant={'outline'}
                    >
                      <Plus className={'mr-2 size-4'} />
                      {'Add Hook'}
                    </Button>
                  )}
                </div>
              </TabsPanel>
            ))}
          </TabsRoot>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface HookEntryCardProps {
  /** The hook entry to display */
  entry: AgentHookEntry;
  /** The index of the entry in the list */
  index: number;
  /** Whether the card actions are disabled */
  isDisabled?: boolean;
  /** Whether to show the matcher field */
  isShowMatcher?: boolean;
  /** Callback when delete is clicked */
  onDelete: (index: number) => void;
}

/**
 * Card component for displaying a single hook entry.
 */
const HookEntryCard = ({ entry, index, isDisabled = false, isShowMatcher = true, onDelete }: HookEntryCardProps) => {
  const handleDeleteClick = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  return (
    <div className={cn('flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3')}>
      {/* Header with matcher and delete button */}
      <div className={'flex items-start justify-between gap-2'}>
        <div className={'flex flex-col gap-1'}>
          {isShowMatcher && (
            <div className={'flex items-center gap-2'}>
              <span className={'text-xs text-muted-foreground'}>{'Matcher:'}</span>
              <span className={'font-mono text-xs font-medium'}>{entry.matcher || '(all tools)'}</span>
            </div>
          )}
        </div>
        <IconButton
          aria-label={'Delete hook'}
          className={'size-7'}
          disabled={isDisabled}
          onClick={handleDeleteClick}
          title={'Delete'}
        >
          <Trash2 className={'size-4 text-destructive'} />
        </IconButton>
      </div>

      {/* Body preview */}
      <div className={'flex flex-col gap-1'}>
        <span className={'text-xs text-muted-foreground'}>{'Body:'}</span>
        <pre className={cn('overflow-x-auto rounded-sm bg-muted/50 px-2 py-1.5', 'font-mono text-xs/relaxed')}>
          {entry.body}
        </pre>
      </div>
    </div>
  );
};
