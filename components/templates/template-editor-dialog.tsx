"use client";

import type { ReactNode } from "react";

import { Fragment, useCallback, useEffect, useState } from "react";

import type {
  TemplatePlaceholderFormValues,
  UpdateTemplateWithPlaceholdersFormValues,
} from "@/lib/validations/template";
import type { Template } from "@/types/electron";

import { PlaceholderEditor } from "@/components/templates/placeholder-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  templateCategories,
  type TemplateCategory,
} from "@/db/schema/templates.schema";
import {
  useCreateTemplate,
  useTemplatePlaceholders,
  useUpdateTemplate,
  useUpdateTemplatePlaceholders,
} from "@/hooks/queries/use-templates";
import { useToast } from "@/hooks/use-toast";
import { useAppForm } from "@/lib/forms/form-hook";
import { updateTemplateWithPlaceholdersSchema } from "@/lib/validations/template";

type EditorMode = "create" | "edit";

interface TemplateEditorDialogProps {
  /** Initial data for pre-filling the form (used in create mode for duplicating) */
  initialData?: TemplateInitialData;
  /** The mode of the editor */
  mode: EditorMode;
  /** Callback when template is successfully saved */
  onSuccess?: () => void;
  /** The template to edit (required for edit mode) */
  template?: Template;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

/**
 * Initial data for creating a template, typically used when duplicating.
 * Differs from Template in that it doesn't include id, timestamps, or usage counts.
 */
interface TemplateInitialData {
  category: string;
  description?: string;
  name: string;
  placeholders?: Array<TemplatePlaceholderFormValues>;
  templateText: string;
}

const CATEGORY_OPTIONS = templateCategories.map((category) => ({
  label: category.charAt(0).toUpperCase() + category.slice(1),
  value: category,
}));

export const TemplateEditorDialog = ({
  initialData,
  mode,
  onSuccess,
  template,
  trigger,
}: TemplateEditorDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placeholders, setPlaceholders] = useState<
    Array<TemplatePlaceholderFormValues>
  >([]);

  const toast = useToast();
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const updatePlaceholdersMutation = useUpdateTemplatePlaceholders();

  // Fetch existing placeholders when editing a template
  const { data: existingPlaceholders } = useTemplatePlaceholders(
    template?.id ?? 0
  );

  const isSubmitting =
    createTemplateMutation.isPending ||
    updateTemplateMutation.isPending ||
    updatePlaceholdersMutation.isPending;
  const isEditMode = mode === "edit";
  const isBuiltIn = template?.builtInAt !== null;
  const isDuplicateMode = mode === "create" && initialData !== undefined;

  // Always use the update schema since our form has all fields
  // The create mutation will only use the fields it needs
  const validationSchema = updateTemplateWithPlaceholdersSchema;

  // Determine default values based on mode and initialData
  const getDefaultValues =
    useCallback((): UpdateTemplateWithPlaceholdersFormValues => {
      if (isEditMode && template) {
        return {
          category: template.category as TemplateCategory,
          description: template.description ?? "",
          id: template.id,
          isActive: template.deactivatedAt === null,
          name: template.name,
          placeholders: [],
          templateText: template.templateText,
        };
      }
      if (initialData) {
        return {
          category: (initialData.category as TemplateCategory) ?? "ui",
          description: initialData.description ?? "",
          id: 0,
          isActive: true,
          name: initialData.name,
          placeholders: [],
          templateText: initialData.templateText,
        };
      }
      return {
        category: "ui" as TemplateCategory,
        description: "",
        id: 0,
        isActive: true,
        name: "",
        placeholders: [],
        templateText: "",
      };
    }, [isEditMode, template, initialData]);

  const form = useAppForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      try {
        // Convert form placeholders to database format
        const placeholdersToSave = value.placeholders.map((p) => ({
          defaultValue: p.defaultValue || null,
          description: p.description || null,
          displayName: p.displayName,
          name: p.name,
          orderIndex: p.orderIndex,
          requiredAt: p.isRequired ? new Date().toISOString() : null,
          validationPattern: p.validationPattern || null,
        }));

        if (isEditMode && template) {
          // Update existing template
          await updateTemplateMutation.mutateAsync({
            data: {
              category: value.category,
              deactivatedAt: value.isActive ? null : new Date().toISOString(),
              description: value.description,
              name: value.name,
              templateText: value.templateText,
            },
            id: template.id,
          });
          // Update placeholders for existing template
          await updatePlaceholdersMutation.mutateAsync({
            placeholders: placeholdersToSave,
            templateId: template.id,
          });
          toast.success({ description: "Template updated successfully." });
        } else {
          // Create new template
          const newTemplate = await createTemplateMutation.mutateAsync({
            category: value.category,
            description: value.description,
            name: value.name,
            templateText: value.templateText,
          });
          // Save placeholders for new template
          if (placeholdersToSave.length > 0) {
            await updatePlaceholdersMutation.mutateAsync({
              placeholders: placeholdersToSave,
              templateId: newTemplate.id,
            });
          }
          toast.success({ description: "Template created successfully." });
        }
        handleClose();
        onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? "update" : "create"} template. Please try again.`;
        toast.error({ description: message });
        throw new Error(message);
      }
    },
    validators: {
      onSubmit: validationSchema,
    },
  });

  // Reset form when template or initialData changes
  useEffect(() => {
    form.reset(getDefaultValues());
  }, [template, initialData, form, getDefaultValues]);

  const resetFormAndPlaceholders = useCallback(() => {
    form.reset(getDefaultValues());
    setPlaceholders([]);
  }, [form, getDefaultValues]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetFormAndPlaceholders();
  }, [resetFormAndPlaceholders]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        // Reset form to ensure it has latest values
        form.reset(getDefaultValues());
        // Load existing placeholders when editing
        if (
          isEditMode &&
          existingPlaceholders &&
          existingPlaceholders.length > 0
        ) {
          const loadedPlaceholders: Array<TemplatePlaceholderFormValues> =
            existingPlaceholders.map((p) => ({
              defaultValue: p.defaultValue ?? "",
              description: p.description ?? "",
              displayName: p.displayName,
              isRequired: p.requiredAt !== null,
              name: p.name,
              orderIndex: p.orderIndex,
              uid: crypto.randomUUID(),
              validationPattern: p.validationPattern ?? "",
            }));
          setPlaceholders(loadedPlaceholders);
          form.setFieldValue("placeholders", loadedPlaceholders);
        } else if (
          isDuplicateMode &&
          initialData?.placeholders &&
          initialData.placeholders.length > 0
        ) {
          // Load placeholders from initialData when duplicating a template
          const duplicatedPlaceholders: Array<TemplatePlaceholderFormValues> =
            initialData.placeholders.map((p) => ({
              ...p,
              uid: crypto.randomUUID(),
            }));
          setPlaceholders(duplicatedPlaceholders);
          form.setFieldValue("placeholders", duplicatedPlaceholders);
        } else {
          setPlaceholders([]);
        }
      } else {
        resetFormAndPlaceholders();
      }
    },
    [
      resetFormAndPlaceholders,
      getDefaultValues,
      form,
      isEditMode,
      isDuplicateMode,
      existingPlaceholders,
      initialData,
    ]
  );

  const handlePlaceholdersChange = (
    newPlaceholders: Array<TemplatePlaceholderFormValues>
  ) => {
    setPlaceholders(newPlaceholders);
    form.setFieldValue("placeholders", newPlaceholders);
  };

  const dialogTitle = isEditMode
    ? "Edit Template"
    : isDuplicateMode
      ? "Duplicate Template"
      : "Create Template";
  const dialogDescription = isEditMode
    ? "Modify the template details and placeholders."
    : isDuplicateMode
      ? "Create a copy of the template with your modifications."
      : "Create a new template with placeholders for feature requests.";
  const submitLabel = isEditMode
    ? isSubmitting
      ? "Saving..."
      : "Save Changes"
    : isSubmitting
      ? "Creating..."
      : "Create Template";

  // For built-in templates in edit mode, only allow toggling active state
  const isFieldsDisabled = isEditMode && isBuiltIn;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          aria-modal={"true"}
          role={"dialog"}
          scrollable={true}
          size={"2xl"}
        >
          {/* Header */}
          <DialogHeader
            badges={
              <Fragment>
                {isEditMode && isBuiltIn && (
                  <Badge variant={"default"}>{"Built-in Template"}</Badge>
                )}
                {isEditMode && template?.category && (
                  <Badge variant={template.category}>
                    {template.category.charAt(0).toUpperCase() +
                      template.category.slice(1)}
                  </Badge>
                )}
              </Fragment>
            }
          >
            <DialogTitle id={"template-editor-title"}>
              {dialogTitle}
            </DialogTitle>
            <DialogDescription id={"template-editor-description"}>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          {/* Form wraps DialogBody + DialogFooter for submit to work */}
          <form
            aria-describedby={"template-editor-description"}
            aria-labelledby={"template-editor-title"}
            className={"flex min-h-0 flex-1 flex-col"}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <DialogBody>
              {/* Usage Count Display (Edit Mode Only) */}
              {isEditMode && template && (
                <div
                  className={"rounded-md border border-border bg-muted/50 p-3"}
                >
                  <div className={"flex items-center justify-between text-sm"}>
                    <span className={"text-muted-foreground"}>
                      {"Usage Count:"}
                    </span>
                    <span className={"font-medium text-foreground"}>
                      {template.usageCount}
                    </span>
                  </div>
                </div>
              )}

              {/* Built-in Template Warning */}
              {isEditMode && isBuiltIn && (
                <div
                  className={
                    "mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
                  }
                >
                  <p className={"text-sm text-amber-800 dark:text-amber-200"}>
                    {
                      "This is a built-in template. Only the active state can be modified."
                    }
                  </p>
                </div>
              )}

              <fieldset
                className={"mt-4 flex flex-col gap-4"}
                disabled={isSubmitting}
              >
                <legend className={"sr-only"}>{"Template details"}</legend>

                {/* Name Field */}
                <form.AppField name={"name"}>
                  {(field) => (
                    <field.TextField
                      autoFocus={isDuplicateMode}
                      isDisabled={isFieldsDisabled}
                      label={"Template Name"}
                      placeholder={"Enter template name"}
                    />
                  )}
                </form.AppField>

                {/* Category Field */}
                <form.AppField name={"category"}>
                  {(field) => (
                    <field.SelectField
                      isDisabled={isFieldsDisabled}
                      label={"Category"}
                      options={CATEGORY_OPTIONS}
                      placeholder={"Select a category"}
                    />
                  )}
                </form.AppField>

                {/* Description Field */}
                <form.AppField name={"description"}>
                  {(field) => (
                    <field.TextareaField
                      description={
                        "A brief description of what this template is for"
                      }
                      isDisabled={isFieldsDisabled}
                      label={"Description"}
                      placeholder={"Describe the template purpose..."}
                      rows={3}
                    />
                  )}
                </form.AppField>

                {/* Template Text Field */}
                <form.AppField name={"templateText"}>
                  {(field) => (
                    <field.TextareaField
                      description={
                        "Use {{placeholderName}} syntax for dynamic content"
                      }
                      isDisabled={isFieldsDisabled}
                      label={"Template Text"}
                      placeholder={
                        "Enter template text with {{placeholders}}..."
                      }
                      rows={8}
                    />
                  )}
                </form.AppField>

                {/* Placeholder Editor (Hidden for Built-in Templates) */}
                {!isFieldsDisabled && (
                  <div className={"flex flex-col gap-2"}>
                    <label className={"text-sm font-medium text-foreground"}>
                      {"Placeholders"}
                    </label>
                    <p className={"text-sm text-muted-foreground"}>
                      {
                        "Define placeholders that users can fill in when using this template."
                      }
                    </p>
                    <PlaceholderEditor
                      className={"mt-2"}
                      onChange={handlePlaceholdersChange}
                      placeholders={placeholders}
                    />
                  </div>
                )}

                {/* Active State Toggle (Edit Mode Only) */}
                {isEditMode && (
                  <form.AppField name={"isActive"}>
                    {(field) => (
                      <field.SwitchField
                        description={
                          "Deactivated templates will not appear in the template selection list"
                        }
                        label={"Active"}
                      />
                    )}
                  </form.AppField>
                )}
              </fieldset>
            </DialogBody>

            {/* Sticky Footer */}
            <DialogFooter>
              <DialogClose>
                <Button
                  disabled={isSubmitting}
                  type={"button"}
                  variant={"outline"}
                >
                  {"Cancel"}
                </Button>
              </DialogClose>
              <form.AppForm>
                <form.SubmitButton>{submitLabel}</form.SubmitButton>
              </form.AppForm>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
