'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, FolderKanban, History, LayoutDashboard, Play, Settings, Workflow } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const WORKFLOWS_BASE_PATH = $path({ route: '/workflows/active' }).replace('/active', '');

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { useShellStore } from '@/lib/stores/shell-store';
import { cn } from '@/lib/utils';

import { NavItem } from './nav-item';

type AppSidebarProps = ComponentPropsWithRef<'aside'>;

export const AppSidebar = ({ className, ref, ...props }: AppSidebarProps) => {
  const { isSidebarCollapsed } = useShellStore();
  const pathname = usePathname();

  const isWorkflowsActive = pathname.startsWith(WORKFLOWS_BASE_PATH);
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(isWorkflowsActive);

  const isPathActive = (href: string) => {
    if (href === $path({ route: '/dashboard' })) {
      return pathname === href || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        `
          fixed top-12 left-0 z-40 h-[calc(100vh-3rem)]
          border-r border-sidebar-border bg-sidebar-bg
          transition-[width] duration-200 ease-out
        `,
        'block',
        isSidebarCollapsed ? 'w-(--sidebar-width-collapsed)' : 'w-(--sidebar-width-expanded)',
        className
      )}
      data-collapsed={isSidebarCollapsed}
      ref={ref}
      {...props}
    >
      {/* Navigation Content */}
      <nav aria-label={'Main navigation'} className={'flex h-full flex-col overflow-x-hidden overflow-y-auto p-2'}>
        {/* Primary Navigation */}
        <div className={'flex flex-col gap-1'}>
          {/* Dashboard */}
          <NavItem
            href={$path({ route: '/dashboard' })}
            icon={LayoutDashboard}
            isActive={isPathActive($path({ route: '/dashboard' }))}
            isCollapsed={isSidebarCollapsed}
            label={'Dashboard'}
          />

          {/* Projects */}
          <NavItem
            href={$path({ route: '/projects' })}
            icon={FolderKanban}
            isActive={isPathActive($path({ route: '/projects' }))}
            isCollapsed={isSidebarCollapsed}
            label={'Projects'}
          />

          {/* Workflows */}
          {isSidebarCollapsed ? (
            <Tooltip content={'Workflows'} side={'right'}>
              <NavItem
                href={$path({ route: '/workflows/active' })}
                icon={Workflow}
                isActive={isWorkflowsActive}
                isCollapsed={isSidebarCollapsed}
                label={'Workflows'}
              />
            </Tooltip>
          ) : (
            <Collapsible onOpenChange={setIsWorkflowsOpen} open={isWorkflowsOpen || isWorkflowsActive}>
              <CollapsibleTrigger
                className={cn(
                  `
                    h-10 w-full px-3 py-2
                    text-muted-foreground
                    hover:bg-muted hover:text-foreground
                  `,
                  isWorkflowsActive && 'text-foreground'
                )}
              >
                <Workflow aria-hidden={'true'} className={'size-4 shrink-0'} />
                <span className={'flex-1 truncate text-left'}>Workflows</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <NavItem
                  href={$path({ route: '/workflows/active' })}
                  icon={Play}
                  isActive={pathname === $path({ route: '/workflows/active' })}
                  isCollapsed={false}
                  isNested={true}
                  label={'Active'}
                />
                <NavItem
                  href={$path({ route: '/workflows/history', searchParams: {} })}
                  icon={History}
                  isActive={pathname === $path({ route: '/workflows/history', searchParams: {} })}
                  isCollapsed={false}
                  isNested={true}
                  label={'History'}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Separator */}
        <Separator className={'my-2'} />

        {/* Secondary Navigation */}
        <div className={'flex flex-col gap-1'}>
          {/* Agents */}
          <NavItem
            href={$path({ route: '/agents' })}
            icon={Bot}
            isActive={isPathActive($path({ route: '/agents' }))}
            isCollapsed={isSidebarCollapsed}
            label={'Agents'}
          />

          {/* Separator */}
          <Separator className={'my-2'} />

          {/* Settings */}
          <NavItem
            href={$path({ route: '/settings' })}
            icon={Settings}
            isActive={isPathActive($path({ route: '/settings' }))}
            isCollapsed={isSidebarCollapsed}
            label={'Settings'}
          />
        </div>
      </nav>
    </aside>
  );
};
