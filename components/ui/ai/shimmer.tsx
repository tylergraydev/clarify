'use client';

import type { ComponentProps } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const shimmerVariants = cva(
  `
    inline-block bg-[linear-gradient(90deg,var(--muted-foreground)_0%,var(--foreground)_50%,var(--muted-foreground)_100%)]
    bg-size-[200%_100%]
    bg-clip-text
    text-transparent
  `,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: '',
        muted:
          'bg-[linear-gradient(90deg,var(--muted-foreground)_0%,var(--foreground)_50%,var(--muted-foreground)_100%)]',
      },
    },
  }
);

export type ShimmerProps = ComponentProps<'span'> &
  VariantProps<typeof shimmerVariants> & {
    duration?: number;
  };

export const Shimmer = ({ children, className, duration = 1.5, style, variant, ...props }: ShimmerProps) => (
  <span
    // eslint-disable-next-line better-tailwindcss/no-unknown-classes -- animate-shimmer is defined in globals.css
    className={cn('animate-shimmer', shimmerVariants({ className, variant }))}
    style={{
      animationDuration: `${duration}s`,
      ...style,
    }}
    {...props}
  >
    {children}
  </span>
);
