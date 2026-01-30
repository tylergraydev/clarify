"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Check, Loader2 } from "lucide-react";
import { Fragment, ReactElement } from "react";

import { cn } from "@/lib/utils";

export type AutoSaveState = "error" | "idle" | "saved" | "saving";

const autoSaveStatusVariants = cva(
  "flex items-center gap-1.5 text-sm transition-opacity duration-200",
  {
    defaultVariants: {
      state: "idle",
    },
    variants: {
      state: {
        error: "text-destructive",
        idle: "opacity-0",
        saved: "text-muted-foreground",
        saving: "text-muted-foreground",
      },
    },
  }
);

interface AutoSaveStatusProps extends VariantProps<
  typeof autoSaveStatusVariants
> {
  className?: string;
  state: AutoSaveState;
}

export const AutoSaveStatus = ({
  className,
  state,
}: AutoSaveStatusProps): ReactElement => {
  return (
    <div
      aria-live={"polite"}
      className={cn(autoSaveStatusVariants({ state }), className)}
    >
      {state === "saving" && (
        <Fragment>
          <Loader2 aria-hidden={"true"} className={"size-4 animate-spin"} />
          <span>Saving...</span>
        </Fragment>
      )}
      {state === "saved" && (
        <Fragment>
          <Check aria-hidden={"true"} className={"size-4"} />
          <span>Saved</span>
        </Fragment>
      )}
      {state === "error" && <span>Failed to save</span>}
    </div>
  );
};
