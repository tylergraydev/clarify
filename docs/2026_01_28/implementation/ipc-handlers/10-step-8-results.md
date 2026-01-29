# Step 8: Implement Projects IPC Handlers

**Status**: SUCCESS

## Files Created

- `electron/ipc/project.handlers.ts` - Project management IPC handlers

## Files Modified

- `electron/ipc/index.ts` - Updated registration to pass both repositories

## Validation Results

- pnpm lint: PASS for project.handlers.ts
- pnpm typecheck: PASS for project.handlers.ts

## Handlers Implemented

| Channel           | Action              | Repository Method                     |
| ----------------- | ------------------- | ------------------------------------- |
| `project:create`  | Create new project  | `projectsRepository.create(data)`     |
| `project:get`     | Get project by ID   | `projectsRepository.findById(id)`     |
| `project:list`    | List projects       | `projectsRepository.findAll(options)` |
| `project:update`  | Update project      | `projectsRepository.update(id, data)` |
| `project:delete`  | Archive project     | `projectsRepository.archive(id)`      |
| `project:addRepo` | Add repo to project | `repositoriesRepository.create(data)` |

## Success Criteria

- [x] All project handlers registered
- [x] `addRepo` creates repository linked to project
- [x] Delete archives rather than hard deletes
- [x] All validation commands pass for this file
