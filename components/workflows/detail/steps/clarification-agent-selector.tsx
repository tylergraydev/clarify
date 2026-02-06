'use client';

import { useCallback, useEffect, useMemo } from 'react';

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
import { useAgentsByType } from '@/hooks/queries/use-agents';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { optionsToItems } from '@/lib/utils';

interface ClarificationAgentSelectorProps {
  /** Optional default agent ID to pre-select */
  defaultAgentId?: number;
}

/**
 * Dropdown selector for choosing a clarification agent.
 * Fetches planning-type agents and updates the workflow detail Zustand store
 * when the selection changes.
 *
 * @param props - Component props
 * @param props.defaultAgentId - Optional default agent ID to pre-select
 */
export const ClarificationAgentSelector = ({ defaultAgentId }: ClarificationAgentSelectorProps) => {
  const { data: agents, isLoading: isAgentsLoading } = useAgentsByType('planning');

  const clarificationSelectedAgentId = useWorkflowDetailStore((state) => state.clarificationSelectedAgentId);
  const setClarificationSelectedAgentId = useWorkflowDetailStore((state) => state.setClarificationSelectedAgentId);

  useEffect(() => {
    if (defaultAgentId !== undefined && clarificationSelectedAgentId === null) {
      setClarificationSelectedAgentId(defaultAgentId);
    }
  }, [defaultAgentId, clarificationSelectedAgentId, setClarificationSelectedAgentId]);

  const options = useMemo(() => {
    if (!agents) return [];

    return agents
      .filter((agent) => agent.deactivatedAt === null)
      .map((agent) => ({
        label: agent.displayName,
        value: String(agent.id),
      }));
  }, [agents]);

  const items = useMemo(() => optionsToItems(options), [options]);

  const handleValueChange = useCallback(
    (value: null | string) => {
      if (value === null) {
        setClarificationSelectedAgentId(null);
      } else {
        setClarificationSelectedAgentId(Number(value));
      }
    },
    [setClarificationSelectedAgentId]
  );

  const selectedValue = clarificationSelectedAgentId !== null ? String(clarificationSelectedAgentId) : '';
  const isDisabled = isAgentsLoading || options.length === 0;
  const hasNoAgents = !isAgentsLoading && options.length === 0;

  return (
    <SelectRoot disabled={isDisabled} items={items} onValueChange={handleValueChange} value={selectedValue}>
      <SelectTrigger aria-label={'Select clarification agent'} size={'sm'}>
        <SelectValue placeholder={hasNoAgents ? 'No agents available' : 'Select agent...'} />
      </SelectTrigger>
      <SelectPortal>
        <SelectPositioner>
          <SelectPopup size={'sm'}>
            <SelectList>
              {options.map((option) => (
                <SelectItem key={option.value} size={'sm'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
  );
};
