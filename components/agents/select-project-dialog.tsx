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

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Component
// ============================================================================

/**
 * Dialog for selecting a target project when moving or copying an agent.
 *
 * Features:
 * - Displays list of available projects
 * - Shows "Global" option for move operations
 * - Excludes current project for move operations
 * - Loading state during mutation
 */
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

  // Computed values
  const isGlobalAgent = sourceAgent?.projectId === null;
  const isMoveMode = mode === 'move';

  // Dialog content
  const title = isMoveMode ? 'Move Agent' : 'Copy Agent to Project';
  const description = isMoveMode
    ? `Select a destination for "${sourceAgent?.displayName ?? 'this agent'}".`
    : `Select a project to copy "${sourceAgent?.displayName ?? 'this agent'}" to.`;

  // Build options list
  const options = useMemo(() => {
    const result: Array<{ label: string; value: string }> = [];

    // Add global option only for move mode when agent is not already global
    if (isMoveMode && !isGlobalAgent) {
      result.push({ label: 'Global (all projects)', value: 'global' });
    }

    // Add projects, excluding archived and current project for move mode
    for (const project of projects) {
      if (!project.archivedAt) {
        // Skip current project for move mode
        if (isMoveMode && project.id === sourceAgent?.projectId) {
          continue;
        }
        result.push({ label: project.name, value: String(project.id) });
      }
    }

    return result;
  }, [isGlobalAgent, isMoveMode, projects, sourceAgent?.projectId]);

  // Build items map for SelectRoot to display labels instead of raw values
  const items = useMemo(() => optionsToItems(options), [options]);

  // Handlers
  const handleConfirmClick = () => {
    if (!selectedValue) return;
    const projectId = selectedValue === 'global' ? null : Number(selectedValue);
    onSelect(projectId);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedValue('');
    }
    onOpenChange(open);
  };

  const handleValueChange = (value: null | string) => {
    setSelectedValue(value ?? '');
  };

  // Derived states
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
                {'Cancel'}
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
