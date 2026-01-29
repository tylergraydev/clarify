# Component Conventions

A comprehensive guide for creating consistent, accessible React components using Base UI and CVA patterns.

---

## Base UI Integration

### Wrapping Primitives

Every component must wrap a Base UI primitive from `@base-ui/react`:

```tsx
'use client';

import type { ComponentPropsWithRef } from 'react';

import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(/* ... */);

type ButtonProps = ComponentPropsWithRef<typeof BaseButton> & VariantProps<typeof buttonVariants>;

export const Button = ({ className, ref, size, variant, ...props }: ButtonProps) => {
  return <BaseButton className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />;
};
```

### Re-exporting Compound Components

For compound components (Dialog, Menu, etc.), re-export sub-components directly:

```tsx
import { Dialog as BaseDialog } from '@base-ui/react/dialog';

// Re-export unchanged sub-components
export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogPortal = BaseDialog.Portal;
export const DialogClose = BaseDialog.Close;

// Custom styled sub-components
export const DialogBackdrop = ({ className, ref, ...props }: DialogBackdropProps) => {
  return <BaseDialog.Backdrop className={cn(dialogBackdropVariants(), className)} ref={ref} {...props} />;
};
```

### Finding Base UI Primitives

Use the Base UI MCP tool to find available primitives:

1. Call `base_ui_list_docs` to see all available components
2. Call `base_ui_get_doc` with the component path to read its API

If no Base UI primitive exists for the component type, create from scratch using semantic HTML with proper ARIA attributes.

---

## CVA (Class Variance Authority) Setup

### Basic Structure

```tsx
export const buttonVariants = cva(
  // Base classes (always applied)
  `
    inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium
    whitespace-nowrap transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
  `,
  {
    // Default variant values
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    // Variant definitions
    variants: {
      size: {
        default: 'h-9 px-4 py-2',
        icon: 'size-9',
        lg: 'h-10 px-6',
        sm: 'h-8 px-3 text-xs',
      },
      variant: {
        default: 'bg-accent text-accent-foreground hover:bg-accent-hover',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'hover:bg-muted hover:text-foreground',
        outline: 'border border-border bg-transparent hover:bg-muted hover:text-foreground',
        secondary: 'bg-muted text-foreground hover:bg-muted/80',
      },
    },
  }
);
```

### Mandatory Requirements

1. **Export variants separately**: `export const componentVariants = cva(...)`
2. **Always include defaultVariants**: Provide sensible defaults for all variant keys
3. **Alphabetize variant keys**: `size` before `variant` (alphabetically)
4. **Alphabetize variant options**: `default`, `ghost`, `outline` (alphabetically within each key)
5. **Use template literals**: For multi-line base classes with proper formatting
6. **Include focus states**: `focus-visible:ring-2 focus-visible:ring-accent`
7. **Include disabled states**: `data-disabled:pointer-events-none data-disabled:opacity-50`

### When to Use CVA

Use CVA when the component has:

- Multiple visual variants (primary, secondary, destructive, etc.)
- Multiple sizes (sm, default, lg)
- Any combination of visual states that should be easily composable

Skip CVA when:

- Component has no variants (use direct Tailwind classes)
- Component is purely structural (layout containers)

---

## Props Interface Patterns

### Basic Pattern with Variants

```tsx
type ButtonProps = ComponentPropsWithRef<typeof BaseButton> & VariantProps<typeof buttonVariants>;
```

### Pattern without Variants

```tsx
type DialogTitleProps = ComponentPropsWithRef<typeof BaseDialog.Title>;
```

### Extending with Custom Props

```tsx
interface TooltipContentProps
  extends ComponentPropsWithRef<typeof BaseTooltip.Popup>, VariantProps<typeof tooltipVariants> {
  sideOffset?: number;
}
```

### Mandatory Requirements

1. **Use ComponentPropsWithRef**: For proper ref forwarding type inference
2. **Combine with VariantProps**: When component has CVA variants
3. **Destructure variant props explicitly**: In the component function signature
4. **Always accept className**: For external style overrides
5. **Always forward ref**: Using the `ref` prop pattern

---

## Component Function Structure

### Standard Pattern

```tsx
export const Button = ({ className, ref, size, variant, ...props }: ButtonProps) => {
  return <BaseButton className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />;
};
```

### Key Points

1. **Destructure variant props first**: `size`, `variant` before `...props`
2. **Always include className**: In destructuring
3. **Always include ref**: In destructuring
4. **Use cn() utility**: For merging classes
5. **Pass className to cn()**: `cn(variants({ className, size, variant }))`
6. **Spread remaining props**: `{...props}` at the end

---

## File Structure & Organization

### Import Order

```tsx
'use client';

// 1. Type imports
import type { ComponentPropsWithRef } from 'react';

// 2. Base UI imports
import { Button as BaseButton } from '@base-ui/react/button';

// 3. CVA imports
import { cva, type VariantProps } from 'class-variance-authority';

// 4. Internal utility imports
import { cn } from '@/lib/utils';
```

### Export Order

```tsx
// 1. CVA variants (if any)
export const buttonVariants = cva(/* ... */);

// 2. Type definitions
type ButtonProps = /* ... */;

// 3. Component exports
export const Button = ({ ... }: ButtonProps) => { /* ... */ };
```

### File Location

| Component Type     | Location                         | Example                                         |
| ------------------ | -------------------------------- | ----------------------------------------------- |
| UI Primitives      | `components/ui/`                 | `components/ui/button.tsx`                      |
| Feature Components | `components/features/{feature}/` | `components/features/projects/project-card.tsx` |
| Layout Components  | `components/layout/`             | `components/layout/sidebar.tsx`                 |

### File Naming

- Use **kebab-case** for all component files: `theme-selector.tsx`
- Match component name to file name: `ThemeSelector` in `theme-selector.tsx`

---

## Styling Patterns

### Using cn() Utility

Always use `cn()` from `@/lib/utils` for class merging:

```tsx
// ✅ Correct
<BaseButton className={cn(buttonVariants({ size, variant }), className)} />

// ❌ Incorrect
<BaseButton className={`${buttonVariants({ size, variant })} ${className}`} />
```

### CSS Variables

Use CSS custom properties defined in `globals.css`:

```tsx
// ✅ Correct - Using CSS variable tokens
'bg-accent text-accent-foreground';
'border-border bg-background';
'text-muted-foreground';

// ❌ Incorrect - Hardcoded colors
'bg-blue-500 text-white';
'border-gray-200 bg-white';
```

### Common CSS Variable Tokens

| Token                   | Usage                |
| ----------------------- | -------------------- |
| `bg-background`         | Main background      |
| `bg-foreground`         | Text on background   |
| `bg-accent`             | Primary action color |
| `bg-accent-foreground`  | Text on accent       |
| `bg-muted`              | Subtle background    |
| `text-muted-foreground` | Secondary text       |
| `border-border`         | Default border color |
| `bg-destructive`        | Danger/error color   |

### Base UI Data Attributes

Use Base UI's data attributes for state styling:

```tsx
// Disabled state
'data-disabled:pointer-events-none data-disabled:opacity-50';

// Open/closed state
'data-open:rotate-180';

// Starting/ending animation states
'data-starting-style:opacity-0 data-ending-style:opacity-0';
```

---

## Compound Component Patterns

### Structure

```tsx
// Root export (unchanged from Base UI)
export const DialogRoot = BaseDialog.Root;

// Styled sub-components
export const dialogBackdropVariants = cva(/* ... */);

type DialogBackdropProps = ComponentPropsWithRef<typeof BaseDialog.Backdrop> &
  VariantProps<typeof dialogBackdropVariants>;

export const DialogBackdrop = ({ blur, className, ref, ...props }: DialogBackdropProps) => {
  return <BaseDialog.Backdrop className={cn(dialogBackdropVariants({ blur }), className)} ref={ref} {...props} />;
};
```

### Naming Convention

- Root component: `{Component}Root`
- Trigger: `{Component}Trigger`
- Content/Popup: `{Component}Content` or `{Component}Popup`
- Other parts: `{Component}{Part}` (e.g., `DialogTitle`, `DialogDescription`)

---

## Accessibility Requirements

### Focus Management

Always include focus-visible styles:

```tsx
'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none';
```

### Disabled States

Use Base UI's data-disabled attribute:

```tsx
'data-disabled:pointer-events-none data-disabled:opacity-50';
```

### ARIA Attributes

Base UI handles most ARIA automatically. For custom implementations:

```tsx
<button
  aria-expanded={isExpanded}
  aria-haspopup={'menu'}
  aria-label={isExpanded ? 'Close menu' : 'Open menu'}
>
```

---

## Essential Rules Summary

1. **Always wrap Base UI**: Every component must use a Base UI primitive as foundation
2. **Export variants separately**: `export const componentVariants = cva(...)`
3. **Use ComponentPropsWithRef**: For all props type definitions
4. **Combine with VariantProps**: When component has CVA variants
5. **Always use cn()**: For class merging, never string concatenation
6. **Use CSS variables**: From `globals.css`, not hardcoded colors
7. **Include focus states**: `focus-visible:ring-2 focus-visible:ring-accent`
8. **Include disabled states**: `data-disabled:pointer-events-none data-disabled:opacity-50`
9. **Follow import order**: Type imports → Base UI → CVA → Utilities
10. **Alphabetize variants**: Both keys and options within each key

---
