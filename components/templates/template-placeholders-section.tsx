'use client';

import type { ComponentPropsWithRef } from 'react';

import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Represents a placeholder item for form state management.
 * Includes a temporary ID for React key purposes.
 */
export interface TemplatePlaceholderItem {
  /** Default value for the placeholder */
  defaultValue: null | string;
  /** Description of the placeholder */
  description: null | string;
  /** Human-readable label */
  displayName: string;
  /** Database ID (optional for new items) */
  id?: number;
  /** Whether the placeholder is required */
  isRequired: boolean;
  /** The placeholder key used in {{name}} syntax */
  name: string;
  /** Display order */
  orderIndex: number;
  /** Temporary ID for React rendering */
  tempId: string;
  /** Optional regex validation pattern */
  validationPattern: null | string;
}

interface PlaceholderFormData {
  defaultValue: string;
  description: string;
  displayName: string;
  isRequired: boolean;
  name: string;
  validationPattern: string;
}

interface TemplatePlaceholdersSectionProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Whether the inputs are disabled */
  isDisabled?: boolean;
  /** Callback when placeholders change */
  onChange: (placeholders: Array<TemplatePlaceholderItem>) => void;
  /** Current placeholders */
  placeholders: Array<TemplatePlaceholderItem>;
}

const createEmptyFormData = (): PlaceholderFormData => ({
  defaultValue: '',
  description: '',
  displayName: '',
  isRequired: false,
  name: '',
  validationPattern: '',
});

const generateTempId = () => `placeholder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Section for managing template placeholders within the editor dialog.
 * Provides add/edit/remove functionality with collapsible list display.
 */
export const TemplatePlaceholdersSection = ({
  className,
  isDisabled = false,
  onChange,
  placeholders,
  ref,
  ...props
}: TemplatePlaceholdersSectionProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<null | string>(null);
  const [formData, setFormData] = useState<PlaceholderFormData>(createEmptyFormData());
  const [validationError, setValidationError] = useState<null | string>(null);

  const handleFormChange = useCallback((field: keyof PlaceholderFormData, value: boolean | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  }, []);

  const validateForm = useCallback(
    (currentFormData: PlaceholderFormData, excludeTempId?: string): null | string => {
      const trimmedName = currentFormData.name.trim();
      const trimmedDisplayName = currentFormData.displayName.trim();

      if (!trimmedName) {
        return 'Placeholder name is required';
      }

      if (!trimmedDisplayName) {
        return 'Display name is required';
      }

      // Check for valid identifier (alphanumeric and underscore only)
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
        return 'Name must be a valid identifier (letters, numbers, underscores, starting with letter or underscore)';
      }

      // Check for duplicate names
      const isDuplicate = placeholders.some(
        (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.tempId !== excludeTempId
      );
      if (isDuplicate) {
        return `A placeholder with name "${trimmedName}" already exists`;
      }

      // Validate regex pattern if provided
      if (currentFormData.validationPattern.trim()) {
        try {
          new RegExp(currentFormData.validationPattern.trim());
        } catch {
          return 'Invalid regex pattern';
        }
      }

      return null;
    },
    [placeholders]
  );

  const handleAddPlaceholder = useCallback(() => {
    const error = validateForm(formData);
    if (error) {
      setValidationError(error);
      return;
    }

    const newPlaceholder: TemplatePlaceholderItem = {
      defaultValue: formData.defaultValue.trim() || null,
      description: formData.description.trim() || null,
      displayName: formData.displayName.trim(),
      isRequired: formData.isRequired,
      name: formData.name.trim(),
      orderIndex: placeholders.length,
      tempId: generateTempId(),
      validationPattern: formData.validationPattern.trim() || null,
    };

    onChange([...placeholders, newPlaceholder]);
    setFormData(createEmptyFormData());
    setIsAdding(false);
    setValidationError(null);
  }, [formData, onChange, placeholders, validateForm]);

  const handleEditPlaceholder = useCallback(
    (tempId: string) => {
      const placeholder = placeholders.find((p) => p.tempId === tempId);
      if (!placeholder) return;

      setFormData({
        defaultValue: placeholder.defaultValue ?? '',
        description: placeholder.description ?? '',
        displayName: placeholder.displayName,
        isRequired: placeholder.isRequired,
        name: placeholder.name,
        validationPattern: placeholder.validationPattern ?? '',
      });
      setEditingId(tempId);
      setIsAdding(false);
      setValidationError(null);
    },
    [placeholders]
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;

    const error = validateForm(formData, editingId);
    if (error) {
      setValidationError(error);
      return;
    }

    const updatedPlaceholders = placeholders.map((p) => {
      if (p.tempId !== editingId) return p;
      return {
        ...p,
        defaultValue: formData.defaultValue.trim() || null,
        description: formData.description.trim() || null,
        displayName: formData.displayName.trim(),
        isRequired: formData.isRequired,
        name: formData.name.trim(),
        validationPattern: formData.validationPattern.trim() || null,
      };
    });

    onChange(updatedPlaceholders);
    setFormData(createEmptyFormData());
    setEditingId(null);
    setValidationError(null);
  }, [editingId, formData, onChange, placeholders, validateForm]);

  const handleDeletePlaceholder = useCallback(
    (tempId: string) => {
      const filtered = placeholders.filter((p) => p.tempId !== tempId);
      // Re-index orderIndex values
      const reindexed = filtered.map((p, index) => ({ ...p, orderIndex: index }));
      onChange(reindexed);

      // If we're editing the deleted item, cancel the edit
      if (editingId === tempId) {
        setEditingId(null);
        setFormData(createEmptyFormData());
      }
    },
    [editingId, onChange, placeholders]
  );

  const handleCancelForm = useCallback(() => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(createEmptyFormData());
    setValidationError(null);
  }, []);

  const handleStartAdding = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    setFormData(createEmptyFormData());
    setValidationError(null);
  }, []);

  const isFormActive = isAdding || editingId !== null;

  return (
    <div className={cn('flex flex-col gap-3', className)} ref={ref} {...props}>
      {/* Section Header */}
      <div className={'flex items-center justify-between'}>
        <div className={'text-sm font-medium text-foreground'}>Placeholders</div>
        <span className={'text-xs text-muted-foreground'}>{placeholders.length} placeholder(s)</span>
      </div>

      {/* Placeholders List */}
      {placeholders.length > 0 ? (
        <div className={'flex flex-col gap-2'}>
          {placeholders.map((placeholder) => {
            const isEditing = editingId === placeholder.tempId;
            const hasNoDetails =
              !placeholder.description && !placeholder.defaultValue && !placeholder.validationPattern;

            return (
              <Collapsible defaultOpen={isEditing} key={placeholder.tempId}>
                <div
                  className={cn(
                    'rounded-md border border-border bg-muted/30',
                    isEditing && 'ring-2 ring-accent ring-offset-0'
                  )}
                >
                  {/* Collapsible Header */}
                  <div className={'flex items-center gap-2 px-3 py-2'}>
                    <CollapsibleTrigger
                      className={'flex flex-1 items-center gap-2 text-left'}
                      isHideChevron
                      variant={'ghost'}
                    >
                      <ChevronDown
                        aria-hidden={'true'}
                        className={`
                          size-4 shrink-0 text-muted-foreground transition-transform duration-200
                          group-data-panel-open:rotate-180
                        `}
                      />
                      <div className={'flex min-w-0 flex-1 items-center gap-2'}>
                        <span className={'font-mono text-sm font-medium'}>{`{{${placeholder.name}}}`}</span>
                        <span className={'truncate text-sm text-muted-foreground'}>{placeholder.displayName}</span>
                        {placeholder.isRequired && (
                          <span className={'shrink-0 text-xs text-destructive'}>Required</span>
                        )}
                      </div>
                    </CollapsibleTrigger>

                    {/* Actions */}
                    <div className={'flex shrink-0 items-center gap-1'}>
                      <IconButton
                        aria-label={'Edit placeholder'}
                        className={'size-7'}
                        disabled={isDisabled || isFormActive}
                        onClick={() => handleEditPlaceholder(placeholder.tempId)}
                        title={'Edit'}
                        type={'button'}
                      >
                        <Pencil className={'size-3.5'} />
                      </IconButton>
                      <IconButton
                        aria-label={'Delete placeholder'}
                        className={'size-7'}
                        disabled={isDisabled}
                        onClick={() => handleDeletePlaceholder(placeholder.tempId)}
                        title={'Delete'}
                        type={'button'}
                      >
                        <Trash2 className={'size-3.5 text-destructive'} />
                      </IconButton>
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <CollapsibleContent>
                    <div className={'border-t border-border px-3 py-2'}>
                      {isEditing ? (
                        /* Edit Form */
                        <PlaceholderForm
                          formData={formData}
                          isDisabled={isDisabled}
                          isEditing
                          onCancel={handleCancelForm}
                          onChange={handleFormChange}
                          onSubmit={handleSaveEdit}
                          validationError={validationError}
                        />
                      ) : (
                        /* Details View */
                        <div className={'flex flex-col gap-2 text-sm'}>
                          {placeholder.description && (
                            <div>
                              <span className={'text-muted-foreground'}>Description: </span>
                              <span>{placeholder.description}</span>
                            </div>
                          )}
                          {placeholder.defaultValue && (
                            <div>
                              <span className={'text-muted-foreground'}>Default: </span>
                              <span className={'font-mono'}>{placeholder.defaultValue}</span>
                            </div>
                          )}
                          {placeholder.validationPattern && (
                            <div>
                              <span className={'text-muted-foreground'}>Validation: </span>
                              <span className={'font-mono'}>{placeholder.validationPattern}</span>
                            </div>
                          )}
                          {hasNoDetails && (
                            <div className={'text-muted-foreground'}>No additional details</div>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        !isAdding && <div className={'py-3 text-center text-sm text-muted-foreground'}>No placeholders defined</div>
      )}

      {/* Add Placeholder Form */}
      {isAdding && (
        <div className={'rounded-md border border-border p-3'}>
          <PlaceholderForm
            formData={formData}
            isDisabled={isDisabled}
            isEditing={false}
            onCancel={handleCancelForm}
            onChange={handleFormChange}
            onSubmit={handleAddPlaceholder}
            validationError={validationError}
          />
        </div>
      )}

      {/* Add Button */}
      {!isAdding && !editingId && (
        <Button
          className={'w-full'}
          disabled={isDisabled}
          onClick={handleStartAdding}
          size={'sm'}
          type={'button'}
          variant={'outline'}
        >
          <Plus className={'mr-2 size-4'} />
          Add Placeholder
        </Button>
      )}
    </div>
  );
};

interface PlaceholderFormProps {
  formData: PlaceholderFormData;
  isDisabled?: boolean;
  isEditing: boolean;
  onCancel: () => void;
  onChange: (field: keyof PlaceholderFormData, value: boolean | string) => void;
  onSubmit: () => void;
  validationError: null | string;
}

const PlaceholderForm = ({
  formData,
  isDisabled = false,
  isEditing,
  onCancel,
  onChange,
  onSubmit,
  validationError,
}: PlaceholderFormProps) => {
  const handleRequiredChange = (isChecked: boolean) => {
    onChange('isRequired', isChecked);
  };

  const isSubmitDisabled = isDisabled || !formData.name.trim() || !formData.displayName.trim();

  return (
    <div className={'flex flex-col gap-3'}>
      {/* Name and Display Name Row */}
      <div className={'flex gap-2'}>
        <div className={'flex flex-1 flex-col gap-1'}>
          <span className={'text-xs text-muted-foreground'}>Name (key)</span>
          <Input
            autoFocus={!isEditing}
            disabled={isDisabled}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder={'entityName'}
            size={'sm'}
            value={formData.name}
          />
        </div>
        <div className={'flex flex-1 flex-col gap-1'}>
          <span className={'text-xs text-muted-foreground'}>Display Name</span>
          <Input
            autoFocus={isEditing}
            disabled={isDisabled}
            onChange={(e) => onChange('displayName', e.target.value)}
            placeholder={'Entity Name'}
            size={'sm'}
            value={formData.displayName}
          />
        </div>
      </div>

      {/* Description */}
      <div className={'flex flex-col gap-1'}>
        <span className={'text-xs text-muted-foreground'}>Description</span>
        <Input
          disabled={isDisabled}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder={'What this placeholder represents'}
          size={'sm'}
          value={formData.description}
        />
      </div>

      {/* Default Value and Validation Pattern Row */}
      <div className={'flex gap-2'}>
        <div className={'flex flex-1 flex-col gap-1'}>
          <span className={'text-xs text-muted-foreground'}>Default Value</span>
          <Input
            disabled={isDisabled}
            onChange={(e) => onChange('defaultValue', e.target.value)}
            placeholder={'Optional default'}
            size={'sm'}
            value={formData.defaultValue}
          />
        </div>
        <div className={'flex flex-1 flex-col gap-1'}>
          <span className={'text-xs text-muted-foreground'}>Validation Pattern (regex)</span>
          <Input
            disabled={isDisabled}
            onChange={(e) => onChange('validationPattern', e.target.value)}
            placeholder={'^[A-Za-z]+$'}
            size={'sm'}
            value={formData.validationPattern}
          />
        </div>
      </div>

      {/* Required Toggle */}
      <div className={'flex items-center gap-2'}>
        <Checkbox
          checked={formData.isRequired}
          disabled={isDisabled}
          id={'placeholder-required'}
          onCheckedChange={handleRequiredChange}
        />
        <span className={'text-sm'}>Required</span>
      </div>

      {/* Validation Error */}
      {validationError && <p className={'text-xs text-destructive'}>{validationError}</p>}

      {/* Actions */}
      <div className={'flex justify-end gap-2'}>
        <Button disabled={isDisabled} onClick={onCancel} size={'sm'} type={'button'} variant={'ghost'}>
          Cancel
        </Button>
        <Button disabled={isSubmitDisabled} onClick={onSubmit} size={'sm'} type={'button'}>
          {isEditing ? 'Save' : 'Add'}
        </Button>
      </div>
    </div>
  );
};
