import YAML from "yaml";

import type { AgentSkill } from "../../db/schema/agent-skills.schema";
import type { AgentTool } from "../../db/schema/agent-tools.schema";
import type { Agent } from "../../db/schema/agents.schema";

import { agentColors, agentTypes } from "../../db/schema/agents.schema";

/**
 * Current format version for agent markdown files.
 * Increment when making breaking changes to the format.
 */
export const AGENT_MARKDOWN_FORMAT_VERSION = 1;

/**
 * Frontmatter structure for agent markdown files.
 */
export interface AgentMarkdownFrontmatter {
  color?: string;
  description?: string;
  displayName: string;
  name: string;
  skills?: Array<AgentMarkdownSkill>;
  tools?: Array<AgentMarkdownTool>;
  type: string;
  version: number;
}

/**
 * Skill configuration in markdown frontmatter format.
 */
export interface AgentMarkdownSkill {
  isRequired: boolean;
  skillName: string;
}

/**
 * Tool configuration in markdown frontmatter format.
 */
export interface AgentMarkdownTool {
  pattern?: string;
  toolName: string;
}

/**
 * Agent data with associated tools and skills for serialization.
 */
export interface AgentWithRelations {
  agent: Pick<
    Agent,
    "color" | "description" | "displayName" | "name" | "systemPrompt" | "type"
  >;
  skills: Array<Pick<AgentSkill, "requiredAt" | "skillName">>;
  tools: Array<Pick<AgentTool, "toolName" | "toolPattern">>;
}

/**
 * Parsed structure of an agent markdown file.
 */
export interface ParsedAgentMarkdown {
  frontmatter: AgentMarkdownFrontmatter;
  systemPrompt: string;
}

/**
 * Error thrown when parsing agent markdown fails.
 */
export class AgentMarkdownParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AgentMarkdownParseError";
  }
}

/**
 * Parses a markdown string with YAML frontmatter into agent data.
 *
 * Expected format:
 * ```markdown
 * ---
 * name: my-agent-name
 * displayName: My Agent Display Name
 * type: specialist
 * color: blue
 * description: Optional description
 * version: 1
 * tools:
 *   - toolName: Read
 *     pattern: "*"
 * skills:
 *   - skillName: tanstack-query
 *     isRequired: true
 * ---
 *
 * System prompt content goes here.
 * ```
 *
 * @param markdown - The markdown string to parse
 * @returns The parsed agent data
 * @throws AgentMarkdownParseError if the markdown is invalid
 */
export function parseAgentMarkdown(markdown: string): ParsedAgentMarkdown {
  const trimmed = markdown.trim();

  // Check for frontmatter delimiter
  if (!trimmed.startsWith("---")) {
    throw new AgentMarkdownParseError(
      "Invalid markdown format: missing frontmatter delimiter"
    );
  }

  // Find the closing frontmatter delimiter
  const endDelimiterIndex = trimmed.indexOf("---", 3);
  if (endDelimiterIndex === -1) {
    throw new AgentMarkdownParseError(
      "Invalid markdown format: missing closing frontmatter delimiter"
    );
  }

  // Extract frontmatter YAML and body content
  const frontmatterYaml = trimmed.slice(3, endDelimiterIndex).trim();
  const systemPrompt = trimmed.slice(endDelimiterIndex + 3).trim();

  // Parse YAML frontmatter
  let parsedYaml: unknown;
  try {
    parsedYaml = YAML.parse(frontmatterYaml);
  } catch (error) {
    throw new AgentMarkdownParseError(
      "Invalid YAML in frontmatter",
      error instanceof Error ? error : undefined
    );
  }

  // Validate parsed YAML is an object
  if (typeof parsedYaml !== "object" || parsedYaml === null) {
    throw new AgentMarkdownParseError("Frontmatter must be a YAML object");
  }

  const yaml = parsedYaml as Record<string, unknown>;

  // Validate required fields
  if (typeof yaml.name !== "string" || yaml.name.length === 0) {
    throw new AgentMarkdownParseError(
      "Missing or invalid required field: name"
    );
  }

  if (typeof yaml.displayName !== "string" || yaml.displayName.length === 0) {
    throw new AgentMarkdownParseError(
      "Missing or invalid required field: displayName"
    );
  }

  if (typeof yaml.type !== "string" || !isValidAgentType(yaml.type)) {
    throw new AgentMarkdownParseError(
      `Missing or invalid required field: type (must be one of: ${agentTypes.join(", ")})`
    );
  }

  // Validate version (default to 1 if not provided)
  const version =
    typeof yaml.version === "number" ? yaml.version : AGENT_MARKDOWN_FORMAT_VERSION;

  // Validate optional color
  let color: string | undefined;
  if (yaml.color !== undefined) {
    if (typeof yaml.color !== "string" || !isValidAgentColor(yaml.color)) {
      throw new AgentMarkdownParseError(
        `Invalid color (must be one of: ${agentColors.join(", ")})`
      );
    }
    color = yaml.color;
  }

  // Validate optional description
  let description: string | undefined;
  if (yaml.description !== undefined) {
    if (typeof yaml.description !== "string") {
      throw new AgentMarkdownParseError("Description must be a string");
    }
    description = yaml.description;
  }

  // Parse tools array
  let tools: Array<AgentMarkdownTool> | undefined;
  if (yaml.tools !== undefined) {
    if (!Array.isArray(yaml.tools)) {
      throw new AgentMarkdownParseError("Tools must be an array");
    }

    tools = yaml.tools.map((tool, index) => {
      if (typeof tool !== "object" || tool === null) {
        throw new AgentMarkdownParseError(
          `Invalid tool at index ${index}: must be an object`
        );
      }

      const toolObj = tool as Record<string, unknown>;

      if (typeof toolObj.toolName !== "string" || toolObj.toolName.length === 0) {
        throw new AgentMarkdownParseError(
          `Invalid tool at index ${index}: missing or invalid toolName`
        );
      }

      const result: AgentMarkdownTool = {
        toolName: toolObj.toolName,
      };

      if (toolObj.pattern !== undefined) {
        if (typeof toolObj.pattern !== "string") {
          throw new AgentMarkdownParseError(
            `Invalid tool at index ${index}: pattern must be a string`
          );
        }
        result.pattern = toolObj.pattern;
      }

      return result;
    });
  }

  // Parse skills array
  let skills: Array<AgentMarkdownSkill> | undefined;
  if (yaml.skills !== undefined) {
    if (!Array.isArray(yaml.skills)) {
      throw new AgentMarkdownParseError("Skills must be an array");
    }

    skills = yaml.skills.map((skill, index) => {
      if (typeof skill !== "object" || skill === null) {
        throw new AgentMarkdownParseError(
          `Invalid skill at index ${index}: must be an object`
        );
      }

      const skillObj = skill as Record<string, unknown>;

      if (
        typeof skillObj.skillName !== "string" ||
        skillObj.skillName.length === 0
      ) {
        throw new AgentMarkdownParseError(
          `Invalid skill at index ${index}: missing or invalid skillName`
        );
      }

      // Default isRequired to false if not specified
      const isRequired =
        typeof skillObj.isRequired === "boolean" ? skillObj.isRequired : false;

      return {
        isRequired,
        skillName: skillObj.skillName,
      };
    });
  }

  // Construct frontmatter object
  const frontmatter: AgentMarkdownFrontmatter = {
    displayName: yaml.displayName,
    name: yaml.name,
    type: yaml.type,
    version,
  };

  if (color !== undefined) {
    frontmatter.color = color;
  }

  if (description !== undefined) {
    frontmatter.description = description;
  }

  if (tools !== undefined && tools.length > 0) {
    frontmatter.tools = tools;
  }

  if (skills !== undefined && skills.length > 0) {
    frontmatter.skills = skills;
  }

  return {
    frontmatter,
    systemPrompt,
  };
}

/**
 * Serializes agent data with tools and skills to markdown format.
 *
 * @param data - The agent data with relations to serialize
 * @returns The markdown string with YAML frontmatter
 */
export function serializeAgentToMarkdown(data: AgentWithRelations): string {
  const { agent, skills, tools } = data;

  // Build frontmatter object with required fields first
  const frontmatter: Record<string, unknown> = {
    displayName: agent.displayName,
    name: agent.name,
    type: agent.type,
  };

  // Add optional fields only if they have values
  if (agent.color) {
    frontmatter.color = agent.color;
  }

  if (agent.description) {
    frontmatter.description = agent.description;
  }

  // Always include version
  frontmatter.version = AGENT_MARKDOWN_FORMAT_VERSION;

  // Add tools if present
  if (tools.length > 0) {
    frontmatter.tools = tools.map((tool) => {
      const toolEntry: AgentMarkdownTool = {
        toolName: tool.toolName,
      };

      // Only include pattern if it's not the default "*"
      if (tool.toolPattern && tool.toolPattern !== "*") {
        toolEntry.pattern = tool.toolPattern;
      }

      return toolEntry;
    });
  }

  // Add skills if present
  if (skills.length > 0) {
    frontmatter.skills = skills.map((skill) => ({
      isRequired: skill.requiredAt !== null,
      skillName: skill.skillName,
    }));
  }

  // Serialize frontmatter to YAML
  const yamlContent = YAML.stringify(frontmatter, {
    indent: 2,
    lineWidth: 0, // Disable line wrapping
  }).trim();

  // Combine frontmatter and system prompt
  const systemPromptContent = agent.systemPrompt.trim();

  return `---
${yamlContent}
---

${systemPromptContent}
`;
}

/**
 * Validates that a parsed agent markdown can be round-tripped without data loss.
 * This is useful for testing and verification.
 *
 * @param original - The original markdown string
 * @returns True if round-trip preserves data, false otherwise
 */
export function validateRoundTrip(original: string): boolean {
  try {
    const parsed = parseAgentMarkdown(original);

    // Convert parsed data to AgentWithRelations format
    const agentData: AgentWithRelations = {
      agent: {
        color: parsed.frontmatter.color ?? null,
        description: parsed.frontmatter.description ?? null,
        displayName: parsed.frontmatter.displayName,
        name: parsed.frontmatter.name,
        systemPrompt: parsed.systemPrompt,
        type: parsed.frontmatter.type,
      },
      skills: (parsed.frontmatter.skills ?? []).map((skill) => ({
        requiredAt: skill.isRequired ? new Date().toISOString() : null,
        skillName: skill.skillName,
      })),
      tools: (parsed.frontmatter.tools ?? []).map((tool) => ({
        toolName: tool.toolName,
        toolPattern: tool.pattern ?? "*",
      })),
    };

    const serialized = serializeAgentToMarkdown(agentData);
    const reparsed = parseAgentMarkdown(serialized);

    // Compare frontmatter fields
    if (parsed.frontmatter.name !== reparsed.frontmatter.name) return false;
    if (parsed.frontmatter.displayName !== reparsed.frontmatter.displayName)
      return false;
    if (parsed.frontmatter.type !== reparsed.frontmatter.type) return false;
    if (parsed.frontmatter.color !== reparsed.frontmatter.color) return false;
    if (parsed.frontmatter.description !== reparsed.frontmatter.description)
      return false;

    // Compare system prompt
    if (parsed.systemPrompt !== reparsed.systemPrompt) return false;

    // Compare tools
    const originalTools = parsed.frontmatter.tools ?? [];
    const reparsedTools = reparsed.frontmatter.tools ?? [];
    if (originalTools.length !== reparsedTools.length) return false;
    for (let i = 0; i < originalTools.length; i++) {
      const originalTool = originalTools[i];
      const reparsedTool = reparsedTools[i];
      if (!originalTool || !reparsedTool) return false;
      if (originalTool.toolName !== reparsedTool.toolName) return false;
      // Handle pattern comparison - default "*" should equal undefined
      const originalPattern = originalTool.pattern;
      const reparsedPattern = reparsedTool.pattern;
      if (originalPattern !== reparsedPattern) {
        // Check if one is "*" and the other is undefined (equivalent)
        const origIsDefault =
          originalPattern === "*" || originalPattern === undefined;
        const reparsedIsDefault =
          reparsedPattern === "*" || reparsedPattern === undefined;
        if (!origIsDefault || !reparsedIsDefault) return false;
      }
    }

    // Compare skills
    const originalSkills = parsed.frontmatter.skills ?? [];
    const reparsedSkills = reparsed.frontmatter.skills ?? [];
    if (originalSkills.length !== reparsedSkills.length) return false;
    for (let i = 0; i < originalSkills.length; i++) {
      const originalSkill = originalSkills[i];
      const reparsedSkill = reparsedSkills[i];
      if (!originalSkill || !reparsedSkill) return false;
      if (originalSkill.skillName !== reparsedSkill.skillName) return false;
      if (originalSkill.isRequired !== reparsedSkill.isRequired) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a string is a valid agent color.
 */
function isValidAgentColor(
  color: string
): color is (typeof agentColors)[number] {
  return agentColors.includes(color as (typeof agentColors)[number]);
}

/**
 * Validates that a string is a valid agent type.
 */
function isValidAgentType(type: string): type is (typeof agentTypes)[number] {
  return agentTypes.includes(type as (typeof agentTypes)[number]);
}
