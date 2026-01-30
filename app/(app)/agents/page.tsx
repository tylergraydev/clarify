"use client";

import { FolderOpen, Globe, Plus, Search } from "lucide-react";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { Fragment, useCallback, useRef } from "react";

import { AgentEditorDialog } from "@/components/agents/agent-editor-dialog";
import { AgentLayoutToggle } from "@/components/agents/agent-layout-toggle";
import { GlobalAgentsTabContent } from "@/components/agents/global-agents-tab-content";
import { ProjectAgentsTabContent } from "@/components/agents/project-agents-tab-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsRoot,
  TabsTrigger,
} from "@/components/ui/tabs";
import { agentTypes } from "@/db/schema/agents.schema";
import { useGlobalAgents, useProjectAgents } from "@/hooks/queries/use-agents";
import { useProject } from "@/hooks/queries/use-projects";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcut";
import { useShellStore } from "@/lib/stores/shell-store";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type TabValue = "global" | "project";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format agent type for display
 */
const formatTypeLabel = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Agents page - Main entry point for agent management.
 *
 * Features:
 * - Dual-tab interface: Global Agents and Project Agents
 * - URL-persisted tab state for sharing and bookmarking
 * - Search by name and description
 * - Type filter
 * - Show/hide deactivated toggle
 * - Edit agent via dialog
 * - Context-aware Create Agent button (respects active tab)
 * - Graceful degradation when no project is selected
 */
export default function AgentsPage() {
  // URL state management with nuqs
  const [activeTab, setActiveTab] = useQueryState<TabValue>(
    "tab",
    parseAsStringLiteral(["global", "project"] as const).withDefault("global")
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringLiteral([...agentTypes])
  );
  const [isShowDeactivated, setIsShowDeactivated] = useQueryState(
    "showDeactivated",
    parseAsBoolean.withDefault(false)
  );

  // Shell store for selected project
  const selectedProjectId = useShellStore((state) => state.selectedProjectId);

  // Fetch selected project details for header context
  const { data: selectedProject, isLoading: isProjectLoading } = useProject(
    selectedProjectId ?? 0
  );

  // Create agent dialog control
  const createDialogTriggerRef = useRef<HTMLButtonElement>(null);

  // Data fetching for counts (separate from tab content queries)
  const { data: globalAgents } = useGlobalAgents({
    includeDeactivated: isShowDeactivated,
    type: typeFilter ?? undefined,
  });
  const { data: projectAgents } = useProjectAgents(selectedProjectId ?? 0, {
    includeDeactivated: isShowDeactivated,
    type: typeFilter ?? undefined,
  });

  // Keyboard shortcut handlers
  const openCreateDialog = useCallback(() => {
    createDialogTriggerRef.current?.click();
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    { callback: openCreateDialog, options: { key: "n", modifiers: ["ctrl"] } },
  ]);

  // Handlers
  const handleTabChange = (newTab: null | string) => {
    if (newTab === "global" || newTab === "project") {
      void setActiveTab(newTab);
    }
  };

  const handleSearchChange = (newSearch: string) => {
    void setSearch(newSearch || null);
  };

  const handleTypeChange = (newType: null | string) => {
    if (!newType) {
      void setTypeFilter(null);
    } else {
      void setTypeFilter(newType as (typeof agentTypes)[number]);
    }
  };

  const handleShowDeactivatedChange = (isChecked: boolean) => {
    void setIsShowDeactivated(isChecked);
  };

  const handleClearFilters = () => {
    void setSearch(null);
    void setTypeFilter(null);
  };

  // Derived state
  const isProjectSelected = selectedProjectId !== null && selectedProjectId > 0;
  const isProjectTab = activeTab === "project";
  const hasActiveFilters = Boolean(typeFilter) || Boolean(search);

  // Filter props for tab content components
  const filterProps = {
    includeDeactivated: isShowDeactivated,
    search: search || undefined,
    type: typeFilter ?? undefined,
  };

  // Count display - use client-side filtered results
  const globalCount =
    globalAgents?.filter((agent) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const isMatchesName = agent.displayName
        .toLowerCase()
        .includes(searchLower);
      const isMatchesDescription =
        agent.description?.toLowerCase().includes(searchLower) ?? false;
      return isMatchesName || isMatchesDescription;
    }).length ?? 0;

  const projectCount =
    projectAgents?.filter((agent) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const isMatchesName = agent.displayName
        .toLowerCase()
        .includes(searchLower);
      const isMatchesDescription =
        agent.description?.toLowerCase().includes(searchLower) ?? false;
      return isMatchesName || isMatchesDescription;
    }).length ?? 0;

  // Determine which count to display based on active tab
  const displayCount = isProjectTab ? projectCount : globalCount;
  const totalCount = isProjectTab
    ? (projectAgents?.length ?? 0)
    : (globalAgents?.length ?? 0);
  const isFiltered = hasActiveFilters && displayCount !== totalCount;

  // Determine if we should show the count badge
  const shouldShowCountBadge = isProjectTab ? isProjectSelected : true;

  // Determine projectId for create dialog
  const createAgentProjectId =
    isProjectTab && isProjectSelected ? selectedProjectId : undefined;

  return (
    <main aria-label={"Agent management"} className={"space-y-6"}>
      {/* Skip link for keyboard navigation */}
      <a
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
          "z-50 rounded-md bg-background px-4 py-2 text-sm font-medium",
          "ring-2 ring-accent ring-offset-2"
        )}
        href={"#agent-content"}
      >
        {"Skip to agent content"}
      </a>

      {/* Page heading */}
      <header className={"flex items-start justify-between gap-4"}>
        <div className={"space-y-1"}>
          <div className={"flex items-center gap-3"}>
            <h1 className={"text-2xl font-semibold tracking-tight"}>
              {"Agents"}
            </h1>
            {/* Project context when on Project Agents tab */}
            {isProjectTab && isProjectSelected && (
              <span className={"text-lg text-muted-foreground"}>
                {isProjectLoading ? (
                  <span className={"animate-pulse"}>{"Loading..."}</span>
                ) : selectedProject ? (
                  <Fragment>
                    <span className={"mx-2"}>{"/"}</span>
                    <span className={"font-medium text-foreground"}>
                      {selectedProject.name}
                    </span>
                  </Fragment>
                ) : null}
              </span>
            )}
            {/* Result count badge - show count for active tab */}
            {shouldShowCountBadge && (
              <Badge size={"sm"} variant={"default"}>
                {isFiltered
                  ? `${displayCount} of ${totalCount}`
                  : `${displayCount}`}
              </Badge>
            )}
          </div>
          <p className={"text-muted-foreground"}>
            {isProjectTab
              ? isProjectSelected
                ? `Configure project-specific agents for ${selectedProject?.name ?? "this project"}.`
                : "Select a project to view and manage project-specific agents."
              : "Configure and customize global AI agents for your workflows."}
          </p>
        </div>
        <AgentEditorDialog
          mode={"create"}
          projectId={createAgentProjectId}
          trigger={
            <Button ref={createDialogTriggerRef}>
              <Plus aria-hidden={"true"} className={"size-4"} />
              {isProjectTab ? "Create Project Agent" : "Create Global Agent"}
              <kbd
                className={
                  "ml-2 hidden rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground md:inline-block"
                }
              >
                {"Ctrl+N"}
              </kbd>
            </Button>
          }
        />
      </header>

      {/* Filters - always show for easy access */}
      <div className={"flex flex-wrap items-center gap-4"}>
        {/* Type filter */}
        <SelectRoot
          onValueChange={(newValue) => handleTypeChange(newValue)}
          value={typeFilter ?? ""}
        >
          <SelectTrigger
            aria-label={"Filter by type"}
            className={"w-40"}
            size={"sm"}
          >
            <SelectValue placeholder={"All types"} />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup size={"sm"}>
                <SelectList>
                  <SelectItem label={"All types"} size={"sm"} value={""}>
                    {"All types"}
                  </SelectItem>
                  {agentTypes.map((type) => (
                    <SelectItem
                      key={type}
                      label={formatTypeLabel(type)}
                      size={"sm"}
                      value={type}
                    >
                      {formatTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>

        {/* Search input */}
        <div className={"relative flex-1 md:max-w-xs"}>
          <Search
            aria-hidden={"true"}
            className={cn(
              "absolute top-1/2 left-2.5 size-4 -translate-y-1/2",
              "text-muted-foreground"
            )}
          />
          <Input
            aria-label={"Search agents"}
            className={"pl-8"}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={"Search by name or description..."}
            size={"sm"}
            type={"search"}
            value={search}
          />
        </div>

        {/* Show deactivated toggle */}
        <div className={"flex items-center gap-2"}>
          <Switch
            aria-label={"Show deactivated agents"}
            checked={isShowDeactivated}
            onCheckedChange={handleShowDeactivatedChange}
            size={"sm"}
          />
          <span className={"text-sm text-muted-foreground"}>
            {"Show deactivated"}
          </span>
        </div>

        {/* Layout toggle */}
        <AgentLayoutToggle />

        {/* Clear filters button (only show when filters are active) */}
        {hasActiveFilters && (
          <Button onClick={handleClearFilters} size={"sm"} variant={"ghost"}>
            {"Clear filters"}
          </Button>
        )}
      </div>

      {/* Tabbed content */}
      <section
        aria-label={"Agents list"}
        aria-live={"polite"}
        id={"agent-content"}
      >
        <TabsRoot onValueChange={handleTabChange} value={activeTab}>
          <TabsList>
            <TabsTrigger className={"flex gap-x-1"} value={"global"}>
              <Globe aria-hidden={"true"} className={"size-4"} />
              Global Agents
            </TabsTrigger>
            <TabsTrigger className={"flex gap-x-1"} value={"project"}>
              <FolderOpen aria-hidden={"true"} className={"size-4"} />
              Project Agents
            </TabsTrigger>
            <TabsIndicator />
          </TabsList>

          {/* Global Agents Tab */}
          <TabsPanel value={"global"}>
            <GlobalAgentsTabContent filters={filterProps} />
          </TabsPanel>

          {/* Project Agents Tab */}
          <TabsPanel value={"project"}>
            <ProjectAgentsTabContent
              filters={filterProps}
              projectId={selectedProjectId ?? 0}
            />
          </TabsPanel>
        </TabsRoot>
      </section>
    </main>
  );
}
