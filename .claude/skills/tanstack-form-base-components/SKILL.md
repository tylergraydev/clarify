---
name: tanstack-form-base-components
description: Enforces project conventions when creating new base form components for the TanStack Form integration. This skill should be used proactively whenever creating new field components, form components, or modifying the form system in components/ui/form/.
---

# TanStack Form Base Component Conventions

## Purpose

This skill enforces the project conventions specifically for creating **new base form components** in `components/ui/form/`. It ensures consistent patterns for field components, form components, accessibility, styling, and integration with the form hook system.

**Important**: This skill is for creating reusable form primitives, NOT for implementing forms in features. The `tanstack-form-conventions` skill handles form implementation.

## When to Use This Skill

Use this skill proactively in the following scenarios:

- Creating new field components (e.g., DateField, SliderField, RadioGroupField)
- Creating new form-level components (e.g., FormSection, FormActions)
- Modifying existing base form components in `components/ui/form/`
- Adding new field types to the form hook registration
- Extending the focus management system for new input types

**Important**: This skill should activate automatically without explicit user request whenever base form component work is detected.

## How to Use This Skill

### 1. Load Conventions Reference

Before creating or modifying any base form component, load the complete conventions document:

```
Read references/TanStack-Form-Base-Component-Conventions.md
```

This reference contains the authoritative standards including:

- Component categories (field vs form components)
- Field component architecture patterns
- Form component architecture patterns
- CVA styling integration
- Accessibility requirements
- Form hook registration process
- Export conventions

### 2. Apply Conventions During Development

When writing base form components, ensure strict adherence to all conventions:

**Component Categories**:

- **Field Components**: Input-level components that bind to form field state (TextField, CheckboxField, etc.)
- **Form Components**: Form-level components that access form state (SubmitButton, FormError)

**Field Component Requirements**:

- Use `useFieldContext<T>()` with appropriate generic type
- Generate unique IDs with `useId()` hook
- Include accessibility attributes (`aria-describedby`, `aria-invalid`)
- Handle errors from `field.state.meta.errors[0]`
- Bind `handleBlur` and `handleChange` to input events
- Use CVA for styling variants with size support
- Use `FieldWrapper` for standard layouts or custom wrapper for special layouts

**Form Component Requirements**:

- Use `useFormContext()` hook for form state access
- Use `form.Subscribe` for reactive state subscriptions
- Handle submission states (`isSubmitting`, `canSubmit`)

**Registration Requirements**:

- Export component and variants from `components/ui/form/index.ts`
- Register field components in `lib/forms/form-hook.ts` under `fieldComponents`
- Register form components in `lib/forms/form-hook.ts` under `formComponents`

### 3. Automatic Convention Enforcement

After generating or modifying form component code, immediately perform automatic validation and correction:

1. **Scan for violations**: Review the generated code against all conventions from the reference document
2. **Identify issues**: Create a mental checklist of any violations found:
   - Missing `useFieldContext` or `useFormContext` hooks
   - Missing ID generation with `useId()`
   - Missing accessibility attributes
   - Incorrect error handling pattern
   - Missing CVA variant definitions
   - Missing exports in index.ts
   - Missing registration in form-hook.ts

3. **Fix automatically**: Apply corrections immediately without asking for permission:
   - Add required hooks
   - Implement accessibility patterns
   - Create CVA variants with size support
   - Add proper exports
   - Register components in form-hook.ts

4. **Verify completeness**: Ensure all conventions are satisfied before presenting code to user

### 4. Reporting

After automatically fixing violations, provide a brief summary:

```
TanStack Form base component conventions enforced:
  - Added useFieldContext<boolean>() hook
  - Created CVA variants with sm/default/lg sizes
  - Added aria-describedby and aria-invalid attributes
  - Exported component from index.ts
  - Registered in fieldComponents in form-hook.ts
```

**Do not ask for permission to apply fixes** - the skill's purpose is automatic enforcement.

## Convention Categories

The complete conventions are detailed in `references/TanStack-Form-Base-Component-Conventions.md`. Key categories include:

1. **Component Categories** - Field vs Form components
2. **Field Component Architecture** - Hooks, accessibility, error handling
3. **Form Component Architecture** - Context access, subscriptions
4. **CVA Styling** - Variant patterns, size support
5. **Base UI Integration** - Using @base-ui/react primitives
6. **Accessibility** - ARIA attributes, semantic markup
7. **Registration** - Form hook integration, exports
8. **File Organization** - Directory structure, naming

## Important Notes

- **Automatic enforcement**: Apply fixes immediately without requesting permission
- **No compromises**: All conventions must be followed strictly
- **Reference first**: Always load the conventions reference before working with form components
- **Complete validation**: Check all aspects of the conventions, not just obvious violations
- **Proactive application**: Use this skill automatically when base form component work is detected, even if user doesn't mention conventions

## Workflow Summary

```
1. Detect base form component work (create/modify components/ui/form/*)
2. Load references/TanStack-Form-Base-Component-Conventions.md
3. Generate or modify component code following all conventions
4. Scan generated code for any violations
5. Automatically fix all violations found
6. Present corrected code to user with brief summary of fixes applied
```

This workflow ensures every base form component in the project maintains consistent, high-quality patterns that follow all established conventions.
