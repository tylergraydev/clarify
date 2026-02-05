'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface TableNameButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  children: ReactNode;
}

export const TableNameButton = ({ children, className, onClick, ref, ...props }: TableNameButtonProps) => (
  <button
    className={cn(
      'cursor-pointer text-left font-medium text-foreground hover:text-accent',
      'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
      'focus-visible:outline-none',
      className
    )}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
    ref={ref}
    type={'button'}
    {...props}
  >
    {children}
  </button>
);
