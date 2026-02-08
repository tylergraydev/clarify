# Step 0a: Clarification

**Status**: Skipped
**Ambiguity Score**: 5/5
**Reason**: Request specifies exact file paths for route relocation, precise implementation details for the placeholder page, specific sidebar modification instructions with icon choice, references existing patterns to follow, and clearly defines scope boundaries.

## Original Request

Move the existing workflow detail page at `app/(app)/workflows/[id]/page.tsx` and its `route-type.ts` to a new legacy route at `app/(app)/workflows/old/[id]/page.tsx`. Create a new minimal placeholder page at `app/(app)/workflows/[id]/page.tsx`. Add a "Legacy" nav item to the sidebar. Do not modify any existing components or workflow list pages.
