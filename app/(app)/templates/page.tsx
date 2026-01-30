"use client";

import type { MouseEvent, RefObject } from "react";

import {
  Copy,
  FileText,
  Grid3X3,
  List,
  Minus,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";

import type { Template } from "@/types/electron";

import { QueryErrorBoundary } from "@/components/data/query-error-boundary";
import { ConfirmDeleteDialog } from "@/components/templates/confirm-delete-dialog";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
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
  templateCategories,
  type TemplateCategory,
} from "@/db/schema/templates.schema";
import {
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate,
} from "@/hooks/queries/use-templates";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcut";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

const VIEW_OPTIONS = ["card", "table"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

/**
 * Map template category to badge variant for consistent styling.
 */
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

/**
 * Extract unique placeholders from template text.
 */
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

/**
 * Loading skeleton for the templates grid view.
 * Matches the visual structure of TemplateCard with animated placeholders.
 */
const TemplateCardSkeleton = () => {
  return (
    <Card className={"animate-pulse"}>
      {/* Header */}
      <CardHeader>
        <div className={"flex items-start justify-between gap-2"}>
          {/* Title */}
          <div className={"h-5 w-32 rounded-sm bg-muted"} />
          {/* Category badge */}
          <div className={"h-5 w-16 rounded-full bg-muted"} />
        </div>
        {/* Description */}
        <div className={"mt-1.5 space-y-1"}>
          <div className={"h-4 w-full rounded-sm bg-muted"} />
          <div className={"h-4 w-3/4 rounded-sm bg-muted"} />
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className={"flex flex-1 flex-col gap-3"}>
        {/* Metrics row */}
        <div className={"flex flex-wrap items-center gap-2"}>
          <div className={"h-5 w-24 rounded-full bg-muted"} />
          <div className={"h-4 w-12 rounded-sm bg-muted"} />
        </div>
        {/* Status indicators */}
        <div className={"flex flex-wrap items-center gap-2"}>
          <div className={"h-4 w-16 rounded-sm bg-muted"} />
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className={"gap-2"}>
        <div className={"h-8 w-16 rounded-md bg-muted"} />
        <div className={"size-8 rounded-md bg-muted"} />
      </CardFooter>
    </Card>
  );
};

/**
 * Loading skeleton for the templates table view.
 */
const TemplateTableSkeleton = () => {
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
              "Name",
              "Category",
              "Description",
              "Placeholders",
              "Uses",
              "Status",
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
                <div className={"h-5 w-16 rounded-full bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-48 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-8 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-8 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"h-4 w-16 rounded-sm bg-muted"} />
              </td>
              <td className={"px-4 py-3"}>
                <div className={"flex justify-end gap-2"}>
                  <div className={"h-8 w-16 rounded-md bg-muted"} />
                  <div className={"size-8 rounded-md bg-muted"} />
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
 * Format category label for display.
 */
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

/**
 * Filter templates based on search term.
 * Searches against name, description, category, and placeholder names.
 */
const filterTemplatesBySearch = (
  templates: Array<Template>,
  searchTerm: string
): Array<Template> => {
  if (!searchTerm.trim()) {
    return templates;
  }

  const searchLower = searchTerm.toLowerCase().trim();

  return templates.filter((template) => {
    // Match against name
    if (template.name.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Match against description
    if (template.description?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Match against category (both key and formatted label)
    if (template.category.toLowerCase().includes(searchLower)) {
      return true;
    }
    if (
      formatCategoryLabel(template.category).toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Match against placeholder names
    const placeholders = extractPlaceholders(template.templateText);
    if (
      placeholders.some((placeholder) =>
        placeholder.toLowerCase().includes(searchLower)
      )
    ) {
      return true;
    }

    return false;
  });
};

// ============================================================================
// Bulk Delete Confirmation Dialog
// ============================================================================

interface BulkDeleteConfirmDialogProps {
  /** Whether the mutation is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open (controlled) */
  isOpen: boolean;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Callback when the dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Number of templates selected for deletion */
  selectedCount: number;
  /** Total usage count across all selected templates */
  totalUsageCount: number;
}

/**
 * Confirmation dialog for bulk delete operations.
 */
const BulkDeleteConfirmDialog = ({
  isLoading = false,
  isOpen,
  onConfirm,
  onOpenChange,
  selectedCount,
  totalUsageCount,
}: BulkDeleteConfirmDialogProps) => {
  const hasUsage = totalUsageCount > 0;

  const handleConfirmClick = () => {
    onConfirm();
  };

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={"true"} role={"alertdialog"}>
          <DialogTitle id={"bulk-delete-title"}>
            {`Delete ${selectedCount} ${selectedCount === 1 ? "Template" : "Templates"}`}
          </DialogTitle>
          <DialogDescription id={"bulk-delete-description"}>
            {`Are you sure you want to delete ${selectedCount} ${selectedCount === 1 ? "template" : "templates"}? This action cannot be undone.`}
          </DialogDescription>

          {/* Usage Warning */}
          {hasUsage && (
            <div
              aria-live={"polite"}
              className={
                "mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
              }
              role={"alert"}
            >
              <p className={"text-sm text-amber-800 dark:text-amber-200"}>
                {`These templates have been used a combined total of ${totalUsageCount} ${totalUsageCount === 1 ? "time" : "times"}. Deleting them will not affect existing workflows that used these templates.`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div
            aria-label={"Confirm bulk deletion actions"}
            className={"mt-6 flex justify-end gap-3"}
            role={"group"}
          >
            <DialogClose>
              <Button disabled={isLoading} variant={"outline"}>
                {"Cancel"}
              </Button>
            </DialogClose>
            <Button
              aria-describedby={"bulk-delete-description"}
              aria-label={`Delete ${selectedCount} ${selectedCount === 1 ? "template" : "templates"} permanently`}
              disabled={isLoading}
              onClick={handleConfirmClick}
              variant={"destructive"}
            >
              {isLoading
                ? "Deleting..."
                : `Delete ${selectedCount} ${selectedCount === 1 ? "Template" : "Templates"}`}
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};

/**
 * Initial data for duplicating a template.
 * Used to pre-fill the create dialog with copied template data.
 */
interface DuplicateTemplateData {
  category: string;
  description?: string;
  name: string;
  templateText: string;
}

interface TemplateGridItemProps {
  isSelected: boolean;
  onDelete: (template: Template) => void;
  onDuplicate: (data: DuplicateTemplateData) => void;
  onSelectionChange: (templateId: number, isSelected: boolean) => void;
  template: Template;
}

/**
 * Renders a TemplateCard with a TemplateEditorDialog.
 * The Edit button in the card triggers the dialog via a hidden trigger element.
 */
const TemplateGridItem = ({
  isSelected,
  onDelete,
  onDuplicate,
  onSelectionChange,
  template,
}: TemplateGridItemProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isBuiltIn = template.builtInAt !== null;

  const handleEditClick = () => {
    // Programmatically click the hidden dialog trigger
    triggerRef.current?.click();
  };

  const handleDeleteClick = () => {
    onDelete(template);
  };

  const handleDuplicateClick = (templateToDuplicate: Template) => {
    onDuplicate({
      category: templateToDuplicate.category,
      description: templateToDuplicate.description ?? undefined,
      name: `${templateToDuplicate.name} (Copy)`,
      templateText: templateToDuplicate.templateText,
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange(template.id, checked);
  };

  const handleCheckboxClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={"relative"}>
      {/* Selection checkbox */}
      {!isBuiltIn && (
        <div
          className={cn(
            "absolute top-3 left-3 z-10",
            "rounded-sm bg-background/80 p-0.5 backdrop-blur-sm"
          )}
          onClick={handleCheckboxClick}
        >
          <Checkbox
            aria-label={`Select ${template.name}`}
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            size={"default"}
          />
        </div>
      )}
      <TemplateCard
        className={cn(isSelected && "ring-2 ring-accent")}
        onDelete={handleDeleteClick}
        onDuplicate={handleDuplicateClick}
        onEdit={handleEditClick}
        template={template}
      />
      {/* Hidden dialog trigger */}
      <TemplateEditorDialog
        mode={"edit"}
        template={template}
        trigger={
          <button
            aria-hidden={"true"}
            className={"sr-only"}
            ref={triggerRef as RefObject<HTMLButtonElement>}
            tabIndex={-1}
            type={"button"}
          >
            {"Edit template"}
          </button>
        }
      />
    </div>
  );
};

interface TemplateTableRowProps {
  isSelected: boolean;
  onDelete: (template: Template) => void;
  onDuplicate: (data: DuplicateTemplateData) => void;
  onSelectionChange: (templateId: number, isSelected: boolean) => void;
  template: Template;
}

/**
 * Renders a table row for a template with an embedded TemplateEditorDialog.
 * The entire row is clickable to open the editor dialog.
 */
const TemplateTableRow = ({
  isSelected,
  onDelete,
  onDuplicate,
  onSelectionChange,
  template,
}: TemplateTableRowProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isActive = template.deactivatedAt === null;
  const isBuiltIn = template.builtInAt !== null;
  const placeholders = extractPlaceholders(template.templateText);

  const handleRowClick = () => {
    triggerRef.current?.click();
  };

  const handleEditClick = (e: MouseEvent) => {
    e.stopPropagation();
    triggerRef.current?.click();
  };

  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    onDelete(template);
  };

  const handleDuplicateClick = (e: MouseEvent) => {
    e.stopPropagation();
    onDuplicate({
      category: template.category,
      description: template.description ?? undefined,
      name: `${template.name} (Copy)`,
      templateText: template.templateText,
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange(template.id, checked);
  };

  const handleCheckboxClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Fragment>
      <tr
        className={cn(
          "cursor-pointer transition-colors hover:bg-muted/50",
          !isActive && "opacity-60",
          isSelected && "bg-accent/10"
        )}
        onClick={handleRowClick}
      >
        {/* Selection checkbox */}
        <td className={"px-4 py-3"} onClick={handleCheckboxClick}>
          {!isBuiltIn ? (
            <Checkbox
              aria-label={`Select ${template.name}`}
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              size={"default"}
            />
          ) : (
            <div className={"size-4"} />
          )}
        </td>

        {/* Name */}
        <td className={"px-4 py-3"}>
          <div className={"flex flex-col"}>
            <span className={"font-medium"}>{template.name}</span>
          </div>
        </td>

        {/* Category */}
        <td className={"px-4 py-3"}>
          <Badge size={"sm"} variant={getCategoryVariant(template.category)}>
            {formatCategoryLabel(template.category)}
          </Badge>
        </td>

        {/* Description */}
        <td className={"max-w-xs px-4 py-3"}>
          <span
            className={"line-clamp-1 text-muted-foreground"}
            title={template.description ?? undefined}
          >
            {template.description || "-"}
          </span>
        </td>

        {/* Placeholders */}
        <td className={"px-4 py-3"}>
          <Badge size={"sm"} variant={"default"}>
            {placeholders.length}
          </Badge>
        </td>

        {/* Usage Count */}
        <td className={"px-4 py-3 text-muted-foreground"}>
          {template.usageCount}
        </td>

        {/* Status */}
        <td className={"px-4 py-3"}>
          <span
            className={cn(
              "text-sm",
              isActive
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            )}
          >
            {isActive ? "Active" : "Deactivated"}
          </span>
        </td>

        {/* Actions */}
        <td className={"px-4 py-3"}>
          <div className={"flex justify-end gap-2"}>
            <Button
              aria-label={"Edit template"}
              onClick={handleEditClick}
              size={"sm"}
              variant={"outline"}
            >
              <Pencil aria-hidden={"true"} className={"size-4"} />
              {"Edit"}
            </Button>
            <Button
              aria-label={"Duplicate template"}
              onClick={handleDuplicateClick}
              size={"sm"}
              variant={"ghost"}
            >
              <Copy aria-hidden={"true"} className={"size-4"} />
            </Button>
            {!isBuiltIn && (
              <Button
                aria-label={"Delete template"}
                onClick={handleDeleteClick}
                size={"sm"}
                variant={"ghost"}
              >
                <Trash2 aria-hidden={"true"} className={"size-4"} />
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* Hidden dialog trigger */}
      <TemplateEditorDialog
        mode={"edit"}
        template={template}
        trigger={
          <button
            aria-hidden={"true"}
            className={"sr-only"}
            ref={triggerRef as RefObject<HTMLButtonElement>}
            tabIndex={-1}
            type={"button"}
          >
            {"Edit template"}
          </button>
        }
      />
    </Fragment>
  );
};

/**
 * Templates page - Main entry point for template management.
 *
 * Features:
 * - Card/table view toggle with URL state persistence
 * - Search by name and description
 * - Category filter
 * - Show/hide deactivated toggle
 * - Create new template dialog
 * - Edit template dialog
 * - Delete template with confirmation dialog
 * - Toast notifications on all actions
 * - Empty states
 */
export default function TemplatesPage() {
  // URL state management with nuqs
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_OPTIONS).withDefault("card")
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "category",
    parseAsStringLiteral([...templateCategories])
  );
  const [showDeactivated, setShowDeactivated] = useQueryState(
    "showDeactivated",
    parseAsBoolean.withDefault(false)
  );

  // Delete confirmation dialog state
  const [templateToDelete, setTemplateToDelete] = useState<null | Template>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Bulk delete confirmation dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Selection state for bulk actions
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<number>>(
    new Set()
  );

  // Duplicate template dialog state
  const [duplicateTemplateData, setDuplicateTemplateData] =
    useState<DuplicateTemplateData | null>(null);
  const duplicateDialogTriggerRef = useRef<HTMLButtonElement>(null);

  // Create template dialog control
  const createDialogTriggerRef = useRef<HTMLButtonElement>(null);

  // Search input ref for keyboard shortcut focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const toast = useToast();
  const deleteTemplateMutation = useDeleteTemplate();
  const updateTemplateMutation = useUpdateTemplate();

  // Data fetching
  const { data: templates, isLoading } = useTemplates({
    category: categoryFilter ?? undefined,
    includeDeactivated: showDeactivated,
  });

  // Client-side filtering by search term (category and deactivated filters are handled by useTemplates)
  const filteredTemplates = useMemo(() => {
    if (!templates) return undefined;
    return filterTemplatesBySearch(templates, search);
  }, [templates, search]);

  // Keyboard shortcut handlers
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const openCreateDialog = useCallback(() => {
    createDialogTriggerRef.current?.click();
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    { callback: focusSearch, options: { key: "k", modifiers: ["ctrl"] } },
    { callback: openCreateDialog, options: { key: "n", modifiers: ["ctrl"] } },
  ]);

  // Determine if any filters are active
  const hasActiveFilters = Boolean(search) || Boolean(categoryFilter);

  // Clear all filters
  const handleClearFilters = () => {
    void setSearch(null);
    void setCategoryFilter(null);
  };

  // Handlers
  const handleViewChange = (newView: ViewOption) => {
    void setView(newView);
  };

  const handleSearchChange = (newSearch: string) => {
    void setSearch(newSearch || null);
  };

  const handleCategoryChange = (newCategory: null | string) => {
    if (!newCategory) {
      void setCategoryFilter(null);
    } else {
      void setCategoryFilter(newCategory as TemplateCategory);
    }
  };

  const handleShowDeactivatedChange = (isChecked: boolean) => {
    void setShowDeactivated(isChecked);
  };

  /**
   * Opens the delete confirmation dialog for the specified template.
   */
  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Closes the delete confirmation dialog and resets the template to delete.
   */
  const handleDeleteDialogOpenChange = (isOpen: boolean) => {
    setIsDeleteDialogOpen(isOpen);
    if (!isOpen) {
      setTemplateToDelete(null);
    }
  };

  /**
   * Confirms deletion of the selected template.
   */
  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplateMutation.mutateAsync(templateToDelete.id);
      toast.success({
        description: `Template "${templateToDelete.name}" deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete template. Please try again.";
      toast.error({ description: message });
    }
  };

  /**
   * Opens the duplicate template dialog with pre-filled data.
   * Modifies the name to indicate it's a copy and resets usage/built-in status.
   */
  const handleDuplicateTemplate = (data: DuplicateTemplateData) => {
    setDuplicateTemplateData(data);
    // Use setTimeout to ensure state is set before triggering dialog
    setTimeout(() => {
      duplicateDialogTriggerRef.current?.click();
    }, 0);
  };

  /**
   * Clears the duplicate template data when dialog closes.
   */
  const handleDuplicateDialogSuccess = () => {
    setDuplicateTemplateData(null);
  };

  // ============================================================================
  // Selection and Bulk Action Logic
  // ============================================================================

  /**
   * Get selectable templates (exclude built-in templates from selection).
   */
  const selectableTemplates = useMemo(() => {
    if (!filteredTemplates) return [];
    return filteredTemplates.filter((template) => template.builtInAt === null);
  }, [filteredTemplates]);

  /**
   * Get currently selected templates.
   */
  const selectedTemplates = useMemo(() => {
    if (!filteredTemplates) return [];
    return filteredTemplates.filter((template) =>
      selectedTemplateIds.has(template.id)
    );
  }, [filteredTemplates, selectedTemplateIds]);

  /**
   * Check if all selectable templates are selected.
   */
  const isAllSelected =
    selectableTemplates.length > 0 &&
    selectableTemplates.every((template) =>
      selectedTemplateIds.has(template.id)
    );

  /**
   * Check if some but not all selectable templates are selected.
   */
  const isSomeSelected = selectedTemplateIds.size > 0 && !isAllSelected;

  /**
   * Toggle selection for a single template.
   */
  const handleSelectionChange = useCallback(
    (templateId: number, isSelected: boolean) => {
      setSelectedTemplateIds((prev) => {
        const next = new Set(prev);
        if (isSelected) {
          next.add(templateId);
        } else {
          next.delete(templateId);
        }
        return next;
      });
    },
    []
  );

  /**
   * Toggle select all/deselect all for visible selectable templates.
   */
  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        // Select all selectable templates
        setSelectedTemplateIds(new Set(selectableTemplates.map((t) => t.id)));
      } else {
        // Deselect all
        setSelectedTemplateIds(new Set());
      }
    },
    [selectableTemplates]
  );

  /**
   * Clear all selections.
   */
  const handleClearSelection = useCallback(() => {
    setSelectedTemplateIds(new Set());
  }, []);

  /**
   * Bulk activate selected templates.
   */
  const handleBulkActivate = useCallback(async () => {
    const templatesToActivate = selectedTemplates.filter(
      (template) => template.deactivatedAt !== null
    );

    if (templatesToActivate.length === 0) {
      toast.info({ description: "All selected templates are already active." });
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const template of templatesToActivate) {
      try {
        await updateTemplateMutation.mutateAsync({
          data: { deactivatedAt: null },
          id: template.id,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.success({
        description: `Successfully activated ${successCount} ${successCount === 1 ? "template" : "templates"}.`,
      });
    } else if (successCount > 0) {
      toast.warning({
        description: `Activated ${successCount} ${successCount === 1 ? "template" : "templates"}, but ${failCount} failed.`,
      });
    } else {
      toast.error({
        description: `Failed to activate ${failCount} ${failCount === 1 ? "template" : "templates"}.`,
      });
    }

    handleClearSelection();
  }, [selectedTemplates, updateTemplateMutation, toast, handleClearSelection]);

  /**
   * Bulk deactivate selected templates.
   */
  const handleBulkDeactivate = useCallback(async () => {
    const templatesToDeactivate = selectedTemplates.filter(
      (template) => template.deactivatedAt === null
    );

    if (templatesToDeactivate.length === 0) {
      toast.info({
        description: "All selected templates are already deactivated.",
      });
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const template of templatesToDeactivate) {
      try {
        await updateTemplateMutation.mutateAsync({
          data: { deactivatedAt: new Date().toISOString() },
          id: template.id,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.success({
        description: `Successfully deactivated ${successCount} ${successCount === 1 ? "template" : "templates"}.`,
      });
    } else if (successCount > 0) {
      toast.warning({
        description: `Deactivated ${successCount} ${successCount === 1 ? "template" : "templates"}, but ${failCount} failed.`,
      });
    } else {
      toast.error({
        description: `Failed to deactivate ${failCount} ${failCount === 1 ? "template" : "templates"}.`,
      });
    }

    handleClearSelection();
  }, [selectedTemplates, updateTemplateMutation, toast, handleClearSelection]);

  /**
   * Open bulk delete confirmation dialog.
   */
  const handleBulkDeleteClick = useCallback(() => {
    if (selectedTemplates.length === 0) {
      toast.info({ description: "No templates selected for deletion." });
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  }, [selectedTemplates.length, toast]);

  /**
   * Handle bulk delete confirmation dialog open change.
   */
  const handleBulkDeleteDialogOpenChange = useCallback((isOpen: boolean) => {
    setIsBulkDeleteDialogOpen(isOpen);
  }, []);

  /**
   * Confirm bulk delete of selected templates.
   */
  const handleConfirmBulkDelete = useCallback(async () => {
    let successCount = 0;
    let failCount = 0;

    for (const template of selectedTemplates) {
      try {
        await deleteTemplateMutation.mutateAsync(template.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.success({
        description: `Successfully deleted ${successCount} ${successCount === 1 ? "template" : "templates"}.`,
      });
    } else if (successCount > 0) {
      toast.warning({
        description: `Deleted ${successCount} ${successCount === 1 ? "template" : "templates"}, but ${failCount} failed.`,
      });
    } else {
      toast.error({
        description: `Failed to delete ${failCount} ${failCount === 1 ? "template" : "templates"}.`,
      });
    }

    setIsBulkDeleteDialogOpen(false);
    handleClearSelection();
  }, [selectedTemplates, deleteTemplateMutation, toast, handleClearSelection]);

  /**
   * Count of active templates in selection.
   */
  const selectedActiveCount = useMemo(() => {
    return selectedTemplates.filter((t) => t.deactivatedAt === null).length;
  }, [selectedTemplates]);

  /**
   * Count of deactivated templates in selection.
   */
  const selectedDeactivatedCount = useMemo(() => {
    return selectedTemplates.filter((t) => t.deactivatedAt !== null).length;
  }, [selectedTemplates]);

  /**
   * Whether any bulk operation is in progress.
   */
  const isBulkOperationPending =
    updateTemplateMutation.isPending || deleteTemplateMutation.isPending;

  // Derived state
  const hasNoTemplates = !isLoading && templates && templates.length === 0;
  const hasNoFilteredTemplates =
    !isLoading &&
    templates &&
    templates.length > 0 &&
    filteredTemplates &&
    filteredTemplates.length === 0;

  // Result counts for display
  const totalCount = templates?.length ?? 0;
  const filteredCount = filteredTemplates?.length ?? 0;
  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  // Generate context-aware empty state message
  const getFilteredEmptyStateMessage = () => {
    const filters: Array<string> = [];
    if (search) {
      filters.push(`search term "${search}"`);
    }
    if (categoryFilter) {
      filters.push(`category "${formatCategoryLabel(categoryFilter)}"`);
    }
    if (filters.length === 0) {
      return "No templates match your current filters. Try adjusting your search criteria.";
    }
    return `No templates found matching ${filters.join(" and ")}. Try adjusting your filters.`;
  };

  return (
    <main aria-label={"Template management"} className={"space-y-6"}>
      {/* Skip link for keyboard navigation */}
      <a
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
          "z-50 rounded-md bg-background px-4 py-2 text-sm font-medium",
          "ring-2 ring-accent ring-offset-2"
        )}
        href={"#template-content"}
      >
        {"Skip to template content"}
      </a>

      {/* Page heading */}
      <header className={"flex items-start justify-between gap-4"}>
        <div className={"space-y-1"}>
          <div className={"flex items-center gap-3"}>
            <h1 className={"text-2xl font-semibold tracking-tight"}>
              {"Templates"}
            </h1>
            {/* Result count badge */}
            {!isLoading && !hasNoTemplates && (
              <Badge size={"sm"} variant={"default"}>
                {isFiltered
                  ? `${filteredCount} of ${totalCount}`
                  : `${totalCount}`}
              </Badge>
            )}
          </div>
          <p className={"text-muted-foreground"}>
            {"Create and manage workflow templates."}
          </p>
        </div>
        <TemplateEditorDialog
          mode={"create"}
          trigger={
            <Button ref={createDialogTriggerRef}>
              <Plus aria-hidden={"true"} className={"size-4"} />
              {"Create Template"}
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

      {/* Filters and view controls */}
      {!hasNoTemplates && (
        <div className={"flex flex-wrap items-center gap-4"}>
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

          {/* Category filter */}
          <SelectRoot
            onValueChange={(newValue) => handleCategoryChange(newValue)}
            value={categoryFilter ?? ""}
          >
            <SelectTrigger
              aria-label={"Filter by category"}
              className={"w-40"}
              size={"sm"}
            >
              <SelectValue placeholder={"All categories"} />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={"sm"}>
                  <SelectList>
                    <SelectItem size={"sm"} value={""}>
                      {"All categories"}
                    </SelectItem>
                    {templateCategories.map((category) => (
                      <SelectItem key={category} size={"sm"} value={category}>
                        {formatCategoryLabel(category)}
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
              aria-label={"Search templates (Ctrl+K)"}
              className={"pr-16 pl-8"}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={"Search by name or description..."}
              ref={searchInputRef}
              size={"sm"}
              type={"search"}
              value={search}
            />
            <kbd
              className={cn(
                "absolute top-1/2 right-2.5 -translate-y-1/2",
                "hidden rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground md:inline-block"
              )}
            >
              {"Ctrl+K"}
            </kbd>
          </div>

          {/* Show deactivated toggle */}
          <div className={"flex items-center gap-2"}>
            <Switch
              aria-label={"Show deactivated templates"}
              checked={showDeactivated}
              onCheckedChange={handleShowDeactivatedChange}
              size={"sm"}
            />
            <span className={"text-sm text-muted-foreground"}>
              {"Show deactivated"}
            </span>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button onClick={handleClearFilters} size={"sm"} variant={"ghost"}>
              <X aria-hidden={"true"} className={"size-4"} />
              {"Clear filters"}
            </Button>
          )}
        </div>
      )}

      {/* Bulk action toolbar - shown when templates are selected */}
      {selectedTemplateIds.size > 0 && (
        <div
          aria-label={"Bulk actions toolbar"}
          className={cn(
            "flex flex-wrap items-center gap-3",
            "rounded-lg border border-border bg-muted/50 px-4 py-3"
          )}
          role={"toolbar"}
        >
          {/* Selection count */}
          <div className={"flex items-center gap-2"}>
            <Badge size={"sm"} variant={"default"}>
              {selectedTemplateIds.size}{" "}
              {selectedTemplateIds.size === 1 ? "selected" : "selected"}
            </Badge>
            {selectedActiveCount > 0 && (
              <span className={"text-xs text-muted-foreground"}>
                {selectedActiveCount} active
              </span>
            )}
            {selectedDeactivatedCount > 0 && (
              <span className={"text-xs text-muted-foreground"}>
                {selectedDeactivatedCount} deactivated
              </span>
            )}
          </div>

          {/* Separator */}
          <div className={"h-6 w-px bg-border"} />

          {/* Bulk action buttons */}
          <div className={"flex items-center gap-2"}>
            {/* Activate button - only show if some deactivated templates are selected */}
            {selectedDeactivatedCount > 0 && (
              <Button
                aria-label={`Activate ${selectedDeactivatedCount} ${selectedDeactivatedCount === 1 ? "template" : "templates"}`}
                disabled={isBulkOperationPending}
                onClick={handleBulkActivate}
                size={"sm"}
                variant={"outline"}
              >
                <Power aria-hidden={"true"} className={"size-4"} />
                {"Activate"}
                {selectedDeactivatedCount > 1 && (
                  <Badge className={"ml-1"} size={"sm"} variant={"default"}>
                    {selectedDeactivatedCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Deactivate button - only show if some active templates are selected */}
            {selectedActiveCount > 0 && (
              <Button
                aria-label={`Deactivate ${selectedActiveCount} ${selectedActiveCount === 1 ? "template" : "templates"}`}
                disabled={isBulkOperationPending}
                onClick={handleBulkDeactivate}
                size={"sm"}
                variant={"outline"}
              >
                <PowerOff aria-hidden={"true"} className={"size-4"} />
                {"Deactivate"}
                {selectedActiveCount > 1 && (
                  <Badge className={"ml-1"} size={"sm"} variant={"default"}>
                    {selectedActiveCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Delete button */}
            <Button
              aria-label={`Delete ${selectedTemplateIds.size} ${selectedTemplateIds.size === 1 ? "template" : "templates"}`}
              disabled={isBulkOperationPending}
              onClick={handleBulkDeleteClick}
              size={"sm"}
              variant={"destructive"}
            >
              <Trash2 aria-hidden={"true"} className={"size-4"} />
              {"Delete"}
              {selectedTemplateIds.size > 1 && (
                <Badge className={"ml-1"} size={"sm"} variant={"default"}>
                  {selectedTemplateIds.size}
                </Badge>
              )}
            </Button>
          </div>

          {/* Separator */}
          <div className={"h-6 w-px bg-border"} />

          {/* Clear selection button */}
          <Button
            aria-label={"Clear selection"}
            onClick={handleClearSelection}
            size={"sm"}
            variant={"ghost"}
          >
            <X aria-hidden={"true"} className={"size-4"} />
            {"Clear selection"}
          </Button>
        </div>
      )}

      {/* Templates content */}
      <section
        aria-label={"Templates list"}
        aria-live={"polite"}
        id={"template-content"}
      >
        <QueryErrorBoundary>
          {isLoading ? (
            // Loading skeletons
            view === "card" ? (
              <div
                aria-busy={"true"}
                aria-label={"Loading templates"}
                className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}
                role={"status"}
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <TemplateCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <TemplateTableSkeleton />
            )
          ) : hasNoTemplates ? (
            // Empty state when no templates exist
            <EmptyState
              action={
                <TemplateEditorDialog
                  mode={"create"}
                  trigger={
                    <Button>
                      <Plus aria-hidden={"true"} className={"size-4"} />
                      {"Create your first template"}
                    </Button>
                  }
                />
              }
              description={
                "Get started by creating your first template to streamline your feature requests."
              }
              icon={<FileText aria-hidden={"true"} className={"size-6"} />}
              title={"No templates yet"}
            />
          ) : hasNoFilteredTemplates ? (
            // Empty state when filters hide all templates
            <EmptyState
              action={
                <Button onClick={handleClearFilters} variant={"outline"}>
                  <X aria-hidden={"true"} className={"size-4"} />
                  {"Clear filters"}
                </Button>
              }
              description={getFilteredEmptyStateMessage()}
              icon={<Search aria-hidden={"true"} className={"size-6"} />}
              title={"No matching templates"}
            />
          ) : view === "card" ? (
            // Card view
            <ul
              aria-label={`${filteredCount} templates`}
              className={"grid gap-4 md:grid-cols-2 lg:grid-cols-3"}
              role={"list"}
            >
              {filteredTemplates?.map((template) => (
                <li key={template.id}>
                  <TemplateGridItem
                    isSelected={selectedTemplateIds.has(template.id)}
                    onDelete={handleDeleteClick}
                    onDuplicate={handleDuplicateTemplate}
                    onSelectionChange={handleSelectionChange}
                    template={template}
                  />
                </li>
              ))}
            </ul>
          ) : (
            // Table view
            <div className={"overflow-x-auto rounded-lg border border-border"}>
              <table
                aria-label={`${filteredCount} templates`}
                className={"w-full border-collapse text-sm"}
              >
                <thead className={"border-b border-border bg-muted/50"}>
                  <tr>
                    {/* Select all checkbox */}
                    <th
                      className={
                        "w-12 px-4 py-3 text-left font-medium text-muted-foreground"
                      }
                      scope={"col"}
                    >
                      {selectableTemplates.length > 0 && (
                        <div className={"relative flex items-center"}>
                          <Checkbox
                            aria-label={
                              isAllSelected
                                ? "Deselect all templates"
                                : isSomeSelected
                                  ? "Clear selection"
                                  : "Select all templates"
                            }
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAllChange}
                            size={"default"}
                          />
                          {/* Indeterminate indicator overlay */}
                          {isSomeSelected && !isAllSelected && (
                            <div
                              className={cn(
                                "pointer-events-none absolute inset-0 flex items-center justify-center"
                              )}
                            >
                              <Minus
                                aria-hidden={"true"}
                                className={"size-3 text-accent-foreground"}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </th>
                    <th
                      className={
                        "px-4 py-3 text-left font-medium text-muted-foreground"
                      }
                      scope={"col"}
                    >
                      {"Name"}
                    </th>
                    <th
                      className={
                        "px-4 py-3 text-left font-medium text-muted-foreground"
                      }
                      scope={"col"}
                    >
                      {"Category"}
                    </th>
                    <th
                      className={
                        "px-4 py-3 text-left font-medium text-muted-foreground"
                      }
                      scope={"col"}
                    >
                      {"Description"}
                    </th>
                    <th
                      className={
                        "px-4 py-3 text-left font-medium text-muted-foreground"
                      }
                      scope={"col"}
                    >
                      {"Placeholders"}
                    </th>
                    <th
                      className={
                        "px-4 py-3 text-left font-medium text-muted-foreground"
                      }
                      scope={"col"}
                    >
                      {"Uses"}
                    </th>
                    <th
                      className={
                        "px-4 py-3 text-left font-medium text-muted-foreground"
                      }
                      scope={"col"}
                    >
                      {"Status"}
                    </th>
                    <th
                      className={
                        "px-4 py-3 text-right font-medium text-muted-foreground"
                      }
                      scope={"col"}
                    >
                      {"Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className={"divide-y divide-border"}>
                  {filteredTemplates?.map((template) => (
                    <TemplateTableRow
                      isSelected={selectedTemplateIds.has(template.id)}
                      key={template.id}
                      onDelete={handleDeleteClick}
                      onDuplicate={handleDuplicateTemplate}
                      onSelectionChange={handleSelectionChange}
                      template={template}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryErrorBoundary>
      </section>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isLoading={deleteTemplateMutation.isPending}
        isOpen={isDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
        templateName={templateToDelete?.name ?? ""}
        usageCount={templateToDelete?.usageCount ?? 0}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog
        isLoading={deleteTemplateMutation.isPending}
        isOpen={isBulkDeleteDialogOpen}
        onConfirm={handleConfirmBulkDelete}
        onOpenChange={handleBulkDeleteDialogOpenChange}
        selectedCount={selectedTemplates.length}
        totalUsageCount={selectedTemplates.reduce(
          (sum, t) => sum + t.usageCount,
          0
        )}
      />

      {/* Duplicate Template Dialog */}
      <TemplateEditorDialog
        initialData={duplicateTemplateData ?? undefined}
        mode={"create"}
        onSuccess={handleDuplicateDialogSuccess}
        trigger={
          <button
            aria-hidden={"true"}
            className={"sr-only"}
            ref={duplicateDialogTriggerRef}
            tabIndex={-1}
            type={"button"}
          >
            {"Duplicate template"}
          </button>
        }
      />
    </main>
  );
}
