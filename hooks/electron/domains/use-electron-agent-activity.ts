'use client';

import { useMemo } from 'react';

import { useElectron } from '../use-electron-base';

export function useElectronAgentActivity() {
  const { api } = useElectron();

  const agentActivity = useMemo(
    () => ({
      getByStepId: async (stepId: number) => {
        if (!api) return [];
        return api.agentActivity.getByStepId(stepId);
      },
      getByWorkflowId: async (workflowId: number) => {
        if (!api) return [];
        return api.agentActivity.getByWorkflowId(workflowId);
      },
    }),
    [api]
  );

  return { agentActivity };
}
