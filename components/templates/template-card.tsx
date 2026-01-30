"use client";

import type { ComponentPropsWithRef } from "react";

import { Copy, Pencil, Trash2 } from "lucide-react";

import type { Template, TemplateCategory } from "@/db/schema";

import { Badge, type badgeVariants } from "@/components/ui/badge";
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

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

const getCategoryVariant = (category: TemplateCategory): BadgeVariant => {
  const categoryVariantMap: Record<TemplateCategory, BadgeVariant> = {
    backend: "backend",
    data: "data",
    electron: "electron",
    security: "security",
    ui: "ui",
  };

  return categoryVariantMap[category] ?? "default";
};

const formatCategoryLabel = (category: TemplateCategory): string => {
  const labelMap: Record<TemplateCategory, string> = {
    backend: "Backend",
    data: "Data",
    electron: "Electron",
    security: "Security",
    ui: "UI",
  };

  return labelMap[category] ?? category;
};

const extractPlaceholders = (templateText: string): Array<string> => {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const placeholders: Array<string> = [];
  let match;

  while ((match = placeholderRegex.exec(templateText)) !== null) {
    const capturedGroup = match[1];
    if (capturedGroup) {
      const placeholder = capturedGroup.trim();
      if (!placeholders.includes(placeholder)) {
        placeholders.push(placeholder);
      }
    }
  }

  return placeholders;
};

interface TemplateCardProps extends Omit<
  ComponentPropsWithRef<"div">,
  "onClick"
> {
  onDelete?: (templateId: number) => void;
  onDuplicate?: (template: Template) => void;
  onEdit?: (templateId: number) => void;
  template: Template;
}

export const TemplateCard = ({
  className,
  onDelete,
  onDuplicate,
  onEdit,
  ref,
  template,
  ...props
}: TemplateCardProps) => {
  const isActive = template.deactivatedAt === null;
  const isBuiltIn = template.builtInAt !== null;
  const placeholders = extractPlaceholders(template.templateText);

  const handleEditClick = () => {
    onEdit?.(template.id);
  };

  const handleDeleteClick = () => {
    onDelete?.(template.id);
  };

  const handleDuplicateClick = () => {
    onDuplicate?.(template);
  };

  return (
    <Card
      aria-label={`${template.name} template${!isActive ? " (deactivated)" : ""}`}
      className={cn(
        "flex flex-col transition-opacity",
        !isActive && "opacity-60",
        className
      )}
      ref={ref}
      role={"article"}
      {...props}
    >
      {/* Header */}
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          <CardTitle
            className={"line-clamp-1"}
            id={`template-title-${template.id}`}
          >
            {template.name}
          </CardTitle>
          <Badge
            aria-label={`Category: ${formatCategoryLabel(template.category)}`}
            variant={getCategoryVariant(template.category)}
          >
            {formatCategoryLabel(template.category)}
          </Badge>
        </div>
        {template.description && (
          <CardDescription className={"line-clamp-2"}>
            {template.description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex flex-1 flex-col gap-3"}>
        {/* Metrics Row */}
        <div
          aria-label={"Template metrics"}
          className={"flex flex-wrap items-center gap-2"}
          role={"group"}
        >
          {/* Placeholder Count */}
          <Badge
            aria-label={`${placeholders.length} ${placeholders.length === 1 ? "placeholder" : "placeholders"}`}
            size={"sm"}
            variant={"default"}
          >
            {placeholders.length}{" "}
            {placeholders.length === 1 ? "placeholder" : "placeholders"}
          </Badge>

          {/* Usage Count */}
          <span
            aria-label={`Used ${template.usageCount} ${template.usageCount === 1 ? "time" : "times"}`}
            className={"text-sm text-muted-foreground"}
          >
            {template.usageCount} {template.usageCount === 1 ? "use" : "uses"}
          </span>
        </div>

        {/* Status Indicators */}
        <div
          aria-label={"Template status"}
          className={"flex flex-wrap items-center gap-2"}
          role={"group"}
        >
          {/* Active/Deactivated State */}
          <span
            aria-label={`Status: ${isActive ? "Active" : "Deactivated"}`}
            className={cn(
              "text-sm",
              isActive
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            )}
          >
            {isActive ? "Active" : "Deactivated"}
          </span>

          {/* Built-in Indicator */}
          {isBuiltIn && (
            <Badge
              aria-label={"Built-in template"}
              size={"sm"}
              variant={"category-builtin"}
            >
              {"Built-in"}
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter
        aria-label={"Template actions"}
        className={"gap-2"}
        role={"group"}
      >
        <Button
          aria-describedby={`template-title-${template.id}`}
          aria-label={`Edit ${template.name} template`}
          onClick={handleEditClick}
          size={"sm"}
          variant={"outline"}
        >
          <Pencil aria-hidden={"true"} className={"size-4"} />
          {"Edit"}
        </Button>
        <Button
          aria-describedby={`template-title-${template.id}`}
          aria-label={`Duplicate ${template.name} template`}
          onClick={handleDuplicateClick}
          size={"sm"}
          variant={"ghost"}
        >
          <Copy aria-hidden={"true"} className={"size-4"} />
          {"Duplicate"}
        </Button>
        {!isBuiltIn && (
          <Button
            aria-describedby={`template-title-${template.id}`}
            aria-label={`Delete ${template.name} template`}
            onClick={handleDeleteClick}
            size={"sm"}
            variant={"ghost"}
          >
            <Trash2 aria-hidden={"true"} className={"size-4"} />
            {"Delete"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
