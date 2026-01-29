"use client";

import { FolderOpen, Grid3X3, List, Plus } from "lucide-react";
import { $path } from "next-typesafe-url";
import { withParamValidation } from "next-typesafe-url/app/hoc";
import { useRouter } from "next/navigation";
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";

import { QueryErrorBoundary } from "@/components/data/query-error-boundary";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import {
  useArchiveProject,
  useProjects,
  useUnarchiveProject,
} from "@/hooks/queries/use-projects";
import { cn } from "@/lib/utils";

import { Route } from "./route-type";

const VIEW_OPTIONS = ["card", "table"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

/**
 * Loading skeleton for the projects grid view
 */
const ProjectCardSkeleton = () => {
  return (
    <Card className={"animate-pulse"}>
      <CardContent className={"p-6"}>
        <div className={"space-y-3"}>
          <div className={"h-5 w-3/4 rounded-sm bg-muted"} />
          <div className={"h-4 w-full rounded-sm bg-muted"} />
          <div className={"h-4 w-1/2 rounded-sm bg-muted"} />
        </div>
        <div className={"mt-4 flex gap-2"}>
          <div className={"h-8 w-16 rounded-sm bg-muted"} />
          <div className={"h-8 w-20 rounded-sm bg-muted"} />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Loading skeleton for the projects table view
 */
const ProjectTableSkeleton = () => {
  return (
    <div
      className={
        "animate-pulse overflow-x-auto rounded-lg border border-border"
      }
    >
      <table className={"w-full border-collapse text-sm"}>
        <thead className={"border-b border-border bg-muted/50"}>
          <tr>
            {["Name", "Description", "Created", "Status", "Actions"].map(
              (header) => (
                <th
                  className={
                    "px-4 py-3 text-left font-medium text-muted-foreground"
                  }
                  key={header}
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className={"divide-y divide-border"}>
          {Array.from({ length: 3 }).map((_, index) => (
            <tr key={index}>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-32 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-48 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-24 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-5 w-16 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"flex justify-end gap-2"}>
                  <div className={"h-8 w-16 rounded-sm bg-muted"} />
                  <div className={"h-8 w-20 rounded-sm bg-muted"} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Projects page - Main entry point for project management.
 *
 * Features:
 * - Card/table view toggle with URL state persistence
 * - Show/hide archived projects filter
 * - Create new project dialog
 * - Archive/unarchive project actions
 * - Empty state when no projects exist
 */
function ProjectsPageContent() {
  const router = useRouter();

  // URL state management with nuqs
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_OPTIONS).withDefault("card")
  );
  const [showArchived, setShowArchived] = useQueryState(
    "showArchived",
    parseAsBoolean.withDefault(false)
  );

  // Data fetching
  const { data: projects, isLoading } = useProjects();

  // Mutations
  const archiveProjectMutation = useArchiveProject();
  const unarchiveProjectMutation = useUnarchiveProject();

  const isArchiving =
    archiveProjectMutation.isPending || unarchiveProjectMutation.isPending;

  // Filter projects based on showArchived state
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (showArchived) return projects;
    return projects.filter((project) => project.archivedAt === null);
  }, [projects, showArchived]);

  // Handlers
  const handleViewChange = (newView: ViewOption) => {
    void setView(newView);
  };

  const handleShowArchivedChange = (checked: boolean) => {
    void setShowArchived(checked);
  };

  const handleArchive = (projectId: number) => {
    archiveProjectMutation.mutate(projectId);
  };

  const handleUnarchive = (projectId: number) => {
    unarchiveProjectMutation.mutate(projectId);
  };

  const handleViewDetails = (projectId: number) => {
    router.push($path({ route: "/projects/[id]", routeParams: { id: projectId } }));
  };

  // Check if there are no projects at all (not just filtered)
  const hasNoProjects = !isLoading && projects && projects.length === 0;

  return (
    <div className={"space-y-6"}>
      {/* Page heading */}
      <div className={"flex items-start justify-between gap-4"}>
        <div className={"space-y-1"}>
          <h1 className={"text-2xl font-semibold tracking-tight"}>Projects</h1>
          <p className={"text-muted-foreground"}>
            Manage your projects and repositories.
          </p>
        </div>
        <CreateProjectDialog
          trigger={
            <Button>
              <Plus aria-hidden={"true"} className={"size-4"} />
              {"Create Project"}
            </Button>
          }
        />
      </div>

      {/* Filters and view controls */}
      {!hasNoProjects && (
        <div className={"flex flex-wrap items-center justify-between gap-4"}>
          {/* View toggle */}
          <ButtonGroup>
            <Button
              aria-label={"Card view"}
              aria-pressed={view === "card"}
              className={cn(view === "card" && "bg-muted")}
              onClick={() => handleViewChange("card")}
              size={"sm"}
              variant={"outline"}
            >
              <Grid3X3 aria-hidden={"true"} className={"size-4"} />
              {"Cards"}
            </Button>
            <Button
              aria-label={"Table view"}
              aria-pressed={view === "table"}
              className={cn(view === "table" && "bg-muted")}
              onClick={() => handleViewChange("table")}
              size={"sm"}
              variant={"outline"}
            >
              <List aria-hidden={"true"} className={"size-4"} />
              {"Table"}
            </Button>
          </ButtonGroup>

          {/* Show archived toggle */}
          <div className={"flex items-center gap-2"}>
            <label
              className={"text-sm text-muted-foreground"}
              htmlFor={"show-archived"}
            >
              {"Show archived"}
            </label>
            <Switch
              checked={showArchived}
              id={"show-archived"}
              onCheckedChange={handleShowArchivedChange}
              size={"sm"}
            />
          </div>
        </div>
      )}

      {/* Projects content */}
      <QueryErrorBoundary>
        {isLoading ? (
          // Loading skeletons
          view === "card" ? (
            <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
              {Array.from({ length: 6 }).map((_, index) => (
                <ProjectCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <ProjectTableSkeleton />
          )
        ) : hasNoProjects ? (
          // Empty state when no projects exist
          <EmptyState
            action={
              <CreateProjectDialog
                trigger={
                  <Button>
                    <Plus aria-hidden={"true"} className={"size-4"} />
                    {"Create your first project"}
                  </Button>
                }
              />
            }
            description={
              "Get started by creating your first project to organize your workflows and repositories."
            }
            icon={<FolderOpen aria-hidden={"true"} className={"size-6"} />}
            title={"No projects yet"}
          />
        ) : filteredProjects.length === 0 ? (
          // Empty state when filters hide all projects
          <EmptyState
            action={
              <Button
                onClick={() => handleShowArchivedChange(true)}
                variant={"outline"}
              >
                {"Show archived projects"}
              </Button>
            }
            description={
              "All your projects are archived. Toggle the filter to see them."
            }
            icon={<FolderOpen aria-hidden={"true"} className={"size-6"} />}
            title={"No active projects"}
          />
        ) : view === "card" ? (
          // Card view
          <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onViewDetails={handleViewDetails}
                project={project}
              />
            ))}
          </div>
        ) : (
          // Table view
          <ProjectTable
            isArchiving={isArchiving}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onViewDetails={handleViewDetails}
            projects={filteredProjects}
          />
        )}
      </QueryErrorBoundary>
    </div>
  );
}

export default withParamValidation(ProjectsPageContent, Route);
