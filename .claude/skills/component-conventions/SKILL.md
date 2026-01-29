---
name: component-conventions
description: Enforces project component conventions automatically when creating or modifying React components. This skill should be used proactively whenever creating UI primitives or feature components to ensure consistent Base UI integration, CVA patterns, and component structure across the codebase.
---

# Component Conventions Enforcer

## Purpose

This skill enforces the project's component-specific conventions automatically during component development. It ensures consistent Base UI integration, CVA variant patterns, and component architecture for all React components.

## When to Use This Skill

Use this skill proactively in the following scenarios:

- Creating new UI primitive components (`components/ui/`)
- Creating new feature components (`components/features/`)
- Wrapping Base UI primitives with project styling
- Adding CVA variants to components
- Modifying existing component structure

**Important**: This skill should activate automatically without explicit user request whenever component creation/modification work is detected.

## How to Use This Skill

### 1. Load Conventions Reference

Before creating or modifying any component, load the complete conventions document:

```
Read references/Component-Conventions.md
```

This reference contains the authoritative component standards including:

- Base UI integration patterns
- CVA variant setup and structure
- Props interface patterns with VariantProps
- Ref forwarding with ComponentPropsWithRef
- Component export patterns
- File organization for UI vs feature components

### 2. Apply Conventions During Development

When writing component code, ensure strict adherence to all conventions:

**Base UI Integration**:

- Always wrap Base UI primitives from `@base-ui/react`
- Re-export compound components directly: `export const DialogRoot = BaseDialog.Root`
- Custom styling goes through CVA or direct Tailwind classes

**CVA Pattern**:

- Export variants separately: `export const buttonVariants = cva(...)`
- Use `defaultVariants` for sensible defaults
- Alphabetize variant keys and options
- Use template literals for multi-line class strings

**Props Interface**:

- Combine Base UI props with VariantProps: `ComponentPropsWithRef<typeof Base> & VariantProps<typeof variants>`
- Destructure variant props explicitly in component signature
- Always include `className` and `ref` in props

**Component Structure**:

- `'use client'` directive at top
- Type imports first: `import type { ComponentPropsWithRef } from 'react'`
- Base UI import second
- CVA imports third
- Utility imports last

### 3. Automatic Convention Enforcement

After generating or modifying component code, immediately perform automatic validation and correction:

1. **Scan for violations**: Review the generated code against all conventions from the reference document
2. **Identify issues**: Create a mental checklist of any violations found:
   - Missing Base UI wrapper
   - CVA structure issues
   - Props interface not combining types correctly
   - Missing ref forwarding
   - Incorrect import order
   - Missing `cn()` utility usage

3. **Fix automatically**: Apply corrections immediately without asking for permission

4. **Verify completeness**: Ensure all conventions are satisfied before presenting code to user

### 4. Reporting

After automatically fixing violations, provide a brief summary:

```
✓ Component conventions enforced:
  - Wrapped Base UI primitive
  - Created CVA variants with size/variant options
  - Combined props with VariantProps
  - Added ref forwarding
  - Applied cn() for className merging
```

**Do not ask for permission to apply fixes** - the skill's purpose is automatic enforcement.

## Convention Categories

The complete conventions are detailed in `references/Component-Conventions.md`. Key categories include:

1. **Base UI Integration** - Wrapping primitives, re-exporting compounds
2. **CVA Setup** - Variant structure, default variants, alphabetization
3. **Props Interfaces** - Type combination, ref forwarding
4. **File Structure** - Import order, export patterns
5. **Styling Patterns** - cn() usage, CSS variables, Tailwind classes
6. **Component Composition** - Compound components, sub-component patterns

## Important Notes

- **Automatic enforcement**: Apply fixes immediately without requesting permission
- **No compromises**: All conventions must be followed strictly
- **Reference first**: Always load the conventions reference before working with components
- **Base UI required**: Every component must wrap a Base UI primitive
- **Proactive application**: Use this skill automatically when component work is detected

## Workflow Summary

```
1. Detect component work (create/modify component files)
2. Load references/Component-Conventions.md
3. Generate or modify component code following all conventions
4. Scan generated code for any violations
5. Automatically fix all violations found
6. Present corrected code to user with brief summary of fixes applied
```

This workflow ensures every component in the project maintains consistent, high-quality code that follows all established conventions.
