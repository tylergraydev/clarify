# Templates Feature Audit Report

**Audit Date:** 2025-01-29
**Auditor:** Claude
**Feature Scope:** Template management system including schema, repository, IPC handlers, query hooks, and UI components

---

## Executive Summary

The Templates feature is **largely well-implemented** with a comprehensive architecture spanning database schema, repository pattern, IPC handlers, TanStack Query hooks, and React UI components. However, several issues were identified ranging from a **critical type mismatch bug** to minor improvements and missing integrations.

**Overall Assessment:** Functional but requires fixes for production readiness.

---

## Issues Found

### 1. CRITICAL: IPC Delete Handler Returns Wrong Type

**Location:** `electron/ipc/template.handlers.ts:103-114`

**Description:**
The `template:delete` IPC handler calls `templatesRepository.deactivate(id)` which returns `Template | undefined`, but the ElectronAPI interface in `types/electron.d.ts` and `electron/preload.ts` declares the return type as `Promise<boolean>`.

**Code Evidence:**

```typescript
// template.handlers.ts - Returns Template | undefined
ipcMain.handle(
  IpcChannels.template.delete,
  (_event: IpcMainInvokeEvent, id: number): Template | undefined => {
    try {
      return templatesRepository.deactivate(id);
```

```typescript
// types/electron.d.ts - Declares boolean return
template: {
  delete(id: number): Promise<boolean>;
```

```typescript
// use-templates.ts - Expects boolean
useMutation<boolean, Error, number, DeleteTemplateMutationContext>({
  mutationFn: (id: number) => api!.template.delete(id),
```

**Impact:** Type safety is broken. The mutation will receive a `Template` object but TypeScript expects a `boolean`. This could cause runtime errors or unexpected behavior if code checks `if (result === true)`.

**Recommendation:** Either:

1. Update the handler to return `boolean` (check if template was deactivated)
2. Update all type declarations to return `Template | undefined`

---

### 2. HIGH: Preload API Doesn't Pass Template List Filters

**Location:** `electron/preload.ts:573`

**Description:**
The IPC handler for `template:list` supports filters (`category` and `includeDeactivated`), but the preload API implementation doesn't accept or pass any filter parameters.

**Code Evidence:**

```typescript
// preload.ts - Doesn't pass filters
template: {
  ...
  list: () => ipcRenderer.invoke(IpcChannels.template.list),
```

```typescript
// template.handlers.ts - Supports filters
ipcMain.handle(
  IpcChannels.template.list,
  (_event: IpcMainInvokeEvent, filters?: TemplateListFilters): Array<Template> => {
    return templatesRepository.findAll(filters);
```

**Impact:** All filtering happens client-side unnecessarily. The `useTemplates` hook fetches ALL templates and filters them in JavaScript, defeating the purpose of server-side filtering.

**Recommendation:** Update preload API to accept and pass filters:

```typescript
list: (filters?: { category?: string; includeDeactivated?: boolean }) =>
  ipcRenderer.invoke(IpcChannels.template.list, filters),
```

---

### 3. MEDIUM: Duplicate Template Doesn't Copy Placeholders

**Location:** `app/(app)/templates/page.tsx:429-436` and `components/templates/template-editor-dialog.tsx:119-128`

**Description:**
When duplicating a template, only the core fields (name, category, description, templateText) are copied. The placeholder definitions from the original template are not loaded or transferred to the new template.

**Code Evidence:**

```typescript
// page.tsx - Only copies basic fields
const handleDuplicateClick = (templateToDuplicate: Template) => {
  onDuplicate({
    category: templateToDuplicate.category,
    description: templateToDuplicate.description ?? undefined,
    name: `${templateToDuplicate.name} (Copy)`,
    templateText: templateToDuplicate.templateText,
    // placeholders are NOT copied
  });
};

// template-editor-dialog.tsx - Initializes with empty placeholders
if (initialData) {
  return {
    ...
    placeholders: [],  // Always empty for duplicates
  };
}
```

**Impact:** Users who duplicate a template will lose all placeholder definitions (display names, descriptions, validation patterns, default values, required status). They must manually recreate all placeholder metadata.

**Recommendation:**

1. Fetch placeholders from the original template when duplicating
2. Pass placeholders in the `initialData` object
3. Initialize the placeholder editor with copied data

---

### 4. MEDIUM: Template Picker Ignores Stored Placeholder Metadata

**Location:** `components/workflows/template-picker-dialog.tsx:61-89`

**Description:**
The `TemplatePickerDialog` extracts placeholder names from the template text using regex but doesn't fetch the actual placeholder definitions from the database. This means validation patterns, descriptions, default values, and required status defined in the template editor are completely ignored.

**Code Evidence:**

```typescript
// Parses placeholders from text, ignoring stored definitions
function parsePlaceholdersFromText(templateText: string): Array<ParsedPlaceholder> {
  const placeholderRegex = /\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;
  ...
  placeholders.push({
    defaultValue: "",        // Hardcoded, ignores stored value
    description: "",         // Hardcoded, ignores stored value
    displayName: name.replace(...), // Auto-generated, ignores stored value
    isRequired: true,        // Hardcoded, ignores stored value
    validationPattern: "",   // Hardcoded, ignores stored value
    name,
  });
```

**Impact:**

- Custom validation patterns won't be applied when inserting templates
- Placeholder descriptions won't help users understand what to enter
- Default values won't be pre-filled
- Optional placeholders are incorrectly marked as required

**Recommendation:** Fetch placeholders from the database using `api.template.getPlaceholders(templateId)` and merge with parsed placeholders from text (to catch any new placeholders added to template text but not yet defined in the database).

---

### 5. MEDIUM: ReplaceForTemplate Lacks Transaction Safety

**Location:** `db/repositories/template-placeholders.repository.ts:66-89`

**Description:**
The `replaceForTemplate` method deletes all existing placeholders and then inserts new ones without wrapping the operations in a transaction. If the insert fails, the old placeholders are permanently deleted.

**Code Evidence:**

```typescript
replaceForTemplate(templateId, placeholders) {
  // Delete existing placeholders - ALWAYS SUCCEEDS
  db.delete(templatePlaceholders)
    .where(eq(templatePlaceholders.templateId, templateId))
    .run();

  // Insert new placeholders - COULD FAIL
  if (placeholders.length === 0) return [];

  return db
    .insert(templatePlaceholders)
    .values(dataWithTemplateId)
    .returning()
    .all();
  // If this fails, old placeholders are gone!
}
```

**Impact:** If the insert operation fails (e.g., constraint violation, disk full), all existing placeholder data for that template is lost with no recovery possible.

**Recommendation:** Wrap the delete and insert in a Drizzle transaction:

```typescript
replaceForTemplate(templateId, placeholders) {
  return db.transaction((tx) => {
    tx.delete(templatePlaceholders)
      .where(eq(templatePlaceholders.templateId, templateId))
      .run();

    if (placeholders.length === 0) return [];

    return tx
      .insert(templatePlaceholders)
      .values(dataWithTemplateId)
      .returning()
      .all();
  });
}
```

---

### 6. LOW: PlaceholderEditor Uses Array Index as React Key

**Location:** `components/templates/placeholder-editor.tsx:209`

**Description:**
Placeholder cards use the array index as the React key, which can cause issues when reordering or deleting items.

**Code Evidence:**

```typescript
{placeholders.map((placeholder, index) => {
  ...
  return (
    <Card
      ...
      key={index}  // Uses array index
```

**Impact:** When dragging to reorder or deleting placeholders, React may incorrectly reuse component instances, causing:

- Input values appearing in wrong fields after reorder
- Stale validation errors
- Flickering or animation issues

**Recommendation:** Generate and track a unique ID for each placeholder (e.g., using `crypto.randomUUID()` or an incrementing counter).

---

### 7. LOW: Client-Side Filtering in Multiple Hooks

**Location:** `hooks/queries/use-templates.ts` (multiple hooks)

**Description:**
Several query hooks (`useActiveTemplates`, `useBuiltInTemplates`, `useTemplatesByCategory`, `useTemplates`) fetch all templates and filter client-side instead of utilizing server-side filtering.

**Code Evidence:**

```typescript
// Fetches ALL templates and filters client-side
export function useActiveTemplates() {
  return useQuery({
    queryFn: async () => {
      const templates = await api!.template.list();
      return templates.filter((template) => template.deactivatedAt === null);
    },
  });
}
```

**Impact:**

- Unnecessary data transfer for large template libraries
- Client-side filtering overhead
- Inconsistent caching (all hooks cache same data differently)

**Recommendation:** After fixing Issue #2, update hooks to pass filters to the server:

```typescript
queryFn: () => api!.template.list({ includeDeactivated: false }),
```

---

### 8. LOW: Missing Template Activate IPC Handler

**Location:** `electron/ipc/template.handlers.ts`

**Description:**
The `TemplatesRepository` has an `activate` method, but there's no dedicated IPC handler for it. Activation is done via `template:update` with `deactivatedAt: null`.

**Impact:** Less explicit API. Users must understand that updating `deactivatedAt` to `null` activates a template.

**Recommendation:** Consider adding a dedicated `template:activate` handler for API clarity (optional).

---

### 9. INFO: Bulk Operations Are Sequential

**Location:** `app/(app)/templates/page.tsx:935-975, 980-1022, 1045-1074`

**Description:**
Bulk activate, deactivate, and delete operations use sequential `for...of` loops with `await`. While this is correct and avoids race conditions, it can be slow for many templates.

**Code Evidence:**

```typescript
for (const template of templatesToActivate) {
  try {
    await updateTemplateMutation.mutateAsync({...});
    successCount++;
  } catch {
    failCount++;
  }
}
```

**Impact:** Processing 10 templates takes 10x longer than necessary if operations could be parallelized.

**Recommendation:** Consider using `Promise.allSettled()` for parallel execution with proper error counting (optional performance optimization).

---

## Summary Table

| #   | Severity | Issue                                               | Status     |
| --- | -------- | --------------------------------------------------- | ---------- |
| 1   | CRITICAL | Delete handler returns Template instead of boolean  | Needs Fix  |
| 2   | HIGH     | Preload doesn't pass template list filters          | Needs Fix  |
| 3   | MEDIUM   | Duplicate doesn't copy placeholders                 | Needs Fix  |
| 4   | MEDIUM   | Template picker ignores stored placeholder metadata | Needs Fix  |
| 5   | MEDIUM   | ReplaceForTemplate lacks transaction                | Needs Fix  |
| 6   | LOW      | Array index used as React key                       | Should Fix |
| 7   | LOW      | Client-side filtering in hooks                      | Should Fix |
| 8   | LOW      | Missing activate IPC handler                        | Optional   |
| 9   | INFO     | Sequential bulk operations                          | Optional   |

---

## Positive Observations

The implementation includes many well-designed aspects:

1. **Comprehensive schema design** with soft-delete via `deactivatedAt` and built-in template tracking via `builtInAt`
2. **Proper foreign key relationships** with cascade delete for placeholder cleanup
3. **Optimistic updates** in TanStack Query mutations with rollback on error
4. **Query key factory pattern** for consistent cache invalidation
5. **Accessible UI components** with ARIA labels, keyboard shortcuts, and screen reader support
6. **Bulk operations** with selection management and confirmation dialogs
7. **Toast notifications** for all operations with success/error feedback
8. **URL state persistence** for filters and view mode using nuqs
9. **Comprehensive validation** with Zod schemas and real-time feedback
10. **Idempotent seeding** that safely handles multiple app launches

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Immediate)

1. Fix delete handler return type mismatch (Issue #1)
2. Add filter support to preload API (Issue #2)

### Phase 2: Medium Priority (Next Sprint)

3. Implement placeholder copying for duplicate flow (Issue #3)
4. Fetch stored placeholders in template picker (Issue #4)
5. Wrap replaceForTemplate in transaction (Issue #5)

### Phase 3: Low Priority (Backlog)

6. Switch to unique keys in PlaceholderEditor (Issue #6)
7. Update hooks to use server-side filtering (Issue #7)

---

_Report generated by analyzing 15+ template-related files across schema, repositories, IPC handlers, query hooks, and UI components._
