"use client";

import type { ComponentPropsWithRef } from "react";

import { format } from "date-fns";
import { Archive, ArchiveRestore, ExternalLink } from "lucide-react";

import type { Project } from "@/db/schema/projects.schema";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProjectCardProps
  extends Omit<ComponentPropsWithRef<"div">, "onClick"> {
  onArchive?: (projectId: number) => void;
  onUnarchive?: (projectId: number) => void;
  onViewDetails?: (projectId: number) => void;
  project: Project;
}

export const ProjectCard = ({
  className,
  onArchive,
  onUnarchive,
  onViewDetails,
  project,
  ref,
  ...props
}: ProjectCardProps) => {
  const isArchived = project.archivedAt !== null;

  const handleArchiveClick = () => {
    onArchive?.(project.id);
  };

  const handleUnarchiveClick = () => {
    onUnarchive?.(project.id);
  };

  const handleViewDetailsClick = () => {
    onViewDetails?.(project.id);
  };

  const formattedDate = format(new Date(project.createdAt), "MMM d, yyyy");

  return (
    <Card
      className={cn(
        "flex flex-col transition-opacity",
        isArchived && "opacity-60",
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Header */}
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          <CardTitle className={"line-clamp-1"}>{project.name}</CardTitle>
          {isArchived && <Badge variant={"stale"}>{"Archived"}</Badge>}
        </div>
        {project.description && (
          <CardDescription className={"line-clamp-2"}>
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex-1"}>
        <p className={"text-xs text-muted-foreground"}>
          {"Created "}
          {formattedDate}
        </p>
      </CardContent>

      {/* Actions */}
      <CardFooter className={"gap-2"}>
        <Button
          aria-label={"View project details"}
          onClick={handleViewDetailsClick}
          size={"sm"}
          variant={"outline"}
        >
          <ExternalLink aria-hidden={"true"} className={"size-4"} />
          {"View"}
        </Button>
        {isArchived ? (
          <Button
            aria-label={"Unarchive project"}
            onClick={handleUnarchiveClick}
            size={"sm"}
            variant={"ghost"}
          >
            <ArchiveRestore aria-hidden={"true"} className={"size-4"} />
            {"Unarchive"}
          </Button>
        ) : (
          <Button
            aria-label={"Archive project"}
            onClick={handleArchiveClick}
            size={"sm"}
            variant={"ghost"}
          >
            <Archive aria-hidden={"true"} className={"size-4"} />
            {"Archive"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
