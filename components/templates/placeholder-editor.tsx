'use client';

import type { ComponentPropsWithRef, DragEvent } from 'react';

import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { TemplatePlaceholderFormValues } from '@/lib/validations/template';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PlaceholderEditorProps
  extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  onChange: (placeholders: Array<TemplatePlaceholderFormValues>) => void;
  placeholders: Array<TemplatePlaceholderFormValues>;
}

interface PlaceholderValidationErrors {
  defaultValue?: string;
  description?: string;
  displayName?: string;
  name?: string;
  validationPattern?: string;
}

const PLACEHOLDER_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

const createDefaultPlaceholder = (
  orderIndex: number
): TemplatePlaceholderFormValues => ({
  defaultValue: '',
  description: '',
  displayName: '',
  isRequired: false,
  name: '',
  orderIndex,
  validationPattern: '',
});

const validatePlaceholder = (
  placeholder: TemplatePlaceholderFormValues
): PlaceholderValidationErrors => {
  const errors: PlaceholderValidationErrors = {};

  // Validate name
  if (!placeholder.name) {
    errors.name = 'Placeholder name is required';
  } else if (placeholder.name.length > 100) {
    errors.name = 'Placeholder name is too long';
  } else if (!PLACEHOLDER_NAME_REGEX.test(placeholder.name)) {
    errors.name =
      'Name must start with a letter and contain only letters, numbers, and underscores';
  }

  // Validate displayName
  if (!placeholder.displayName) {
    errors.displayName = 'Display name is required';
  } else if (placeholder.displayName.length > 255) {
    errors.displayName = 'Display name is too long';
  }

  // Validate validationPattern (regex)
  if (placeholder.validationPattern) {
    try {
      new RegExp(placeholder.validationPattern);
    } catch {
      errors.validationPattern = 'Invalid regular expression pattern';
    }
  }

  return errors;
};

export const PlaceholderEditor = ({
  className,
  onChange,
  placeholders,
  ref,
  ...props
}: PlaceholderEditorProps) => {
  const [validationErrors, setValidationErrors] = useState<
    Map<number, PlaceholderValidationErrors>
  >(new Map());
  const [draggedIndex, setDraggedIndex] = useState<null | number>(null);
  const [dragOverIndex, setDragOverIndex] = useState<null | number>(null);

  const nextOrderIndex = useMemo(() => {
    if (placeholders.length === 0) return 0;
    return Math.max(...placeholders.map((p) => p.orderIndex)) + 1;
  }, [placeholders]);

  const handleAddPlaceholder = useCallback(() => {
    const newPlaceholder = createDefaultPlaceholder(nextOrderIndex);
    onChange([...placeholders, newPlaceholder]);
  }, [nextOrderIndex, onChange, placeholders]);

  const handleRemovePlaceholder = useCallback(
    (index: number) => {
      const newPlaceholders = placeholders.filter((_, i) => i !== index);
      // Reindex orderIndex values after removal
      const reindexedPlaceholders = newPlaceholders.map((p, i) => ({
        ...p,
        orderIndex: i,
      }));
      onChange(reindexedPlaceholders);

      // Clear validation errors for removed item
      setValidationErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(index);
        return newErrors;
      });
    },
    [onChange, placeholders]
  );

  const handlePlaceholderChange = useCallback(
    (
      index: number,
      field: keyof TemplatePlaceholderFormValues,
      value: boolean | number | string
    ) => {
      const newPlaceholders = placeholders.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      );

      // Validate the changed placeholder
      const updatedPlaceholder = newPlaceholders[index];
      if (updatedPlaceholder) {
        const errors = validatePlaceholder(updatedPlaceholder);
        setValidationErrors((prev) => {
          const newErrors = new Map(prev);
          if (Object.keys(errors).length > 0) {
            newErrors.set(index, errors);
          } else {
            newErrors.delete(index);
          }
          return newErrors;
        });
      }

      onChange(newPlaceholders);
    },
    [onChange, placeholders]
  );

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex]
  );

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      const newPlaceholders = [...placeholders];
      const [draggedItem] = newPlaceholders.splice(draggedIndex, 1);
      if (draggedItem) {
        newPlaceholders.splice(dragOverIndex, 0, draggedItem);
        // Reindex orderIndex values after reordering
        const reindexedPlaceholders = newPlaceholders.map((p, i) => ({
          ...p,
          orderIndex: i,
        }));
        onChange(reindexedPlaceholders);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, onChange, placeholders]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  return (
    <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
      {/* Placeholder List */}
      {placeholders.length > 0 && (
        <div className={'flex flex-col gap-3'}>
          {placeholders.map((placeholder, index) => {
            const errors = validationErrors.get(index) ?? {};
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const placeholderTitle =
              placeholder.displayName || `Placeholder ${index + 1}`;

            return (
              <Card
                className={cn(
                  'transition-all',
                  isDragging && 'opacity-50',
                  isDragOver && 'border-accent'
                )}
                draggable
                key={index}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragStart={() => handleDragStart(index)}
              >
                {/* Card Header with Drag Handle and Remove Button */}
                <CardHeader className={'flex flex-row items-center gap-2 pb-3'}>
                  {/* Drag Handle */}
                  <button
                    aria-label={'Drag to reorder'}
                    className={cn(
                      'cursor-grab text-muted-foreground transition-colors',
                      'hover:text-foreground',
                      'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
                      'active:cursor-grabbing'
                    )}
                    type={'button'}
                  >
                    <GripVertical aria-hidden={'true'} className={'size-5'} />
                  </button>

                  {/* Title */}
                  <CardTitle className={'flex-1 text-base'}>
                    {placeholderTitle}
                  </CardTitle>

                  {/* Remove Button */}
                  <Button
                    aria-label={'Remove placeholder'}
                    onClick={() => handleRemovePlaceholder(index)}
                    size={'icon-sm'}
                    type={'button'}
                    variant={'ghost'}
                  >
                    <Trash2 aria-hidden={'true'} className={'size-4'} />
                  </Button>
                </CardHeader>

                {/* Card Content with Form Fields */}
                <CardContent className={'flex flex-col gap-4'}>
                  {/* Name and Display Name Row */}
                  <div className={'grid grid-cols-2 gap-4'}>
                    {/* Name Field */}
                    <div className={'flex flex-col gap-1.5'}>
                      <label
                        className={'text-sm font-medium text-foreground'}
                        htmlFor={`placeholder-${index}-name`}
                      >
                        {'Name'}
                        <span
                          aria-hidden={'true'}
                          className={'ml-0.5 text-destructive'}
                        >
                          {'*'}
                        </span>
                      </label>
                      <Input
                        id={`placeholder-${index}-name`}
                        isInvalid={Boolean(errors.name)}
                        onChange={(e) =>
                          handlePlaceholderChange(index, 'name', e.target.value)
                        }
                        placeholder={'entityName'}
                        size={'sm'}
                        value={placeholder.name}
                      />
                      {errors.name && (
                        <span className={'text-sm text-destructive'}>
                          {errors.name}
                        </span>
                      )}
                    </div>

                    {/* Display Name Field */}
                    <div className={'flex flex-col gap-1.5'}>
                      <label
                        className={'text-sm font-medium text-foreground'}
                        htmlFor={`placeholder-${index}-displayName`}
                      >
                        {'Display Name'}
                        <span
                          aria-hidden={'true'}
                          className={'ml-0.5 text-destructive'}
                        >
                          {'*'}
                        </span>
                      </label>
                      <Input
                        id={`placeholder-${index}-displayName`}
                        isInvalid={Boolean(errors.displayName)}
                        onChange={(e) =>
                          handlePlaceholderChange(
                            index,
                            'displayName',
                            e.target.value
                          )
                        }
                        placeholder={'Entity Name'}
                        size={'sm'}
                        value={placeholder.displayName}
                      />
                      {errors.displayName && (
                        <span className={'text-sm text-destructive'}>
                          {errors.displayName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className={'flex flex-col gap-1.5'}>
                    <label
                      className={'text-sm font-medium text-foreground'}
                      htmlFor={`placeholder-${index}-description`}
                    >
                      {'Description'}
                    </label>
                    <Textarea
                      id={`placeholder-${index}-description`}
                      isInvalid={Boolean(errors.description)}
                      onChange={(e) =>
                        handlePlaceholderChange(
                          index,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder={'Describe what this placeholder is used for...'}
                      rows={2}
                      size={'sm'}
                      value={placeholder.description}
                    />
                    {errors.description && (
                      <span className={'text-sm text-destructive'}>
                        {errors.description}
                      </span>
                    )}
                  </div>

                  {/* Default Value and Validation Pattern Row */}
                  <div className={'grid grid-cols-2 gap-4'}>
                    {/* Default Value Field */}
                    <div className={'flex flex-col gap-1.5'}>
                      <label
                        className={'text-sm font-medium text-foreground'}
                        htmlFor={`placeholder-${index}-defaultValue`}
                      >
                        {'Default Value'}
                      </label>
                      <Input
                        id={`placeholder-${index}-defaultValue`}
                        isInvalid={Boolean(errors.defaultValue)}
                        onChange={(e) =>
                          handlePlaceholderChange(
                            index,
                            'defaultValue',
                            e.target.value
                          )
                        }
                        placeholder={'Optional default'}
                        size={'sm'}
                        value={placeholder.defaultValue}
                      />
                      {errors.defaultValue && (
                        <span className={'text-sm text-destructive'}>
                          {errors.defaultValue}
                        </span>
                      )}
                    </div>

                    {/* Validation Pattern Field */}
                    <div className={'flex flex-col gap-1.5'}>
                      <label
                        className={'text-sm font-medium text-foreground'}
                        htmlFor={`placeholder-${index}-validationPattern`}
                      >
                        {'Validation Pattern (Regex)'}
                      </label>
                      <Input
                        id={`placeholder-${index}-validationPattern`}
                        isInvalid={Boolean(errors.validationPattern)}
                        onChange={(e) =>
                          handlePlaceholderChange(
                            index,
                            'validationPattern',
                            e.target.value
                          )
                        }
                        placeholder={'^[a-zA-Z]+$'}
                        size={'sm'}
                        value={placeholder.validationPattern}
                      />
                      {errors.validationPattern && (
                        <span className={'text-sm text-destructive'}>
                          {errors.validationPattern}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Required Toggle and Order Index Row */}
                  <div className={'flex items-center justify-between'}>
                    {/* Required Toggle */}
                    <label
                      className={
                        'flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground'
                      }
                    >
                      <input
                        checked={placeholder.isRequired}
                        className={cn(
                          'size-4 rounded-sm border-border',
                          'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
                        )}
                        onChange={(e) =>
                          handlePlaceholderChange(
                            index,
                            'isRequired',
                            e.target.checked
                          )
                        }
                        type={'checkbox'}
                      />
                      {'Required'}
                    </label>

                    {/* Order Index Display */}
                    <span className={'text-sm text-muted-foreground'}>
                      {'Order: '}
                      {placeholder.orderIndex}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {placeholders.length === 0 && (
        <div
          className={
            'rounded-lg border border-dashed border-border p-6 text-center'
          }
        >
          <p className={'text-sm text-muted-foreground'}>
            {'No placeholders defined. Add one to get started.'}
          </p>
        </div>
      )}

      {/* Add Placeholder Button */}
      <Button
        className={'w-full'}
        onClick={handleAddPlaceholder}
        type={'button'}
        variant={'outline'}
      >
        <Plus aria-hidden={'true'} className={'size-4'} />
        {'Add Placeholder'}
      </Button>
    </div>
  );
};
