# Step 2: File Discovery

## Metadata

- **Status**: Completed
- **Timestamp**: 2026-02-05
- **Duration**: ~167s

## Refined Request Used

See `01-feature-refinement.md` for the full refined request.

## Discovered Files

### Critical (Core Implementation)

| File | Action | Relevance |
|------|--------|-----------|
| `components/workflows/detail/steps/clarification-step-content.tsx` | Modify | Current placeholder with hardcoded questions. Needs complete replacement with dynamic form rendering. |
| `components/workflows/detail/workflow-step-accordion.tsx` | Modify | Main accordion rendering all 4 steps. Hardcoded status badges/metrics need real data integration. |
| `app/(app)/workflows/[id]/page.tsx` | Modify | Three-zone layout page shell. May need updates for clarification-specific routing/state. |
| `electron/services/clarification-step.service.ts` | Reference | Complete 917-line backend service. Already production-ready with start, submit, skip, retry, streaming. |
| `electron/ipc/clarification.handlers.ts` | Reference | Complete 390-line IPC layer with 5 channels. Ready to use from frontend. |
| `lib/validations/clarification.ts` | Reference | Complete 566-line type system with Zod schemas for questions, answers, outcomes, streaming. |
| `electron/ipc/channels.ts` | Reference | Clarification IPC channels already defined (lines 70-78). |

### High Priority (State & Data Integration)

| File | Action | Relevance |
|------|--------|-----------|
| `lib/stores/workflow-detail-store.ts` | Modify | Zustand store for workflow UI state. May need clarification-specific state slices. |
| `types/electron.d.ts` | Reference | Complete ClarificationAPI type definitions (lines 173-336). |
| `db/schema/workflow-steps.schema.ts` | Reference | Database schema storing clarification data in outputStructured JSON field. |
| `db/repositories/workflow-steps.repository.ts` | Reference | Data access layer for workflow steps. |
| `hooks/queries/use-default-clarification-agent.ts` | Reference | Query hook for default clarification agent setting. |

### Medium Priority (UI Components & Forms)

| File | Action | Relevance |
|------|--------|-----------|
| `components/ui/accordion.tsx` | Reference | Base accordion with status variants (completed, running, pending, paused, skipped). |
| `components/ui/badge.tsx` | Reference | Status badges for collapsed summary bar. |
| `components/ui/button.tsx` | Reference | Action buttons (Submit, Re-run, Skip, etc.). |
| `components/ui/select.tsx` | Reference | Agent selection dropdown. |
| `components/ui/form/radio-field.tsx` | Reference | TanStack Form radio field for single-select questions. |
| `components/ui/form/checkbox-field.tsx` | Modify | May need CheckboxGroupField adaptation for multi-select questions. |
| `components/ui/form/text-field.tsx` | Reference | Text input for "Other" fields. |
| `components/ui/form/textarea-field.tsx` | Reference | Textarea for open-ended text questions. |
| `components/ui/form/field-wrapper.tsx` | Reference | Label, description, error variants for fields. |
| `components/ui/form/tanstack-field-root.tsx` | Reference | TanStack Form Field wrapper component. |
| `components/ui/separator.tsx` | Reference | Visual dividers between sections. |

### Medium Priority (Streaming & Real-time)

| File | Action | Relevance |
|------|--------|-----------|
| `components/workflows/detail/workflow-streaming-panel.tsx` | Modify | Bottom panel needs clarification stream integration. |
| `components/workflows/detail/workflow-top-bar.tsx` | Reference | Sticky top bar, may display clarification progress. |
| `components/workflows/detail/workflow-pre-start-form.tsx` | Reference | Pre-start settings form with agent/skip toggles. |
| `components/workflows/detail/workflow-detail-skeleton.tsx` | Reference | Loading skeleton for workflow detail. |

### Low Priority (Supporting Infrastructure)

| File | Action | Relevance |
|------|--------|-----------|
| `hooks/queries/use-workflows.ts` | Modify | May need clarification-specific query hooks. |
| `hooks/electron/domains/use-electron-workflows.ts` | Reference | Existing IPC hook wrappers for workflow operations. |
| `lib/queries/workflows.ts` | Modify | Query key factory may need clarification-specific keys. |
| `lib/validations/workflow.ts` | Reference | Workflow validation schemas. |
| `db/repositories/workflows.repository.ts` | Reference | Workflow data access. |
| `lib/layout/constants.ts` | Reference | Streaming panel height/storage constants. |
| `db/schema/workflows.schema.ts` | Reference | Main workflow table definition. |
| `components/workflows/detail/index.ts` | Modify | Barrel export file for workflow detail components. |
| `app/(app)/workflows/[id]/route-type.ts` | Reference | Type-safe routing with step parameter. |
| `components/workflows/detail/steps/refinement-step-content.tsx` | Reference | Similar step pattern for reference. |
| `components/workflows/detail/steps/file-discovery-step-content.tsx` | Reference | Similar step pattern for reference. |
| `components/workflows/detail/steps/implementation-planning-step-content.tsx` | Reference | Similar step pattern for reference. |

## Architecture Insights

1. **Complete Backend**: Service, IPC handlers, and type system are fully implemented and production-ready
2. **TanStack Form Integration**: Existing field components (RadioField, CheckboxField, TextareaField) can be leveraged
3. **Discriminated Unions**: ClarificationOutcome uses discriminated unions requiring switch/case rendering logic
4. **Three Question Types**: radio (single-select), checkbox (multi-select), text (open-ended) with allowOther flag
5. **Version History**: Re-runs create new versions stored in outputStructured
6. **Streaming**: Service emits phase_change, text_delta, thinking_delta, tool_start/stop messages via IPC
7. **Type-Safe IPC**: ClarificationAPI fully defined in electron.d.ts with all operations

## Statistics

- **Total Files Discovered**: 37
- **Files to Modify**: 7
- **Reference Files**: 30
- **Directories Covered**: 12+
