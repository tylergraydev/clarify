'use client';

import type { FormEvent, ReactNode } from 'react';

import { Fragment, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';

import type { Template, TemplatePlaceholder } from '@/types/electron';

import { ConfirmDiscardDialog } from '@/components/agents/confirm-discard-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { templateCategories } from '@/db/schema/templates.schema';
import {
  useCreateTemplate,
  useTemplatePlaceholders,
  useUpdateTemplate,
  useUpdateTemplatePlaceholders,
} from '@/hooks/queries/use-templates';
import { useControllableState } from '@/hooks/use-controllable-state';
import { useAppForm } from '@/lib/forms';
import { type CreateTemplateFormValues, createTemplateSchema } from '@/lib/validations/template';

import type { TemplatePlaceholderItem } from './template-placeholders-section';

import { TemplatePlaceholdersSection } from './template-placeholders-section';

type EditorMode = 'create' | 'edit' | 'view';

interface TemplateEditorDialogProps {
  /** Controlled open state (optional - if provided, component is controlled) */
  isOpen?: boolean;
  /** The mode of the editor */
  mode: EditorMode;
  /** Callback when open state changes (optional - for controlled mode) */
  onOpenChange?: (isOpen: boolean) => void;
  /** Callback when template is successfully saved */
  onSuccess?: () => void;
  /** The template to edit (required for edit/view mode) */
  template?: Template;
  /** The trigger element that opens the dialog (optional when using controlled mode) */
  trigger?: ReactNode;
}

const CATEGORY_OPTIONS = templateCategories.map((category) => ({
  label: category.charAt(0).toUpperCase() + category.slice(1),
  value: category,
}));

const generateTempId = () => `placeholder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Dialog for creating, editing, and viewing templates with placeholder management.
 * Supports create, edit, and view modes with controlled/uncontrolled open state.
 *
 * @param props - Component props
 * @param props.isOpen - Controlled open state (optional - if provided, component is controlled)
 * @param props.mode - The mode of the editor ('create' | 'edit' | 'view')
 * @param props.onOpenChange - Callback when open state changes (optional - for controlled mode)
 * @param props.onSuccess - Callback when template is successfully saved
 * @param props.template - The template to edit (required for edit/view mode)
 * @param props.trigger - The trigger element that opens the dialog (optional when using controlled mode)
 */
export const TemplateEditorDialog = ({
  isOpen: controlledIsOpen,
  mode,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  template,
  trigger,
}: TemplateEditorDialogProps) => {
  // State hooks
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: false,
    onChange: controlledOnOpenChange,
    value: controlledIsOpen,
  });
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [pendingPlaceholders, setPendingPlaceholders] = useState<Array<TemplatePlaceholderItem>>([]);
  const [isPlaceholdersDirty, setIsPlaceholdersDirty] = useState(false);

  // Mutation hooks
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const updatePlaceholdersMutation = useUpdateTemplatePlaceholders();

  // Query hooks
  const placeholdersQuery = useTemplatePlaceholders(template?.id ?? 0);
  const existingPlaceholders = placeholdersQuery.data;

  // Derived state
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';
  const isBuiltIn = template?.builtInAt !== null && template?.builtInAt !== undefined;
  const isSubmitting =
    createTemplateMutation.isPending || updateTemplateMutation.isPending || updatePlaceholdersMutation.isPending;

  // Memoized values
  const dialogLabels = useMemo(() => {
    const dialogTitle = isViewMode
      ? 'View Template'
      : isEditMode
        ? 'Edit Template'
        : 'Create Template';

    const dialogDescription = isViewMode
      ? 'View the built-in template configuration. Duplicate to create an editable copy.'
      : isEditMode
        ? 'Modify the template name, description, content, and placeholders.'
        : 'Create a new template with placeholders for dynamic content.';

    const submitLabel = isEditMode
      ? isSubmitting
        ? 'Saving...'
        : 'Save Changes'
      : isSubmitting
        ? 'Creating...'
        : 'Create Template';

    return {
      dialogDescription,
      dialogTitle,
      submitLabel,
    };
  }, [isEditMode, isSubmitting, isViewMode]);

  // Utility functions
  const getDefaultValues = useCallback((): CreateTemplateFormValues => {
    if (template) {
      return {
        category: template.category,
        description: template.description ?? '',
        name: template.name,
        templateText: template.templateText,
      };
    }
    return {
      category: '' as CreateTemplateFormValues['category'],
      description: '',
      name: '',
      templateText: '',
    };
  }, [template]);

  const convertPlaceholdersToItems = useCallback(
    (placeholders: Array<TemplatePlaceholder>): Array<TemplatePlaceholderItem> => {
      return placeholders.map((p) => ({
        defaultValue: p.defaultValue,
        description: p.description,
        displayName: p.displayName,
        id: p.id,
        isRequired: p.requiredAt !== null,
        name: p.name,
        orderIndex: p.orderIndex,
        tempId: generateTempId(),
        validationPattern: p.validationPattern,
      }));
    },
    []
  );

  // Form initialization
  const form = useAppForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      if (isEditMode && template) {
        // Update template
        await updateTemplateMutation.mutateAsync({
          data: {
            category: value.category,
            description: value.description || null,
            name: value.name,
            templateText: value.templateText,
          },
          id: template.id,
        });

        // Update placeholders
        const placeholdersToSave = pendingPlaceholders.map((p) => ({
          defaultValue: p.defaultValue,
          description: p.description,
          displayName: p.displayName,
          name: p.name,
          orderIndex: p.orderIndex,
          requiredAt: p.isRequired ? new Date().toISOString() : null,
          validationPattern: p.validationPattern,
        }));

        await updatePlaceholdersMutation.mutateAsync({
          placeholders: placeholdersToSave,
          templateId: template.id,
        });
      } else {
        // Create template
        const createdTemplate = await createTemplateMutation.mutateAsync({
          category: value.category,
          description: value.description || null,
          name: value.name,
          templateText: value.templateText,
        });

        // Create placeholders for new template
        if (pendingPlaceholders.length > 0) {
          const placeholdersToSave = pendingPlaceholders.map((p) => ({
            defaultValue: p.defaultValue,
            description: p.description,
            displayName: p.displayName,
            name: p.name,
            orderIndex: p.orderIndex,
            requiredAt: p.isRequired ? new Date().toISOString() : null,
            validationPattern: p.validationPattern,
          }));

          await updatePlaceholdersMutation.mutateAsync({
            placeholders: placeholdersToSave,
            templateId: createdTemplate.id,
          });
        }
      }

      handleClose();
      onSuccess?.();
    },
    validators: {
      onSubmit: createTemplateSchema,
    },
  });

  // Reset form state utility
  const resetFormState = useCallback(() => {
    form.reset(getDefaultValues());
    setPendingPlaceholders([]);
    setIsPlaceholdersDirty(false);
  }, [form, getDefaultValues]);

  // Effect event handlers (stable references for effects)
  const updatePlaceholdersFromData = useEffectEvent((placeholders: Array<TemplatePlaceholder>) => {
    setPendingPlaceholders(convertPlaceholdersToItems(placeholders));
    setIsPlaceholdersDirty(false);
  });

  const resetPlaceholders = useEffectEvent(() => {
    setPendingPlaceholders([]);
    setIsPlaceholdersDirty(false);
  });

  // Effects
  useEffect(() => {
    form.reset(getDefaultValues());
  }, [template, form, getDefaultValues]);

  useEffect(() => {
    if (!isOpen) return;

    if (existingPlaceholders && (isEditMode || isViewMode)) {
      updatePlaceholdersFromData(existingPlaceholders);
    } else if (isCreateMode) {
      resetPlaceholders();
    }
  }, [isOpen, isEditMode, isViewMode, isCreateMode, existingPlaceholders]);

  // Event handlers
  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetFormState();
  }, [resetFormState, setIsOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && (form.state.isDirty || isPlaceholdersDirty)) {
        setIsDiscardDialogOpen(true);
        return;
      }
      setIsOpen(open);
      if (open) {
        form.reset(getDefaultValues());
        if (existingPlaceholders && (isEditMode || isViewMode)) {
          setPendingPlaceholders(convertPlaceholdersToItems(existingPlaceholders));
        } else {
          setPendingPlaceholders([]);
        }
        setIsPlaceholdersDirty(false);
      } else {
        resetFormState();
      }
    },
    [
      setIsOpen,
      resetFormState,
      getDefaultValues,
      form,
      isEditMode,
      isViewMode,
      existingPlaceholders,
      convertPlaceholdersToItems,
      isPlaceholdersDirty,
    ]
  );

  const handleConfirmDiscard = useCallback(() => {
    setIsDiscardDialogOpen(false);
    setIsOpen(false);
    resetFormState();
  }, [resetFormState, setIsOpen]);

  const handlePlaceholdersChange = useCallback((placeholders: Array<TemplatePlaceholderItem>) => {
    setPendingPlaceholders(placeholders);
    setIsPlaceholdersDirty(true);
  }, []);

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    },
    [form]
  );

  // Derived values for render
  const { dialogDescription, dialogTitle, submitLabel } = dialogLabels;
  const isEditOrViewMode = isEditMode || isViewMode;
  const shouldShowBuiltInBadge = isEditOrViewMode && isBuiltIn;
  const shouldShowCustomBadge = isEditOrViewMode && !isBuiltIn;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Dialog Trigger */}
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      {/* Dialog Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'dialog'} scrollable={true} size={'xl'}>
          {/* Dialog Header */}
          <DialogHeader
            badges={
              <Fragment>
                {/* Template Type Badges */}
                {shouldShowBuiltInBadge && <Badge variant={'default'}>Built-in Template</Badge>}
                {shouldShowCustomBadge && <Badge variant={'custom'}>Custom Template</Badge>}
                {template?.category && (
                  <Badge variant={template.category}>{template.category.charAt(0).toUpperCase() + template.category.slice(1)}</Badge>
                )}
              </Fragment>
            }
            isCloseDisabled={isSubmitting}
          >
            <DialogTitle id={'template-editor-title'}>{dialogTitle}</DialogTitle>
            <DialogDescription id={'template-editor-description'}>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {/* Template Editor Form */}
          <form
            aria-describedby={'template-editor-description'}
            aria-labelledby={'template-editor-title'}
            className={'flex min-h-0 flex-1 flex-col'}
            onSubmit={handleFormSubmit}
          >
            {/* Scrollable Content */}
            <DialogBody className={'px-2'}>
              {/* Form Fields */}
              <fieldset className={'flex flex-col gap-4'} disabled={isSubmitting || isViewMode}>
                <legend className={'sr-only'}>Template details</legend>

                {/* Name Field */}
                <form.AppField name={'name'}>
                  {(field) => (
                    <field.TextField
                      autoFocus={isCreateMode}
                      isRequired
                      label={'Template Name'}
                      placeholder={'Enter template name'}
                    />
                  )}
                </form.AppField>

                {/* Category Field */}
                <form.AppField name={'category'}>
                  {(field) => (
                    <field.SelectField
                      description={'The category helps organize templates by their purpose'}
                      isRequired
                      label={'Category'}
                      options={CATEGORY_OPTIONS}
                      placeholder={'Select a category'}
                    />
                  )}
                </form.AppField>

                {/* Description Field */}
                <form.AppField name={'description'}>
                  {(field) => (
                    <field.TextareaField
                      description={'A brief description of what this template is for'}
                      label={'Description'}
                      placeholder={'Describe the template...'}
                      rows={3}
                    />
                  )}
                </form.AppField>

                {/* Template Text Field */}
                <form.AppField name={'templateText'}>
                  {(field) => (
                    <field.TextareaField
                      description={'Use {{placeholderName}} syntax for dynamic content'}
                      isRequired
                      label={'Template Text'}
                      placeholder={'Enter template content with {{placeholders}}...'}
                      rows={12}
                    />
                  )}
                </form.AppField>
              </fieldset>

              {/* Placeholders Section */}
              <div className={'mt-4 rounded-md border border-border p-3'}>
                <TemplatePlaceholdersSection
                  isDisabled={isSubmitting || isViewMode}
                  onChange={handlePlaceholdersChange}
                  placeholders={pendingPlaceholders}
                />
              </div>
            </DialogBody>

            {/* Dialog Footer */}
            <DialogFooter>
              {/* Cancel and Save Buttons */}
              <div className={'flex gap-3'}>
                <DialogClose>
                  <Button disabled={isSubmitting} type={'button'} variant={'outline'}>
                    {isViewMode ? 'Close' : 'Cancel'}
                  </Button>
                </DialogClose>
                {!isViewMode && (
                  <form.AppForm>
                    <form.SubmitButton>{submitLabel}</form.SubmitButton>
                  </form.AppForm>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>

      {/* Discard Changes Confirmation Dialog */}
      <ConfirmDiscardDialog
        isOpen={isDiscardDialogOpen}
        onConfirm={handleConfirmDiscard}
        onOpenChange={setIsDiscardDialogOpen}
      />
    </DialogRoot>
  );
};
