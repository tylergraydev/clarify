'use client';

import type { ComponentPropsWithRef } from 'react';

import type { CreateToolData, ToolSelection } from '@/types/agent-tools';

import { cn } from '@/lib/utils';

import { BuiltinToolsSelector } from './builtin-tools-selector';
import { CustomToolsManager } from './custom-tools-manager';

interface AgentToolsSectionProps extends ComponentPropsWithRef<'div'> {
  /** Current custom tools */
  customTools: Array<CreateToolData>;
  /** Whether the inputs are disabled */
  isDisabled?: boolean;
  /** Callback when custom tools change */
  onCustomToolsChange: (tools: Array<CreateToolData>) => void;
  /** Callback when built-in tool selections change */
  onToolSelectionsChange: (tools: Array<ToolSelection>) => void;
  /** Current built-in tool selections */
  toolSelections: Array<ToolSelection>;
}

/**
 * Combined section for managing agent tools.
 * Wraps BuiltinToolsSelector and CustomToolsManager.
 *
 * This is a purely presentational component - state initialization
 * should be handled by the parent component.
 */
export const AgentToolsSection = ({
  className,
  customTools,
  isDisabled = false,
  onCustomToolsChange,
  onToolSelectionsChange,
  ref,
  toolSelections,
  ...props
}: AgentToolsSectionProps) => {
  return (
    <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
      {/* Built-in Tools */}
      <BuiltinToolsSelector isDisabled={isDisabled} onChange={onToolSelectionsChange} value={toolSelections} />

      {/* Custom Tools */}
      <CustomToolsManager isDisabled={isDisabled} onChange={onCustomToolsChange} value={customTools} />
    </div>
  );
};
