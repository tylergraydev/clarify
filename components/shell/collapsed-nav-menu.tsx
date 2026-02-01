'use client';

import type { ComponentPropsWithRef, ElementType } from 'react';

import { cva } from 'class-variance-authority';
import Link from 'next/link';

import { PopoverPopup, PopoverPortal, PopoverPositioner, PopoverRoot, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { navItemVariants } from './nav-item';

// ============================================================================
// Types
// ============================================================================

interface CollapsedNavMenuItem {
  href: string;
  icon?: ElementType;
  isActive: boolean;
  label: string;
}

interface CollapsedNavMenuProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  icon: ElementType;
  isActive: boolean;
  items: Array<CollapsedNavMenuItem>;
  label: string;
}

// ============================================================================
// Menu Item Variants
// ============================================================================

const menuItemVariants = cva(
  `
    flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
    transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0
    focus-visible:outline-none
  `,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        active: 'bg-accent text-accent-foreground',
        default: 'text-muted-foreground hover:bg-muted hover:text-foreground',
      },
    },
  }
);

// ============================================================================
// CollapsedNavMenu Component
// ============================================================================

export const CollapsedNavMenu = ({
  className,
  icon: Icon,
  isActive,
  items,
  label,
  ref,
  ...props
}: CollapsedNavMenuProps) => {
  return (
    <div className={cn('relative', className)} ref={ref} {...props}>
      <PopoverRoot>
        <PopoverTrigger closeDelay={100} delay={0} openOnHover>
          <button
            aria-label={label}
            className={cn(navItemVariants({ variant: isActive ? 'active' : 'default' }), 'justify-center px-0')}
            type={'button'}
          >
            <Icon aria-hidden={'true'} className={cn('size-4 shrink-0', isActive && 'text-accent-foreground')} />
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverPositioner align={'start'} side={'right'} sideOffset={8}>
            <PopoverPopup className={'min-w-40 p-1'}>
              {/* Header with label */}
              <div className={'px-3 py-2 text-xs font-semibold text-muted-foreground'}>{label}</div>

              {/* Menu items */}
              <nav aria-label={`${label} submenu`}>
                {items.map((item) => (
                  <Link
                    aria-current={item.isActive ? 'page' : undefined}
                    className={menuItemVariants({ variant: item.isActive ? 'active' : 'default' })}
                    href={item.href}
                    key={item.href}
                  >
                    {item.icon && (
                      <item.icon
                        aria-hidden={'true'}
                        className={cn('size-4 shrink-0', item.isActive && 'text-accent-foreground')}
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </PopoverPopup>
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>
    </div>
  );
};
