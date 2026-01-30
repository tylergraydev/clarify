'use client';

import type { ComponentPropsWithRef } from 'react';

import { NumberField } from '@base-ui/react/number-field';
import { cva, type VariantProps } from 'class-variance-authority';
import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

export const numberInputVariants = cva(
  `
    border-y border-border bg-transparent text-center text-foreground
    tabular-nums
    focus:z-10 focus:ring-2 focus:ring-accent focus:ring-offset-0
    focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'h-9 w-20 text-sm',
        lg: 'h-10 w-24 text-base',
        sm: 'h-8 w-16 text-xs',
      },
    },
  }
);

export const numberButtonVariants = cva(
  `
    flex items-center justify-center border border-border bg-muted
    text-foreground select-none
    hover:bg-muted/80
    active:bg-muted/70
    data-disabled:cursor-not-allowed data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'size-9',
        lg: 'size-10',
        sm: 'size-8',
      },
    },
  }
);

/* Root */
export const NumberInputRoot = NumberField.Root;

/* Group */
type NumberInputGroupProps = ComponentPropsWithRef<typeof NumberField.Group>;

export const NumberInputGroup = ({ className, ref, ...props }: NumberInputGroupProps) => {
  return <NumberField.Group className={cn('flex', className)} ref={ref} {...props} />;
};

/* Input */
type NumberInputFieldProps = Omit<ComponentPropsWithRef<typeof NumberField.Input>, 'size'> &
  VariantProps<typeof numberInputVariants>;

export const NumberInputField = ({ className, ref, size, ...props }: NumberInputFieldProps) => {
  return <NumberField.Input className={cn(numberInputVariants({ size }), className)} ref={ref} {...props} />;
};

/* Decrement Button */
type NumberInputDecrementProps = ComponentPropsWithRef<typeof NumberField.Decrement> &
  VariantProps<typeof numberButtonVariants>;

export const NumberInputDecrement = ({ className, ref, size, ...props }: NumberInputDecrementProps) => {
  return (
    <NumberField.Decrement
      aria-label={'Decrease value'}
      className={cn(numberButtonVariants({ size }), 'rounded-l-md border-r-0', className)}
      ref={ref}
      {...props}
    >
      <Minus aria-hidden={'true'} className={'size-3.5'} />
    </NumberField.Decrement>
  );
};

/* Increment Button */
type NumberInputIncrementProps = ComponentPropsWithRef<typeof NumberField.Increment> &
  VariantProps<typeof numberButtonVariants>;

export const NumberInputIncrement = ({ className, ref, size, ...props }: NumberInputIncrementProps) => {
  return (
    <NumberField.Increment
      aria-label={'Increase value'}
      className={cn(numberButtonVariants({ size }), 'rounded-r-md border-l-0', className)}
      ref={ref}
      {...props}
    >
      <Plus aria-hidden={'true'} className={'size-3.5'} />
    </NumberField.Increment>
  );
};
