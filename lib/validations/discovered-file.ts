import { z } from 'zod';

import { fileActions, filePriorities } from '../../db/schema/discovered-files.schema';

// ============================================================================
// Shared Schemas
// ============================================================================

/**
 * Shared schema for file metadata fields used across add and edit operations.
 * Contains common validation rules for path, priority, action, role, and relevanceExplanation.
 */
export const fileMetadataSchema = z.object({
  action: z.enum(fileActions, {
    error: 'Please select a valid action (create, modify, delete, or reference)',
  }),
  priority: z.enum(filePriorities, {
    error: 'Please select a valid priority (high, medium, or low)',
  }),
  relevanceExplanation: z
    .string()
    .trim()
    .min(1, 'Relevance explanation is required')
    .max(2000, 'Relevance explanation is too long'),
  role: z.string().trim().min(1, 'Role is required').max(500, 'Role is too long'),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

// ============================================================================
// Add Discovered File Schema
// ============================================================================

/**
 * Schema for manually adding a discovered file to a workflow step.
 * Validates path, priority, action, role, and relevanceExplanation fields.
 */
export const addDiscoveredFileSchema = fileMetadataSchema.extend({
  filePath: z
    .string()
    .trim()
    .min(1, 'File path is required')
    .max(1000, 'File path is too long')
    .refine((path) => !path.includes('\0'), 'File path contains invalid characters'),
});

export type AddDiscoveredFileFormValues = z.infer<typeof addDiscoveredFileSchema>;

// ============================================================================
// Edit Discovered File Schema
// ============================================================================

/**
 * Schema for editing an existing discovered file's metadata.
 * All fields are optional since the API accepts partial updates.
 */
export const editDiscoveredFileSchema = z.object({
  action: z
    .enum(fileActions, {
      error: 'Please select a valid action (create, modify, delete, or reference)',
    })
    .optional(),
  priority: z
    .enum(filePriorities, {
      error: 'Please select a valid priority (high, medium, or low)',
    })
    .optional(),
  relevanceExplanation: z
    .string()
    .trim()
    .min(1, 'Relevance explanation is required')
    .max(2000, 'Relevance explanation is too long')
    .optional(),
  role: z.string().trim().min(1, 'Role is required').max(500, 'Role is too long').optional(),
});

export type EditDiscoveredFileFormValues = z.infer<typeof editDiscoveredFileSchema>;
