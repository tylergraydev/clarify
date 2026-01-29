# Step 17: Create TanStack Query Hooks for Agents and Templates

**Status**: SUCCESS

## Files Created
- `hooks/queries/use-agents.ts` - Agent query and mutation hooks
- `hooks/queries/use-templates.ts` - Template query and mutation hooks

## Validation Results
- pnpm lint: PASS
- pnpm typecheck: PASS

## Agent Hooks Created
| Hook | Purpose |
|------|---------|
| `useAgent(id)` | Fetch single agent |
| `useAgents(filters?)` | Fetch all agents |
| `useActiveAgents(projectId?)` | Fetch active agents |
| `useBuiltInAgents()` | Fetch built-in agents |
| `useAgentsByProject(projectId)` | Fetch by project |
| `useAgentsByType(type)` | Fetch by type |
| `useActivateAgent()` | Activate agent |
| `useDeactivateAgent()` | Deactivate agent |
| `useResetAgent()` | Reset agent |
| `useUpdateAgent()` | Update agent |

## Template Hooks Created
| Hook | Purpose |
|------|---------|
| `useTemplate(id)` | Fetch single template |
| `useTemplates(filters?)` | Fetch all templates |
| `useActiveTemplates()` | Fetch active templates |
| `useBuiltInTemplates()` | Fetch built-in templates |
| `useTemplatesByCategory(category)` | Fetch by category |
| `useCreateTemplate()` | Create template |
| `useUpdateTemplate()` | Update template |
| `useDeleteTemplate()` | Delete template |
| `useIncrementTemplateUsage()` | Increment usage |

## Success Criteria
- [x] All agent hooks use async pattern
- [x] Template hooks support category filtering
- [x] Reset agent invalidates all agent queries
- [x] All validation commands pass
