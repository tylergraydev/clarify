import { z } from "zod";

import { templateCategories } from "@/db/schema/templates.schema";

// Template placeholder schema for individual placeholder fields
export const templatePlaceholderSchema = z.object({
  defaultValue: z.string(),
  description: z.string(),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(255, "Display name is too long"),
  isRequired: z.boolean(),
  name: z
    .string()
    .min(1, "Placeholder name is required")
    .max(100, "Placeholder name is too long")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "Placeholder name must start with a letter and contain only letters, numbers, and underscores"
    ),
  orderIndex: z.number().int().min(0, "Order index must be non-negative"),
  validationPattern: z.string(),
});

export type TemplatePlaceholderFormValues = z.infer<
  typeof templatePlaceholderSchema
>;

// Create template schema
export const createTemplateSchema = z.object({
  category: z.enum(templateCategories, {
    error: "Please select a category",
  }),
  description: z.string().max(1000, "Description is too long"),
  name: z
    .string()
    .min(1, "Template name is required")
    .max(255, "Template name is too long"),
  templateText: z
    .string()
    .min(1, "Template text is required")
    .max(50000, "Template text is too long"),
});

export type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>;

// Update template schema extends create schema with id and active state
export const updateTemplateSchema = createTemplateSchema.extend({
  id: z.number().int().positive("Invalid template ID"),
  isActive: z.boolean(),
});

export type UpdateTemplateFormValues = z.infer<typeof updateTemplateSchema>;

// Template with placeholders schema for combined operations
export const templateWithPlaceholdersSchema = createTemplateSchema.extend({
  placeholders: z.array(templatePlaceholderSchema),
});

export type TemplateWithPlaceholdersFormValues = z.infer<
  typeof templateWithPlaceholdersSchema
>;

// Update template with placeholders schema
export const updateTemplateWithPlaceholdersSchema = updateTemplateSchema.extend(
  {
    placeholders: z.array(templatePlaceholderSchema),
  }
);

export type UpdateTemplateWithPlaceholdersFormValues = z.infer<
  typeof updateTemplateWithPlaceholdersSchema
>;
