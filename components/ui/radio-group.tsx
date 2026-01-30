'use client';

import type { ComponentPropsWithRef } from 'react';

import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const radioGroupVariants = cva(`flex gap-2`, {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col items-start',
    },
  },
});

export const radioItemVariants = cva(
  `
    flex items-center justify-center rounded-full border
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
    data-checked:border-accent data-checked:bg-accent
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-unchecked:border-border data-unchecked:bg-transparent
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'size-4',
        lg: 'size-5',
        sm: 'size-3.5',
      },
    },
  }
);

export const radioIndicatorVariants = cva(
  `
    rounded-full bg-accent-foreground
    data-unchecked:hidden
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'size-1.5',
        lg: 'size-2',
        sm: 'size-1',
      },
    },
  }
);

type RadioGroupProps = ComponentPropsWithRef<typeof BaseRadioGroup> & VariantProps<typeof radioGroupVariants>;

export const RadioGroup = ({ className, orientation, ref, ...props }: RadioGroupProps) => {
  return <BaseRadioGroup className={cn(radioGroupVariants({ orientation }), className)} ref={ref} {...props} />;
};

interface RadioGroupItemProps
  extends Omit<ComponentPropsWithRef<typeof BaseRadio.Root>, 'children'>, VariantProps<typeof radioItemVariants> {
  label?: string;
}

export const RadioGroupItem = ({ className, label, ref, size, ...props }: RadioGroupItemProps) => {
  const _hasLabel = Boolean(label);

  if (_hasLabel) {
    return (
      <label
        className={`
        flex cursor-pointer items-center gap-2 text-sm
        data-disabled:cursor-not-allowed
      `}
      >
        <BaseRadio.Root className={cn(radioItemVariants({ size }), className)} ref={ref} {...props}>
          <BaseRadio.Indicator className={cn(radioIndicatorVariants({ size }))} keepMounted />
        </BaseRadio.Root>
        <span className={'text-foreground'}>{label}</span>
      </label>
    );
  }

  return (
    <BaseRadio.Root className={cn(radioItemVariants({ size }), className)} ref={ref} {...props}>
      <BaseRadio.Indicator className={cn(radioIndicatorVariants({ size }))} keepMounted />
    </BaseRadio.Root>
  );
};
