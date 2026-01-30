"use client";

import type { ComponentPropsWithRef } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { agentColors } from "@/db/schema/agents.schema";
import { cn } from "@/lib/utils";

type AgentColor = (typeof agentColors)[number];

const colorClassMap: Record<AgentColor, string> = {
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
};

const colorLabelMap: Record<AgentColor, string> = {
  blue: "Blue",
  cyan: "Cyan",
  green: "Green",
  red: "Red",
  yellow: "Yellow",
};

interface AgentColorPickerProps extends Omit<
  ComponentPropsWithRef<"div">,
  "onChange"
> {
  disabled?: boolean;
  onChange?: (color: AgentColor) => void;
  value?: AgentColor | null;
}

export const AgentColorPicker = ({
  className,
  disabled = false,
  onChange,
  value,
  ...props
}: AgentColorPickerProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <span className={"text-sm font-medium text-foreground"}>
        {"Color Tag"}
      </span>
      <RadioGroup
        disabled={disabled}
        onValueChange={(newValue) => onChange?.(newValue as AgentColor)}
        orientation={"horizontal"}
        value={value ?? undefined}
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
                colorClassMap[color],
                value === color ? "ring-accent" : "ring-transparent"
              )}
              title={colorLabelMap[color]}
            />
            <span className={"text-sm text-muted-foreground"}>
              {colorLabelMap[color]}
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};
