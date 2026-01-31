'use client';

import { Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { AgentTool } from '@/types/electron';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import {
  useAgentTools,
  useAllowAgentTool,
  useCreateAgentTool,
  useDeleteAgentTool,
  useDisallowAgentTool,
} from '@/hooks/queries/use-agent-tools';
import { cn } from '@/lib/utils';
import { agentToolInputSchema } from '@/lib/validations/agent';

interface AgentToolsManagerProps {
  agentId: number;
  isDisabled?: boolean;
}

/**
 * Check if a tool is currently allowed (not disallowed).
 * @param tool - The agent tool to check
 * @returns true if the tool is allowed, false otherwise
 */
const isToolAllowed = (tool: AgentTool): boolean => tool.disallowedAt === null;

/**
 * Tools manager component for edit mode with database persistence.
 * Manages agent tools through direct database operations via mutations.
 * Used when editing existing agents with saved tool configurations.
 *
 * @param props - Component props
 * @param props.agentId - The ID of the agent to manage tools for
 * @param props.isDisabled - Whether the inputs are disabled
 */
export const AgentToolsManager = ({ agentId, isDisabled = false }: AgentToolsManagerProps) => {
  const [newToolName, setNewToolName] = useState('');
  const [newToolPattern, setNewToolPattern] = useState('*');
  const [isAdding, setIsAdding] = useState(false);
  const [validationError, setValidationError] = useState<null | string>(null);

  const { data: tools = [], isLoading } = useAgentTools(agentId);
  const createMutation = useCreateAgentTool();
  const deleteMutation = useDeleteAgentTool();
  const allowMutation = useAllowAgentTool();
  const disallowMutation = useDisallowAgentTool();

  const handleAddTool = async () => {
    // Clear previous validation error
    setValidationError(null);

    // Validate input with Zod schema
    const result = agentToolInputSchema.safeParse({
      name: newToolName.trim(),
      pattern: newToolPattern.trim() || undefined,
    });

    if (!result.success) {
      // Get the first error message from Zod issues
      const firstIssue = result.error.issues[0];
      setValidationError(firstIssue?.message ?? 'Invalid input');
      return;
    }

    try {
      await createMutation.mutateAsync({
        agentId,
        toolName: result.data.name,
        toolPattern: result.data.pattern ?? '*',
      });
      setNewToolName('');
      setNewToolPattern('*');
      setIsAdding(false);
      setValidationError(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteTool = async (tool: AgentTool) => {
    try {
      await deleteMutation.mutateAsync({ agentId, id: tool.id });
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleTool = async (tool: AgentTool) => {
    try {
      if (tool.disallowedAt) {
        await allowMutation.mutateAsync(tool.id);
      } else {
        await disallowMutation.mutateAsync(tool.id);
      }
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return <div className={'py-4 text-center text-sm text-muted-foreground'}>{'Loading tools...'}</div>;
  }

  return (
    <div className={'flex flex-col gap-3'}>
      {/* Tools List */}
      {tools.length > 0 ? (
        <div className={'flex flex-col gap-2'}>
          {tools.map((tool) => (
            <div
              className={cn(
                'flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2',
                !isToolAllowed(tool) && 'opacity-60'
              )}
              key={tool.id}
            >
              <div className={'min-w-0 flex-1'}>
                <div className={'flex items-center gap-2'}>
                  <span className={'font-mono text-sm font-medium'}>{tool.toolName}</span>
                  {tool.toolPattern !== '*' && (
                    <span className={'text-xs text-muted-foreground'}>
                      {'('}
                      {tool.toolPattern}
                      {')'}
                    </span>
                  )}
                </div>
                {!isToolAllowed(tool) && <span className={'text-xs text-muted-foreground'}>{'Disallowed'}</span>}
              </div>
              <div className={'flex items-center gap-1'}>
                <IconButton
                  aria-label={isToolAllowed(tool) ? 'Disallow tool' : 'Allow tool'}
                  className={'size-7'}
                  disabled={isDisabled}
                  onClick={() => handleToggleTool(tool)}
                  title={isToolAllowed(tool) ? 'Disallow' : 'Allow'}
                >
                  {isToolAllowed(tool) ? (
                    <ToggleRight className={'size-4 text-success-indicator'} />
                  ) : (
                    <ToggleLeft className={'size-4 text-muted-foreground'} />
                  )}
                </IconButton>
                <IconButton
                  aria-label={'Delete tool'}
                  className={'size-7'}
                  disabled={isDisabled}
                  onClick={() => handleDeleteTool(tool)}
                  title={'Delete'}
                >
                  <Trash2 className={'size-4 text-destructive'} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={'py-4 text-center text-sm text-muted-foreground'}>{'No tools configured'}</div>
      )}

      {/* Add Tool Form */}
      {isAdding ? (
        <div className={'flex flex-col gap-2 rounded-md border border-border p-3'}>
          <div className={'flex flex-col gap-1'}>
            <div className={'flex gap-2'}>
              <Input
                autoFocus
                className={'flex-1'}
                disabled={isDisabled || createMutation.isPending}
                onChange={(e) => {
                  setNewToolName(e.target.value);
                  setValidationError(null);
                }}
                placeholder={'Tool name (e.g., Read, Write, Bash)'}
                value={newToolName}
              />
              <Input
                className={'w-32'}
                disabled={isDisabled || createMutation.isPending}
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
            <Button
              disabled={createMutation.isPending}
              onClick={() => {
                setIsAdding(false);
                setValidationError(null);
              }}
              size={'sm'}
              variant={'ghost'}
            >
              {'Cancel'}
            </Button>
            <Button
              disabled={isDisabled || !newToolName.trim() || createMutation.isPending}
              onClick={handleAddTool}
              size={'sm'}
              type={'button'}
            >
              {createMutation.isPending ? 'Adding...' : 'Add Tool'}
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
          {'Add Tool'}
        </Button>
      )}
    </div>
  );
};
