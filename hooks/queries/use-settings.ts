"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { settingKeys } from "@/lib/queries/settings";

import { useElectronDb } from "../use-electron";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Bulk update multiple settings at once
 */
export function useBulkUpdateSettings() {
  const queryClient = useQueryClient();
  const { settings } = useElectronDb();

  return useMutation({
    mutationFn: (updates: Array<{ key: string; value: string }>) =>
      settings.bulkUpdate(updates),
    onSuccess: (updatedSettings) => {
      // Update each setting in the cache
      for (const setting of updatedSettings) {
        queryClient.setQueryData(
          settingKeys.detail(setting.id).queryKey,
          setting
        );
        queryClient.setQueryData(
          settingKeys.byKey(setting.key).queryKey,
          setting
        );
      }
      // Invalidate all settings queries to ensure lists are refreshed
      void queryClient.invalidateQueries({ queryKey: settingKeys._def });
    },
  });
}

/**
 * Reset a setting to its default value
 */
export function useResetSetting() {
  const queryClient = useQueryClient();
  const { settings } = useElectronDb();

  return useMutation({
    mutationFn: (key: string) => settings.resetToDefault(key),
    onSuccess: (setting) => {
      if (setting) {
        // Update detail cache directly
        queryClient.setQueryData(
          settingKeys.detail(setting.id).queryKey,
          setting
        );
        // Update by key cache directly
        queryClient.setQueryData(
          settingKeys.byKey(setting.key).queryKey,
          setting
        );
        // Invalidate list and category queries
        void queryClient.invalidateQueries({ queryKey: settingKeys.list._def });
        void queryClient.invalidateQueries({
          queryKey: settingKeys.byCategory(setting.category).queryKey,
        });
      }
    },
  });
}

/**
 * Fetch a single setting by ID
 */
export function useSetting(id: number) {
  const { isElectron, settings } = useElectronDb();

  return useQuery({
    ...settingKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => settings.get(id),
  });
}

/**
 * Fetch a single setting by key
 */
export function useSettingByKey(key: string) {
  const { isElectron, settings } = useElectronDb();

  return useQuery({
    ...settingKeys.byKey(key),
    enabled: isElectron && Boolean(key),
    queryFn: () => settings.getByKey(key),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fetch all settings, optionally filtered by category
 */
export function useSettings(filters?: { category?: string }) {
  const { isElectron, settings } = useElectronDb();

  return useQuery({
    ...settingKeys.list(filters),
    enabled: isElectron,
    queryFn: async () => {
      const allSettings = await settings.list();
      // Apply client-side filtering if category filter provided
      if (filters?.category) {
        return allSettings.filter(
          (setting) => setting.category === filters.category
        );
      }
      return allSettings;
    },
  });
}

/**
 * Fetch settings filtered by category
 */
export function useSettingsByCategory(category: string) {
  const { isElectron, settings } = useElectronDb();

  return useQuery({
    ...settingKeys.byCategory(category),
    enabled: isElectron && Boolean(category),
    queryFn: () => settings.getByCategory(category),
  });
}

/**
 * Update a single setting value by key
 */
export function useUpdateSetting() {
  const queryClient = useQueryClient();
  const { settings } = useElectronDb();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      settings.setValue(key, value),
    onSuccess: (setting) => {
      if (setting) {
        // Update detail cache directly
        queryClient.setQueryData(
          settingKeys.detail(setting.id).queryKey,
          setting
        );
        // Update by key cache directly
        queryClient.setQueryData(
          settingKeys.byKey(setting.key).queryKey,
          setting
        );
        // Invalidate list and category queries
        void queryClient.invalidateQueries({ queryKey: settingKeys.list._def });
        void queryClient.invalidateQueries({
          queryKey: settingKeys.byCategory(setting.category).queryKey,
        });
      }
    },
  });
}
