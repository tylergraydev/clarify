'use client';

import { AgentLayoutProvider } from '@/components/providers/agent-layout-provider';

type AgentsLayoutProps = RequiredChildren;

/**
 * Layout for the agents section that provides layout state management.
 * The AgentLayoutProvider hydrates the layout preference from electron-store
 * before rendering to prevent flash of default layout.
 */
export default function AgentsLayout({ children }: AgentsLayoutProps) {
  return <AgentLayoutProvider>{children}</AgentLayoutProvider>;
}
