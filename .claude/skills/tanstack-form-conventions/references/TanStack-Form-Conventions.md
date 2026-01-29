# TanStack Form Conventions

A comprehensive guide for consistent, maintainable form implementations using TanStack Form with the project's pre-built field components.

---

## Tech Stack

- **TanStack Form**: `@tanstack/react-form` for form state management
- **Zod**: `zod` for validation schemas
- **Pre-built Components**: Custom field components in `components/ui/form/`
- **Form Hook**: Custom `useAppForm` hook in `lib/forms/`

---

## File Organization

### Directory Structure

```
lib/
  forms/
    form-hook.ts              # useAppForm hook and contexts
    index.ts                  # Barrel exports

  validations/
    project.ts                # Project form validation schemas
    feature.ts                # Feature form validation schemas
    {entity}.ts               # Entity-specific validation schemas

components/
  ui/
    form/
      text-field.tsx          # Text input field component
      textarea-field.tsx      # Textarea field component
      select-field.tsx        # Select dropdown field component
      checkbox-field.tsx      # Checkbox field component
      switch-field.tsx        # Toggle switch field component
      number-field.tsx        # Number input field component
      submit-button.tsx       # Form submit button component
      form-error.tsx          # Form-level error display component
      field-wrapper.tsx       # Shared field wrapper with label/description/error
      index.ts                # Barrel exports

  {feature}/
    {feature}-form.tsx        # Feature-specific form components
```

### File Naming

- Validation schema files: `{entity}.ts` in `lib/validations/`
- Form component files: `{feature}-form.tsx` in feature component folder
- Export both schema and inferred type from validation files

---

## Form Hook Setup

### useAppForm Configuration

Use the custom `useAppForm` hook for all forms:

```typescript
import { useAppForm } from "@/lib/forms";
import {
  type CreateProjectFormValues,
  createProjectSchema,
} from "@/lib/validations/project";

const form = useAppForm({
  defaultValues: {
    description: "",
    name: "",
  },
  onSubmit: async ({ value }) => {
    await onSubmit(value);
  },
  validators: {
    onSubmit: createProjectSchema,
  },
});
```

### Required Configuration Options

| Option          | Description                                         |
| --------------- | --------------------------------------------------- |
| `defaultValues` | Initial form values matching the validation schema  |
| `onSubmit`      | Async callback receiving `{ value }` with form data |
| `validators`    | Object with `onSubmit` key containing Zod schema    |

### Default Values Rules

1. **Match schema shape**: Default values must include all schema fields
2. **Use empty strings**: For optional text fields, use `""`
3. **Use null for optional numbers**: For optional number fields, use `null`
4. **Use false for booleans**: For checkbox/switch fields, default to `false`

```typescript
// Correct default values
defaultValues: {
  name: "",                    // Required string
  description: "",             // Optional string
  count: null,                 // Optional number
  isEnabled: false,            // Boolean
  category: "",                // Select field
},
```

---

## Available Field Components

### TextField

For single-line text input (text, email, password, URL).

```typescript
<form.AppField name={"name"}>
  {(field) => (
    <field.TextField
      label={"Project Name"}
      placeholder={"Enter project name"}
    />
  )}
</form.AppField>
```

**Props**:

| Prop          | Type                                       | Required | Description                  |
| ------------- | ------------------------------------------ | -------- | ---------------------------- |
| `label`       | `string`                                   | Yes      | Field label text             |
| `placeholder` | `string`                                   | No       | Input placeholder text       |
| `description` | `string`                                   | No       | Helper text below input      |
| `type`        | `"text" \| "email" \| "password" \| "url"` | No       | Input type (default: "text") |
| `size`        | `"sm" \| "default" \| "lg"`                | No       | Field size variant           |
| `disabled`    | `boolean`                                  | No       | Disable the input            |
| `className`   | `string`                                   | No       | Additional CSS classes       |

### TextareaField

For multi-line text input.

```typescript
<form.AppField name={"description"}>
  {(field) => (
    <field.TextareaField
      description={"Optional description for your project"}
      label={"Description"}
      placeholder={"Describe your project..."}
      rows={4}
    />
  )}
</form.AppField>
```

**Props**:

| Prop          | Type                        | Required | Description                         |
| ------------- | --------------------------- | -------- | ----------------------------------- |
| `label`       | `string`                    | Yes      | Field label text                    |
| `placeholder` | `string`                    | No       | Input placeholder text              |
| `description` | `string`                    | No       | Helper text below input             |
| `rows`        | `number`                    | No       | Number of visible rows (default: 3) |
| `size`        | `"sm" \| "default" \| "lg"` | No       | Field size variant                  |
| `disabled`    | `boolean`                   | No       | Disable the input                   |
| `className`   | `string`                    | No       | Additional CSS classes              |

### SelectField

For dropdown selection from predefined options.

```typescript
<form.AppField name={"category"}>
  {(field) => (
    <field.SelectField
      label={"Category"}
      options={[
        { label: "Bug Fix", value: "bug" },
        { label: "Feature", value: "feature" },
        { label: "Improvement", value: "improvement" },
      ]}
      placeholder={"Select a category"}
    />
  )}
</form.AppField>
```

**Props**:

| Prop          | Type                        | Required | Description                          |
| ------------- | --------------------------- | -------- | ------------------------------------ |
| `label`       | `string`                    | Yes      | Field label text                     |
| `options`     | `Array<SelectOption>`       | Yes      | Array of { label, value, disabled? } |
| `placeholder` | `string`                    | No       | Placeholder when no selection        |
| `description` | `string`                    | No       | Helper text below select             |
| `size`        | `"sm" \| "default" \| "lg"` | No       | Field size variant                   |
| `disabled`    | `boolean`                   | No       | Disable the select                   |
| `className`   | `string`                    | No       | Additional CSS classes               |

**SelectOption Interface**:

```typescript
interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}
```

### CheckboxField

For boolean toggle with checkbox UI.

```typescript
<form.AppField name={"isPublic"}>
  {(field) => (
    <field.CheckboxField
      description={"Make this project visible to others"}
      label={"Public Project"}
    />
  )}
</form.AppField>
```

**Props**:

| Prop          | Type                        | Required | Description                |
| ------------- | --------------------------- | -------- | -------------------------- |
| `label`       | `string`                    | Yes      | Field label text           |
| `description` | `string`                    | No       | Helper text below checkbox |
| `size`        | `"sm" \| "default" \| "lg"` | No       | Field size variant         |
| `disabled`    | `boolean`                   | No       | Disable the checkbox       |
| `className`   | `string`                    | No       | Additional CSS classes     |

### SwitchField

For boolean toggle with switch UI.

```typescript
<form.AppField name={"isEnabled"}>
  {(field) => (
    <field.SwitchField
      description={"Enable notifications for this feature"}
      label={"Enable Notifications"}
    />
  )}
</form.AppField>
```

**Props**:

| Prop          | Type                        | Required | Description              |
| ------------- | --------------------------- | -------- | ------------------------ |
| `label`       | `string`                    | Yes      | Field label text         |
| `description` | `string`                    | No       | Helper text below switch |
| `size`        | `"sm" \| "default" \| "lg"` | No       | Field size variant       |
| `disabled`    | `boolean`                   | No       | Disable the switch       |
| `className`   | `string`                    | No       | Additional CSS classes   |

### NumberField

For numeric input with increment/decrement buttons.

```typescript
<form.AppField name={"priority"}>
  {(field) => (
    <field.NumberField
      label={"Priority"}
      max={10}
      min={1}
      step={1}
    />
  )}
</form.AppField>
```

**Props**:

| Prop          | Type                        | Required | Description                           |
| ------------- | --------------------------- | -------- | ------------------------------------- |
| `label`       | `string`                    | Yes      | Field label text                      |
| `min`         | `number`                    | No       | Minimum allowed value                 |
| `max`         | `number`                    | No       | Maximum allowed value                 |
| `step`        | `number`                    | No       | Increment/decrement step (default: 1) |
| `description` | `string`                    | No       | Helper text below input               |
| `size`        | `"sm" \| "default" \| "lg"` | No       | Field size variant                    |
| `disabled`    | `boolean`                   | No       | Disable the input                     |
| `className`   | `string`                    | No       | Additional CSS classes                |

---

## Validation Patterns

### Validation Schema Structure

Define Zod schemas in `lib/validations/{entity}.ts`:

```typescript
// lib/validations/project.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  description: z.string(),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name is too long"),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
```

### Schema Rules

1. **Export both schema and type**: Always export the schema and its inferred type
2. **Descriptive error messages**: Include user-friendly error messages
3. **Alphabetical field order**: Order fields alphabetically in the schema object
4. **Use appropriate Zod methods**: `min`, `max`, `email`, `url`, etc.

### Common Validation Patterns

```typescript
// Required string
name: z.string().min(1, "Name is required");

// Optional string (empty string allowed)
description: z.string();

// Required email
email: z.string().min(1, "Email is required").email("Invalid email address");

// Required URL
url: z.string().min(1, "URL is required").url("Invalid URL");

// Required number with range
priority: z.number()
  .min(1, "Minimum priority is 1")
  .max(10, "Maximum priority is 10");

// Optional number (nullable)
count: z.number().nullable();

// Required boolean
isEnabled: z.boolean();

// Required select (non-empty string)
category: z.string().min(1, "Please select a category");
```

---

## Form Structure

### Basic Form Template

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { useAppForm } from "@/lib/forms";
import {
  type CreateEntityFormValues,
  createEntitySchema,
} from "@/lib/validations/entity";

interface CreateEntityFormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateEntityFormValues) => Promise<void> | void;
}

export function CreateEntityForm({
  isSubmitting,
  onCancel,
  onSubmit,
}: CreateEntityFormProps) {
  const form = useAppForm({
    defaultValues: {
      description: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: createEntitySchema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className={"flex flex-col gap-4"}>
        {/* Form Fields */}
        <form.AppField name={"name"}>
          {(field) => (
            <field.TextField
              label={"Name"}
              placeholder={"Enter name"}
            />
          )}
        </form.AppField>

        <form.AppField name={"description"}>
          {(field) => (
            <field.TextareaField
              description={"Optional description"}
              label={"Description"}
              placeholder={"Describe..."}
              rows={4}
            />
          )}
        </form.AppField>

        {/* Action Buttons */}
        <div className={"mt-2 flex justify-end gap-3"}>
          <Button
            disabled={isSubmitting}
            onClick={onCancel}
            type={"button"}
            variant={"outline"}
          >
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>
              {isSubmitting ? "Creating..." : "Create"}
            </form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}
```

### Form Submission Rules

1. **Native form element**: Always wrap in `<form>` element
2. **Prevent default**: Call `e.preventDefault()` and `e.stopPropagation()`
3. **Void the promise**: Use `void form.handleSubmit()` to avoid unhandled promise warnings
4. **External submission state**: Accept `isSubmitting` prop from parent for dialog coordination

### Button Placement

1. **Flex container**: Use `flex justify-end gap-3` for button row
2. **Cancel button first**: Place cancel/secondary action before submit
3. **Button types**: Cancel uses `type="button"`, submit uses `type="submit"`
4. **Disable during submission**: Disable cancel button when `isSubmitting`

---

## Submit Button

### SubmitButton Component

The `SubmitButton` component automatically handles:

- Disabled state when form can't submit or is submitting
- Loading text during submission
- Proper button variants

```typescript
<form.AppForm>
  <form.SubmitButton>
    {isSubmitting ? "Creating..." : "Create"}
  </form.SubmitButton>
</form.AppForm>
```

### Important: form.AppForm Wrapper

The `SubmitButton` must be wrapped in `form.AppForm` to access form context:

```typescript
// Correct
<form.AppForm>
  <form.SubmitButton>Submit</form.SubmitButton>
</form.AppForm>

// Incorrect - will not work
<form.SubmitButton>Submit</form.SubmitButton>
```

### SubmitButton Props

| Prop        | Type                        | Required | Description            |
| ----------- | --------------------------- | -------- | ---------------------- |
| `children`  | `ReactNode`                 | Yes      | Button label           |
| `variant`   | `ButtonVariant`             | No       | Button style variant   |
| `size`      | `"sm" \| "default" \| "lg"` | No       | Button size            |
| `className` | `string`                    | No       | Additional CSS classes |

---

## Error Display

### Field-Level Errors

Field-level errors are automatically displayed by field components below the input when validation fails. No additional configuration needed.

### Form-Level Errors

For form-level errors (like API errors), use the `FormError` component:

```typescript
<form.AppForm>
  <form.FormError />
</form.AppForm>

// Or with custom styling
<form.AppForm>
  <form.FormError className={"mb-4"} />
</form.AppForm>
```

### Setting Form-Level Errors

To display form-level errors (e.g., from API responses):

```typescript
const form = useAppForm({
  // ... config
  onSubmit: async ({ value }) => {
    try {
      await onSubmit(value);
    } catch (error) {
      // This will display in FormError component
      throw new Error("Failed to create project. Please try again.");
    }
  },
});
```

---

## Form Props Interface Pattern

### Standard Form Props

All form components should follow this props pattern:

```typescript
interface {Entity}FormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: {Entity}FormValues) => Promise<void> | void;
}
```

### Props Explanation

| Prop           | Type                                | Purpose                              |
| -------------- | ----------------------------------- | ------------------------------------ |
| `isSubmitting` | `boolean \| undefined`              | External loading state (from dialog) |
| `onCancel`     | `() => void`                        | Cancel button handler                |
| `onSubmit`     | `(values) => Promise<void> \| void` | Form submission handler              |

### Why External isSubmitting?

Forms are often used in dialogs where submission triggers async operations. The parent component (dialog) manages the loading state and passes it down:

```typescript
// In dialog component
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (values: CreateProjectFormValues) => {
  setIsSubmitting(true);
  try {
    await createProject(values);
    onClose();
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <CreateProjectForm
    isSubmitting={isSubmitting}
    onCancel={onClose}
    onSubmit={handleSubmit}
  />
);
```

---

## Complete Form Example

```typescript
// components/projects/create-project-form.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useAppForm } from "@/lib/forms";
import {
  type CreateProjectFormValues,
  createProjectSchema,
} from "@/lib/validations/project";

interface CreateProjectFormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateProjectFormValues) => Promise<void> | void;
}

export function CreateProjectForm({
  isSubmitting,
  onCancel,
  onSubmit,
}: CreateProjectFormProps) {
  const form = useAppForm({
    defaultValues: {
      description: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: createProjectSchema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className={"flex flex-col gap-4"}>
        <form.AppField name={"name"}>
          {(field) => (
            <field.TextField
              label={"Project Name"}
              placeholder={"Enter project name"}
            />
          )}
        </form.AppField>

        <form.AppField name={"description"}>
          {(field) => (
            <field.TextareaField
              description={"Optional description for your project"}
              label={"Description"}
              placeholder={"Describe your project..."}
              rows={4}
            />
          )}
        </form.AppField>

        <div className={"mt-2 flex justify-end gap-3"}>
          <Button
            disabled={isSubmitting}
            onClick={onCancel}
            type={"button"}
            variant={"outline"}
          >
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>
              {isSubmitting ? "Creating..." : "Create Project"}
            </form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}
```

```typescript
// lib/validations/project.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  description: z.string(),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name is too long"),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
```

---

## Essential Rules Summary

1. **useAppForm Hook**: Always use `useAppForm` from `@/lib/forms`
2. **Zod Validation**: Define schemas in `lib/validations/{entity}.ts`
3. **Field Components**: Use pre-built field components (TextField, TextareaField, etc.)
4. **Label Required**: All field components require a `label` prop
5. **AppField Pattern**: Access fields via `form.AppField` with render function
6. **Native Form**: Wrap in `<form>` element with preventDefault
7. **SubmitButton Wrapper**: Wrap `SubmitButton` in `form.AppForm`
8. **Props Interface**: Follow standard `onSubmit`, `onCancel`, `isSubmitting` pattern
9. **Default Values**: Match schema shape with appropriate empty values
10. **Type Exports**: Export both schema and inferred type from validation files

---
