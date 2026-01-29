# Step 5: Implement Discovery Files IPC Handlers

**Status**: SUCCESS

## Files Created

- `electron/ipc/discovery.handlers.ts` - Discovery file IPC handlers

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS for discovery.handlers.ts

## Handlers Implemented

| Channel                    | Action               | Repository Method      |
| -------------------------- | -------------------- | ---------------------- |
| `discovery:list`           | List files by step   | `findByWorkflowStep()` |
| `discovery:update`         | Batch update files   | Map over `update()`    |
| `discovery:include`        | Include a file       | `include()`            |
| `discovery:exclude`        | Exclude a file       | `exclude()`            |
| `discovery:add`            | Add user file        | `addUserFile()`        |
| `discovery:updatePriority` | Change file priority | `updatePriority()`     |

## Success Criteria

- [x] All discovery handlers registered
- [x] Batch update handles array of files correctly
- [x] Include/exclude toggle file inclusion status
- [x] All validation commands pass for this file
