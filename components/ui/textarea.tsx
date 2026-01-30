'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const textareaVariants = cva(
  `
    w-full resize-none rounded-md border border-border bg-transparent
    text-foreground
    placeholder:text-muted-foreground
    focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none
    disabled:cursor-not-allowed disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'min-h-20 px-3 py-2 text-sm',
        lg: 'min-h-24 px-4 py-3 text-base',
        sm: 'min-h-16 px-2 py-1.5 text-xs',
      },
    },
  }
);

type TextareaProps = Omit<ComponentPropsWithRef<'textarea'>, 'size'> &
  VariantProps<typeof textareaVariants> & {
    isInvalid?: boolean;
  };

export const Textarea = ({ className, isInvalid, ref, size, ...props }: TextareaProps) => {
  return (
    <textarea
      className={cn(textareaVariants({ size }), className)}
      data-invalid={isInvalid || undefined}
      ref={ref}
      {...props}
    />
  );
};
