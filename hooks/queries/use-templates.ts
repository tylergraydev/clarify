"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewTemplate } from "@/types/electron";

import { templateKeys } from "@/lib/queries/templates";

import { useElectron } from "../use-electron";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch active templates
 */
export function useActiveTemplates() {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...templateKeys.active,
    enabled: isElectron,
    queryFn: async () => {
      const templates = await api!.template.list();
      // Template is active if deactivatedAt is null
      return templates.filter((template) => template.deactivatedAt === null);
    },
  });
}

/**
 * Fetch built-in templates
 */
export function useBuiltInTemplates() {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...templateKeys.builtIn,
    enabled: isElectron,
    queryFn: async () => {
      const templates = await api!.template.list();
      // Template is built-in if builtInAt is not null
      return templates.filter((template) => template.builtInAt !== null);
    },
  });
}

/**
 * Create a new template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (data: NewTemplate) => api!.template.create(data),
    onSuccess: (template) => {
      // Invalidate list queries
      void queryClient.invalidateQueries({ queryKey: templateKeys.list._def });
      // Invalidate active templates
      void queryClient.invalidateQueries({
        queryKey: templateKeys.active.queryKey,
      });
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
 * Delete a template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.template.delete(id),
    onSuccess: () => {
      // Invalidate all template queries
      void queryClient.invalidateQueries({ queryKey: templateKeys._def });
    },
  });
}

/**
 * Increment template usage count
 */
export function useIncrementTemplateUsage() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: (id: number) => api!.template.incrementUsage(id),
    onSuccess: (template) => {
      if (template) {
        // Update detail cache directly
        queryClient.setQueryData(
          templateKeys.detail(template.id).queryKey,
          template
        );
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
  const { api, isElectron } = useElectron();

  return useQuery({
    ...templateKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => api!.template.get(id),
  });
}

/**
 * Fetch all templates
 */
export function useTemplates(filters?: {
  category?: string;
  includeDeactivated?: boolean;
}) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...templateKeys.list(filters),
    enabled: isElectron,
    queryFn: async () => {
      const templates = await api!.template.list();
      // Apply client-side filtering since API returns all templates
      return templates.filter((template) => {
        // Template is active if deactivatedAt is null
        if (!filters?.includeDeactivated && template.deactivatedAt !== null) {
          return false;
        }
        if (filters?.category && template.category !== filters.category) {
          return false;
        }
        return true;
      });
    },
  });
}

/**
 * Fetch templates filtered by category
 */
export function useTemplatesByCategory(category: string) {
  const { api, isElectron } = useElectron();

  return useQuery({
    ...templateKeys.byCategory(category),
    enabled: isElectron && Boolean(category),
    queryFn: async () => {
      const templates = await api!.template.list();
      // Template is active if deactivatedAt is null
      return templates.filter(
        (template) =>
          template.category === category && template.deactivatedAt === null
      );
    },
  });
}

/**
 * Update a template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: ({ data, id }: { data: Partial<NewTemplate>; id: number }) =>
      api!.template.update(id, data),
    onSuccess: (template) => {
      if (template) {
        // Update detail cache directly
        queryClient.setQueryData(
          templateKeys.detail(template.id).queryKey,
          template
        );
        // Invalidate list queries
        void queryClient.invalidateQueries({
          queryKey: templateKeys.list._def,
        });
        // Invalidate active templates
        void queryClient.invalidateQueries({
          queryKey: templateKeys.active.queryKey,
        });
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
