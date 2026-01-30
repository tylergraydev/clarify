"use client";

import type { ComponentPropsWithRef } from "react";

import { LayoutGrid, List, Table2 } from "lucide-react";

import type { AgentLayout } from "@/lib/layout/constants";

import { ButtonGroup } from "@/components/ui/button-group";
import { IconButton } from "@/components/ui/icon-button";
import { useAgentLayoutStore } from "@/lib/stores/agent-layout-store";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface AgentLayoutToggleProps extends Omit<
  ComponentPropsWithRef<"div">,
  "onChange"
> {
  /** Callback when layout changes */
  onChange?: (layout: AgentLayout) => void;
}

interface LayoutOption {
  icon: typeof LayoutGrid;
  label: string;
  value: AgentLayout;
}

// ============================================================================
// Constants
// ============================================================================

const LAYOUT_OPTIONS: Array<LayoutOption> = [
  { icon: LayoutGrid, label: "Card view", value: "card" },
  { icon: List, label: "List view", value: "list" },
  { icon: Table2, label: "Table view", value: "table" },
];

// ============================================================================
// Component
// ============================================================================

/**
 * Toggle control for switching between card, list, and table agent layouts.
 * Connects to the agent layout store for state persistence.
 *
 * @example
 * ```tsx
 * <AgentLayoutToggle onChange={(layout) => console.log('Layout changed:', layout)} />
 * ```
 */
export const AgentLayoutToggle = ({
  className,
  onChange,
  ref,
  ...props
}: AgentLayoutToggleProps) => {
  const { layout, setLayout } = useAgentLayoutStore();

  const handleLayoutChange = (newLayout: AgentLayout) => {
    setLayout(newLayout);
    onChange?.(newLayout);
  };

  return (
    <ButtonGroup
      aria-label={"Agent layout view options"}
      className={cn("rounded-md border border-border", className)}
      ref={ref}
      {...props}
    >
      {LAYOUT_OPTIONS.map(({ icon: Icon, label, value }) => {
        const isActive = layout === value;

        return (
          <IconButton
            aria-label={label}
            aria-pressed={isActive}
            className={cn(
              "rounded-none border-0",
              isActive
                ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            key={value}
            onClick={() => handleLayoutChange(value)}
            type={"button"}
          >
            <Icon aria-hidden={"true"} className={"size-4"} />
          </IconButton>
        );
      })}
    </ButtonGroup>
  );
};
