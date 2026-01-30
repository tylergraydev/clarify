# Templates Audit Fixes - Implementation Plan

**Generated:** 2026-01-29
**Original Request:** Fix all issues identified in `docs/templates-feature-audit-report.md`
**Refined Request:** The Templates feature audit has identified nine issues requiring remediation across the template management system, spanning IPC handlers, repository patterns, React components, and TanStack Query hooks. The most critical issue involves a type mismatch in the `template:delete` IPC handler located in `electron/ipc/template.handlers.ts`, which currently returns `Template | undefined` while the TypeScript declarations in `types/electron.d.ts` and `electron/preload.ts` expect `Promise<boolean>`, breaking the type-safe IPC bridge pattern and potentially causing runtime errors. A high-priority issue exists in the preload API where `electron/preload.ts` fails to pass filter parameters to the `template:list` handler, which directly impacts Issue #7 since the TanStack Query hooks in `use-templates.ts` are forced to fetch all templates and filter client-side rather than leveraging server-side filtering through the Drizzle ORM repository layer. Medium-priority issues include incomplete template duplication in `app/(app)/templates/page.tsx` that neglects to copy placeholder definitions from the `template_placeholders` table, the `TemplatePickerDialog` component parsing placeholders from raw text instead of fetching stored definitions with their validation patterns and metadata, and a transaction safety gap in the `replaceForTemplate` method within `db/repositories/template-placeholders.repository.ts` where a failed insert after delete could result in permanent data loss—this should utilize better-sqlite3's transaction support to ensure atomicity. Lower-priority issues include the `PlaceholderEditor` component using array indices as React keys which causes reconciliation problems during reorder operations, the absence of a dedicated `template:activate` IPC handler requiring the system to use the general update endpoint, and bulk operations throughout the codebase using sequential loops rather than parallel execution with `Promise.allSettled()` for improved performance.

---

## Analysis Summary

- Feature request refined with project context
- Discovered 19 files across 8 directories
- Generated 9-step implementation plan organized in 4 phases

---

## File Discovery Results

### Critical Priority (Must Modify)

| File                                                  | Issue(s) | Modification                                 |
| ----------------------------------------------------- | -------- | -------------------------------------------- |
| `electron/ipc/template.handlers.ts`                   | #1, #8   | Fix delete return type; Add activate handler |
| `electron/preload.ts`                                 | #2       | Add filter parameters to list()              |
| `types/electron.d.ts`                                 | #1, #2   | Update type declarations                     |
| `db/repositories/template-placeholders.repository.ts` | #5       | Add transaction wrapper                      |
| `app/(app)/templates/page.tsx`                        | #3, #9   | Copy placeholders; Parallelize bulk ops      |
| `components/templates/template-editor-dialog.tsx`     | #3       | Accept copied placeholders                   |
| `components/workflows/template-picker-dialog.tsx`     | #4       | Fetch stored placeholder metadata            |
| `components/templates/placeholder-editor.tsx`         | #6       | Use unique IDs as keys                       |
| `hooks/queries/use-templates.ts`                      | #7       | Pass filters to server                       |

### Reference Files

- `electron/ipc/repository.handlers.ts` - Delete handler boolean pattern
- `electron/ipc/channels.ts` - IPC channel definitions
- `db/repositories/templates.repository.ts` - Server-side filtering
- `db/index.ts` - Transaction support

---

## Implementation Plan

## Overview

**Estimated Duration**: 2-3 days
**Complexity**: Medium
**Risk Level**: Medium

## Quick Summary

This plan addresses nine audit issues in the Templates feature across IPC handlers, repository patterns, React components, and TanStack Query hooks. The fixes range from critical type mismatches in the IPC bridge to medium-priority improvements like transaction safety, proper placeholder handling during template duplication, and replacing array indices with unique IDs for React reconciliation.

## Prerequisites

- [ ] Ensure development environment is set up and running
- [ ] Verify better-sqlite3 transaction API is available
- [ ] Review existing tests for templates feature to understand expected behaviors
- [ ] Backup development database before starting transaction-related changes

## Implementation Steps

### Phase 1: Critical Priority (Type Safety and IPC Bridge)

---

### Step 1: Fix Delete Handler Return Type Mismatch (Issue #1)

**What**: Modify the `template:delete` IPC handler to return a boolean instead of `Template | undefined`
**Why**: The TypeScript declarations in `types/electron.d.ts` and `electron/preload.ts` expect `Promise<boolean>`, but the handler returns the deactivated template object, breaking the type-safe IPC bridge pattern
**Confidence**: High

**Files to Modify:**

- `electron/ipc/template.handlers.ts` - Change delete handler to call `delete` method and return boolean

**Changes:**

- In `registerTemplateHandlers`, locate the `template:delete` handler (lines 104-114)
- Change the handler to call `templatesRepository.delete(id)` instead of `templatesRepository.deactivate(id)`
- Update return type annotation to `: boolean`
- The repository already has a `delete` method that returns `boolean`

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handler return type matches `boolean` as declared in type definitions
- [ ] No TypeScript errors in `template.handlers.ts`
- [ ] All validation commands pass

---

### Step 2: Add Filter Parameters to Preload Template List (Issue #2)

**What**: Update the preload API to pass filter parameters to the `template:list` IPC handler
**Why**: The handler already accepts `TemplateListFilters` but the preload API ignores these parameters, forcing client-side filtering instead of leveraging server-side filtering
**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Add filters parameter to template.list method
- `types/electron.d.ts` - Update type declaration for template.list

**Changes:**

- In `electron/preload.ts`, update the `template.list` method signature to accept optional filters parameter
- Pass the filters parameter through to the IPC invoke call
- Define `TemplateListFilters` interface matching the handler's expected type (category and includeDeactivated)
- Update `types/electron.d.ts` with the matching type signature

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Preload API signature includes optional filters parameter
- [ ] Type declarations match between preload and electron.d.ts
- [ ] All validation commands pass

---

### Step 3: Add Transaction Safety to replaceForTemplate (Issue #5)

**What**: Wrap the delete and insert operations in `replaceForTemplate` within a database transaction
**Why**: Currently, if the insert fails after delete, all existing placeholders are lost permanently; this should be atomic
**Confidence**: High

**Files to Modify:**

- `db/repositories/template-placeholders.repository.ts` - Add transaction wrapper

**Changes:**

- Import the underlying better-sqlite3 database connection or use Drizzle's transaction API
- Wrap the delete and insert operations in `replaceForTemplate` method within a transaction block
- Use try-catch to ensure transaction rollback on error
- The Drizzle ORM supports transactions via `db.transaction(async (tx) => { ... })` pattern

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Delete and insert operations are wrapped in a transaction
- [ ] Transaction rollback occurs on insert failure
- [ ] No TypeScript errors
- [ ] All validation commands pass

---

### Phase 2: High Priority (Server-Side Filtering)

---

### Step 4: Update TanStack Query Hooks to Use Server-Side Filtering (Issue #7)

**What**: Modify the `useTemplates` hook to pass filters to the server instead of fetching all templates and filtering client-side
**Why**: After Issue #2 is fixed, the hooks should leverage server-side filtering for better performance
**Confidence**: High
**Dependencies**: Step 2 must be completed first

**Files to Modify:**

- `hooks/queries/use-templates.ts` - Pass filters to API call

**Changes:**

- In `useTemplates` hook, pass the filters object to `api.template.list(filters)` instead of calling without parameters
- Remove the client-side filtering logic that duplicates server-side behavior
- Also update `useActiveTemplates`, `useBuiltInTemplates`, and `useTemplatesByCategory` hooks to leverage server-side filtering where applicable

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Filters are passed to the API call
- [ ] Client-side filtering logic is removed or simplified
- [ ] All validation commands pass

---

### Phase 3: Medium Priority (Data Integrity and UX)

---

### Step 5: Copy Placeholders During Template Duplication (Issue #3)

**What**: Modify the template duplication flow to fetch and copy placeholder definitions from the source template
**Why**: Currently, duplicating a template only copies the base template data but loses all placeholder metadata
**Confidence**: Medium

**Files to Modify:**

- `app/(app)/templates/page.tsx` - Add placeholder fetching to duplicate handler
- `components/templates/template-editor-dialog.tsx` - Accept initial placeholders prop

**Changes:**

- In `page.tsx`, update `handleDuplicateTemplate` to accept placeholders as part of `DuplicateTemplateData`
- Update `DuplicateTemplateData` interface to include optional placeholders array
- In the `TemplateGridItem` and `TemplateTableRow` components, fetch placeholders before calling onDuplicate
- In `template-editor-dialog.tsx`, update `TemplateInitialData` interface to include optional placeholders
- When initialData contains placeholders, pre-populate the placeholder editor with those values

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Duplicated templates include all placeholder definitions
- [ ] Placeholder metadata (validation patterns, descriptions, default values) is preserved
- [ ] All validation commands pass

---

### Step 6: Fetch Stored Placeholder Metadata in TemplatePickerDialog (Issue #4)

**What**: Update the `TemplatePickerDialog` to fetch placeholder definitions from the database instead of parsing from template text
**Why**: Current implementation extracts placeholders via regex and loses validation patterns, descriptions, and metadata stored in `template_placeholders` table
**Confidence**: Medium

**Files to Modify:**

- `components/workflows/template-picker-dialog.tsx` - Add placeholder fetching query

**Changes:**

- Import `useTemplatePlaceholders` hook from `use-templates.ts`
- When a template is selected, fetch its placeholders using the hook
- Replace `parsePlaceholdersFromText` usage with the fetched placeholder data
- Map the database placeholder format to the component's `ParsedPlaceholder` interface
- Keep the regex parsing as a fallback for templates without stored placeholders

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Placeholder validation patterns from database are applied during form validation
- [ ] Placeholder descriptions and metadata are displayed to users
- [ ] Fallback to regex parsing works for templates without stored placeholders
- [ ] All validation commands pass

---

### Step 7: Use Unique IDs as Keys in PlaceholderEditor (Issue #6)

**What**: Replace array indices with unique identifiers as React keys in the placeholder editor
**Why**: Using array indices causes React reconciliation issues during drag-and-drop reordering
**Confidence**: High

**Files to Modify:**

- `components/templates/placeholder-editor.tsx` - Add unique IDs to placeholders
- `lib/validations/template.ts` - Update schema to include id field (if needed)

**Changes:**

- Add a `uid` field (using crypto.randomUUID or a simple counter) to the placeholder form values type
- Update `createDefaultPlaceholder` to generate a unique ID
- Change the `key={index}` on line 209 to `key={placeholder.uid}`
- Update the validation errors Map to use the uid instead of index as the key
- Ensure uid is generated when loading existing placeholders in the editor dialog

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Each placeholder has a unique identifier
- [ ] React key uses the unique identifier instead of array index
- [ ] Drag-and-drop reordering works correctly without reconciliation issues
- [ ] All validation commands pass

---

### Phase 4: Lower Priority (Optimizations)

---

### Step 8: Add Dedicated Template Activate Handler (Issue #8)

**What**: Add a dedicated `template:activate` IPC handler and channel
**Why**: Currently activation requires using the general update endpoint; a dedicated handler provides clearer semantics and potential optimizations
**Confidence**: High

**Files to Modify:**

- `electron/ipc/channels.ts` - Add activate channel
- `electron/preload.ts` - Add activate method and channel constant
- `types/electron.d.ts` - Add activate method type
- `electron/ipc/template.handlers.ts` - Add activate handler

**Changes:**

- Add `activate: "template:activate"` to the template channels in both files
- Create a new handler that calls `templatesRepository.activate(id)` directly
- Add the `activate` method to the preload API and type declarations
- Pattern after existing activate/deactivate handlers in agent.handlers.ts

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] New IPC channel `template:activate` is defined
- [ ] Handler correctly calls repository activate method
- [ ] Type declarations are consistent across all files
- [ ] All validation commands pass

---

### Step 9: Parallelize Bulk Operations (Issue #9)

**What**: Replace sequential loops in bulk activate, deactivate, and delete operations with parallel execution using `Promise.allSettled()`
**Why**: Sequential execution is slower and does not take advantage of concurrent processing
**Confidence**: Medium

**Files to Modify:**

- `app/(app)/templates/page.tsx` - Update bulk operation handlers

**Changes:**

- In `handleBulkActivate`, replace the for-loop with `Promise.allSettled()` pattern
- In `handleBulkDeactivate`, replace the for-loop with `Promise.allSettled()` pattern
- In `handleConfirmBulkDelete`, replace the for-loop with `Promise.allSettled()` pattern
- Extract common parallel execution logic into a helper function if beneficial
- Update success/failure counting to use the `Promise.allSettled()` result statuses

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Bulk operations execute in parallel
- [ ] Success/failure counting remains accurate
- [ ] User feedback messages correctly report results
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] Template CRUD operations work correctly in the Electron app
- [ ] Template duplication preserves all placeholder data
- [ ] Template picker dialog displays placeholder metadata from database
- [ ] Bulk operations complete faster with parallel execution
- [ ] Drag-and-drop reordering in placeholder editor works without visual glitches

## Notes

- **Issue Dependencies**: Step 4 (server-side filtering hooks) depends on Step 2 (preload filter parameters) being completed first
- **Transaction Support**: The better-sqlite3 library used by Drizzle ORM supports transactions natively; verify the exact API surface before implementing Step 3
- **Backwards Compatibility**: The activate handler (Step 8) is additive and should not break existing functionality using the update endpoint
- **Testing Considerations**: Consider adding integration tests for the transaction safety in Step 3 to verify rollback behavior
- **Performance Baseline**: Before implementing Step 9 (parallel bulk ops), consider measuring current bulk operation times for comparison
