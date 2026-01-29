"use client";

import type { ComponentPropsWithRef } from "react";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";

/* Root */
export const ComboboxRoot = BaseCombobox.Root;

/* Input */
export const comboboxInputVariants = cva(
  `
    w-full rounded-md border border-border bg-transparent text-foreground
    placeholder:text-muted-foreground
    focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "h-9 px-3 pr-16 text-sm",
        lg: "h-10 px-4 pr-18 text-base",
        sm: "h-8 px-2 pr-14 text-xs",
      },
    },
  }
);

type ComboboxInputProps = ComponentPropsWithRef<typeof BaseCombobox.Input> &
  VariantProps<typeof comboboxInputVariants> & {
    isInvalid?: boolean;
  };

export const ComboboxInput = ({
  className,
  isInvalid,
  ref,
  size,
  ...props
}: ComboboxInputProps) => {
  return (
    <BaseCombobox.Input
      className={cn(comboboxInputVariants({ size }), className)}
      data-invalid={isInvalid || undefined}
      ref={ref}
      {...props}
    />
  );
};

/* Trigger */
export const comboboxTriggerVariants = cva(
  `
    flex items-center justify-center rounded-sm bg-transparent p-0
    text-muted-foreground
    hover:text-foreground
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "size-6",
        lg: "size-7",
        sm: "size-5",
      },
    },
  }
);

type ComboboxTriggerProps = ComponentPropsWithRef<typeof BaseCombobox.Trigger> &
  VariantProps<typeof comboboxTriggerVariants>;

export const ComboboxTrigger = ({
  children,
  className,
  ref,
  size,
  ...props
}: ComboboxTriggerProps) => {
  return (
    <BaseCombobox.Trigger
      className={cn(comboboxTriggerVariants({ size }), className)}
      ref={ref}
      {...props}
    >
      {children ?? <ChevronDown aria-hidden={"true"} className={"size-4"} />}
    </BaseCombobox.Trigger>
  );
};

/* Clear */
export const comboboxClearVariants = cva(
  `
    flex items-center justify-center rounded-sm bg-transparent p-0
    text-muted-foreground
    hover:text-foreground
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "size-6",
        lg: "size-7",
        sm: "size-5",
      },
    },
  }
);

type ComboboxClearProps = ComponentPropsWithRef<typeof BaseCombobox.Clear> &
  VariantProps<typeof comboboxClearVariants>;

export const ComboboxClear = ({
  children,
  className,
  ref,
  size,
  ...props
}: ComboboxClearProps) => {
  return (
    <BaseCombobox.Clear
      className={cn(comboboxClearVariants({ size }), className)}
      ref={ref}
      {...props}
    >
      {children ?? <X aria-hidden={"true"} className={"size-4"} />}
    </BaseCombobox.Clear>
  );
};

/* Portal */
export const ComboboxPortal = BaseCombobox.Portal;

/* Positioner */
type ComboboxPositionerProps = ComponentPropsWithRef<
  typeof BaseCombobox.Positioner
>;

export const ComboboxPositioner = ({
  className,
  ref,
  ...props
}: ComboboxPositionerProps) => {
  return (
    <BaseCombobox.Positioner
      className={cn("z-50 outline-none", className)}
      ref={ref}
      sideOffset={4}
      {...props}
    />
  );
};

/* Popup */
export const comboboxPopupVariants = cva(
  `
    max-w-(--available-width) min-w-(--anchor-width) origin-(--transform-origin)
    rounded-md border border-border bg-card p-1 shadow-md transition-all
    duration-150 outline-none
    data-ending-style:scale-95 data-ending-style:opacity-0
    data-starting-style:scale-95 data-starting-style:opacity-0
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "text-sm",
        lg: "text-base",
        sm: "text-xs",
      },
    },
  }
);

type ComboboxPopupProps = ComponentPropsWithRef<typeof BaseCombobox.Popup> &
  VariantProps<typeof comboboxPopupVariants>;

export const ComboboxPopup = ({
  className,
  ref,
  size,
  ...props
}: ComboboxPopupProps) => {
  return (
    <BaseCombobox.Popup
      className={cn(comboboxPopupVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  );
};

/* List */
type ComboboxListProps = ComponentPropsWithRef<typeof BaseCombobox.List>;

export const ComboboxList = ({
  className,
  ref,
  ...props
}: ComboboxListProps) => {
  return (
    <BaseCombobox.List
      className={cn(
        `
          max-h-[min(23rem,var(--available-height))] overflow-y-auto
          overscroll-contain py-1 outline-none
        `,
        `
          scroll-py-1
          data-empty:p-0
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Item */
export const comboboxItemVariants = cva(
  `
    relative grid cursor-pointer grid-cols-[0.75rem_1fr] items-center gap-2
    rounded-sm px-2 py-1.5 text-foreground outline-none select-none
    data-disabled:pointer-events-none data-disabled:opacity-50
    data-highlighted:bg-muted
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "text-sm",
        lg: "text-base",
        sm: "text-xs",
      },
    },
  }
);

type ComboboxItemProps = ComponentPropsWithRef<typeof BaseCombobox.Item> &
  VariantProps<typeof comboboxItemVariants>;

export const ComboboxItem = ({
  className,
  ref,
  size,
  ...props
}: ComboboxItemProps) => {
  return (
    <BaseCombobox.Item
      className={cn(comboboxItemVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  );
};

/* Item Indicator */
type ComboboxItemIndicatorProps = ComponentPropsWithRef<
  typeof BaseCombobox.ItemIndicator
>;

export const ComboboxItemIndicator = ({
  children,
  className,
  ref,
  ...props
}: ComboboxItemIndicatorProps) => {
  return (
    <BaseCombobox.ItemIndicator
      className={cn("col-start-1", className)}
      ref={ref}
      {...props}
    >
      {children ?? <Check className={"size-3"} />}
    </BaseCombobox.ItemIndicator>
  );
};

/* Empty */
type ComboboxEmptyProps = ComponentPropsWithRef<typeof BaseCombobox.Empty>;

export const ComboboxEmpty = ({
  className,
  ref,
  ...props
}: ComboboxEmptyProps) => {
  return (
    <BaseCombobox.Empty
      className={cn(
        `
        p-4 text-sm text-muted-foreground
        empty:m-0 empty:p-0
      `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Status */
type ComboboxStatusProps = ComponentPropsWithRef<typeof BaseCombobox.Status>;

export const ComboboxStatus = ({
  className,
  ref,
  ...props
}: ComboboxStatusProps) => {
  return (
    <BaseCombobox.Status
      className={cn(
        `
        flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground
      `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Group */
export const ComboboxGroup = BaseCombobox.Group;

/* Group Label */
export const comboboxGroupLabelVariants = cva(
  `px-2 py-1.5 font-semibold text-muted-foreground select-none`,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "text-xs",
        lg: "text-sm",
        sm: "text-xs",
      },
    },
  }
);

type ComboboxGroupLabelProps = ComponentPropsWithRef<
  typeof BaseCombobox.GroupLabel
> &
  VariantProps<typeof comboboxGroupLabelVariants>;

export const ComboboxGroupLabel = ({
  className,
  ref,
  size,
  ...props
}: ComboboxGroupLabelProps) => {
  return (
    <BaseCombobox.GroupLabel
      className={cn(comboboxGroupLabelVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  );
};

/* Separator */
type ComboboxSeparatorProps = ComponentPropsWithRef<
  typeof BaseCombobox.Separator
>;

export const ComboboxSeparator = ({
  className,
  ref,
  ...props
}: ComboboxSeparatorProps) => {
  return (
    <BaseCombobox.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      ref={ref}
      {...props}
    />
  );
};

/* Arrow */
type ComboboxArrowProps = ComponentPropsWithRef<typeof BaseCombobox.Arrow>;

export const ComboboxArrow = ({
  className,
  ref,
  ...props
}: ComboboxArrowProps) => {
  return (
    <BaseCombobox.Arrow
      className={cn("fill-card stroke-border stroke-1", className)}
      ref={ref}
      {...props}
    />
  );
};

/* Backdrop */
type ComboboxBackdropProps = ComponentPropsWithRef<
  typeof BaseCombobox.Backdrop
>;

export const ComboboxBackdrop = ({
  className,
  ref,
  ...props
}: ComboboxBackdropProps) => {
  return (
    <BaseCombobox.Backdrop
      className={cn("fixed inset-0", className)}
      ref={ref}
      {...props}
    />
  );
};

/* Value */
export const ComboboxValue = BaseCombobox.Value;

/* Icon */
export const ComboboxIcon = BaseCombobox.Icon;

/* Collection */
export const ComboboxCollection = BaseCombobox.Collection;

/* Row */
export const ComboboxRow = BaseCombobox.Row;

/* Chips (for multiple select) */
type ComboboxChipsProps = ComponentPropsWithRef<typeof BaseCombobox.Chips>;

export const ComboboxChips = ({
  className,
  ref,
  ...props
}: ComboboxChipsProps) => {
  return (
    <BaseCombobox.Chips
      className={cn(
        `
          flex flex-wrap items-center gap-0.5 rounded-md border border-border
          px-1.5 py-1
        `,
        `
          focus-within:ring-2 focus-within:ring-accent
          focus-within:ring-offset-0 focus-within:outline-none
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

/* Chip */
export const comboboxChipVariants = cva(
  `
    flex cursor-default items-center gap-1 rounded-md bg-muted px-1.5 py-0.5
    text-foreground outline-none
    focus-within:bg-accent focus-within:text-accent-foreground
    data-highlighted:bg-accent data-highlighted:text-accent-foreground
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "text-sm",
        lg: "px-2 py-1 text-base",
        sm: "px-1 py-0.5 text-xs",
      },
    },
  }
);

type ComboboxChipProps = ComponentPropsWithRef<typeof BaseCombobox.Chip> &
  VariantProps<typeof comboboxChipVariants>;

export const ComboboxChip = ({
  className,
  ref,
  size,
  ...props
}: ComboboxChipProps) => {
  return (
    <BaseCombobox.Chip
      className={cn(comboboxChipVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  );
};

/* Chip Remove */
type ComboboxChipRemoveProps = ComponentPropsWithRef<
  typeof BaseCombobox.ChipRemove
>;

export const ComboboxChipRemove = ({
  children,
  className,
  ref,
  ...props
}: ComboboxChipRemoveProps) => {
  return (
    <BaseCombobox.ChipRemove
      className={cn(
        `
        rounded-sm p-0.5 text-inherit
        hover:bg-muted
      `,
        className
      )}
      ref={ref}
      {...props}
    >
      {children ?? <X aria-hidden={"true"} className={"size-3"} />}
    </BaseCombobox.ChipRemove>
  );
};
