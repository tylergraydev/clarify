import { inferQueryKeyStore, mergeQueryKeys } from '@lukemorales/query-key-factory';

import { agentHookKeys } from './agent-hooks';
import { agentSkillKeys } from './agent-skills';
import { agentToolKeys } from './agent-tools';
import { agentKeys } from './agents';
import { auditLogKeys } from './audit-logs';
import { clarificationKeys } from './clarification';
import { debugLogKeys } from './debug-logs';
import { discoveredFileKeys } from './discovered-files';
import { projectKeys } from './projects';
import { refinementKeys } from './refinement';
import { repositoryKeys } from './repositories';
import { settingKeys } from './settings';
import { stepKeys } from './steps';
import { templateKeys } from './templates';
import { workflowKeys } from './workflows';

export const queries = mergeQueryKeys(
  agentKeys,
  agentHookKeys,
  agentSkillKeys,
  agentToolKeys,
  auditLogKeys,
  clarificationKeys,
  debugLogKeys,
  discoveredFileKeys,
  projectKeys,
  refinementKeys,
  repositoryKeys,
  settingKeys,
  stepKeys,
  templateKeys,
  workflowKeys
);

export type QueryKeys = inferQueryKeyStore<typeof queries>;

export { agentHookKeys } from './agent-hooks';
export { agentSkillKeys } from './agent-skills';
export { agentToolKeys } from './agent-tools';
// Re-export individual keys for direct access
export { agentKeys } from './agents';
export { auditLogKeys } from './audit-logs';
export { clarificationKeys } from './clarification';
export { debugLogKeys } from './debug-logs';
export { discoveredFileKeys } from './discovered-files';
export { projectKeys } from './projects';
export { refinementKeys } from './refinement';
export { repositoryKeys } from './repositories';
export { settingKeys } from './settings';
export { stepKeys } from './steps';
export { templateKeys } from './templates';
export { workflowKeys } from './workflows';
