'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, FolderKanban, History, LayoutDashboard, Play, Settings, Star, Workflow } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { usePathname } from 'next/navigation';

const WORKFLOWS_BASE_PATH = $path({ route: '/workflows/active' }).replace('/active', '');

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useFavoriteProjects } from '@/hooks/queries/use-projects';
import { useShellStore } from '@/lib/stores/shell-store';
import { cn } from '@/lib/utils';

/** Nav item keys for persistence */
const NAV_ITEM_KEYS = {
  FAVORITES: 'favorites',
  WORKFLOWS: 'workflows',
} as const;

import { CollapsedNavMenu } from './collapsed-nav-menu';
import { NavItem } from './nav-item';

type AppSidebarProps = ComponentPropsWithRef<'aside'>;

export const AppSidebar = ({ className, ref, ...props }: AppSidebarProps) => {
  const { expandedNavItems, isSidebarCollapsed, toggleNavItemExpanded } = useShellStore();
  const pathname = usePathname();

  const { data: favoriteProjects = [], isLoading: isFavoritesLoading } = useFavoriteProjects();

  const isWorkflowsActive = pathname.startsWith(WORKFLOWS_BASE_PATH);
  const isFavoritesOpen = expandedNavItems.includes(NAV_ITEM_KEYS.FAVORITES);
  const isWorkflowsOpen = expandedNavItems.includes(NAV_ITEM_KEYS.WORKFLOWS);

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

          {/* Separator */}
          <Separator className={'my-2'} />

          {/* Favorites */}
          {isSidebarCollapsed ? (
            favoriteProjects.length > 0 ? (
              <CollapsedNavMenu
                icon={Star}
                isActive={false}
                items={favoriteProjects.map((project) => ({
                  href: $path({ route: '/projects/[id]', routeParams: { id: String(project.id) } }),
                  isActive: pathname === $path({ route: '/projects/[id]', routeParams: { id: String(project.id) } }),
                  label: project.name,
                }))}
                label={'Favorites'}
              />
            ) : (
              <NavItem
                href={$path({ route: '/projects' })}
                icon={Star}
                isActive={false}
                isCollapsed={isSidebarCollapsed}
                label={'Favorites'}
              />
            )
          ) : (
            <Collapsible onOpenChange={() => toggleNavItemExpanded(NAV_ITEM_KEYS.FAVORITES)} open={isFavoritesOpen}>
              <CollapsibleTrigger
                className={cn(
                  `
                    h-10 w-full px-3 py-2
                    text-muted-foreground
                    hover:bg-muted hover:text-foreground
                  `
                )}
              >
                <Star aria-hidden={'true'} className={'size-4 shrink-0'} />
                <span className={'flex-1 truncate text-left'}>Favorites</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {isFavoritesLoading ? (
                  <div className={'px-9 py-2 text-xs text-muted-foreground'}>Loading...</div>
                ) : favoriteProjects.length === 0 ? (
                  <div className={'px-9 py-2 text-xs text-muted-foreground'}>No favorites yet</div>
                ) : (
                  favoriteProjects.map((project) => (
                    <NavItem
                      href={$path({ route: '/projects/[id]', routeParams: { id: String(project.id) } })}
                      isActive={
                        pathname === $path({ route: '/projects/[id]', routeParams: { id: String(project.id) } })
                      }
                      isCollapsed={false}
                      isNested={true}
                      key={project.id}
                      label={project.name}
                    />
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Separator */}
          <Separator className={'my-2'} />

          {/* Projects */}
          <NavItem
            href={$path({ route: '/projects' })}
            icon={FolderKanban}
            isActive={isPathActive($path({ route: '/projects' }))}
            isCollapsed={isSidebarCollapsed}
            label={'Projects'}
          />

          {/* Agents */}
          <NavItem
            href={$path({ route: '/agents' })}
            icon={Bot}
            isActive={isPathActive($path({ route: '/agents' }))}
            isCollapsed={isSidebarCollapsed}
            label={'Agents'}
          />

          {/* Templates */}
          <NavItem
            href={$path({ route: '/templates' })}
            icon={Bot}
            isActive={isPathActive($path({ route: '/templates' }))}
            isCollapsed={isSidebarCollapsed}
            label={'Templates'}
          />

          {/* Separator */}
          <Separator className={'my-2'} />

          {/* Workflows */}
          {isSidebarCollapsed ? (
            <CollapsedNavMenu
              icon={Workflow}
              isActive={isWorkflowsActive}
              items={[
                {
                  href: $path({ route: '/workflows/active' }),
                  icon: Play,
                  isActive: pathname === $path({ route: '/workflows/active' }),
                  label: 'Active',
                },
                {
                  href: $path({ route: '/workflows/history', searchParams: {} }),
                  icon: History,
                  isActive: pathname === $path({ route: '/workflows/history', searchParams: {} }),
                  label: 'History',
                },
              ]}
              label={'Workflows'}
            />
          ) : (
            <Collapsible
              onOpenChange={() => toggleNavItemExpanded(NAV_ITEM_KEYS.WORKFLOWS)}
              open={isWorkflowsOpen || isWorkflowsActive}
            >
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

        {/* Secondary Navigation */}
        <div className={'flex flex-col gap-1'}>
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
