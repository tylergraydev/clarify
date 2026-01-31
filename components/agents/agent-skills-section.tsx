'use client';

import { Plus, Star, StarOff, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { PendingSkillData } from '@/types/agent-skills';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { agentSkillInputSchema } from '@/lib/validations/agent';

interface AgentSkillsSectionProps {
  /** Whether the inputs are disabled */
  disabled?: boolean;
  /** Callback when skills change */
  onSkillsChange: (skills: Array<PendingSkillData>) => void;
  /** Current pending skills */
  skills: Array<PendingSkillData>;
}

/**
 * Stateless skills section for agent creation mode.
 * Manages pending skills in local state before agent is created.
 *
 * This is a purely presentational component - state management
 * should be handled by the parent component.
 */
export const AgentSkillsSection = ({ disabled = false, onSkillsChange, skills }: AgentSkillsSectionProps) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [validationError, setValidationError] = useState<null | string>(null);

  const handleAddSkill = () => {
    // Clear previous validation error
    setValidationError(null);

    const trimmedName = newSkillName.trim();

    // Validate input with Zod schema
    const result = agentSkillInputSchema.safeParse({
      name: trimmedName,
    });

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      setValidationError(firstIssue?.message ?? 'Invalid input');
      return;
    }

    // Check for duplicates
    if (skills.some((s) => s.skillName === trimmedName)) {
      setValidationError('This skill has already been added');
      return;
    }

    // Add the new skill
    onSkillsChange([
      ...skills,
      {
        isRequired: false,
        skillName: trimmedName,
      },
    ]);

    setNewSkillName('');
    setIsAdding(false);
    setValidationError(null);
  };

  const handleDeleteSkill = (skillName: string) => {
    onSkillsChange(skills.filter((s) => s.skillName !== skillName));
  };

  const handleToggleRequired = (skillName: string) => {
    onSkillsChange(skills.map((s) => (s.skillName === skillName ? { ...s, isRequired: !s.isRequired } : s)));
  };

  return (
    <div className={'flex flex-col gap-3'}>
      {/* Skills List */}
      {skills.length > 0 ? (
        <div className={'flex flex-col gap-2'}>
          {skills.map((skill) => (
            <div
              className={cn('flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2')}
              key={skill.skillName}
            >
              <div className={'min-w-0 flex-1'}>
                <div className={'flex items-center gap-2'}>
                  <span className={'font-mono text-sm font-medium'}>{skill.skillName}</span>
                  {skill.isRequired && <span className={'text-xs font-medium text-yellow-500'}>{'Required'}</span>}
                </div>
              </div>
              <div className={'flex items-center gap-1'}>
                <IconButton
                  aria-label={skill.isRequired ? 'Mark as optional' : 'Mark as required'}
                  className={'size-7'}
                  disabled={disabled}
                  onClick={() => handleToggleRequired(skill.skillName)}
                  title={skill.isRequired ? 'Mark as optional' : 'Mark as required'}
                >
                  {skill.isRequired ? (
                    <Star className={'size-4 fill-yellow-500 text-yellow-500'} />
                  ) : (
                    <StarOff className={'size-4 text-muted-foreground'} />
                  )}
                </IconButton>
                <IconButton
                  aria-label={'Delete skill'}
                  className={'size-7'}
                  disabled={disabled}
                  onClick={() => handleDeleteSkill(skill.skillName)}
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
              disabled={disabled}
              onChange={(e) => {
                setNewSkillName(e.target.value);
                setValidationError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                  setValidationError(null);
                }
              }}
              placeholder={'Skill name (e.g., react-coding-conventions)'}
              value={newSkillName}
            />
            {validationError && <p className={'text-xs text-destructive'}>{validationError}</p>}
          </div>
          <div className={'flex justify-end gap-2'}>
            <Button
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
            <Button disabled={disabled || !newSkillName.trim()} onClick={handleAddSkill} size={'sm'}>
              {'Add Skill'}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className={'w-full'}
          disabled={disabled}
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
