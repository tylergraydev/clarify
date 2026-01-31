'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { CreateToolData } from '@/types/agent-tools';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { isBuiltinTool } from '@/lib/constants/claude-tools';
import { cn } from '@/lib/utils';

interface CustomToolEntry {
  /** The pattern for tool arguments */
  pattern: string;
  /** Unique key for React rendering */
  tempId: string;
  /** The name of the tool */
  toolName: string;
}

interface CustomToolsManagerProps {
  /** Whether the inputs are disabled */
  isDisabled?: boolean;
  /** Callback when custom tools change */
  onChange: (tools: Array<CreateToolData>) => void;
  /** Current custom tools */
  value: Array<CreateToolData>;
}

/**
 * Manages custom (MCP / user-defined) tools for agents.
 * Allows adding and removing tools that are not built-in Claude Code tools.
 */
export const CustomToolsManager = ({ isDisabled = false, onChange, value }: CustomToolsManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolPattern, setNewToolPattern] = useState('*');
  const [validationError, setValidationError] = useState<null | string>(null);

  // Convert value to entries with temp IDs for rendering
  const entries: Array<CustomToolEntry> = value.map((tool, index) => ({
    ...tool,
    tempId: `custom-tool-${index}-${tool.toolName}`,
  }));

  const handleAddTool = useCallback(() => {
    const trimmedName = newToolName.trim();
    const trimmedPattern = newToolPattern.trim() || '*';

    // Validate
    if (!trimmedName) {
      setValidationError('Tool name is required');
      return;
    }

    if (isBuiltinTool(trimmedName)) {
      setValidationError(`"${trimmedName}" is a built-in tool. Use the Built-in Tools section above.`);
      return;
    }

    // Check for duplicates
    if (value.some((t) => t.toolName === trimmedName)) {
      setValidationError(`"${trimmedName}" is already added`);
      return;
    }

    // Add the tool
    onChange([...value, { pattern: trimmedPattern, toolName: trimmedName }]);

    // Reset form
    setNewToolName('');
    setNewToolPattern('*');
    setIsAdding(false);
    setValidationError(null);
  }, [newToolName, newToolPattern, onChange, value]);

  const handleDeleteTool = useCallback(
    (toolName: string) => {
      onChange(value.filter((t) => t.toolName !== toolName));
    },
    [onChange, value]
  );

  const handleCancel = useCallback(() => {
    setIsAdding(false);
    setNewToolName('');
    setNewToolPattern('*');
    setValidationError(null);
  }, []);

  return (
    <div className={'flex flex-col gap-2'}>
      <div className={'text-sm font-medium text-foreground'}>{'Custom Tools (MCP / User-defined)'}</div>

      {/* Custom Tools List */}
      {entries.length > 0 ? (
        <div className={'flex flex-col gap-2'}>
          {entries.map((entry) => (
            <div
              className={cn('flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2')}
              key={entry.tempId}
            >
              <div className={'min-w-0 flex-1'}>
                <div className={'flex items-center gap-2'}>
                  <span className={'font-mono text-sm font-medium'}>{entry.toolName}</span>
                  {entry.pattern !== '*' && <span className={'text-xs text-muted-foreground'}>({entry.pattern})</span>}
                </div>
              </div>
              <IconButton
                aria-label={'Delete tool'}
                className={'size-7'}
                disabled={isDisabled}
                onClick={() => handleDeleteTool(entry.toolName)}
                title={'Delete'}
              >
                <Trash2 className={'size-4 text-destructive'} />
              </IconButton>
            </div>
          ))}
        </div>
      ) : (
        !isAdding && <div className={'py-2 text-center text-sm text-muted-foreground'}>{'No custom tools added'}</div>
      )}

      {/* Add Tool Form */}
      {isAdding ? (
        <div className={'flex flex-col gap-2 rounded-md border border-border p-3'}>
          <div className={'flex flex-col gap-1'}>
            <div className={'flex gap-2'}>
              <Input
                autoFocus
                className={'flex-1'}
                disabled={isDisabled}
                onChange={(e) => {
                  setNewToolName(e.target.value);
                  setValidationError(null);
                }}
                placeholder={'Tool name (e.g., mcp__github__search)'}
                value={newToolName}
              />
              <Input
                className={'w-32'}
                disabled={isDisabled}
                onChange={(e) => {
                  setNewToolPattern(e.target.value);
                  setValidationError(null);
                }}
                placeholder={'Pattern'}
                value={newToolPattern}
              />
            </div>
            {validationError && <p className={'text-xs text-destructive'}>{validationError}</p>}
          </div>
          <div className={'flex justify-end gap-2'}>
            <Button disabled={isDisabled} onClick={handleCancel} size={'sm'} variant={'ghost'}>
              Cancel
            </Button>
            <Button disabled={isDisabled || !newToolName.trim()} onClick={handleAddTool} size={'sm'} type={'button'}>
              Add Tool
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className={'w-full'}
          disabled={isDisabled}
          onClick={() => setIsAdding(true)}
          size={'sm'}
          variant={'outline'}
        >
          <Plus className={'mr-2 size-4'} />
          Add Custom Tool
        </Button>
      )}
    </div>
  );
};
