'use client';

import type { ComponentPropsWithRef } from 'react';

import { Tabs as BaseTabs } from '@base-ui/react/tabs';

import { cn } from '@/lib/utils';

export const TabsRoot = BaseTabs.Root;

type TabsListProps = ComponentPropsWithRef<typeof BaseTabs.List>;

export const TabsList = ({ className, ref, ...props }: TabsListProps) => {
  return (
    <BaseTabs.List
      className={cn(`relative z-0 flex gap-1 border-b border-border px-1`, className)}
      ref={ref}
      {...props}
    />
  );
};

type TabsTriggerProps = ComponentPropsWithRef<typeof BaseTabs.Tab>;

export const TabsTrigger = ({ className, ref, ...props }: TabsTriggerProps) => {
  return (
    <BaseTabs.Tab
      className={cn(
        `
          flex h-9 items-center justify-center px-3 text-sm font-medium
          whitespace-nowrap text-muted-foreground transition-colors outline-none
          hover:text-foreground
          focus-visible:relative focus-visible:z-10 focus-visible:ring-2
          focus-visible:ring-accent focus-visible:ring-offset-0
          data-active:text-foreground
        `,
        className
      )}
      nativeButton={true}
      ref={ref}
      {...props}
    />
  );
};

type TabsIndicatorProps = ComponentPropsWithRef<typeof BaseTabs.Indicator>;

export const TabsIndicator = ({ className, ref, ...props }: TabsIndicatorProps) => {
  return (
    <BaseTabs.Indicator
      className={cn(
        `
          absolute bottom-0 left-0 h-0.5 w-(--active-tab-width)
          translate-x-(--active-tab-left) bg-accent transition-all duration-200
          ease-in-out
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

type TabsPanelProps = ComponentPropsWithRef<typeof BaseTabs.Panel>;

export const TabsPanel = ({ className, ref, ...props }: TabsPanelProps) => {
  return (
    <BaseTabs.Panel
      className={cn(
        `
          mt-4 outline-none
          focus-visible:ring-2 focus-visible:ring-accent
          focus-visible:ring-offset-0
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};
