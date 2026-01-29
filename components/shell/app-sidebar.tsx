'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, FileText, History, LayoutDashboard, Play, Settings, Workflow } from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { useShellStore } from '@/lib/stores/shell-store';
import { cn } from '@/lib/utils';

import { NavItem } from './nav-item';

type AppSidebarProps = ComponentPropsWithRef<'aside'>;

export const AppSidebar = ({ className, ref, ...props }: AppSidebarProps) => {
  const { isSidebarCollapsed } = useShellStore();
  const pathname = usePathname();

  /**
   * Check if a path is currently active
   */
  const isPathActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  /**
   * Check if any child path is active (for expandable sections)
   */
  const isWorkflowsSectionActive = pathname.startsWith('/workflows');

  return (
    <aside
      className={cn(
        `
          fixed top-12 left-0 z-40 h-[calc(100vh-3rem)]
          border-r border-sidebar-border bg-sidebar-bg
          transition-[width] duration-200 ease-out
        `,
        isSidebarCollapsed
          ? 'w-(--sidebar-width-collapsed)'
          : 'w-(--sidebar-width-expanded)',
        className
      )}
      data-collapsed={isSidebarCollapsed}
      ref={ref}
      {...props}
    >
      {/* Navigation Content */}
      <nav
        aria-label={'Main navigation'}
        className={'flex h-full flex-col overflow-x-hidden overflow-y-auto p-2'}
      >
        {/* Primary Navigation */}
        <div className={'flex flex-col gap-1'}>
          {/* Dashboard */}
          <NavItem
            href={'/dashboard'}
            icon={LayoutDashboard}
            isActive={isPathActive('/dashboard')}
            isCollapsed={isSidebarCollapsed}
            label={'Dashboard'}
          />
        </div>

        {/* Separator */}
        <Separator className={'my-2'} />

        {/* Workflows Section */}
        <div className={'flex flex-col gap-1'}>
          {isSidebarCollapsed ? (
            /* Collapsed: Show icon-only with tooltip */
            <Tooltip content={'Workflows'} side={'right'}>
              <NavItem
                href={'/workflows/active'}
                icon={Workflow}
                isActive={isWorkflowsSectionActive}
                isCollapsed={isSidebarCollapsed}
                label={'Workflows'}
              />
            </Tooltip>
          ) : (
            /* Expanded: Show collapsible section */
            <Collapsible defaultOpen={isWorkflowsSectionActive}>
              <CollapsibleTrigger
                className={cn(
                  'h-10 w-full px-3 py-2 text-muted-foreground',
                  isWorkflowsSectionActive && 'text-foreground'
                )}
              >
                <Workflow aria-hidden={'true'} className={'size-4 shrink-0'} />
                <span className={'flex-1 truncate text-left text-sm font-medium'}>
                  {'Workflows'}
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className={'flex flex-col gap-1 py-1'}>
                  <NavItem
                    href={'/workflows/active'}
                    icon={Play}
                    isActive={isPathActive('/workflows/active')}
                    isCollapsed={isSidebarCollapsed}
                    isNested={true}
                    label={'Active'}
                  />
                  <NavItem
                    href={'/workflows/history'}
                    icon={History}
                    isActive={isPathActive('/workflows/history')}
                    isCollapsed={isSidebarCollapsed}
                    isNested={true}
                    label={'History'}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Templates */}
          <NavItem
            href={'/templates'}
            icon={FileText}
            isActive={isPathActive('/templates')}
            isCollapsed={isSidebarCollapsed}
            label={'Templates'}
          />
        </div>

        {/* Separator */}
        <Separator className={'my-2'} />

        {/* Secondary Navigation */}
        <div className={'flex flex-col gap-1'}>
          {/* Agents */}
          <NavItem
            href={'/agents'}
            icon={Bot}
            isActive={isPathActive('/agents')}
            isCollapsed={isSidebarCollapsed}
            label={'Agents'}
          />

          {/* Settings */}
          <NavItem
            href={'/settings'}
            icon={Settings}
            isActive={isPathActive('/settings')}
            isCollapsed={isSidebarCollapsed}
            label={'Settings'}
          />
        </div>

        {/* Spacer to push content up */}
        <div className={'flex-1'} />
      </nav>
    </aside>
  );
};
