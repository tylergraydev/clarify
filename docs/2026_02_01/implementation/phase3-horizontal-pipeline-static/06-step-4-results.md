# Step 4: Create Main PipelineView Component

**Status**: ✅ SUCCESS
**Specialist**: frontend-component
**Agent ID**: a08517f

## Files Created

- `components/workflows/pipeline-view.tsx` - Main container component for pipeline visualization

## Implementation Details

**Data Fetching**: Uses `useStepsByWorkflow` from TanStack Query

**State Management**: Uses `usePipelineStore` Zustand store for expand/collapse

**Step Configuration**: `ORCHESTRATION_STEPS` constant with:
- clarification
- refinement
- discovery
- planning

**State Derivation** (`deriveStepState`):
- `pending` → pending
- `running`, `paused`, `editing` → running
- `completed`, `failed`, `skipped` → completed

**Layout**: Horizontal flex with `overflow-x-auto` for responsive scrolling

**Accessibility**:
- `aria-label="Workflow pipeline"`
- `role="list"` on container
- `role="listitem"` on steps
- `aria-posinset`/`aria-setsize` for positions
- Screen reader loading status

## Validation Results

- pnpm lint: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] Component fetches workflow steps via TanStack Query
- [x] Four hardcoded steps render with correct icons and titles
- [x] Step states derive correctly from fetched data
- [x] Expand/collapse interactivity works
- [x] Connectors render between steps
- [x] All validation commands pass
