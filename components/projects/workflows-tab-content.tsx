"use client";

import type { ComponentPropsWithRef } from "react";

import { AlertCircle, GitBranch, Grid3X3, List, Plus } from "lucide-react";
import { $path } from "next-typesafe-url";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { WorkflowTable } from "@/components/workflows/workflow-table";
import {
  useCancelWorkflow,
  useWorkflowsByProject,
} from "@/hooks/queries/use-workflows";
import { cn } from "@/lib/utils";

type ViewOption = "card" | "table";

interface WorkflowsTabContentProps extends ComponentPropsWithRef<"div"> {
  /** The ID of the project to display workflows for */
  projectId: number;
  /** The name of the project (for display in WorkflowTable) */
  projectName?: string;
}

export const WorkflowsTabContent = ({
  className,
  projectId,
  projectName,
  ref,
  ...props
}: WorkflowsTabContentProps) => {
  const router = useRouter();

  const [view, setView] = useState<ViewOption>("table");

  const {
    data: workflows,
    error,
    isLoading,
  } = useWorkflowsByProject(projectId);

  const cancelWorkflowMutation = useCancelWorkflow();

  const handleCancelWorkflow = (workflowId: number) => {
    cancelWorkflowMutation.mutate(workflowId);
  };

  const handleViewDetails = (workflowId: number) => {
    router.push(
      $path({
        route: "/workflows/[id]",
        routeParams: { id: String(workflowId) },
      })
    );
  };

  const handleViewChange = (newView: ViewOption) => {
    setView(newView);
  };

  const handleCreateWorkflow = () => {
    router.push(
      $path({
        route: "/workflows/new",
        searchParams: { projectId },
      })
    );
  };

  // Build project map for WorkflowTable
  const projectMap: Record<number, string> = projectName
    ? { [projectId]: projectName }
    : {};

  // Derived state
  const isWorkflowsEmpty = !isLoading && !error && workflows?.length === 0;
  const hasWorkflows =
    !isLoading && !error && workflows && workflows.length > 0;
  const hasError = !isLoading && error;

  // Loading State
  if (isLoading) {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        ref={ref}
        {...props}
      >
        {/* Header with View Toggle Skeleton */}
        <div className={"flex items-center justify-between"}>
          <div className={"h-9 w-40 animate-pulse rounded-md bg-muted"} />
          <div className={"h-9 w-32 animate-pulse rounded-md bg-muted"} />
        </div>

        {/* Table Skeleton (default view) */}
        <WorkflowTableSkeleton />
      </div>
    );
  }

  // Error State
  if (hasError) {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        ref={ref}
        {...props}
      >
        <EmptyState
          description={"Failed to load workflows. Please try again."}
          icon={<AlertCircle className={"size-6"} />}
          title={"Error Loading Workflows"}
        />
      </div>
    );
  }

  // Empty State
  if (isWorkflowsEmpty) {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        ref={ref}
        {...props}
      >
        <EmptyState
          action={
            <Button onClick={handleCreateWorkflow}>
              <Plus aria-hidden={"true"} className={"size-4"} />
              {"Create Workflow"}
            </Button>
          }
          description={
            "Create a workflow to plan or implement features for this project."
          }
          icon={<GitBranch className={"size-6"} />}
          title={"No Workflows"}
        />
      </div>
    );
  }

  // Content State
  if (hasWorkflows) {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        ref={ref}
        {...props}
      >
        {/* Header with View Toggle and Create Button */}
        <div className={"flex items-center justify-between"}>
          {/* View Toggle */}
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

          {/* Create Workflow Button */}
          <Button onClick={handleCreateWorkflow}>
            <Plus aria-hidden={"true"} className={"size-4"} />
            {"Create Workflow"}
          </Button>
        </div>

        {/* Workflows Content */}
        {view === "card" ? (
          <div className={"grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                onCancel={handleCancelWorkflow}
                onViewDetails={handleViewDetails}
                workflow={workflow}
              />
            ))}
          </div>
        ) : (
          <WorkflowTable
            onCancel={handleCancelWorkflow}
            onViewDetails={handleViewDetails}
            projectMap={projectMap}
            workflows={workflows}
          />
        )}
      </div>
    );
  }

  return null;
};

/**
 * Loading skeleton for the workflows table view
 */
const WorkflowTableSkeleton = () => {
  return (
    <div
      className={
        "animate-pulse overflow-x-auto rounded-lg border border-border"
      }
    >
      <table className={"w-full border-collapse text-sm"}>
        <thead className={"border-b border-border bg-muted/50"}>
          <tr>
            {[
              "Feature Name",
              "Project",
              "Type",
              "Status",
              "Progress",
              "Created",
              "Actions",
            ].map((header) => (
              <th
                className={
                  "px-4 py-3 text-left font-medium text-muted-foreground"
                }
                key={header}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={"divide-y divide-border"}>
          {Array.from({ length: 3 }).map((_, index) => (
            <tr key={index}>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-32 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-24 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-5 w-20 rounded-full bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-5 w-16 rounded-full bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-12 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-24 rounded-sm bg-muted"} />
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
 * Loading skeleton for the workflows card view
 */
const WorkflowCardSkeleton = () => {
  return (
    <Card className={"animate-pulse"}>
      <CardContent className={"p-6"}>
        <div className={"space-y-3"}>
          <div className={"flex items-start justify-between gap-2"}>
            <div className={"h-5 w-3/4 rounded-sm bg-muted"} />
            <div className={"h-5 w-16 rounded-full bg-muted"} />
          </div>
          <div className={"h-4 w-1/2 rounded-sm bg-muted"} />
        </div>
        <div className={"mt-4 space-y-2"}>
          <div className={"flex items-center gap-2"}>
            <div className={"h-4 w-12 rounded-sm bg-muted"} />
            <div className={"h-5 w-20 rounded-full bg-muted"} />
          </div>
          <div className={"h-2 w-full rounded-full bg-muted"} />
          <div className={"h-4 w-32 rounded-sm bg-muted"} />
        </div>
        <div className={"mt-4 flex gap-2"}>
          <div className={"h-8 w-16 rounded-sm bg-muted"} />
          <div className={"h-8 w-20 rounded-sm bg-muted"} />
        </div>
      </CardContent>
    </Card>
  );
};

// Export the skeleton for potential external use
export { WorkflowCardSkeleton, WorkflowTableSkeleton };
