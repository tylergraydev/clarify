'use client';

import { useMemo } from 'react';

import type { EditorPreference, OpenInEditorInput } from '@/types/editor';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronEditor() {
  const { api } = useElectron();

  const editor = useMemo(
    () => ({
      detect: async () => {
        if (!api) return [];
        return api.editor.detect();
      },
      getPreferred: async () => {
        if (!api) return undefined;
        return api.editor.getPreferred();
      },
      getRegistry: async () => {
        if (!api) return [];
        return api.editor.getRegistry();
      },
      open: async (input: OpenInEditorInput) => {
        const electronApi = throwIfNoApi(api, 'editor.open');
        return electronApi.editor.open(input);
      },
      setPreferred: async (pref: EditorPreference) => {
        const electronApi = throwIfNoApi(api, 'editor.setPreferred');
        return electronApi.editor.setPreferred(pref);
      },
    }),
    [api]
  );

  return { editor };
}
