'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const kbdVariants = cva(
  `
    inline-flex items-center justify-center rounded-sm border border-border
    bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold
    text-muted-foreground
  `,
  {
    defaultVariants: {},
    variants: {},
  }
);

type KbdProps = ComponentPropsWithRef<'kbd'> & VariantProps<typeof kbdVariants>;

export const Kbd = ({ className, ref, ...props }: KbdProps) => {
  return <kbd className={cn(kbdVariants({ className }))} ref={ref} {...props} />;
};
