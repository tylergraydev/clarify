'use client';

import { Plus, Star, StarOff, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { AgentSkill } from '@/types/electron';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import {
  useAgentSkills,
  useCreateAgentSkill,
  useDeleteAgentSkill,
  useSetAgentSkillRequired,
} from '@/hooks/queries/use-agent-skills';
import { cn } from '@/lib/utils';
import { agentSkillInputSchema } from '@/lib/validations/agent';

interface AgentSkillsManagerProps {
  agentId: number;
  isDisabled?: boolean;
}

/**
 * Skills manager component for edit mode with database persistence.
 * Manages agent skills through direct database operations via mutations.
 * Used when editing existing agents with saved skill configurations.
 *
 * @param props - Component props
 * @param props.agentId - The ID of the agent to manage skills for
 * @param props.isDisabled - Whether the inputs are disabled
 */
export const AgentSkillsManager = ({ agentId, isDisabled = false }: AgentSkillsManagerProps) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [validationError, setValidationError] = useState<null | string>(null);

  const { data: skills = [], isLoading } = useAgentSkills(agentId);
  const createMutation = useCreateAgentSkill();
  const deleteMutation = useDeleteAgentSkill();
  const setRequiredMutation = useSetAgentSkillRequired();

  const handleAddSkill = async () => {
    // Clear previous validation error
    setValidationError(null);

    // Validate input with Zod schema
    const result = agentSkillInputSchema.safeParse({
      name: newSkillName.trim(),
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
        skillName: result.data.name,
      });
      setNewSkillName('');
      setIsAdding(false);
      setValidationError(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteSkill = async (skill: AgentSkill) => {
    try {
      await deleteMutation.mutateAsync({ agentId, id: skill.id });
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleRequired = async (skill: AgentSkill) => {
    const isRequired = skill.requiredAt !== null;
    try {
      await setRequiredMutation.mutateAsync({
        id: skill.id,
        required: !isRequired,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const isRequired = (skill: AgentSkill) => skill.requiredAt !== null;

  if (isLoading) {
    return <div className={'py-4 text-center text-sm text-muted-foreground'}>{'Loading skills...'}</div>;
  }

  return (
    <div className={'flex flex-col gap-3'}>
      {/* Skills List */}
      {skills.length > 0 ? (
        <div className={'flex flex-col gap-2'}>
          {skills.map((skill) => (
            <div
              className={cn('flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2')}
              key={skill.id}
            >
              <div className={'min-w-0 flex-1'}>
                <div className={'flex items-center gap-2'}>
                  <span className={'font-mono text-sm font-medium'}>{skill.skillName}</span>
                  {isRequired(skill) && <span className={'text-xs font-medium text-required-indicator'}>{'Required'}</span>}
                </div>
              </div>
              <div className={'flex items-center gap-1'}>
                <IconButton
                  aria-label={isRequired(skill) ? 'Mark as optional' : 'Mark as required'}
                  className={'size-7'}
                  disabled={isDisabled}
                  onClick={() => handleToggleRequired(skill)}
                  title={isRequired(skill) ? 'Mark as optional' : 'Mark as required'}
                >
                  {isRequired(skill) ? (
                    <Star className={'size-4 fill-required-indicator text-required-indicator'} />
                  ) : (
                    <StarOff className={'size-4 text-muted-foreground'} />
                  )}
                </IconButton>
                <IconButton
                  aria-label={'Delete skill'}
                  className={'size-7'}
                  disabled={isDisabled}
                  onClick={() => handleDeleteSkill(skill)}
                  title={'Delete'}
                >
                  <Trash2 className={'size-4 text-destructive'} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={'py-4 text-center text-sm text-muted-foreground'}>{'No skills configured'}</div>
      )}

      {/* Add Skill Form */}
      {isAdding ? (
        <div className={'flex flex-col gap-2 rounded-md border border-border p-3'}>
          <div className={'flex flex-col gap-1'}>
            <Input
              autoFocus
              disabled={isDisabled || createMutation.isPending}
              onChange={(e) => {
                setNewSkillName(e.target.value);
                setValidationError(null);
              }}
              placeholder={'Skill name (e.g., react-coding-conventions)'}
              value={newSkillName}
            />
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
              type={'button'}
              variant={'ghost'}
            >
              {'Cancel'}
            </Button>
            <Button
              disabled={isDisabled || !newSkillName.trim() || createMutation.isPending}
              onClick={handleAddSkill}
              size={'sm'}
            >
              {createMutation.isPending ? 'Adding...' : 'Add Skill'}
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
          {'Add Skill'}
        </Button>
      )}
    </div>
  );
};
