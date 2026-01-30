'use client';

import type { ComponentPropsWithRef } from 'react';

import { Input as BaseInput } from '@base-ui/react/input';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const inputVariants = cva(
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

type InputProps = Omit<ComponentPropsWithRef<typeof BaseInput>, 'size'> &
  VariantProps<typeof inputVariants> & {
    isInvalid?: boolean;
  };

export const Input = ({ className, isInvalid, ref, size, ...props }: InputProps) => {
  return (
    <BaseInput
      className={cn(inputVariants({ size }), className)}
      data-invalid={isInvalid || undefined}
      ref={ref}
      {...props}
    />
  );
};
