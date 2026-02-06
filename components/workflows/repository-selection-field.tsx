'use client';

import type { AnyFormApi } from '@tanstack/react-form';
import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { useStore } from '@tanstack/react-form';
import { cva } from 'class-variance-authority';

import type { Repository } from '@/types/electron';

import { Checkbox, checkboxVariants } from '@/components/ui/checkbox';
import { descriptionVariants, errorVariants, labelVariants } from '@/components/ui/form/field-wrapper';
import { TanStackFieldRoot } from '@/components/ui/form/tanstack-field-root';
import { cn } from '@/lib/utils';

export const repositorySelectionVariants = cva('flex flex-col gap-2', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'gap-2',
      lg: 'gap-2.5',
      sm: 'gap-1.5',
    },
  },
});

export const repositoryItemVariants = cva(
  `
    flex items-center gap-3 rounded-md border border-border bg-background p-3
    transition-colors
    hover:bg-muted/50
  `,
  {
    defaultVariants: {
      isSelected: false,
      size: 'default',
    },
    variants: {
      isSelected: {
        false: '',
        true: 'border-accent/50 bg-muted/30',
      },
      size: {
        default: 'p-3',
        lg: 'p-4',
        sm: 'p-2',
      },
    },
  }
);

interface RepositorySelectionFieldProps extends VariantProps<typeof checkboxVariants> {
  className?: string;
  description?: string;
  form: AnyFormApi;
  isDisabled?: boolean;
  isRequired?: boolean;
  label?: string;
  repositories: Array<Repository>;
}

export const RepositorySelectionField = ({
  className,
  description,
  form,
  isDisabled,
  isRequired,
  label = 'Repositories',
  repositories,
  size,
}: RepositorySelectionFieldProps) => {
  // Subscribe to form field values
  const selectedIds = useStore(form.store, (state) => {
    const value = state.values['repositoryIds'];
    return (value as Array<number> | undefined) ?? [];
  });

  // Get field errors
  const repositoryIdsErrors = useStore(form.store, (state) => {
    const meta = state.fieldMeta['repositoryIds'];
    return meta?.errors ?? [];
  });

  const rawError = repositoryIdsErrors[0];
  const error = typeof rawError === 'string' ? rawError : rawError?.message;
  const hasError = Boolean(error);

  // Get field meta for dirty/touched state
  const fieldMeta = useStore(form.store, (state) => state.fieldMeta['repositoryIds']);
  const isDirty = fieldMeta?.isDirty ?? false;
  const isTouched = fieldMeta?.isTouched ?? false;

  const handleRepositoryToggle = (repositoryId: number, isChecked: boolean) => {
    if (isChecked) {
      const newIds = [...selectedIds, repositoryId];
      form.setFieldValue('repositoryIds', newIds);
    } else {
      const newIds = selectedIds.filter((id) => id !== repositoryId);
      form.setFieldValue('repositoryIds', newIds);
    }
  };

  const hasRepositories = repositories.length > 0;
  const hasSelectedRepositories = selectedIds.length > 0;

  return (
    <TanStackFieldRoot
      className={className}
      isDirty={isDirty}
      isDisabled={isDisabled}
      isInvalid={hasError}
      isTouched={isTouched}
      name={'repositoryIds'}
      size={size}
    >
      {/* Label */}
      <Field.Label className={labelVariants({ size })} nativeLabel={false} render={<span />}>
        {label}
        {isRequired && (
          <span aria-hidden={'true'} className={'ml-0.5 text-destructive'}>
            *
          </span>
        )}
      </Field.Label>

      {/* Repository List */}
      {hasRepositories ? (
        <div
          aria-label={'Select repositories for this workflow'}
          className={repositorySelectionVariants({ size })}
          role={'group'}
        >
          {repositories.map((repository) => {
            const isSelected = selectedIds.includes(repository.id);
            const isOptionDisabled = isDisabled;

            return (
              <div
                className={cn(repositoryItemVariants({ isSelected, size }), !isOptionDisabled && 'cursor-pointer')}
                key={repository.id}
                onClick={() => {
                  if (!isOptionDisabled) {
                    handleRepositoryToggle(repository.id, !isSelected);
                  }
                }}
              >
                <div className={'flex items-center gap-3'}>
                  <Checkbox
                    aria-label={`Select ${repository.name}`}
                    checked={isSelected}
                    disabled={isOptionDisabled}
                    onCheckedChange={(isChecked) => handleRepositoryToggle(repository.id, isChecked)}
                    onClick={(e) => e.stopPropagation()}
                    size={size}
                  />
                  <div className={'flex min-w-0 flex-1 flex-col gap-0.5'}>
                    <span className={cn('font-medium text-foreground', isOptionDisabled && 'opacity-50')}>
                      {repository.name}
                    </span>
                    <span className={cn('truncate text-xs text-muted-foreground', isOptionDisabled && 'opacity-50')}>
                      {repository.path}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={'rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground'}>
          No repositories available. Add repositories to the project first.
        </div>
      )}

      {/* Description */}
      {description && !hasError && (
        <Field.Description className={descriptionVariants({ size })}>{description}</Field.Description>
      )}

      {/* Selected Count */}
      {hasSelectedRepositories && !hasError && (
        <p className={'text-xs text-muted-foreground'}>
          {selectedIds.length} {selectedIds.length === 1 ? 'repository' : 'repositories'} selected
        </p>
      )}

      {/* Error */}
      {hasError && (
        <Field.Error className={errorVariants({ size })} match={true}>
          {error}
        </Field.Error>
      )}
    </TanStackFieldRoot>
  );
};
