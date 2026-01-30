import { z } from "zod";

import { agentColors, agentTypes } from "../../db/schema/agents.schema";

/**
 * Regex pattern for validating kebab-case agent names.
 * Must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.
 */
const KEBAB_CASE_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Zod schema for validating tool entries in agent imports.
 */
export const agentImportToolSchema = z.object({
  pattern: z.string().max(1000, "Tool pattern is too long").optional(),
  toolName: z
    .string()
    .min(1, "Tool name is required")
    .max(255, "Tool name is too long"),
});

export type AgentImportTool = z.infer<typeof agentImportToolSchema>;

/**
 * Zod schema for validating skill entries in agent imports.
 */
export const agentImportSkillSchema = z.object({
  isRequired: z.boolean().default(false),
  skillName: z
    .string()
    .min(1, "Skill name is required")
    .max(255, "Skill name is too long"),
});

export type AgentImportSkill = z.infer<typeof agentImportSkillSchema>;

/**
 * Zod schema for validating imported agent markdown data.
 * Validates all frontmatter fields plus the system prompt.
 */
export const agentImportSchema = z.object({
  // Optional color field - must match valid agent colors if provided
  color: z.enum(agentColors).optional(),

  // Optional description field
  description: z.string().max(1000, "Description is too long").optional(),

  // Required display name - human-readable name
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(255, "Display name is too long"),

  // Required name - kebab-case identifier
  name: z
    .string()
    .min(1, "Agent name is required")
    .max(255, "Agent name is too long")
    .regex(
      KEBAB_CASE_PATTERN,
      "Agent name must be in kebab-case (start with a lowercase letter, contain only lowercase letters, numbers, and hyphens)"
    ),

  // Optional skills array
  skills: z.array(agentImportSkillSchema).optional(),

  // Required system prompt - the main agent instructions
  systemPrompt: z
    .string()
    .min(1, "System prompt is required")
    .max(50000, "System prompt is too long"),

  // Optional tools array
  tools: z.array(agentImportToolSchema).optional(),

  // Required type - must match valid agent types
  type: z.enum(agentTypes, {
    error: `Invalid agent type. Must be one of: ${agentTypes.join(", ")}`,
  }),

  // Optional version - must be a positive integer if provided
  version: z
    .number()
    .int("Version must be an integer")
    .positive("Version must be a positive number")
    .optional(),
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
    displayName: string;
    name: string;
    skills?: Array<{ isRequired: boolean; skillName: string }>;
    tools?: Array<{ pattern?: string; toolName: string }>;
    type: string;
    version: number;
  };
  systemPrompt: string;
}): unknown {
  return {
    color: parsed.frontmatter.color,
    description: parsed.frontmatter.description,
    displayName: parsed.frontmatter.displayName,
    name: parsed.frontmatter.name,
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
      field: issue.path.join("."),
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

  // Warn if version is missing (will default to current version)
  if (validatedData.version === undefined) {
    warnings.push({
      field: "version",
      message: "Version not specified. Will use current format version.",
    });
  }

  // Warn if color is missing (will need to be selected)
  if (validatedData.color === undefined) {
    warnings.push({
      field: "color",
      message: "Color not specified. A default color will be assigned.",
    });
  }

  // Warn if tools array is empty
  if (validatedData.tools && validatedData.tools.length === 0) {
    warnings.push({
      field: "tools",
      message: "Tools array is empty. Agent will have no tool restrictions.",
    });
  }

  // Warn if skills array is empty
  if (validatedData.skills && validatedData.skills.length === 0) {
    warnings.push({
      field: "skills",
      message: "Skills array is empty. Agent will have no skills.",
    });
  }

  return {
    data: validatedData,
    errors: [],
    success: true,
    warnings,
  };
}
