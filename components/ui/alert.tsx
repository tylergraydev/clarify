'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const alertVariants = cva(
  `
    relative flex w-full gap-3 rounded-md border p-4 text-sm
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
  `,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'border-border bg-card text-foreground',
        destructive: 'border-destructive/50 bg-destructive/10 text-destructive',
        info: 'border-accent/50 bg-accent/10 text-accent',
        success: `
          border-green-500/50 bg-green-500/10 text-green-600
          dark:text-green-400
        `,
        warning: `
          border-amber-500/50 bg-amber-500/10 text-amber-600
          dark:text-amber-400
        `,
      },
    },
  }
);

type AlertProps = ComponentPropsWithRef<'div'> & VariantProps<typeof alertVariants>;

export const Alert = ({ className, ref, variant, ...props }: AlertProps) => {
  return <div className={cn(alertVariants({ className, variant }))} ref={ref} role={'alert'} {...props} />;
};

type AlertTitleProps = ComponentPropsWithRef<'h5'>;

export const AlertTitle = ({ className, ref, ...props }: AlertTitleProps) => {
  return <h5 className={cn('leading-none font-medium', className)} ref={ref} {...props} />;
};

type AlertDescriptionProps = ComponentPropsWithRef<'p'>;

export const AlertDescription = ({ className, ref, ...props }: AlertDescriptionProps) => {
  return <p className={cn('text-sm opacity-90', className)} ref={ref} {...props} />;
};
