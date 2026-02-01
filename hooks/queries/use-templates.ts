'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  NewTemplate,
  NewTemplatePlaceholder,
  Template,
  TemplateListFilters,
  TemplatePlaceholder,
} from '@/types/electron';

import { templateKeys } from '@/lib/queries/templates';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Types for Optimistic Update Contexts
// ============================================================================

interface CreateTemplateMutationContext {
  previousListQueries: Array<[QueryKeyType, Array<Template> | undefined]>;
}

interface DeleteTemplateMutationContext {
  previousQueries: Array<[QueryKeyType, Array<Template> | Template | undefined]>;
}

type QueryKeyType = ReadonlyArray<unknown>;

interface UpdateTemplateMutationContext {
  previousQueries: Array<[QueryKeyType, Array<Template> | Template | undefined]>;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch active templates using server-side filtering
 */
export function useActiveTemplates() {
  const { isElectron, templates } = useElectronDb();

  return useQuery({
    ...templateKeys.active,
    enabled: isElectron,
    queryFn: () => templates.list({ includeDeactivated: false }),
  });
}

/**
 * Fetch built-in templates
 * Note: builtInAt filter is not supported server-side, so client-side filtering is required
 */
export function useBuiltInTemplates() {
  const { isElectron, templates } = useElectronDb();

  return useQuery({
    ...templateKeys.builtIn,
    enabled: isElectron,
    queryFn: async () => {
      // Fetch active templates (using server-side filter), then filter by builtInAt client-side
      const templateList = await templates.list({ includeDeactivated: false });
      return templateList.filter((template) => template.builtInAt !== null);
    },
  });
}

/**
 * Create a new template with optimistic updates.
 * Adds the template to lists immediately, then reconciles with server response.
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { templates } = useElectronDb();

  return useMutation<Template, Error, NewTemplate, CreateTemplateMutationContext>({
    mutationFn: (data: NewTemplate) => templates.create(data),
    onError: (_error, _variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousListQueries) {
        for (const [queryKey, data] of context.previousListQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onMutate: async (newTemplate) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: templateKeys.list._def });
      await queryClient.cancelQueries({
        queryKey: templateKeys.active.queryKey,
      });

      // Snapshot previous values for rollback
      const previousListQueries: Array<[QueryKeyType, Array<Template> | undefined]> = [];

      // Create an optimistic template with placeholder ID
      const optimisticTemplate: Template = {
        builtInAt: null,
        category: newTemplate.category,
        createdAt: new Date().toISOString(),
        deactivatedAt: null,
        description: newTemplate.description ?? null,
        id: -Date.now(), // Temporary negative ID
        name: newTemplate.name,
        templateText: newTemplate.templateText,
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      };

      // Get all list query keys and update them optimistically
      const listQueryKey = templateKeys.list._def;
      const activeQueryKey = templateKeys.active.queryKey;

      // Update all matching list queries
      queryClient.setQueriesData<Array<Template>>({ queryKey: listQueryKey }, (old) => {
        if (old) {
          previousListQueries.push([listQueryKey, old]);
          return [optimisticTemplate, ...old];
        }
        return [optimisticTemplate];
      });

      // Update active templates query
      const previousActive = queryClient.getQueryData<Array<Template>>(activeQueryKey);
      if (previousActive !== undefined) {
        previousListQueries.push([activeQueryKey, previousActive]);
        queryClient.setQueryData<Array<Template>>(activeQueryKey, [optimisticTemplate, ...previousActive]);
      }

      return { previousListQueries };
    },
    onSettled: () => {
      // Always refetch after mutation to ensure data consistency
      void queryClient.invalidateQueries({ queryKey: templateKeys.list._def });
      void queryClient.invalidateQueries({
        queryKey: templateKeys.active.queryKey,
      });
    },
    onSuccess: (template) => {
      // Invalidate category-specific queries
      if (template.category) {
        void queryClient.invalidateQueries({
          queryKey: templateKeys.byCategory(template.category).queryKey,
        });
      }
    },
  });
}

/**
 * Delete a template with optimistic updates.
 * Removes the template from lists immediately, then confirms with server.
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { templates } = useElectronDb();

  return useMutation<boolean, Error, number, DeleteTemplateMutationContext>({
    mutationFn: (id: number) => templates.delete(id),
    onError: (_error, _id, context) => {
      // Rollback optimistic updates on error
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onMutate: async (templateId) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: templateKeys._def });

      // Snapshot previous values for rollback
      const previousQueries: Array<[QueryKeyType, Array<Template> | Template | undefined]> = [];

      // Remove from all list queries optimistically
      queryClient.setQueriesData<Array<Template>>({ queryKey: templateKeys.list._def }, (old) => {
        if (old) {
          previousQueries.push([templateKeys.list._def, old]);
          return old.filter((t) => t.id !== templateId);
        }
        return old;
      });

      // Remove from active templates query
      const activeQueryKey = templateKeys.active.queryKey;
      const previousActive = queryClient.getQueryData<Array<Template>>(activeQueryKey);
      if (previousActive) {
        previousQueries.push([activeQueryKey, previousActive]);
        queryClient.setQueryData<Array<Template>>(
          activeQueryKey,
          previousActive.filter((t) => t.id !== templateId)
        );
      }

      // Remove from built-in templates query
      const builtInQueryKey = templateKeys.builtIn.queryKey;
      const previousBuiltIn = queryClient.getQueryData<Array<Template>>(builtInQueryKey);
      if (previousBuiltIn) {
        previousQueries.push([builtInQueryKey, previousBuiltIn]);
        queryClient.setQueryData<Array<Template>>(
          builtInQueryKey,
          previousBuiltIn.filter((t) => t.id !== templateId)
        );
      }

      // Remove the detail cache
      const detailQueryKey = templateKeys.detail(templateId).queryKey;
      const previousDetail = queryClient.getQueryData<Template>(detailQueryKey);
      if (previousDetail) {
        previousQueries.push([detailQueryKey, previousDetail]);
        queryClient.removeQueries({ queryKey: detailQueryKey });
      }

      return { previousQueries };
    },
    onSettled: () => {
      // Always refetch after mutation to ensure data consistency
      void queryClient.invalidateQueries({ queryKey: templateKeys._def });
    },
  });
}

/**
 * Increment template usage count
 */
export function useIncrementTemplateUsage() {
  const queryClient = useQueryClient();
  const { templates } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => templates.incrementUsage(id),
    onSuccess: (template) => {
      if (template) {
        // Update detail cache directly
        queryClient.setQueryData(templateKeys.detail(template.id).queryKey, template);
        // Invalidate list queries to update usage counts in lists
        void queryClient.invalidateQueries({
          queryKey: templateKeys.list._def,
        });
      }
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fetch a single template by ID
 */
export function useTemplate(id: number) {
  const { isElectron, templates } = useElectronDb();

  return useQuery({
    ...templateKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => templates.get(id),
  });
}

/**
 * Fetch placeholders for a specific template
 */
export function useTemplatePlaceholders(templateId: number) {
  const { isElectron, templates } = useElectronDb();

  return useQuery({
    ...templateKeys.placeholders(templateId),
    enabled: isElectron && templateId > 0,
    queryFn: () => templates.getPlaceholders(templateId),
  });
}

/**
 * Fetch all templates with server-side filtering
 */
export function useTemplates(filters?: TemplateListFilters) {
  const { isElectron, templates } = useElectronDb();

  return useQuery({
    ...templateKeys.list(filters),
    enabled: isElectron,
    queryFn: () => templates.list(filters),
  });
}

/**
 * Fetch templates filtered by category using server-side filtering
 */
export function useTemplatesByCategory(category: TemplateListFilters['category']) {
  const { isElectron, templates } = useElectronDb();

  return useQuery({
    ...templateKeys.byCategory(category),
    enabled: isElectron && Boolean(category),
    queryFn: () => templates.list({ category, includeDeactivated: false }),
  });
}

// ============================================================================
// Template Placeholder Hooks
// ============================================================================

/**
 * Update a template with optimistic updates.
 * Updates the template in place immediately, then confirms with server.
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { templates } = useElectronDb();

  interface UpdateVariables {
    data: Partial<NewTemplate>;
    id: number;
  }

  return useMutation<Template | undefined, Error, UpdateVariables, UpdateTemplateMutationContext>({
    mutationFn: ({ data, id }: UpdateVariables) => templates.update(id, data),
    onError: (_error, _variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onMutate: async ({ data: updateData, id: templateId }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: templateKeys._def });

      // Snapshot previous values for rollback
      const previousQueries: Array<[QueryKeyType, Array<Template> | Template | undefined]> = [];

      // Get existing template from detail cache or find in lists
      const detailQueryKey = templateKeys.detail(templateId).queryKey;
      let existingTemplate = queryClient.getQueryData<Template>(detailQueryKey);

      // If not in detail cache, try to find in list queries
      if (!existingTemplate) {
        const allLists = queryClient.getQueriesData<Array<Template>>({
          queryKey: templateKeys.list._def,
        });
        for (const [, templateList] of allLists) {
          if (templateList) {
            const found = templateList.find((t) => t.id === templateId);
            if (found) {
              existingTemplate = found;
              break;
            }
          }
        }
      }

      if (!existingTemplate) {
        // Can't do optimistic update without existing data
        return { previousQueries };
      }

      // Create optimistically updated template
      const optimisticTemplate: Template = {
        ...existingTemplate,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      // Update detail cache
      const previousDetail = queryClient.getQueryData<Template>(detailQueryKey);
      if (previousDetail) {
        previousQueries.push([detailQueryKey, previousDetail]);
      }
      queryClient.setQueryData<Template>(detailQueryKey, optimisticTemplate);

      // Update all list queries optimistically
      queryClient.setQueriesData<Array<Template>>({ queryKey: templateKeys.list._def }, (old) => {
        if (old) {
          previousQueries.push([templateKeys.list._def, old]);
          return old.map((t) => (t.id === templateId ? optimisticTemplate : t));
        }
        return old;
      });

      // Update active templates query
      const activeQueryKey = templateKeys.active.queryKey;
      const previousActive = queryClient.getQueryData<Array<Template>>(activeQueryKey);
      if (previousActive) {
        previousQueries.push([activeQueryKey, previousActive]);
        // Handle deactivation - remove from active list if deactivatedAt is set
        if (updateData.deactivatedAt !== undefined) {
          if (updateData.deactivatedAt === null) {
            // Re-activating - add to list if not present
            const isInList = previousActive.some((t) => t.id === templateId);
            if (!isInList) {
              queryClient.setQueryData<Array<Template>>(activeQueryKey, [optimisticTemplate, ...previousActive]);
            } else {
              queryClient.setQueryData<Array<Template>>(
                activeQueryKey,
                previousActive.map((t) => (t.id === templateId ? optimisticTemplate : t))
              );
            }
          } else {
            // Deactivating - remove from active list
            queryClient.setQueryData<Array<Template>>(
              activeQueryKey,
              previousActive.filter((t) => t.id !== templateId)
            );
          }
        } else {
          queryClient.setQueryData<Array<Template>>(
            activeQueryKey,
            previousActive.map((t) => (t.id === templateId ? optimisticTemplate : t))
          );
        }
      }

      return { previousQueries };
    },
    onSettled: () => {
      // Always refetch after mutation to ensure data consistency
      void queryClient.invalidateQueries({ queryKey: templateKeys._def });
    },
    onSuccess: (template) => {
      if (template) {
        // Update detail cache with actual server response
        queryClient.setQueryData(templateKeys.detail(template.id).queryKey, template);
        // Invalidate category-specific queries
        if (template.category) {
          void queryClient.invalidateQueries({
            queryKey: templateKeys.byCategory(template.category).queryKey,
          });
        }
      }
    },
  });
}

/**
 * Update placeholders for a template (replace all)
 */
export function useUpdateTemplatePlaceholders() {
  const queryClient = useQueryClient();
  const { templates } = useElectronDb();

  interface UpdatePlaceholdersVariables {
    placeholders: Array<Omit<NewTemplatePlaceholder, 'templateId'>>;
    templateId: number;
  }

  return useMutation<Array<TemplatePlaceholder>, Error, UpdatePlaceholdersVariables>({
    mutationFn: ({ placeholders, templateId }: UpdatePlaceholdersVariables) =>
      templates.updatePlaceholders(templateId, placeholders),
    onSuccess: (_placeholders, { templateId }) => {
      // Invalidate the placeholders cache for this template
      void queryClient.invalidateQueries({
        queryKey: templateKeys.placeholders(templateId).queryKey,
      });
    },
  });
}
