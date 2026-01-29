# TanStack Form Base Component Conventions

A comprehensive guide for creating consistent, accessible, and maintainable base form components for the TanStack Form integration.

---

## Tech Stack

- **TanStack Form**: `@tanstack/react-form` with custom form hook integration
- **Base UI**: `@base-ui/react` for unstyled accessible primitives
- **CVA**: `class-variance-authority` for variant-based styling
- **Lucide React**: `lucide-react` for icons

---

## File Organization

### Directory Structure

```
components/
  ui/
    form/
      text-field.tsx           # Text input field component
      textarea-field.tsx       # Textarea field component
      select-field.tsx         # Select dropdown field component
      checkbox-field.tsx       # Checkbox field component
      switch-field.tsx         # Toggle switch field component
      number-field.tsx         # Number input field component
      submit-button.tsx        # Form submit button component
      form-error.tsx           # Form-level error display component
      field-wrapper.tsx        # Shared field wrapper with label/description/error
      focus-management/        # Focus management utilities
        focus-context.tsx      # Focus provider and context
        use-focus-management.ts # Focus management hook
        with-focus-management.tsx # HOC for focus management
      index.ts                 # Barrel exports

lib/
  forms/
    form-hook.ts               # useAppForm hook and field/form component registration
    index.ts                   # Barrel exports
```

### File Naming

- Component files: `{component-name}.tsx` (kebab-case)
- One component per file
- Export both component and CVA variants

---

## Component Categories

### Field Components

Field components are input-level components that bind to form field state. They:

- Access field state via `useFieldContext<T>()`
- Handle value changes and blur events
- Display validation errors
- Are registered in `fieldComponents` in form-hook.ts

**Examples**: TextField, TextareaField, SelectField, CheckboxField, SwitchField, NumberField

### Form Components

Form components are form-level components that access overall form state. They:

- Access form state via `useFormContext()`
- Subscribe to form state changes via `form.Subscribe`
- Handle form-level concerns (submission, errors)
- Are registered in `formComponents` in form-hook.ts

**Examples**: SubmitButton, FormError

---

## Field Component Architecture

### Required Imports

```typescript
'use client';

import type { ComponentProps } from 'react'; // If needed for icon wrappers

import { SomeBaseUIComponent } from '@base-ui/react/component';
import { cva, type VariantProps } from 'class-variance-authority';
import { SomeIcon } from 'lucide-react';
import { useId } from 'react';

import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { FieldWrapper, getAriaDescribedBy } from './field-wrapper';
// OR for custom layouts:
import { descriptionVariants, errorVariants, getAriaDescribedBy, labelVariants } from './field-wrapper';
```

### CVA Variant Definition

Every field component must define CVA variants with size support:

```typescript
export const myFieldVariants = cva(
  `
    base-styles-here
    focus:ring-2 focus:ring-accent focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
        sm: 'h-8 px-2 text-xs',
      },
    },
  }
);
```

### Size Variant Rules

All field components must support three size variants:

| Size      | Typical Height | Text Size   | Padding |
| --------- | -------------- | ----------- | ------- |
| `sm`      | `h-8`          | `text-xs`   | `px-2`  |
| `default` | `h-9`          | `text-sm`   | `px-3`  |
| `lg`      | `h-10`         | `text-base` | `px-4`  |

### Props Type Definition

```typescript
type MyFieldProps = ClassName &
  VariantProps<typeof myFieldVariants> & {
    description?: string;
    disabled?: boolean;
    label: string;
    // Component-specific props...
  };
```

### Standard Field Component Template

```typescript
export function MyField({
  className,
  description,
  disabled,
  label,
  size,
  // ...other props
}: MyFieldProps) {
  // 1. Access field context with appropriate generic type
  const field = useFieldContext<string>(); // or boolean, number, etc.

  // 2. Generate unique ID
  const id = useId();

  // 3. Create accessibility IDs
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  // 4. Extract error state
  const error = field.state.meta.errors[0];
  const hasError = Boolean(error);

  return (
    <FieldWrapper
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      label={label}
      labelFor={id}
      size={size}
    >
      <SomeInput
        aria-describedby={getAriaDescribedBy(
          descriptionId,
          errorId,
          Boolean(description),
          hasError
        )}
        aria-invalid={hasError || undefined}
        className={cn(myFieldVariants({ size }), className)}
        disabled={disabled}
        id={id}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        value={field.state.value ?? ""}
      />
    </FieldWrapper>
  );
}
```

### Field Context Generic Types

Match the generic type to the field value type:

```typescript
// String fields (text, textarea, select)
const field = useFieldContext<string>();

// Boolean fields (checkbox, switch)
const field = useFieldContext<boolean>();

// Number fields
const field = useFieldContext<number | null>();
```

### Error Handling Pattern

```typescript
// Extract first error from errors array
const error = field.state.meta.errors[0];
const hasError = Boolean(error);
```

### Event Binding Patterns

**Text inputs**:

```typescript
onBlur={field.handleBlur}
onChange={(e) => field.handleChange(e.target.value)}
value={field.state.value ?? ""}
```

**Boolean inputs (checkbox, switch)**:

```typescript
checked={field.state.value ?? false}
onCheckedChange={(checked) => field.handleChange(checked)}
```

**Number inputs**:

```typescript
onBlur={field.handleBlur}
onValueChange={(value) => field.handleChange(value)}
value={field.state.value}
```

**Select inputs**:

```typescript
onOpenChange={(open) => {
  if (!open) {
    field.handleBlur();
  }
}}
onValueChange={(value) => field.handleChange(value ?? "")}
value={field.state.value}
```

---

## Custom Layout Field Components

Some field components (checkbox, switch) use custom layouts instead of FieldWrapper:

```typescript
export function CheckboxField({
  className,
  description,
  disabled,
  label,
  size,
}: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();
  const id = useId();

  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const error = field.state.meta.errors[0];
  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Label wraps the input for click area */}
      <label className={"flex items-center gap-2"}>
        <Checkbox.Root
          aria-describedby={getAriaDescribedBy(
            descriptionId,
            errorId,
            Boolean(description),
            hasError
          )}
          aria-invalid={hasError || undefined}
          checked={field.state.value ?? false}
          className={checkboxVariants({ size })}
          disabled={disabled}
          id={id}
          name={field.name}
          onCheckedChange={(checked) => field.handleChange(checked)}
        >
          <Checkbox.Indicator>
            <CheckIcon aria-hidden={"true"} size={size} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span className={labelVariants({ size })}>{label}</span>
      </label>

      {/* Description with left padding to align with label */}
      {description && !error && (
        <p
          className={cn(descriptionVariants({ size }), "pl-6")}
          id={descriptionId}
        >
          {description}
        </p>
      )}

      {/* Error with left padding to align with label */}
      {error && (
        <p
          aria-live={"polite"}
          className={cn(errorVariants({ size }), "pl-6")}
          id={errorId}
          role={"alert"}
        >
          {error}
        </p>
      )}
    </div>
  );
}
```

### Padding for Inline Labels

When label is inline with input (checkbox, switch), add left padding to description/error:

| Component | Padding Class |
| --------- | ------------- |
| Checkbox  | `pl-6`        |
| Switch    | `pl-11`       |

---

## Form Component Architecture

### SubmitButton Pattern

```typescript
"use client";

import { type VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import { useFormContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

type SubmitButtonProps = ClassName &
  RequiredChildren &
  VariantProps<typeof buttonVariants>;

export function SubmitButton({
  children,
  className,
  size,
  variant,
}: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
      {([isSubmitting, canSubmit]) => (
        <Button
          aria-busy={isSubmitting || undefined}
          aria-disabled={!canSubmit || isSubmitting || undefined}
          className={cn(className)}
          disabled={!canSubmit || isSubmitting}
          size={size}
          type={"submit"}
          variant={variant}
        >
          {isSubmitting ? "Submitting..." : children}
        </Button>
      )}
    </form.Subscribe>
  );
}
```

### FormError Pattern

```typescript
"use client";

import { AlertCircle } from "lucide-react";

import { useFormContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

type FormErrorProps = ClassName;

export function FormError({ className }: FormErrorProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        if (errors.length === 0) {
          return null;
        }

        return (
          <div
            aria-live={"assertive"}
            className={cn(
              `
                flex items-start gap-2 rounded-md border border-destructive/50
                bg-destructive/10 p-3 text-sm text-destructive
              `,
              className
            )}
            role={"alert"}
          >
            <AlertCircle
              aria-hidden={"true"}
              className={`mt-0.5 size-4 shrink-0`}
            />
            <div className={"flex flex-col gap-1"}>
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          </div>
        );
      }}
    </form.Subscribe>
  );
}
```

### form.Subscribe Pattern

Use `form.Subscribe` for reactive access to form state:

```typescript
<form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
  {([isSubmitting, canSubmit]) => (
    // Render based on state
  )}
</form.Subscribe>

<form.Subscribe selector={(state) => state.errors}>
  {(errors) => (
    // Render based on errors
  )}
</form.Subscribe>
```

---

## Accessibility Requirements

### Required ARIA Attributes

**For all field inputs**:

```typescript
aria-describedby={getAriaDescribedBy(descriptionId, errorId, Boolean(description), hasError)}
aria-invalid={hasError || undefined}
```

**For error messages**:

```typescript
<p
  aria-live={"polite"}
  id={errorId}
  role={"alert"}
>
  {error}
</p>
```

**For form-level errors**:

```typescript
<div
  aria-live={"assertive"}
  role={"alert"}
>
```

**For icons**:

```typescript
<SomeIcon aria-hidden={"true"} />
```

**For submit buttons during submission**:

```typescript
aria-busy={isSubmitting || undefined}
aria-disabled={!canSubmit || isSubmitting || undefined}
```

### getAriaDescribedBy Helper

Use the helper function to properly construct aria-describedby:

```typescript
import { getAriaDescribedBy } from "./field-wrapper";

aria-describedby={getAriaDescribedBy(
  descriptionId,
  errorId,
  Boolean(description),
  hasError
)}
```

This function returns:

- `errorId` when there's an error
- `descriptionId` when there's a description but no error
- `undefined` when neither exists

---

## Base UI Integration

### When to Use Base UI

Use Base UI primitives when:

- Building complex interactive components (select, checkbox, switch, number field)
- Need accessible keyboard navigation out of the box
- Need compound components with proper state management

### Base UI Component Imports

```typescript
// Checkbox
import { Checkbox } from '@base-ui/react/checkbox';
// <Checkbox.Root>, <Checkbox.Indicator>

// Switch
import { Switch } from '@base-ui/react/switch';
// <Switch.Root>, <Switch.Thumb>

// Select
import { Select } from '@base-ui/react/select';
// <Select.Root>, <Select.Trigger>, <Select.Value>, <Select.Icon>
// <Select.Portal>, <Select.Positioner>, <Select.Popup>
// <Select.Item>, <Select.ItemIndicator>, <Select.ItemText>

// NumberField
import { NumberField } from '@base-ui/react/number-field';
// <NumberField.Root>, <NumberField.Group>
// <NumberField.Decrement>, <NumberField.Input>, <NumberField.Increment>

// Input (for simple text inputs)
import { Input } from '@base-ui/react/input';
```

### Base UI Data Attributes

Base UI components use data attributes for styling states:

```typescript
// Checked/unchecked states
data-checked:border-accent
data-unchecked:border-border

// Disabled state
data-disabled:cursor-not-allowed data-disabled:opacity-50

// Invalid state (set via aria-invalid)
data-invalid:border-destructive

// Popup open state
data-popup-open:ring-2 data-popup-open:ring-accent

// Highlighted state (for select items)
data-highlighted:bg-muted

// Animation states
data-starting-style:opacity-0
data-ending-style:opacity-0
```

---

## Registration in Form Hook

### Field Component Registration

Add field components to `fieldComponents` in `lib/forms/form-hook.ts`:

```typescript
import { MyField } from '@/components/ui/form/my-field';

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    CheckboxField,
    MyField, // Add new field component here
    NumberField: NumberFieldComponent,
    SelectField,
    SwitchField,
    TextareaField,
    TextField,
  },
  fieldContext,
  formComponents: {
    FormError,
    SubmitButton,
  },
  formContext,
});
```

### Form Component Registration

Add form components to `formComponents` in `lib/forms/form-hook.ts`:

```typescript
export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    // ...
  },
  fieldContext,
  formComponents: {
    FormError,
    MyFormComponent, // Add new form component here
    SubmitButton,
  },
  formContext,
});
```

### Important: Alphabetical Order

Keep components alphabetically sorted in both `fieldComponents` and `formComponents` objects.

---

## Barrel Exports

### Export from index.ts

Export all new components and their variants from `components/ui/form/index.ts`:

```typescript
// Export component and variants
export { MyField, myFieldVariants } from './my-field';

// For components with multiple variants
export { MyField, myFieldIndicatorVariants, myFieldVariants } from './my-field';
```

### Export Order

Maintain alphabetical order for exports in index.ts.

---

## Icon Wrapper Pattern

When icons need size variants, create a wrapper function:

```typescript
function CheckIcon(
  props: ComponentProps<"svg"> & VariantProps<typeof checkIconVariants>
) {
  const { size, ...rest } = props;
  return <Check className={cn(checkIconVariants({ size }))} {...rest} />;
}

// Usage
<CheckIcon aria-hidden={"true"} size={size} />
```

For simple icons without size variants:

```typescript
function MinusIcon(props: ComponentProps<"svg">) {
  return <Minus className={"size-3.5"} {...props} />;
}
```

---

## Complete Field Component Example

```typescript
// components/ui/form/text-field.tsx
"use client";

import { Input } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { useId } from "react";

import { useFieldContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

import { FieldWrapper, getAriaDescribedBy } from "./field-wrapper";

export const inputVariants = cva(
  `
    w-full rounded-md border border-border bg-transparent text-foreground
    placeholder:text-muted-foreground
    focus:ring-2 focus:ring-accent focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "h-9 px-3 text-sm",
        lg: "h-10 px-4 text-base",
        sm: "h-8 px-2 text-xs",
      },
    },
  }
);

type TextFieldProps = ClassName &
  VariantProps<typeof inputVariants> & {
    description?: string;
    disabled?: boolean;
    label: string;
    placeholder?: string;
    type?: "email" | "password" | "text" | "url";
  };

export function TextField({
  className,
  description,
  disabled,
  label,
  placeholder,
  size,
  type = "text",
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const error = field.state.meta.errors[0];
  const hasError = Boolean(error);

  return (
    <FieldWrapper
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      label={label}
      labelFor={id}
      size={size}
    >
      <Input
        aria-describedby={getAriaDescribedBy(
          descriptionId,
          errorId,
          Boolean(description),
          hasError
        )}
        aria-invalid={hasError || undefined}
        className={cn(inputVariants({ size }), className)}
        disabled={disabled}
        id={id}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={field.state.value ?? ""}
      />
    </FieldWrapper>
  );
}
```

---

## Essential Rules Summary

1. **Component Categories**: Distinguish between field components (useFieldContext) and form components (useFormContext)
2. **useFieldContext Generic**: Always specify the correct type: `<string>`, `<boolean>`, `<number | null>`
3. **Unique IDs**: Use `useId()` hook for generating unique element IDs
4. **CVA Variants**: Define variants with sm/default/lg size support
5. **Accessibility**: Include aria-describedby, aria-invalid, role="alert", aria-hidden for icons
6. **Error Handling**: Extract first error from `field.state.meta.errors[0]`
7. **Event Binding**: Use appropriate handlers (handleBlur, handleChange, onCheckedChange, onValueChange)
8. **FieldWrapper**: Use for standard label-above layouts; custom layout for inline labels
9. **Registration**: Add to fieldComponents or formComponents in form-hook.ts
10. **Exports**: Export component and variants from index.ts in alphabetical order

---
