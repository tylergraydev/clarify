'use client';

import type { ReactNode } from 'react';

import { FileText, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { Template } from '@/types/electron';
import type { TemplatePlaceholder } from '@/types/electron';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useActiveTemplates, useIncrementTemplateUsage, useTemplatePlaceholders } from '@/hooks/queries/use-templates';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ParsedPlaceholder {
  defaultValue: string;
  description: string;
  displayName: string;
  isRequired: boolean;
  name: string;
  validationPattern: string;
}

type PlaceholderValidationErrors = Record<string, string>;

type PlaceholderValues = Record<string, string>;

interface TemplatePickerDialogProps {
  /** Callback when template content is inserted */
  onInsert: (content: string) => void;
  /** The trigger element that opens the dialog */
  trigger: ReactNode;
}

// ============================================================================
// Placeholder Parsing Utilities
// ============================================================================

/**
 * Maps an array of database placeholders to ParsedPlaceholder format,
 * sorted by orderIndex for consistent display order.
 */
function mapDatabasePlaceholdersToParsed(dbPlaceholders: Array<TemplatePlaceholder>): Array<ParsedPlaceholder> {
  return [...dbPlaceholders].sort((a, b) => a.orderIndex - b.orderIndex).map(mapDatabasePlaceholderToParsed);
}

/**
 * Maps a database TemplatePlaceholder to the component's ParsedPlaceholder format.
 * This ensures validation patterns, descriptions, and other metadata from the database
 * are properly applied to the form fields.
 */
function mapDatabasePlaceholderToParsed(dbPlaceholder: TemplatePlaceholder): ParsedPlaceholder {
  return {
    defaultValue: dbPlaceholder.defaultValue ?? '',
    description: dbPlaceholder.description ?? '',
    displayName: dbPlaceholder.displayName,
    // requiredAt is null for optional, contains a datetime string for required
    isRequired: dbPlaceholder.requiredAt !== null,
    name: dbPlaceholder.name,
    validationPattern: dbPlaceholder.validationPattern ?? '',
  };
}

/**
 * Parses placeholders from template text using regex.
 * Used as a fallback when no stored placeholders exist in the database.
 * Supports format: {{placeholderName}}
 */
function parsePlaceholdersFromText(templateText: string): Array<ParsedPlaceholder> {
  const placeholderRegex = /\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;
  const matches = templateText.matchAll(placeholderRegex);
  const placeholders: Array<ParsedPlaceholder> = [];
  const seenNames = new Set<string>();

  for (const match of matches) {
    const name = match[1];
    if (name && !seenNames.has(name)) {
      seenNames.add(name);
      placeholders.push({
        defaultValue: '',
        description: '',
        // Convert camelCase to display name (e.g., entityName -> Entity Name)
        displayName: name
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim(),
        isRequired: true,
        name,
        validationPattern: '',
      });
    }
  }

  return placeholders;
}

/**
 * Substitutes placeholder values into template text
 */
function substituteValues(templateText: string, values: PlaceholderValues): string {
  let result = templateText;

  for (const [name, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Validates a placeholder value against its validation pattern
 */
function validatePlaceholderValue(placeholder: ParsedPlaceholder, value: string): string | undefined {
  // Check required
  if (placeholder.isRequired && !value.trim()) {
    return `${placeholder.displayName} is required`;
  }

  // Check validation pattern
  if (placeholder.validationPattern && value) {
    try {
      const regex = new RegExp(placeholder.validationPattern);
      if (!regex.test(value)) {
        return `${placeholder.displayName} does not match the required format`;
      }
    } catch {
      // Invalid regex pattern, skip validation
    }
  }

  return undefined;
}

// ============================================================================
// Component
// ============================================================================

export const TemplatePickerDialog = ({ onInsert, trigger }: TemplatePickerDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<null | Template>(null);
  const [placeholderValues, setPlaceholderValues] = useState<PlaceholderValues>({});
  const [validationErrors, setValidationErrors] = useState<PlaceholderValidationErrors>({});

  const activeTemplatesQuery = useActiveTemplates();
  const incrementUsageMutation = useIncrementTemplateUsage();

  // Fetch placeholders from database when a template is selected
  const templatePlaceholdersQuery = useTemplatePlaceholders(selectedTemplate?.id ?? 0);

  // Get placeholders from database or fall back to regex parsing
  // Uses stored placeholders when available (which include validation patterns,
  // descriptions, and other metadata), otherwise falls back to parsing from text
  const parsedPlaceholders = useMemo(() => {
    if (!selectedTemplate) return [];

    // Use database placeholders if available
    const dbPlaceholders = templatePlaceholdersQuery.data;
    if (dbPlaceholders && dbPlaceholders.length > 0) {
      return mapDatabasePlaceholdersToParsed(dbPlaceholders);
    }

    // Fallback to regex parsing for templates without stored placeholders
    return parsePlaceholdersFromText(selectedTemplate.templateText);
  }, [selectedTemplate, templatePlaceholdersQuery.data]);

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    const templates = activeTemplatesQuery.data ?? [];
    if (!searchQuery.trim()) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
    );
  }, [activeTemplatesQuery.data, searchQuery]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (parsedPlaceholders.length === 0) return true;

    for (const placeholder of parsedPlaceholders) {
      const value = placeholderValues[placeholder.name] ?? '';
      const error = validatePlaceholderValue(placeholder, value);
      if (error) return false;
    }

    return true;
  }, [parsedPlaceholders, placeholderValues]);

  // Preview content with substituted values
  const previewContent = useMemo(() => {
    if (!selectedTemplate) return '';
    return substituteValues(selectedTemplate.templateText, placeholderValues);
  }, [selectedTemplate, placeholderValues]);

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setSelectedTemplate(null);
    setPlaceholderValues({});
    setValidationErrors({});
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        handleReset();
      }
    },
    [handleReset]
  );

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setPlaceholderValues({});
    setValidationErrors({});
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedTemplate(null);
    setPlaceholderValues({});
    setValidationErrors({});
  }, []);

  const handlePlaceholderChange = useCallback(
    (name: string, value: string) => {
      setPlaceholderValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Validate the changed field
      const placeholder = parsedPlaceholders.find((p) => p.name === name);
      if (placeholder) {
        const error = validatePlaceholderValue(placeholder, value);
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          if (error) {
            newErrors[name] = error;
          } else {
            delete newErrors[name];
          }
          return newErrors;
        });
      }
    },
    [parsedPlaceholders]
  );

  const handleInsert = useCallback(() => {
    if (!selectedTemplate) return;

    // Validate all fields
    const errors: PlaceholderValidationErrors = {};
    let hasErrors = false;

    for (const placeholder of parsedPlaceholders) {
      const value = placeholderValues[placeholder.name] ?? '';
      const error = validatePlaceholderValue(placeholder, value);
      if (error) {
        errors[placeholder.name] = error;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    // Substitute values and insert
    const content = substituteValues(selectedTemplate.templateText, placeholderValues);
    onInsert(content);

    // Increment usage count - fire and forget, don't block insertion
    // Errors are logged silently without disrupting user workflow
    incrementUsageMutation.mutate(selectedTemplate.id, {
      onError: (error) => {
        // Log error silently without showing to user
        console.error('Failed to increment template usage:', error);
      },
    });

    handleOpenChange(false);
  }, [selectedTemplate, parsedPlaceholders, placeholderValues, onInsert, incrementUsageMutation, handleOpenChange]);

  const isLoading = activeTemplatesQuery.isLoading;
  const hasTemplates = (activeTemplatesQuery.data?.length ?? 0) > 0;
  const hasPlaceholders = parsedPlaceholders.length > 0;
  const isShowingNoSearchResults = !isLoading && hasTemplates && filteredTemplates.length === 0;
  const isShowingTemplateList = !isLoading && filteredTemplates.length > 0;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      <DialogTrigger>{trigger}</DialogTrigger>

      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} className={'max-w-2xl'} role={'dialog'}>
          {/* Header */}
          <div className={'flex items-start justify-between gap-4'}>
            <div>
              <DialogTitle id={'template-picker-title'}>
                {selectedTemplate ? 'Fill Template Values' : 'Select Template'}
              </DialogTitle>
              <DialogDescription id={'template-picker-description'}>
                {selectedTemplate
                  ? `Fill in the placeholder values for "${selectedTemplate.name}"`
                  : 'Choose a template to insert into your feature request'}
              </DialogDescription>
            </div>
            {selectedTemplate && (
              <Badge variant={selectedTemplate.category}>
                {selectedTemplate.category.charAt(0).toUpperCase() + selectedTemplate.category.slice(1)}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className={'mt-6'}>
            {/* Template List View */}
            {!selectedTemplate && (
              <div className={'flex flex-col gap-4'}>
                {/* Search Input */}
                <div className={'relative'}>
                  <Search
                    aria-hidden={'true'}
                    className={'absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'}
                  />
                  <Input
                    aria-controls={'template-list'}
                    aria-label={'Search templates'}
                    className={'pl-9'}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={'Search templates by name or category...'}
                    role={'searchbox'}
                    value={searchQuery}
                  />
                </div>

                {/* Template List */}
                <div
                  aria-label={'Available templates'}
                  className={'max-h-80 overflow-y-auto rounded-lg border border-border'}
                  id={'template-list'}
                  role={'listbox'}
                >
                  {isLoading && (
                    <div className={'flex items-center justify-center p-8'}>
                      <p className={'text-sm text-muted-foreground'}>{'Loading templates...'}</p>
                    </div>
                  )}

                  {!isLoading && !hasTemplates && (
                    <div className={'flex flex-col items-center justify-center gap-2 p-8'}>
                      <FileText aria-hidden={'true'} className={'size-8 text-muted-foreground'} />
                      <p className={'text-sm text-muted-foreground'}>{'No active templates available'}</p>
                    </div>
                  )}

                  {isShowingNoSearchResults && (
                    <div className={'flex flex-col items-center justify-center gap-2 p-8'}>
                      <Search aria-hidden={'true'} className={'size-8 text-muted-foreground'} />
                      <p className={'text-sm text-muted-foreground'}>{'No templates match your search'}</p>
                    </div>
                  )}

                  {isShowingTemplateList && (
                    <ul className={'divide-y divide-border'} role={'listbox'}>
                      {filteredTemplates.map((template) => {
                        const placeholders = parsePlaceholdersFromText(template.templateText);
                        const placeholderCount = placeholders.length;

                        return (
                          <li aria-selected={'false'} key={template.id} role={'option'}>
                            <button
                              aria-label={`Select ${template.name} template, ${template.category} category, ${placeholderCount} ${placeholderCount === 1 ? 'placeholder' : 'placeholders'}`}
                              className={cn(
                                'flex w-full flex-col gap-1 p-4 text-left transition-colors',
                                'hover:bg-muted/50',
                                'focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset'
                              )}
                              onClick={() => handleTemplateSelect(template)}
                              type={'button'}
                            >
                              {/* Template Header */}
                              <div className={'flex items-center justify-between'}>
                                <span className={'font-medium text-foreground'}>{template.name}</span>
                                <div className={'flex items-center gap-2'}>
                                  {template.usageCount > 0 && (
                                    <span className={'text-xs text-muted-foreground'}>
                                      {template.usageCount} {template.usageCount === 1 ? 'use' : 'uses'}
                                    </span>
                                  )}
                                  {placeholderCount > 0 && (
                                    <span className={'text-xs text-muted-foreground'}>
                                      {placeholderCount} {placeholderCount === 1 ? 'placeholder' : 'placeholders'}
                                    </span>
                                  )}
                                  <Badge size={'sm'} variant={template.category}>
                                    {template.category}
                                  </Badge>
                                </div>
                              </div>

                              {/* Template Description */}
                              {template.description && (
                                <p className={'line-clamp-2 text-sm text-muted-foreground'}>{template.description}</p>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Placeholder Form View */}
            {selectedTemplate && (
              <div className={'flex flex-col gap-4'}>
                {/* Back Button */}
                <Button
                  aria-label={'Go back to template list'}
                  className={'w-fit'}
                  onClick={handleBackToList}
                  size={'sm'}
                  type={'button'}
                  variant={'ghost'}
                >
                  {'← Back to templates'}
                </Button>

                {/* Placeholder Fields */}
                {hasPlaceholders && (
                  <fieldset className={'flex flex-col gap-4'}>
                    <legend className={'flex flex-col gap-1'}>
                      <span className={'text-sm font-medium text-foreground'}>{'Placeholder Values'}</span>
                      <span className={'text-sm text-muted-foreground'}>
                        {'Fill in the values for each placeholder below'}
                      </span>
                    </legend>

                    <div className={'flex flex-col gap-3'}>
                      {parsedPlaceholders.map((placeholder) => {
                        const value = placeholderValues[placeholder.name] ?? placeholder.defaultValue;
                        const error = validationErrors[placeholder.name];
                        const errorId = error ? `error-${placeholder.name}` : undefined;

                        return (
                          <div className={'flex flex-col gap-1.5'} key={placeholder.name}>
                            <label
                              className={'text-sm font-medium text-foreground'}
                              htmlFor={`placeholder-${placeholder.name}`}
                            >
                              {placeholder.displayName}
                              {placeholder.isRequired && (
                                <span aria-hidden={'true'} className={'ml-0.5 text-destructive'}>
                                  {'*'}
                                </span>
                              )}
                            </label>
                            {placeholder.description && (
                              <p className={'text-sm text-muted-foreground'} id={`desc-${placeholder.name}`}>
                                {placeholder.description}
                              </p>
                            )}
                            <Input
                              aria-describedby={placeholder.description ? `desc-${placeholder.name}` : undefined}
                              aria-errormessage={errorId}
                              aria-invalid={Boolean(error)}
                              aria-required={placeholder.isRequired}
                              id={`placeholder-${placeholder.name}`}
                              isInvalid={Boolean(error)}
                              onChange={(e) => handlePlaceholderChange(placeholder.name, e.target.value)}
                              placeholder={`Enter ${placeholder.displayName.toLowerCase()}`}
                              value={value}
                            />
                            {error && (
                              <span className={'text-sm text-destructive'} id={errorId} role={'alert'}>
                                {error}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {/* No Placeholders Message */}
                {!hasPlaceholders && (
                  <div className={'rounded-lg border border-border bg-muted/50 p-4'}>
                    <p className={'text-sm text-muted-foreground'}>
                      {'This template has no placeholders. The content will be inserted as-is.'}
                    </p>
                  </div>
                )}

                {/* Preview Section */}
                <div className={'flex flex-col gap-2'}>
                  <h3 className={'text-sm font-medium text-foreground'}>{'Preview'}</h3>
                  <div className={'max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3'}>
                    <pre className={'text-sm whitespace-pre-wrap text-muted-foreground'}>{previewContent}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div aria-label={'Dialog actions'} className={'mt-6 flex justify-end gap-3'} role={'group'}>
            <DialogClose>
              <Button type={'button'} variant={'outline'}>
                {'Cancel'}
              </Button>
            </DialogClose>
            {selectedTemplate && (
              <Button
                aria-describedby={!isFormValid ? 'insert-disabled-reason' : undefined}
                disabled={!isFormValid}
                onClick={handleInsert}
                type={'button'}
              >
                {'Insert Template'}
              </Button>
            )}
            {selectedTemplate && !isFormValid && (
              <span className={'sr-only'} id={'insert-disabled-reason'}>
                {'Please fill in all required fields to enable insertion'}
              </span>
            )}
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
