---
name: tanstack-form-conventions
description: Enforces project TanStack Form conventions automatically when creating or modifying forms. This skill should be used proactively whenever working with form implementations to ensure consistent patterns, validation, and component usage across the codebase.
---

# TanStack Form Conventions Enforcer

## Purpose

This skill enforces the project TanStack Form conventions automatically during form development. It ensures consistent form structure, proper use of pre-built field components, validation patterns, and adherence to project-specific standards for all form implementations.

**Important**: This skill is for implementing forms using the existing form system. It is NOT for creating new base form components - there is a separate skill for that purpose.

## When to Use This Skill

Use this skill proactively in the following scenarios:

- Creating new forms in the application
- Modifying existing form implementations
- Adding validation to forms
- Working with form submission logic
- Implementing forms in dialogs or pages
- Any task involving `useAppForm` or form field components

**Important**: This skill should activate automatically without explicit user request whenever form implementation work is detected.

## How to Use This Skill

### 1. Load Conventions Reference

Before creating or modifying any form, load the complete conventions document:

```
Read references/TanStack-Form-Conventions.md
```

This reference contains the authoritative standards including:

- Form hook setup with `useAppForm`
- Available field components and their props
- Validation schema patterns with Zod
- Form structure and submission patterns
- Error display patterns
- Focus management integration

### 2. Apply Conventions During Development

When writing form code, ensure strict adherence to all conventions:

**Form Setup**:

- Always use `useAppForm` from `@/lib/forms`
- Define `defaultValues` matching the validation schema
- Use `validators.onSubmit` with a Zod schema
- Handle submission via `onSubmit` callback prop

**Field Components**:

- Use pre-built field components: `TextField`, `TextareaField`, `SelectField`, `CheckboxField`, `SwitchField`, `NumberField`
- Access fields via `form.AppField` with render function pattern
- Pass `label` prop to all field components (required)
- Use `description` for helper text, `placeholder` for input hints

**Validation**:

- Define Zod schemas in `lib/validations/{entity}.ts`
- Export both schema and inferred type
- Use descriptive error messages in schema

**Form Structure**:

- Wrap form content in native `<form>` element
- Prevent default and stop propagation on submit
- Use `form.AppForm` wrapper for `SubmitButton`
- Place action buttons in a flex container with proper spacing

### 3. Automatic Convention Enforcement

After generating or modifying form code, immediately perform automatic validation and correction:

1. **Scan for violations**: Review the generated code against all conventions from the reference document
2. **Identify issues**: Create a mental checklist of any violations found:
   - useAppForm hook usage
   - Field component selection
   - Validation schema structure
   - Form submission handling
   - Error display patterns
   - Component prop patterns

3. **Fix automatically**: Apply corrections immediately without asking for permission:
   - Import from correct locations (`@/lib/forms`)
   - Use correct field component for data type
   - Add missing validation schemas
   - Fix form submission patterns
   - Correct prop usage on field components

4. **Verify completeness**: Ensure all conventions are satisfied before presenting code to user

### 4. Reporting

After automatically fixing violations, provide a brief summary:

```
TanStack Form conventions enforced:
  - Used useAppForm hook from @/lib/forms
  - Applied TextField for name input with label prop
  - Created validation schema in lib/validations/
  - Fixed form submission with preventDefault
  - Wrapped SubmitButton in form.AppForm
```

**Do not ask for permission to apply fixes** - the skill's purpose is automatic enforcement.

## Convention Categories

The complete conventions are detailed in `references/TanStack-Form-Conventions.md`. Key categories include:

1. **Form Hook Setup** - useAppForm configuration, default values, validators
2. **Available Field Components** - TextField, TextareaField, SelectField, CheckboxField, SwitchField, NumberField
3. **Field Component Props** - Required and optional props for each component type
4. **Validation Patterns** - Zod schema structure, error messages, file organization
5. **Form Structure** - Native form element, submission handling, button placement
6. **Submit Button** - SubmitButton component, form.AppForm wrapper
7. **Error Display** - FormError component for form-level errors
8. **Form Props Interface** - Standard callback props pattern

## Important Notes

- **Automatic enforcement**: Apply fixes immediately without requesting permission
- **No compromises**: All conventions must be followed strictly
- **Reference first**: Always load the conventions reference before working with form code
- **Complete validation**: Check all aspects of the conventions, not just obvious violations
- **Proactive application**: Use this skill automatically when form work is detected, even if user doesn't mention conventions
- **Component reuse**: Always use existing field components - never create custom field implementations unless extending the form system itself

## Workflow Summary

```
1. Detect form implementation work (create/modify forms)
2. Load references/TanStack-Form-Conventions.md
3. Generate or modify form code following all conventions
4. Scan generated code for any violations
5. Automatically fix all violations found
6. Present corrected code to user with brief summary of fixes applied
```

This workflow ensures every form implementation in the project maintains consistent, high-quality patterns that follow all established conventions.
