'use client';

import { useMemo, useState } from 'react';

import type { AgentWithRelations } from '@/components/agents/agent-table';
import type { Project } from '@/db/schema';

import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { optionsToItems } from '@/lib/utils';

interface SelectProjectDialogProps {
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** The mode of the operation */
  mode: 'copy' | 'move';
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Callback when user confirms with a project ID (null = global) */
  onSelect: (projectId: null | number) => void;
  /** List of available projects */
  projects: Array<Project>;
  /** The source agent being moved/copied */
  sourceAgent: AgentWithRelations | null;
}

export const SelectProjectDialog = ({
  isLoading = false,
  isOpen,
  mode,
  onOpenChange,
  onSelect,
  projects,
  sourceAgent,
}: SelectProjectDialogProps) => {
  const [selectedValue, setSelectedValue] = useState<string>('');

  const isGlobalAgent = sourceAgent?.projectId === null;
  const isMoveMode = mode === 'move';

  const options = useMemo(() => {
    const result: Array<{ label: string; value: string }> = [];

    if (isMoveMode && !isGlobalAgent) {
      result.push({ label: 'Global (all projects)', value: 'global' });
    }

    for (const project of projects) {
      if (!project.archivedAt) {
        if (isMoveMode && project.id === sourceAgent?.projectId) {
          continue;
        }
        result.push({ label: project.name, value: String(project.id) });
      }
    }

    return result;
  }, [isGlobalAgent, isMoveMode, projects, sourceAgent?.projectId]);

  const items = useMemo(() => optionsToItems(options), [options]);

  const handleConfirmClick = () => {
    if (!selectedValue) return;
    const projectId = selectedValue === 'global' ? null : Number(selectedValue);
    onSelect(projectId);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedValue('');
    }
    onOpenChange(isOpen);
  };

  const handleValueChange = (value: null | string) => {
    setSelectedValue(value ?? '');
  };

  const title = isMoveMode ? 'Move Agent' : 'Copy Agent to Project';
  const description = isMoveMode
    ? `Select a destination for "${sourceAgent?.displayName ?? 'this agent'}".`
    : `Select a project to copy "${sourceAgent?.displayName ?? 'this agent'}" to.`;
  const isConfirmDisabled = isLoading || !selectedValue;
  const confirmButtonLabel = isLoading ? (isMoveMode ? 'Moving...' : 'Copying...') : isMoveMode ? 'Move' : 'Copy';

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'dialog'} size={'sm'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={'select-project-dialog-title'}>{title}</DialogTitle>
            <DialogDescription id={'select-project-dialog-description'}>{description}</DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className={'mt-4 space-y-4'}>
            <SelectRoot disabled={isLoading} items={items} onValueChange={handleValueChange} value={selectedValue}>
              <SelectTrigger aria-label={'Select destination'}>
                <SelectValue placeholder={'Select a destination...'} />
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup>
                    <SelectList>
                      {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </SelectRoot>
          </div>

          {/* Footer */}
          <DialogFooter sticky={false}>
            <DialogClose>
              <Button disabled={isLoading} variant={'outline'}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              aria-describedby={'select-project-dialog-description'}
              aria-label={
                isMoveMode
                  ? `Move ${sourceAgent?.displayName ?? 'agent'} to selected destination`
                  : `Copy ${sourceAgent?.displayName ?? 'agent'} to selected project`
              }
              disabled={isConfirmDisabled}
              onClick={handleConfirmClick}
            >
              {confirmButtonLabel}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
