'use client';

import { Bot, FileText, FolderKanban, History, LayoutDashboard, Play, Settings, Workflow } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { usePathname } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DialogBackdrop, DialogCloseButton, DialogPortal, DialogRoot } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useShellStore } from '@/lib/stores/shell-store';
import { cn } from '@/lib/utils';

import { NavItem } from './nav-item';

export const MobileDrawer = () => {
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(false);

  const { isMobileDrawerOpen, setMobileDrawerOpen } = useShellStore();
  const pathname = usePathname();

  const updateIsWorkflowsOpen = useEffectEvent((isOpen: boolean) => {
    setIsWorkflowsOpen(isOpen);
  });
  const previousPathname = useEffectEvent(() => pathname);

  useEffect(() => {
    if (pathname.startsWith($path({ route: '/workflows' }))) {
      updateIsWorkflowsOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (isMobileDrawerOpen && pathname !== previousPathname()) {
      setMobileDrawerOpen(false);
    }
  }, [pathname, isMobileDrawerOpen, setMobileDrawerOpen]);

  const isPathActive = (href: string) => {
    if (href === $path({ route: '/dashboard' })) {
      return pathname === href || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const isWorkflowsSectionActive = pathname.startsWith($path({ route: '/workflows' }));

  return (
    <DialogRoot onOpenChange={setMobileDrawerOpen} open={isMobileDrawerOpen}>
      <DialogPortal>
        {/* Backdrop */}
        <DialogBackdrop />

        {/* Drawer Panel */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64',
            'border-r border-sidebar-border bg-sidebar-bg',
            'outline-none',
            'transition-transform duration-200 ease-out',
            'data-ending-style:-translate-x-full',
            'data-starting-style:-translate-x-full'
          )}
          role={'dialog'}
        >
          {/* Header */}
          <div className={'flex h-12 items-center justify-between border-b border-sidebar-border px-4'}>
            <span className={'text-sm font-semibold text-foreground'}>Navigation</span>
            <DialogCloseButton aria-label={'Close navigation'} />
          </div>

          {/* Navigation Content */}
          <nav aria-label={'Mobile navigation'} className={'flex h-[calc(100%-3rem)] flex-col overflow-y-auto p-2'}>
            {/* Primary Navigation */}
            <div className={'flex flex-col gap-1'}>
              {/* Dashboard */}
              <NavItem
                href={$path({ route: '/dashboard' })}
                icon={LayoutDashboard}
                isActive={isPathActive($path({ route: '/dashboard' }))}
                isCollapsed={false}
                label={'Dashboard'}
              />

              {/* Projects */}
              <NavItem
                href={$path({ route: '/projects' })}
                icon={FolderKanban}
                isActive={isPathActive($path({ route: '/projects' }))}
                isCollapsed={false}
                label={'Projects'}
              />
            </div>

            {/* Separator */}
            <Separator className={'my-2'} />

            {/* Workflows Section */}
            <div className={'flex flex-col gap-1'}>
              <Collapsible onOpenChange={setIsWorkflowsOpen} open={isWorkflowsOpen}>
                <CollapsibleTrigger
                  className={cn(
                    'h-10 w-full px-3 py-2 text-muted-foreground',
                    isWorkflowsSectionActive && 'text-foreground'
                  )}
                >
                  <Workflow aria-hidden={'true'} className={'size-4 shrink-0'} />
                  <span className={'flex-1 truncate text-left text-sm font-medium'}>Workflows</span>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className={'flex flex-col gap-1 py-1'}>
                    <NavItem
                      href={$path({ route: '/workflows/active' })}
                      icon={Play}
                      isActive={isPathActive($path({ route: '/workflows/active' }))}
                      isCollapsed={false}
                      isNested={true}
                      label={'Active'}
                    />
                    <NavItem
                      href={$path({ route: '/workflows/history' })}
                      icon={History}
                      isActive={isPathActive($path({ route: '/workflows/history' }))}
                      isCollapsed={false}
                      isNested={true}
                      label={'History'}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Templates */}
              <NavItem
                href={$path({ route: '/templates' })}
                icon={FileText}
                isActive={isPathActive($path({ route: '/templates' }))}
                isCollapsed={false}
                label={'Templates'}
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
                isCollapsed={false}
                label={'Agents'}
              />
              {/* Settings */}
              <NavItem
                href={$path({ route: '/settings' })}
                icon={Settings}
                isActive={isPathActive($path({ route: '/settings' }))}
                isCollapsed={false}
                label={'Settings'}
              />
            </div>
          </nav>
        </div>
      </DialogPortal>
    </DialogRoot>
  );
};
