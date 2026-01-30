"use client";

import type { ComponentPropsWithRef } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { agentColors } from "@/db/schema/agents.schema";
import {
  agentColorClassMap,
  agentColorLabelMap,
} from "@/lib/colors/agent-colors";
import { cn } from "@/lib/utils";

type AgentColor = (typeof agentColors)[number];

interface AgentColorPickerProps extends Omit<
  ComponentPropsWithRef<"div">,
  "onChange"
> {
  disabled?: boolean;
  hasError?: boolean;
  label?: string;
  onChange?: (color: AgentColor) => void;
  value?: "" | AgentColor | null;
}

export const AgentColorPicker = ({
  className,
  disabled = false,
  hasError = false,
  label,
  onChange,
  value,
  ...props
}: AgentColorPickerProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {label && (
        <span className={"text-sm font-medium text-foreground"}>{label}</span>
      )}
      <RadioGroup
        className={cn(
          "rounded-md border p-2",
          hasError ? "border-destructive" : "border-transparent"
        )}
        disabled={disabled}
        onValueChange={(newValue) => onChange?.(newValue as AgentColor)}
        orientation={"horizontal"}
        value={value ?? ""}
      >
        {agentColors.map((color) => (
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5",
              "transition-colors hover:bg-muted/50",
              disabled && "cursor-not-allowed opacity-50"
            )}
            key={color}
          >
            <RadioGroupItem
              className={"sr-only"}
              disabled={disabled}
              value={color}
            />
            <div
              className={cn(
                "size-5 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                agentColorClassMap[color],
                value === color ? "ring-accent" : "ring-transparent"
              )}
              title={agentColorLabelMap[color]}
            />
            <span className={"text-sm text-muted-foreground"}>
              {agentColorLabelMap[color]}
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};
