# Step 2: Implement IPC Handlers for Move and Copy Operations

**Status**: SUCCESS

## Files Modified

- `electron/ipc/agent.handlers.ts` - Added `move` and `copyToProject` handlers with full validation
- `electron/ipc/index.ts` - Updated `registerAgentHandlers` call to pass `projectsRepository`

## Handler Details

### agent:move Handler
- Validates agent existence with `agentsRepository.findById`
- Prevents moving built-in agents (suggests creating override instead)
- Validates target project exists (when not null) and is not archived
- Uses `agentsRepository.update` to change `projectId`
- Accepts `null` to move agent back to global scope

### agent:copyToProject Handler
- Validates both agent and target project exist
- Prevents copying to archived projects
- Generates unique name with project ID suffix
- Uses project name in display name for clarity
- Copies all tools and skills from source agent to new agent
- Sets `parentAgentId` to link back to source agent

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Move handler validates agent exists and updates projectId correctly
- [x] CopyToProject handler creates a new agent with tools and skills copied
- [x] Error handling returns meaningful messages for validation failures
- [x] All validation commands pass
