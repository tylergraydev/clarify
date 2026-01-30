"use client";

import type { ComponentPropsWithRef } from "react";

import { format } from "date-fns";
import { FolderGit2, Pencil, Star, StarOff, Trash2 } from "lucide-react";

import type { Repository } from "@/db/schema/repositories.schema";

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

interface RepositoryCardProps
  extends Omit<ComponentPropsWithRef<"div">, "onClick"> {
  isDefault?: boolean;
  onClearDefault?: (repositoryId: number) => void;
  onDelete?: (repositoryId: number) => void;
  onEdit?: (repository: Repository) => void;
  onSetDefault?: (repositoryId: number) => void;
  repository: Repository;
}

export const RepositoryCard = ({
  className,
  isDefault = false,
  onClearDefault,
  onDelete,
  onEdit,
  onSetDefault,
  ref,
  repository,
  ...props
}: RepositoryCardProps) => {
  const handleClearDefaultClick = () => {
    onClearDefault?.(repository.id);
  };

  const handleDeleteClick = () => {
    onDelete?.(repository.id);
  };

  const handleEditClick = () => {
    onEdit?.(repository);
  };

  const handleSetDefaultClick = () => {
    onSetDefault?.(repository.id);
  };

  const formattedDate = format(new Date(repository.createdAt), "MMM d, yyyy");

  return (
    <Card
      className={cn("flex flex-col transition-opacity", className)}
      ref={ref}
      {...props}
    >
      {/* Header */}
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          <div className={"flex items-center gap-2"}>
            <FolderGit2
              aria-hidden={"true"}
              className={"size-4 shrink-0 text-muted-foreground"}
            />
            <CardTitle className={"line-clamp-1"}>{repository.name}</CardTitle>
          </div>
          {isDefault && <Badge variant={"default"}>{"Default"}</Badge>}
        </div>
        <CardDescription className={"line-clamp-1 font-mono text-xs"}>
          {repository.path}
        </CardDescription>
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex flex-1 flex-col gap-2"}>
        {/* Branch Info */}
        <div className={"flex items-center gap-2"}>
          <span className={"text-sm text-muted-foreground"}>
            {"Default branch:"}
          </span>
          <code
            className={
              "rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
            }
          >
            {repository.defaultBranch}
          </code>
        </div>

        {/* Created Date */}
        <p className={"text-xs text-muted-foreground"}>
          {"Created "}
          {formattedDate}
        </p>
      </CardContent>

      {/* Actions */}
      <CardFooter className={"gap-2"}>
        {isDefault ? (
          <Button
            aria-label={"Clear default repository status"}
            onClick={handleClearDefaultClick}
            size={"sm"}
            variant={"outline"}
          >
            <StarOff aria-hidden={"true"} className={"size-4"} />
            {"Clear Default"}
          </Button>
        ) : (
          <Button
            aria-label={"Set repository as default"}
            onClick={handleSetDefaultClick}
            size={"sm"}
            variant={"outline"}
          >
            <Star aria-hidden={"true"} className={"size-4"} />
            {"Set Default"}
          </Button>
        )}
        <Button
          aria-label={"Edit repository"}
          onClick={handleEditClick}
          size={"sm"}
          variant={"ghost"}
        >
          <Pencil aria-hidden={"true"} className={"size-4"} />
          {"Edit"}
        </Button>
        <Button
          aria-label={"Remove repository"}
          onClick={handleDeleteClick}
          size={"sm"}
          variant={"ghost"}
        >
          <Trash2 aria-hidden={"true"} className={"size-4"} />
          {"Remove"}
        </Button>
      </CardFooter>
    </Card>
  );
};
