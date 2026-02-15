'use client';

import { Fragment, useEffect, useState } from 'react';

import { AgentEditorDialog } from '@/components/agents/agent-editor-dialog';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { TemplateEditorDialog } from '@/components/templates/template-editor-dialog';
import { useCommandPaletteStore } from '@/lib/stores/command-palette-store';

export const CommandPaletteDialogs = () => {
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Subscribe to store changes to open dialogs without calling setState in an effect
  useEffect(() => {
    return useCommandPaletteStore.subscribe((state) => {
      if (!state.pendingDialog) return;
      switch (state.pendingDialog) {
        case 'create-agent':
          setAgentDialogOpen(true);
          break;
        case 'create-project':
          setProjectDialogOpen(true);
          break;
        case 'create-template':
          setTemplateDialogOpen(true);
          break;
      }
      state.setPendingDialog(null);
    });
  }, []);

  return (
    <Fragment>
      <CreateProjectDialog isOpen={projectDialogOpen} onOpenChange={setProjectDialogOpen} />
      <AgentEditorDialog isOpen={agentDialogOpen} mode={'create'} onOpenChange={setAgentDialogOpen} />
      <TemplateEditorDialog isOpen={templateDialogOpen} mode={'create'} onOpenChange={setTemplateDialogOpen} />
    </Fragment>
  );
};
