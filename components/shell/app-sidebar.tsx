"use client";

import {
  Bot,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  Play,
  Settings,
  Workflow,
} from "lucide-react";
import { $path } from "next-typesafe-url";
import { usePathname } from "next/navigation";
import {
  type ComponentPropsWithRef,
  useEffect,
  useEffectEvent,
  useState,
} from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { useShellStore } from "@/lib/stores/shell-store";
import { cn } from "@/lib/utils";

import { NavItem } from "./nav-item";

type AppSidebarProps = ComponentPropsWithRef<"aside">;

export const AppSidebar = ({ className, ref, ...props }: AppSidebarProps) => {
  const { isSidebarCollapsed } = useShellStore();
  const pathname = usePathname();

  /**
   * Check if a path is currently active
   */
  const isPathActive = (href: string) => {
    if (href === $path({ route: "/dashboard" })) {
      return pathname === href || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  /**
   * Check if any child path is active (for expandable sections)
   */
  const isWorkflowsSectionActive = pathname.startsWith(
    $path({ route: "/workflows" })
  );

  /**
   * Controlled state for Workflows collapsible section.
   * Auto-expands when navigating to workflow routes.
   */
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(
    isWorkflowsSectionActive
  );
  const updateIsWorkflowsOpen = useEffectEvent((isOpen: boolean) => {
    setIsWorkflowsOpen(isOpen);
  });

  useEffect(() => {
    if (isWorkflowsSectionActive) {
      updateIsWorkflowsOpen(true);
    }
  }, [isWorkflowsSectionActive]);

  return (
    <aside
      className={cn(
        `
          fixed top-12 left-0 z-40 h-[calc(100vh-3rem)]
          border-r border-sidebar-border bg-sidebar-bg
          transition-[width] duration-200 ease-out
        `,
        // Hide on mobile, show on tablet and up
        "hidden md:block",
        isSidebarCollapsed
          ? "w-(--sidebar-width-collapsed)"
          : "w-(--sidebar-width-expanded)",
        className
      )}
      data-collapsed={isSidebarCollapsed}
      ref={ref}
      {...props}
    >
      {/* Navigation Content */}
      <nav
        aria-label={"Main navigation"}
        className={"flex h-full flex-col overflow-x-hidden overflow-y-auto p-2"}
      >
        {/* Primary Navigation */}
        <div className={"flex flex-col gap-1"}>
          {/* Dashboard */}
          <NavItem
            href={$path({ route: "/dashboard" })}
            icon={LayoutDashboard}
            isActive={isPathActive($path({ route: "/dashboard" }))}
            isCollapsed={isSidebarCollapsed}
            label={"Dashboard"}
          />

          {/* Projects */}
          <NavItem
            href={$path({ route: "/projects" })}
            icon={FolderKanban}
            isActive={isPathActive($path({ route: "/projects" }))}
            isCollapsed={isSidebarCollapsed}
            label={"Projects"}
          />
        </div>

        {/* Separator */}
        <Separator className={"my-2"} />

        {/* Workflows Section */}
        <div className={"flex flex-col gap-1"}>
          {isSidebarCollapsed ? (
            /* Collapsed: Show icon-only with tooltip */
            <Tooltip content={"Workflows"} side={"right"}>
              <NavItem
                href={$path({ route: "/workflows/active" })}
                icon={Workflow}
                isActive={isWorkflowsSectionActive}
                isCollapsed={isSidebarCollapsed}
                label={"Workflows"}
              />
            </Tooltip>
          ) : (
            /* Expanded: Show collapsible section */
            <Collapsible
              onOpenChange={setIsWorkflowsOpen}
              open={isWorkflowsOpen}
            >
              <CollapsibleTrigger
                className={cn(
                  "h-10 w-full px-3 py-2 text-muted-foreground",
                  isWorkflowsSectionActive && "text-foreground"
                )}
              >
                <Workflow aria-hidden={"true"} className={"size-4 shrink-0"} />
                <span
                  className={"flex-1 truncate text-left text-sm font-medium"}
                >
                  {"Workflows"}
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className={"flex flex-col gap-1 py-1"}>
                  <NavItem
                    href={$path({ route: "/workflows/active" })}
                    icon={Play}
                    isActive={isPathActive(
                      $path({ route: "/workflows/active" })
                    )}
                    isCollapsed={isSidebarCollapsed}
                    isNested={true}
                    label={"Active"}
                  />
                  <NavItem
                    href={$path({ route: "/workflows/history" })}
                    icon={History}
                    isActive={isPathActive(
                      $path({ route: "/workflows/history" })
                    )}
                    isCollapsed={isSidebarCollapsed}
                    isNested={true}
                    label={"History"}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Templates */}
          <NavItem
            href={$path({ route: "/templates" })}
            icon={FileText}
            isActive={isPathActive($path({ route: "/templates" }))}
            isCollapsed={isSidebarCollapsed}
            label={"Templates"}
          />
        </div>

        {/* Separator */}
        <Separator className={"my-2"} />

        {/* Secondary Navigation */}
        <div className={"flex flex-col gap-1"}>
          {/* Agents */}
          <NavItem
            href={$path({ route: "/agents" })}
            icon={Bot}
            isActive={isPathActive($path({ route: "/agents" }))}
            isCollapsed={isSidebarCollapsed}
            label={"Agents"}
          />
        </div>

        {/* Spacer to push content up */}
        <div className={"flex-1"} />

        {/* Footer Navigation */}
        <Separator className={"my-2"} />
        <NavItem
          href={$path({ route: "/settings" })}
          icon={Settings}
          isActive={isPathActive($path({ route: "/settings" }))}
          isCollapsed={isSidebarCollapsed}
          label={"Settings"}
        />
      </nav>
    </aside>
  );
};
