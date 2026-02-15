'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { EditorPreference, OpenInEditorInput } from '@/types/editor';

import { editorKeys } from '@/lib/queries/editor';

import { useElectronDb } from '../use-electron';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch detected editors on the system.
 */
export function useDetectedEditors() {
  const { editor, isElectron } = useElectronDb();

  return useQuery({
    ...editorKeys.detected,
    enabled: isElectron,
    queryFn: () => editor.detect(),
  });
}

/**
 * Fetch the editor registry (platform-filtered list of known editors).
 */
export function useEditorRegistry() {
  const { editor, isElectron } = useElectronDb();

  return useQuery({
    ...editorKeys.registry,
    enabled: isElectron,
    queryFn: () => editor.getRegistry(),
  });
}

/**
 * Open a file in the preferred editor.
 */
export function useOpenInEditor() {
  const { editor } = useElectronDb();

  return useMutation({
    mutationFn: (input: OpenInEditorInput) => editor.open(input),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Fetch the user's preferred editor.
 */
export function usePreferredEditor() {
  const { editor, isElectron } = useElectronDb();

  return useQuery({
    ...editorKeys.preferred,
    enabled: isElectron,
    queryFn: async () => (await editor.getPreferred()) ?? null,
  });
}

/**
 * Set the preferred editor.
 */
export function useSetPreferredEditor() {
  const queryClient = useQueryClient();
  const { editor } = useElectronDb();

  return useMutation({
    mutationFn: (pref: EditorPreference) => editor.setPreferred(pref),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: editorKeys.preferred.queryKey });
    },
  });
}
