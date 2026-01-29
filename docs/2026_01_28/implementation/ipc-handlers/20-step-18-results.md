# Step 18: Create TanStack Query Hooks for Projects and Repositories

**Status**: SUCCESS

## Files Created
- `hooks/queries/use-projects.ts` - Project query and mutation hooks
- `hooks/queries/use-repositories.ts` - Repository query and mutation hooks

## Validation Results
- pnpm lint --fix: PASS
- pnpm typecheck: PASS

## Project Hooks Created
| Hook | Purpose |
|------|---------|
| `useProject(id)` | Fetch single project |
| `useProjects()` | Fetch all projects |
| `useCreateProject()` | Create project |
| `useUpdateProject()` | Update project |
| `useDeleteProject()` | Delete project |
| `useAddRepositoryToProject()` | Add repo to project |

## Repository Hooks Created
| Hook | Purpose |
|------|---------|
| `useRepository(id)` | Fetch single repository |
| `useRepositories()` | Fetch all repositories |
| `useRepositoriesByProject(projectId)` | Fetch by project |
| `useCreateRepository()` | Create repository |
| `useUpdateRepository()` | Update repository |
| `useDeleteRepository()` | Delete repository |
| `useSetDefaultRepository()` | Set default repo |

## Success Criteria
- [x] All project hooks handle async repository
- [x] Repository hooks support project filtering
- [x] Add repo mutation invalidates both project and repository caches
- [x] All validation commands pass
