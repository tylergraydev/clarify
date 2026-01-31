---
name: nextjs-routing-conventions
description: Enforces project Next.js App Router conventions automatically when creating or modifying pages, layouts, and route types. This skill should be used proactively whenever working with App Router pages to ensure consistent route validation, page structure, and loading patterns across the codebase.
---

# Next.js Routing Conventions Enforcer

## Purpose

This skill enforces the project's Next.js App Router conventions automatically during page development. It ensures consistent route type validation, page component structure, and loading state patterns.

## When to Use This Skill

Use this skill proactively in the following scenarios:

- Creating new pages in `app/` directory
- Adding URL parameters (search or route params) to pages
- Creating or modifying `route-type.ts` files
- Adding loading states or skeletons
- Creating layouts for route groups

**Important**: This skill should activate automatically without explicit user request whenever App Router page work is detected.

## How to Use This Skill

### 1. Load Conventions Reference

Before creating or modifying any page, load the complete conventions document:

```
Read references/NextJS-Routing-Conventions.md
```

This reference contains the authoritative routing standards including:

- Route type file requirements
- Zod validation patterns
- Page component structure
- withParamValidation HOC usage
- Loading state patterns
- Error handling patterns

### 2. Apply Conventions During Development

When writing page code, ensure strict adherence to all conventions:

**Route Type Requirements**:

- ALL pages with URL parameters MUST have `route-type.ts`
- Use numeric validation with coercion for IDs: `z.coerce.number().int().positive()`
- Use `satisfies DynamicRoute` for type safety

**Page Structure**:

- Add `'use client'` directive (Electron IPC requires client-side)
- Use `withParamValidation` HOC for ALL pages with params
- Follow section organization: Helpers → Skeletons → Page Content → Export

**Loading States**:

- Colocate skeletons in `_components/` directory
- Match skeleton structure to actual content

### 3. Automatic Convention Enforcement

After generating or modifying page code, immediately perform automatic validation and correction:

1. **Scan for violations**: Review the generated code against all conventions from the reference document
2. **Identify issues**: Create a mental checklist of any violations found:
   - Missing route-type.ts for page with params
   - String ID validation instead of numeric
   - Missing withParamValidation HOC
   - Skeleton not colocated in _components/
   - Missing 'use client' directive

3. **Fix automatically**: Apply corrections immediately without asking for permission

4. **Verify completeness**: Ensure all conventions are satisfied before presenting code to user

### 4. Reporting

After automatically fixing violations, provide a brief summary:

```
✓ Routing conventions enforced:
  - Created route-type.ts with Zod schema
  - Used numeric ID validation with coercion
  - Wrapped page with withParamValidation HOC
  - Added skeleton component in _components/
```

**Do not ask for permission to apply fixes** - the skill's purpose is automatic enforcement.

## Convention Categories

The complete conventions are detailed in `references/NextJS-Routing-Conventions.md`. Key categories include:

1. **Route Type Files** - Zod schemas, DynamicRoute type
2. **Page Component Structure** - Sections, HOC usage
3. **URL State Management** - nuqs integration patterns
4. **Loading States** - Skeleton patterns, colocated components
5. **Error Handling** - Route param errors, data errors
6. **Navigation** - Type-safe links with $path

## Important Notes

- **Automatic enforcement**: Apply fixes immediately without requesting permission
- **No compromises**: All conventions must be followed strictly
- **Reference first**: Always load the conventions reference before working with pages
- **Client-side default**: All pages use 'use client' due to Electron IPC
- **Proactive application**: Use this skill automatically when page work is detected

## Workflow Summary

```
1. Detect page work (create/modify page files, route-type files)
2. Load references/NextJS-Routing-Conventions.md
3. Generate or modify page code following all conventions
4. Scan generated code for any violations
5. Automatically fix all violations found
6. Present corrected code to user with brief summary of fixes applied
```

This workflow ensures every page in the project maintains consistent, high-quality code that follows all established conventions.
