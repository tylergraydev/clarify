'use client';

import { useCallback } from 'react';

import type { ToolSelection } from '@/types/agent-tools';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CLAUDE_BUILTIN_TOOLS } from '@/lib/constants/claude-tools';
import { cn } from '@/lib/utils';

interface BuiltinToolsSelectorProps {
  /** Whether the inputs are disabled */
  isDisabled?: boolean;
  /** Callback when tool selections change */
  onChange: (tools: Array<ToolSelection>) => void;
  /** Current tool selections */
  value: Array<ToolSelection>;
}

/**
 * Displays built-in Claude Code tools as a checklist with toggles.
 * Each tool can be enabled/disabled with an optional pattern for argument restrictions.
 */
export const BuiltinToolsSelector = ({ isDisabled = false, onChange, value }: BuiltinToolsSelectorProps) => {
  // Get current selection state for a tool
  const getToolSelection = useCallback(
    (toolName: string): ToolSelection | undefined => {
      return value.find((t) => t.toolName === toolName);
    },
    [value]
  );

  // Check if a tool is enabled
  const isToolEnabled = useCallback(
    (toolName: string): boolean => {
      const selection = getToolSelection(toolName);
      return selection?.enabled ?? false;
    },
    [getToolSelection]
  );

  // Get pattern for a tool
  const getToolPattern = useCallback(
    (toolName: string): string => {
      const selection = getToolSelection(toolName);
      return selection?.pattern ?? '*';
    },
    [getToolSelection]
  );

  // Toggle a tool's enabled state
  const handleToggle = useCallback(
    (toolName: string, checked: boolean) => {
      const existingIndex = value.findIndex((t) => t.toolName === toolName);
      const newTools = [...value];

      if (existingIndex >= 0) {
        // Update existing tool
        const existing = newTools[existingIndex];
        if (existing) {
          newTools[existingIndex] = {
            enabled: checked,
            pattern: existing.pattern,
            toolName: existing.toolName,
          };
        }
      } else {
        // Add new tool selection
        newTools.push({
          enabled: checked,
          pattern: '*',
          toolName,
        });
      }

      onChange(newTools);
    },
    [value, onChange]
  );

  // Update a tool's pattern
  const handlePatternChange = useCallback(
    (toolName: string, pattern: string) => {
      const existingIndex = value.findIndex((t) => t.toolName === toolName);
      const newTools = [...value];

      if (existingIndex >= 0) {
        const existing = newTools[existingIndex];
        if (existing) {
          newTools[existingIndex] = {
            enabled: existing.enabled,
            pattern,
            toolName: existing.toolName,
          };
        }
      } else {
        // Add new tool with pattern (enabled by default if pattern is being set)
        newTools.push({
          enabled: true,
          pattern,
          toolName,
        });
      }

      onChange(newTools);
    },
    [value, onChange]
  );

  return (
    <div className={'flex flex-col gap-1'}>
      <div className={'mb-2 text-sm font-medium text-foreground'}>{'Built-in Tools'}</div>
      <div className={'flex flex-col gap-2'}>
        {CLAUDE_BUILTIN_TOOLS.map((tool) => {
          const isEnabled = isToolEnabled(tool.name);
          const pattern = getToolPattern(tool.name);

          return (
            <div
              className={cn(
                'flex items-center gap-3 rounded-md border border-border px-3 py-2',
                !isEnabled && 'bg-muted/30 opacity-60'
              )}
              key={tool.name}
            >
              <Switch
                checked={isEnabled}
                disabled={isDisabled}
                onCheckedChange={(checked) => handleToggle(tool.name, checked)}
                size={'sm'}
              />
              <div className={'flex min-w-0 flex-1 items-center gap-3'}>
                <div className={'flex flex-col'}>
                  <span className={'font-mono text-sm font-medium'}>{tool.name}</span>
                  <span className={'text-xs text-muted-foreground'}>{tool.description}</span>
                </div>
              </div>
              <div className={'flex items-center gap-2'}>
                <span className={'text-xs text-muted-foreground'}>{'Pattern:'}</span>
                <Input
                  className={'h-7 w-24 font-mono text-xs'}
                  disabled={isDisabled || !isEnabled}
                  onChange={(e) => handlePatternChange(tool.name, e.target.value)}
                  placeholder={'*'}
                  value={isEnabled ? pattern : ''}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
