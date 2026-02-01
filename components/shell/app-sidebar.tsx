'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, FolderKanban, LayoutDashboard, Settings } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { usePathname } from 'next/navigation';

import { Separator } from '@/components/ui/separator';
import { useShellStore } from '@/lib/stores/shell-store';
import { cn } from '@/lib/utils';

import { NavItem } from './nav-item';

type AppSidebarProps = ComponentPropsWithRef<'aside'>;

export const AppSidebar = ({ className, ref, ...props }: AppSidebarProps) => {
  const { isSidebarCollapsed } = useShellStore();
  const pathname = usePathname();

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
