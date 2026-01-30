"use client";

import type { ComponentPropsWithRef } from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { ChevronsUpDown, FolderKanban } from "lucide-react";

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
import { Tooltip } from "@/components/ui/tooltip";
import { useProjects } from "@/hooks/queries/use-projects";
import { useShellStore } from "@/lib/stores/shell-store";
import { cn } from "@/lib/utils";

export const projectSelectorTriggerVariants = cva(
  `
    inline-flex w-full items-center justify-between gap-2 rounded-md border
    border-border bg-transparent text-sm font-medium text-foreground
    hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent
    focus-visible:ring-offset-0
    focus-visible:outline-none data-disabled:pointer-events-none
    data-disabled:opacity-50 data-popup-open:ring-2
    data-popup-open:ring-accent
    data-popup-open:ring-offset-0
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        compact: "h-8 px-2",
        default: "h-9 px-3",
      },
    },
  }
);

interface ProjectSelectorProps
  extends
    Omit<ComponentPropsWithRef<"div">, "children" | "onChange">,
    ProjectSelectorTriggerVariants {
  isCollapsed?: boolean;
  onProjectChange?: (projectId: string) => void;
  value?: string;
}

type ProjectSelectorTriggerVariants = VariantProps<
  typeof projectSelectorTriggerVariants
>;

export const ProjectSelector = ({
  className,
  isCollapsed = false,
  onProjectChange,
  ref,
  size = "default",
  value,
  ...props
}: ProjectSelectorProps) => {
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const { selectedProjectId, setSelectedProject } = useShellStore();

  // Use explicit value prop if provided, otherwise fall back to shell store
  // Use null (not undefined) when no project is selected to keep Select in controlled mode
  const controlledValue =
    value ?? (selectedProjectId !== null ? String(selectedProjectId) : null);

  const handleValueChange = (newValue: null | string) => {
    if (newValue !== null) {
      // Update shell store
      setSelectedProject(Number(newValue));
      // Call optional callback
      onProjectChange?.(newValue);
    }
  };

  const selectedProject = projects?.find(
    (p) => String(p.id) === controlledValue
  );
  const hasProjects = projects && projects.length > 0;

  // Loading state
  if (isProjectsLoading) {
    const loadingContent = (
      <div
        className={cn(
          projectSelectorTriggerVariants({ size }),
          "cursor-wait opacity-50",
          isCollapsed && "w-8 justify-center px-0",
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Icon */}
        <FolderKanban aria-hidden={"true"} className={"size-4 shrink-0"} />

        {/* Label */}
        {!isCollapsed && <span className={"truncate"}>{"Loading..."}</span>}
      </div>
    );

    if (isCollapsed) {
      return (
        <Tooltip content={"Loading projects..."} side={"right"}>
          {loadingContent}
        </Tooltip>
      );
    }

    return loadingContent;
  }

  // Empty state
  if (!hasProjects) {
    const emptyContent = (
      <div
        className={cn(
          projectSelectorTriggerVariants({ size }),
          "cursor-not-allowed opacity-50",
          isCollapsed && "w-8 justify-center px-0",
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Icon */}
        <FolderKanban aria-hidden={"true"} className={"size-4 shrink-0"} />

        {/* Label */}
        {!isCollapsed && <span className={"truncate"}>{"No projects"}</span>}
      </div>
    );

    if (isCollapsed) {
      return (
        <Tooltip content={"No projects available"} side={"right"}>
          {emptyContent}
        </Tooltip>
      );
    }

    return emptyContent;
  }

  // Collapsed state with tooltip
  if (isCollapsed) {
    return (
      <Tooltip
        content={selectedProject?.name ?? "Select project"}
        side={"right"}
      >
        <div ref={ref} {...props}>
          <SelectRoot onValueChange={handleValueChange} value={controlledValue}>
            <SelectTrigger
              className={cn(
                projectSelectorTriggerVariants({ size }),
                "w-8 justify-center px-0",
                className
              )}
            >
              <FolderKanban
                aria-hidden={"true"}
                className={"size-4 shrink-0"}
              />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup>
                  <SelectList>
                    {projects.map((project) => (
                      <SelectItem
                        key={project.id}
                        label={project.name}
                        value={String(project.id)}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>
        </div>
      </Tooltip>
    );
  }

  // Default expanded state
  return (
    <div ref={ref} {...props}>
      <SelectRoot onValueChange={handleValueChange} value={controlledValue}>
        <SelectTrigger
          className={cn(projectSelectorTriggerVariants({ size }), className)}
        >
          {/* Icon */}
          <FolderKanban aria-hidden={"true"} className={"size-4 shrink-0"} />

          {/* Value */}
          <SelectValue
            className={"flex-1 truncate text-left"}
            placeholder={"Select project"}
          />

          {/* Chevron */}
          <ChevronsUpDown
            aria-hidden={"true"}
            className={"size-4 shrink-0 opacity-50"}
          />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList>
                {projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    label={project.name}
                    value={String(project.id)}
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>
    </div>
  );
};
