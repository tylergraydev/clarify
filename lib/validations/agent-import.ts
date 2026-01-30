import { z } from 'zod';

import { agentColors, agentModels, agentPermissionModes, agentTypes } from '../../db/schema/agents.schema';

/**
 * Regex pattern for validating kebab-case agent names.
 * Must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.
 */
const KEBAB_CASE_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Zod schema for validating hook entries in agent imports.
 * Matches Claude Code subagent specification.
 */
export const agentImportHookEntrySchema = z.object({
  body: z.string().min(1, 'Hook body is required'),
  matcher: z.string().optional(),
});

export type AgentImportHookEntry = z.infer<typeof agentImportHookEntrySchema>;

/**
 * Zod schema for validating hooks object in agent imports.
 * Matches Claude Code subagent specification.
 */
export const agentImportHooksSchema = z.object({
  PostToolUse: z.array(agentImportHookEntrySchema).optional(),
  PreToolUse: z.array(agentImportHookEntrySchema).optional(),
  Stop: z.array(agentImportHookEntrySchema).optional(),
});

export type AgentImportHooks = z.infer<typeof agentImportHooksSchema>;

/**
 * Zod schema for validating imported agent markdown data.
 * Matches the official Claude Code subagent specification.
 *
 * Claude Code format uses simple string arrays for tools and skills,
 * not objects with additional metadata.
 */
export const agentImportSchema = z.object({
  // Clarify-specific fields (internal use, optional)
  color: z.enum(agentColors).optional(),

  // Required by Claude Code spec - natural language description
  description: z.string().min(1, 'Description is required').max(1000, 'Description is too long'),

  // Optional Claude Code fields
  disallowedTools: z.array(z.string()).optional(),
  displayName: z.string().max(255, 'Display name is too long').optional(),
  hooks: agentImportHooksSchema.optional(),
  model: z.enum(agentModels).optional(),
  // Required by Claude Code spec - kebab-case identifier
  name: z
    .string()
    .min(1, 'Agent name is required')
    .max(255, 'Agent name is too long')
    .regex(
      KEBAB_CASE_PATTERN,
      'Agent name must be in kebab-case (start with a lowercase letter, contain only lowercase letters, numbers, and hyphens)'
    ),
  permissionMode: z.enum(agentPermissionModes).optional(),

  skills: z.array(z.string()).optional(),

  // Required system prompt - the main agent instructions (body content)
  systemPrompt: z.string().min(1, 'System prompt is required').max(50000, 'System prompt is too long'),
  tools: z.array(z.string()).optional(),
  type: z.enum(agentTypes).optional(),
  version: z.number().int('Version must be an integer').positive('Version must be a positive number').optional(),
});

export type AgentImportData = z.infer<typeof agentImportSchema>;

/**
 * Result of validating agent import data.
 */
export interface AgentImportValidationResult {
  /** The validated and parsed agent data (null if validation failed) */
  data: AgentImportData | null;
  /** Validation errors (empty array if successful) */
  errors: Array<{
    /** The field path that has an error */
    field: string;
    /** Human-readable error message */
    message: string;
  }>;
  /** Whether the validation was successful */
  success: boolean;
  /** Non-blocking warnings about the import data */
  warnings: Array<AgentImportWarning>;
}

/**
 * Validation warning for non-blocking issues in agent imports.
 */
export interface AgentImportWarning {
  /** The field that has a warning */
  field: string;
  /** Human-readable warning message */
  message: string;
}

/**
 * Converts a ParsedAgentMarkdown structure to the format expected by agentImportSchema.
 * This is a utility function to bridge between the parsed markdown and the validation schema.
 *
 * @param parsed - The parsed agent markdown data
 * @returns Object ready for validation with agentImportSchema
 */
export function prepareAgentImportData(parsed: {
  frontmatter: {
    color?: string;
    description?: string;
    disallowedTools?: Array<string>;
    displayName?: string;
    hooks?: AgentImportHooks;
    model?: string;
    name: string;
    permissionMode?: string;
    skills?: Array<string>;
    tools?: Array<string>;
    type?: string;
    version?: number;
  };
  systemPrompt: string;
}): unknown {
  return {
    color: parsed.frontmatter.color,
    description: parsed.frontmatter.description,
    disallowedTools: parsed.frontmatter.disallowedTools,
    displayName: parsed.frontmatter.displayName,
    hooks: parsed.frontmatter.hooks,
    model: parsed.frontmatter.model,
    name: parsed.frontmatter.name,
    permissionMode: parsed.frontmatter.permissionMode,
    skills: parsed.frontmatter.skills,
    systemPrompt: parsed.systemPrompt,
    tools: parsed.frontmatter.tools,
    type: parsed.frontmatter.type,
    version: parsed.frontmatter.version,
  };
}

/**
 * Validates agent import data using the Zod schema.
 *
 * @param data - The raw data to validate (typically from parsed markdown frontmatter + systemPrompt)
 * @returns Validation result with parsed data, errors, and warnings
 */
export function validateAgentImport(data: unknown): AgentImportValidationResult {
  const warnings: Array<AgentImportWarning> = [];

  // Perform Zod validation
  const result = agentImportSchema.safeParse(data);

  if (!result.success) {
    // Map Zod errors to our error format
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return {
      data: null,
      errors,
      success: false,
      warnings,
    };
  }

  // Check for warnings (non-blocking issues)
  const validatedData = result.data;

  // Warn if displayName is missing (will use name as fallback)
  if (!validatedData.displayName) {
    warnings.push({
      field: 'displayName',
      message: 'Display name not specified. Will use agent name.',
    });
  }

  // Warn if type is missing (will default to 'specialist')
  if (!validatedData.type) {
    warnings.push({
      field: 'type',
      message: "Agent type not specified. Will default to 'specialist'.",
    });
  }

  // Warn if color is missing (will need to be selected)
  if (validatedData.color === undefined) {
    warnings.push({
      field: 'color',
      message: 'Color not specified. A default color will be assigned.',
    });
  }

  // Warn if tools array is empty
  if (validatedData.tools && validatedData.tools.length === 0) {
    warnings.push({
      field: 'tools',
      message: 'Tools array is empty. Agent will have no tool restrictions.',
    });
  }

  // Warn if skills array is empty
  if (validatedData.skills && validatedData.skills.length === 0) {
    warnings.push({
      field: 'skills',
      message: 'Skills array is empty. Agent will have no skills.',
    });
  }

  return {
    data: validatedData,
    errors: [],
    success: true,
    warnings,
  };
}
