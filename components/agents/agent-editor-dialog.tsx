'use client';

import { Fragment, memo } from 'react';

import type { PendingSkillData } from '@/types/agent-skills';
import type { CreateToolData, ToolSelection } from '@/types/agent-tools';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAgentEditorForm } from '@/hooks/agents/use-agent-editor-form';

import type { AgentEditorDialogProps } from './agent-editor-dialog.types';

import { AgentEditorFormFields } from './agent-editor-form-fields';
import { type AgentHooksData, AgentHooksSection } from './agent-hooks-section';
import { AgentSkillsSection } from './agent-skills-section';
import { AgentToolsSection } from './agent-tools-section';
import { ConfirmDiscardDialog } from './confirm-discard-dialog';
import { ConfirmResetAgentDialog } from './confirm-reset-agent-dialog';

/**
 * Props for the memoized tools collapsible section
 */
interface ToolsCollapsibleSectionProps {
  customTools: Array<CreateToolData>;
  isDisabled: boolean;
  onCustomToolsChange: (tools: Array<CreateToolData>) => void;
  onToolSelectionsChange: (selections: Array<ToolSelection>) => void;
  toolSelections: Array<ToolSelection>;
}

/**
 * Memoized tools collapsible section to prevent re-renders when parent state changes
 */
const ToolsCollapsibleSection = memo(function ToolsCollapsibleSection({
  customTools,
  isDisabled,
  onCustomToolsChange,
  onToolSelectionsChange,
  toolSelections,
}: ToolsCollapsibleSectionProps) {
  const enabledToolsCount = toolSelections.filter((s) => s.enabled).length + customTools.length;

  return (
    <Collapsible className={'rounded-md border border-border'}>
      <CollapsibleTrigger className={'w-full justify-start px-3 py-2'}>
        <span>{'Allowed Tools'}</span>
        <span className={'ml-auto text-xs text-muted-foreground'}>
          {enabledToolsCount}
          {' configured'}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={'border-t border-border p-3'}>
          <AgentToolsSection
            customTools={customTools}
            isDisabled={isDisabled}
            onCustomToolsChange={onCustomToolsChange}
            onToolSelectionsChange={onToolSelectionsChange}
            toolSelections={toolSelections}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

/**
 * Props for the memoized skills collapsible section
 */
interface SkillsCollapsibleSectionProps {
  isDisabled: boolean;
  onSkillsChange: (skills: Array<PendingSkillData>) => void;
  pendingSkills: Array<PendingSkillData>;
}

/**
 * Memoized skills collapsible section to prevent re-renders when parent state changes
 */
const SkillsCollapsibleSection = memo(function SkillsCollapsibleSection({
  isDisabled,
  onSkillsChange,
  pendingSkills,
}: SkillsCollapsibleSectionProps) {
  return (
    <Collapsible className={'rounded-md border border-border'}>
      <CollapsibleTrigger className={'w-full justify-start px-3 py-2'}>
        <span>{'Referenced Skills'}</span>
        <span className={'ml-auto text-xs text-muted-foreground'}>
          {pendingSkills.length}
          {' configured'}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={'border-t border-border p-3'}>
          <AgentSkillsSection isDisabled={isDisabled} onSkillsChange={onSkillsChange} skills={pendingSkills} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

/**
 * Props for the memoized hooks collapsible section
 */
interface HooksCollapsibleSectionProps {
  hooks: AgentHooksData;
  isDisabled: boolean;
  onHooksChange: (hooks: AgentHooksData) => void;
}

/**
 * Memoized hooks collapsible section to prevent re-renders when parent state changes
 * Note: AgentHooksSection already contains its own Collapsible, so we just wrap with border styling
 */
const HooksCollapsibleSection = memo(function HooksCollapsibleSection({
  hooks,
  isDisabled,
  onHooksChange,
}: HooksCollapsibleSectionProps) {
  return (
    <div className={'rounded-md border border-border'}>
      <AgentHooksSection hooks={hooks} isDisabled={isDisabled} onHooksChange={onHooksChange} />
    </div>
  );
});

/**
 * Dialog for creating and editing agents with full configuration options.
 * Supports both create and edit modes with controlled/uncontrolled open state.
 * Manages agent properties, tools, skills, and hooks configuration.
 */
export const AgentEditorDialog = ({
  agent,
  initialData,
  isOpen: controlledIsOpen,
  mode,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  projectId,
  trigger,
}: AgentEditorDialogProps) => {
  const {
    canEditAgentName,
    customTools,
    derivedFlags,
    dialogLabels,
    form,
    handleAgentTypeChange,
    handleConfirmDiscard,
    handleConfirmReset,
    handleFormSubmit,
    handleOpenChange,
    handleResetClick,
    isDiscardDialogOpen,
    isOpen,
    isResetDialogOpen,
    pendingHooks,
    pendingSkills,
    projectOptions,
    projectQuery,
    setCustomTools,
    setIsDiscardDialogOpen,
    setIsResetDialogOpen,
    setPendingHooks,
    setPendingSkills,
    setToolSelections,
    showBuiltInNameDisplay,
    toolSelections,
  } = useAgentEditorForm({
    agent,
    controlledIsOpen,
    controlledOnOpenChange,
    initialData,
    mode,
    onSuccess,
    projectId,
  });

  const {
    isBuiltIn,
    isCollapsibleDisabled,
    isEditMode,
    isProjectScoped,
    isProjectSelectorDisabled,
    isResetButtonVisible,
    isResetting,
    isSubmitting,
    isViewMode,
  } = derivedFlags;

  const { agentTypeLabel, dialogDescription, dialogTitle, submitLabel } = dialogLabels;
  const { isDuplicateMode } = derivedFlags;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Dialog Trigger */}
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      {/* Dialog Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'dialog'} scrollable={true} size={'xl'}>
          {/* Dialog Header */}
          <DialogHeader
            badges={
              <Fragment>
                {/* Project Scope Badge */}
                {isProjectScoped && projectQuery.data && (
                  <Badge variant={'project'}>{`Project: ${projectQuery.data.name}`}</Badge>
                )}
                {/* Agent Type Badges */}
                {isEditMode && isBuiltIn && <Badge variant={'default'}>{'Built-in Agent'}</Badge>}
                {isEditMode && !isBuiltIn && <Badge variant={'custom'}>{'Custom Agent'}</Badge>}
                {isEditMode && agentTypeLabel && <Badge variant={'default'}>{agentTypeLabel}</Badge>}
              </Fragment>
            }
            isCloseDisabled={isSubmitting || isResetting}
          >
            <DialogTitle id={'agent-editor-title'}>{dialogTitle}</DialogTitle>
            <DialogDescription id={'agent-editor-description'}>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {/* Agent Editor Form */}
          <form
            aria-describedby={'agent-editor-description'}
            aria-labelledby={'agent-editor-title'}
            className={'flex min-h-0 flex-1 flex-col'}
            onSubmit={handleFormSubmit}
          >
            {/* Scrollable Content */}
            <DialogBody className={'px-2'}>
              <AgentEditorFormFields
                agent={agent}
                canEditAgentName={canEditAgentName}
                form={form}
                isDuplicateMode={isDuplicateMode}
                isEditMode={isEditMode}
                isProjectSelectorDisabled={isProjectSelectorDisabled}
                isResetting={isResetting}
                isSubmitting={isSubmitting}
                isViewMode={isViewMode}
                onAgentTypeChange={handleAgentTypeChange}
                projectOptions={projectOptions}
                showBuiltInNameDisplay={showBuiltInNameDisplay}
              />

              {/* Collapsible Configuration Sections */}
              <div className={'mt-4 flex flex-col gap-4'}>
                {/* Tools Section */}
                <ToolsCollapsibleSection
                  customTools={customTools}
                  isDisabled={isCollapsibleDisabled}
                  onCustomToolsChange={setCustomTools}
                  onToolSelectionsChange={setToolSelections}
                  toolSelections={toolSelections}
                />

                {/* Skills Section */}
                <SkillsCollapsibleSection
                  isDisabled={isCollapsibleDisabled}
                  onSkillsChange={setPendingSkills}
                  pendingSkills={pendingSkills}
                />

                {/* Hooks Section */}
                <HooksCollapsibleSection
                  hooks={pendingHooks}
                  isDisabled={isCollapsibleDisabled}
                  onHooksChange={setPendingHooks}
                />
              </div>
            </DialogBody>

            {/* Dialog Footer */}
            <DialogFooter alignment={'between'}>
              {/* Reset Button */}
              <div>
                {isResetButtonVisible && (
                  <Button
                    disabled={isSubmitting || isResetting}
                    onClick={handleResetClick}
                    type={'button'}
                    variant={'outline'}
                  >
                    {'Reset to Default'}
                  </Button>
                )}
              </div>

              {/* Cancel and Save Buttons */}
              <div className={'flex gap-3'}>
                <DialogClose>
                  <Button disabled={isSubmitting || isResetting} type={'button'} variant={'outline'}>
                    {isViewMode ? 'Close' : 'Cancel'}
                  </Button>
                </DialogClose>
                {!isViewMode && (
                  <form.AppForm>
                    <form.SubmitButton>{submitLabel}</form.SubmitButton>
                  </form.AppForm>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>

      {/* Reset Confirmation Dialog (Edit Mode Only) */}
      {isEditMode && agent && (
        <ConfirmResetAgentDialog
          agentName={agent.displayName}
          isLoading={isResetting}
          isOpen={isResetDialogOpen}
          onConfirm={handleConfirmReset}
          onOpenChange={setIsResetDialogOpen}
        />
      )}

      {/* Discard Changes Confirmation Dialog */}
      <ConfirmDiscardDialog
        isOpen={isDiscardDialogOpen}
        onConfirm={handleConfirmDiscard}
        onOpenChange={setIsDiscardDialogOpen}
      />
    </DialogRoot>
  );
};
