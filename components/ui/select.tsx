'use client';

import type { ComponentPropsWithRef } from 'react';

import { Select as BaseSelect } from '@base-ui/react/select';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export const selectTriggerVariants = cva(
  `
    inline-flex w-full items-center justify-between gap-2 rounded-md border
    border-border bg-transparent text-foreground
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus-visible:ring-destructive
    data-popup-open:ring-2 data-popup-open:ring-accent
    data-popup-open:ring-offset-0
    data-invalid:data-popup-open:ring-destructive
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
        sm: 'h-8 px-2 text-xs',
      },
    },
  }
);

export const selectPopupVariants = cva(
  `
    min-w-(--anchor-width) rounded-md border border-border bg-card p-1 shadow-md
    transition-opacity duration-150 outline-none
    data-ending-style:opacity-0
    data-starting-style:opacity-0
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm',
        lg: 'text-base',
        sm: 'text-xs',
      },
    },
  }
);

export const selectItemVariants = cva(
  `
    relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5
    text-foreground outline-none select-none
    data-disabled:pointer-events-none data-disabled:opacity-50
    data-highlighted:bg-muted
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm',
        lg: 'text-base',
        sm: 'text-xs',
      },
    },
  }
);

/* Root */
export const SelectRoot = BaseSelect.Root;

/* Trigger */
type SelectTriggerProps = ComponentPropsWithRef<typeof BaseSelect.Trigger> &
  VariantProps<typeof selectTriggerVariants> & {
    isInvalid?: boolean;
  };

export const SelectTrigger = ({ children, className, isInvalid, ref, size, ...props }: SelectTriggerProps) => {
  return (
    <BaseSelect.Trigger
      className={cn(selectTriggerVariants({ size }), className)}
      data-invalid={isInvalid || undefined}
      ref={ref}
      {...props}
    >
      {children}
      <BaseSelect.Icon>
        <ChevronDown aria-hidden={'true'} className={'size-4 opacity-50'} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
};

/* Value */
export const SelectValue = BaseSelect.Value;

/* Portal */
export const SelectPortal = BaseSelect.Portal;

/* Positioner */
type SelectPositionerProps = ComponentPropsWithRef<typeof BaseSelect.Positioner>;

export const SelectPositioner = ({ className, ref, ...props }: SelectPositionerProps) => {
  return (
    <BaseSelect.Positioner
      alignItemWithTrigger={false}
      className={cn('z-100 outline-none', className)}
      ref={ref}
      sideOffset={4}
      {...props}
    />
  );
};

/* Popup */
type SelectPopupProps = ComponentPropsWithRef<typeof BaseSelect.Popup> & VariantProps<typeof selectPopupVariants>;

export const SelectPopup = ({ className, ref, size, ...props }: SelectPopupProps) => {
  return <BaseSelect.Popup className={cn(selectPopupVariants({ size }), className)} ref={ref} {...props} />;
};

/* List */
export const SelectList = BaseSelect.List;

/* Group */
export const SelectGroup = BaseSelect.Group;

/* Group Label */
export const selectGroupLabelVariants = cva(`px-2 py-1.5 font-semibold text-muted-foreground select-none`, {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'text-xs',
      lg: 'text-sm',
      sm: 'text-xs',
    },
  },
});

type SelectGroupLabelProps = ComponentPropsWithRef<typeof BaseSelect.GroupLabel> &
  VariantProps<typeof selectGroupLabelVariants>;

export const SelectGroupLabel = ({ className, ref, size, ...props }: SelectGroupLabelProps) => {
  return <BaseSelect.GroupLabel className={cn(selectGroupLabelVariants({ size }), className)} ref={ref} {...props} />;
};

/* Item */
type SelectItemProps = ComponentPropsWithRef<typeof BaseSelect.Item> & VariantProps<typeof selectItemVariants>;

export const SelectItem = ({ children, className, label, ref, size, ...props }: SelectItemProps) => {
  // Derive label from children if not explicitly provided
  const derivedLabel = label ?? (typeof children === 'string' ? children : undefined);

  return (
    <BaseSelect.Item className={cn(selectItemVariants({ size }), className)} label={derivedLabel} ref={ref} {...props}>
      <BaseSelect.ItemIndicator className={'absolute left-2'}>
        <Check className={'size-3.5'} />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className={'pl-5'}>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
};
