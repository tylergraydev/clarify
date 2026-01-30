# Agents Feature Audit Report

**Generated:** January 29, 2026
**Scope:** Full examination of the Agents feature implementation
**Status:** Issues identified requiring attention

---

## Executive Summary

The Agents feature is substantially implemented with a complete stack from database schema through IPC handlers to React UI. However, there are several issues ranging from critical bugs to design concerns that should be addressed before production use.

**Critical Issues:** 2
**High Priority Issues:** 5
**Medium Priority Issues:** 5
**Low Priority Issues:** 3

---

## File Inventory

The Agents feature spans the following files:

| Layer | Files |
|-------|-------|
| Database Schema | `db/schema/agents.schema.ts`, `agent-tools.schema.ts`, `agent-skills.schema.ts` |
| Repositories | `db/repositories/agents.repository.ts`, `agent-tools.repository.ts`, `agent-skills.repository.ts` |
| Seed Data | `db/seed/agents.seed.ts` |
| IPC Handlers | `electron/ipc/agent.handlers.ts`, `agent-tool.handlers.ts`, `agent-skill.handlers.ts` |
| IPC Registration | `electron/ipc/index.ts`, `electron/ipc/channels.ts` |
| Preload | `electron/preload.ts` |
| Type Definitions | `types/electron.d.ts` |
| Query Keys | `lib/queries/agents.ts`, `agent-tools.ts`, `agent-skills.ts` |
| React Hooks | `hooks/queries/use-agents.ts`, `use-agent-tools.ts`, `use-agent-skills.ts` |
| UI Components | `components/agents/agent-card.tsx`, `agent-editor-dialog.tsx`, `agent-tools-manager.tsx`, `agent-skills-manager.tsx`, `agent-color-picker.tsx` |
| Page | `app/(app)/agents/page.tsx` |
| Validation | `lib/validations/agent.ts` |

---

## Critical Issues

### 1. Preload API Doesn't Pass Agent List Filters

**Location:** `electron/preload.ts:444`

**Problem:** The `agent.list()` method in the preload API doesn't accept or pass filters to the IPC handler:

```typescript
// Current implementation (BROKEN)
list: () => ipcRenderer.invoke(IpcChannels.agent.list),
```

The IPC handler in `agent.handlers.ts:36-48` is designed to accept filters:

```typescript
ipcMain.handle(
  IpcChannels.agent.list,
  async (_event, filters?: AgentListFilters) => {
    return agentsRepository.findAll(filters);
  }
);
```

**Impact:** All server-side filtering is bypassed. The React hooks in `use-agents.ts` compensate with client-side filtering, which works but:
- Fetches all agents on every query (inefficient)
- Defeats the purpose of having server-side filtering
- Could cause performance issues with large agent counts

**Fix Required:**
1. Update `types/electron.d.ts` to add filters parameter to `list()`
2. Update `electron/preload.ts` to pass filters through
3. Consider removing redundant client-side filtering in hooks

---

## High Priority Issues

### 2. Missing Agent Creation Capability

**Location:** Full stack (preload, handlers, repository)

**Problem:** There is no `agent.create()` method exposed in the API. The design document mentions "project-specific overrides" and agent customization, but users cannot create new custom agents from scratch.

**Current Behavior:** Only built-in agents can be modified via `update()`.

**Impact:** Limits the flexibility described in the design document. Users cannot create new specialized agents.

**Recommendation:** Either:
- Implement `agent.create()` if custom agents are intended
- Document that only built-in agents can be modified

---

### 3. Reset Logic Creates Orphaned Agents

**Location:** `electron/ipc/agent.handlers.ts:86-114`

**Problem:** When resetting a custom agent:
```typescript
if (agent.parentAgentId !== null) {
  await agentsRepository.deactivate(id);  // Deactivates but doesn't delete
  return agentsRepository.activate(agent.parentAgentId);
}
```

The custom agent is deactivated but remains in the database. Over time, this could lead to many orphaned deactivated custom agents.

**Impact:** Database bloat, potential confusion in admin/debug scenarios.

**Recommendation:** Either:
- Delete the custom agent instead of deactivating
- Add a cleanup mechanism for orphaned agents
- Document this as intended behavior

---

### 4. No Agent Deletion Exposed via IPC

**Location:** Missing from `electron/ipc/agent.handlers.ts` and `electron/preload.ts`

**Problem:** The repository has a `delete()` method but it's not exposed via IPC. Agents can never be truly deleted through the application - only deactivated.

**Impact:** No way to permanently remove agents. This may be intentional for audit purposes but should be documented.

---

### 5. Agent Version Field Never Incremented

**Location:** `db/repositories/agents.repository.ts:129-140`

**Problem:** The `update()` method doesn't increment the `version` field:
```typescript
async update(id, data) {
  const result = await db
    .update(agents)
    .set({ ...data, updatedAt: now })  // version not incremented
    .where(eq(agents.id, id))
    .returning();
}
```

**Impact:** Version tracking feature is non-functional. Could cause issues with optimistic concurrency or version-based features.

**Fix Required:** Increment version on update:
```typescript
.set({ ...data, updatedAt: now, version: sql`${agents.version} + 1` })
```

---

### 6. Missing Error Display in UI

**Locations:**
- `components/agents/agent-tools-manager.tsx:51-53, 59-61, 72-74`
- `components/agents/agent-skills-manager.tsx:46-48, 54-56, 67-69`

**Problem:** Error catches are empty:
```typescript
} catch {
  // Error handled by mutation
}
```

But the mutations don't display errors to users. There's no toast or error message shown.

**Impact:** Users have no feedback when operations fail silently.

**Fix Required:** Add toast notifications for mutation errors.

---

## Medium Priority Issues

### 7. Client-Side vs Server-Side Filtering Mismatch

**Location:** `hooks/queries/use-agents.ts`

**Problem:** All query hooks perform client-side filtering despite the server supporting filtering:
```typescript
queryFn: async () => {
  const agents = await api!.agent.list();
  // Apply client-side filtering since API returns all agents
  return agents.filter((agent) => { ... });
}
```

**Impact:** Performance inefficiency - always fetches all agents.

**Recommendation:** Once Issue #1 is fixed, update hooks to use server-side filtering.

---

### 8. Form Reset Dependency Array Issue

**Location:** `components/agents/agent-editor-dialog.tsx:102-109`

```typescript
useEffect(() => {
  form.reset({ ... });
  updateSelectedColor((agent.color as AgentColor) ?? null);
}, [agent, form]);  // 'form' in deps could cause issues
```

**Problem:** Including `form` in the dependency array could cause unexpected resets if the form object reference changes.

**Impact:** Potential loss of form state during edits.

**Recommendation:** Remove `form` from dependencies or use a ref-based pattern.

---

### 9. Unused Query Key Definitions

**Location:** `lib/queries/agent-tools.ts:5`, `lib/queries/agent-skills.ts:5`

```typescript
export const agentToolKeys = createQueryKeys("agentTools", {
  byAgent: (agentId: number) => [agentId],
  detail: (id: number) => [id],  // Never used
});
```

**Impact:** Dead code / incomplete implementation.

**Recommendation:** Either implement detail queries or remove unused key definitions.

---

### 10. No Database-Level Type Validation

**Location:** `db/schema/agents.schema.ts:34`

```typescript
type: text("type").notNull(),
```

**Problem:** While `agentTypes` is exported as a const array, the database accepts any string for `type`. Invalid types could be inserted.

**Impact:** Data integrity risk.

**Recommendation:** Add a CHECK constraint or validate in the repository layer.

---

### 11. Silent Color Fallback

**Location:** `components/agents/agent-card.tsx:43-54`

```typescript
const getColorClasses = (color: AgentColor): string => {
  const colorClassMap: Record<string, string> = { ... };
  return colorClassMap[color ?? ""] ?? "bg-blue-500";  // Silent fallback
};
```

**Problem:** Invalid colors silently fall back to blue, masking data integrity issues.

**Recommendation:** Log a warning when falling back to help identify data issues.

---

## Low Priority Issues

### 12. Missing Input Validation for Tools/Skills

**Location:** `components/agents/agent-tools-manager.tsx`, `agent-skills-manager.tsx`

**Problem:** No validation that tool/skill names are valid. Users could enter empty strings or invalid characters.

**Impact:** Potential data quality issues.

**Recommendation:** Add Zod validation schemas for tool and skill creation.

---

### 13. Tools/Skills Orphaned on Deactivation

**Location:** Schema design

**Problem:** When an agent is deactivated, its tools and skills remain. They're only deleted if the agent row is deleted (via `onDelete: cascade`).

**Impact:** Minor - these records are harmless but contribute to database size.

**Status:** This is likely acceptable behavior.

---

### 14. Missing Built-in Agent Protection

**Location:** UI layer

**Problem:** No warnings or restrictions when modifying built-in agents with invalid configurations.

**Recommendation:** Add validation or warnings for built-in agents.

---

## What's Working Correctly

1. **Schema Design:** Well-structured with proper relationships, indexes, and cascade deletes
2. **Repository Pattern:** Clean separation of database access logic
3. **IPC Registration:** Properly organized and type-safe
4. **UI Components:** Well-structured with loading states and empty states
5. **Query Invalidation:** Correct cache invalidation patterns in mutations
6. **Seed Data:** Comprehensive built-in agents with proper tools
7. **Form Integration:** TanStack Form properly integrated with validation
8. **Accessibility:** Components use proper aria labels and keyboard navigation
9. **CVA Patterns:** Consistent variant-based styling

---

## Recommendations Summary

### Immediate Actions (Critical)
1. Fix preload API to pass agent list filters

### Short-term Actions (High Priority)
3. Add error display (toasts) for failed mutations
4. Implement version incrementing on agent updates
5. Decide on agent creation/deletion strategy and implement

### Medium-term Actions
6. Migrate to server-side filtering once preload is fixed
7. Fix form reset dependency issue
8. Clean up unused query keys
9. Add database-level type validation

### Documentation Needed
- Clarify intentional design decisions (no agent creation, soft deletes only)
- Document the agent customization workflow
- Add JSDoc comments to repository methods

---

## Conclusion

The Agents feature has a solid foundation with proper layering and patterns. The critical issues (filters not passed) should be fixed immediately. The high-priority issues around error handling and data integrity should follow. Most issues are straightforward fixes that don't require architectural changes.

The feature is **functional but incomplete** for production use. After addressing the critical and high-priority issues, it will be production-ready.
