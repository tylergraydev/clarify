import YAML from 'yaml';

import type { AgentHook } from '../../db/schema/agent-hooks.schema';
import type { AgentSkill } from '../../db/schema/agent-skills.schema';
import type { AgentTool } from '../../db/schema/agent-tools.schema';
import type { Agent } from '../../db/schema/agents.schema';

import { agentColors, agentModels, agentPermissionModes, agentTypes } from '../../db/schema/agents.schema';

/**
 * Current format version for agent markdown files.
 * Increment when making breaking changes to the format.
 */
export const AGENT_MARKDOWN_FORMAT_VERSION = 2;

/**
 * Frontmatter structure for agent markdown files.
 * Matches the official Claude Code subagent specification.
 */
export interface AgentMarkdownFrontmatter {
  // Clarify-specific fields (not exported to Claude Code format)
  color?: string;
  // Required by Claude Code spec
  description: string;

  // Optional Claude Code fields
  disallowedTools?: Array<string>;
  displayName?: string;
  hooks?: AgentMarkdownHooks;
  model?: (typeof agentModels)[number];
  name: string;
  permissionMode?: (typeof agentPermissionModes)[number];

  skills?: Array<string>;
  tools?: Array<string>;
  type?: string;
  version?: number;
}

/**
 * Hook entry structure matching Claude Code specification.
 */
export interface AgentMarkdownHookEntry {
  body: string;
  matcher?: string;
}

/**
 * Hooks structure matching Claude Code specification.
 */
export interface AgentMarkdownHooks {
  PostToolUse?: Array<AgentMarkdownHookEntry>;
  PreToolUse?: Array<AgentMarkdownHookEntry>;
  Stop?: Array<AgentMarkdownHookEntry>;
}

/**
 * Agent data with associated tools, skills, and hooks for serialization.
 */
export interface AgentWithRelations {
  agent: Pick<
    Agent,
    'color' | 'description' | 'displayName' | 'model' | 'name' | 'permissionMode' | 'systemPrompt' | 'type'
  >;
  disallowedTools: Array<Pick<AgentTool, 'toolName'>>;
  hooks: Array<Pick<AgentHook, 'body' | 'eventType' | 'matcher'>>;
  skills: Array<Pick<AgentSkill, 'skillName'>>;
  tools: Array<Pick<AgentTool, 'toolName'>>;
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
    this.name = 'AgentMarkdownParseError';
  }
}

/**
 * Parses a markdown string with YAML frontmatter into agent data.
 *
 * Expected format (Claude Code subagent specification):
 * ```markdown
 * ---
 * name: my-agent-name
 * description: When to use this agent
 * model: sonnet
 * permissionMode: default
 * tools:
 *   - Read
 *   - Write
 * disallowedTools:
 *   - Edit
 * skills:
 *   - tanstack-query
 * hooks:
 *   PreToolUse:
 *     - matcher: Bash
 *       body: "echo 'Running'"
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
  if (!trimmed.startsWith('---')) {
    throw new AgentMarkdownParseError('Invalid markdown format: missing frontmatter delimiter');
  }

  // Find the closing frontmatter delimiter
  const endDelimiterIndex = trimmed.indexOf('---', 3);
  if (endDelimiterIndex === -1) {
    throw new AgentMarkdownParseError('Invalid markdown format: missing closing frontmatter delimiter');
  }

  // Extract frontmatter YAML and body content
  const frontmatterYaml = trimmed.slice(3, endDelimiterIndex).trim();
  const systemPrompt = trimmed.slice(endDelimiterIndex + 3).trim();

  // Parse YAML frontmatter
  let parsedYaml: unknown;
  try {
    parsedYaml = YAML.parse(frontmatterYaml);
  } catch (error) {
    throw new AgentMarkdownParseError('Invalid YAML in frontmatter', error instanceof Error ? error : undefined);
  }

  // Validate parsed YAML is an object
  if (typeof parsedYaml !== 'object' || parsedYaml === null) {
    throw new AgentMarkdownParseError('Frontmatter must be a YAML object');
  }

  const yaml = parsedYaml as Record<string, unknown>;

  // Validate required fields (Claude Code spec)
  if (typeof yaml.name !== 'string' || yaml.name.length === 0) {
    throw new AgentMarkdownParseError('Missing or invalid required field: name');
  }

  if (typeof yaml.description !== 'string' || yaml.description.length === 0) {
    throw new AgentMarkdownParseError('Missing or invalid required field: description');
  }

  // Validate optional model
  let model: (typeof agentModels)[number] | undefined;
  if (yaml.model !== undefined) {
    if (typeof yaml.model !== 'string' || !isValidAgentModel(yaml.model)) {
      throw new AgentMarkdownParseError(`Invalid model (must be one of: ${agentModels.join(', ')})`);
    }
    model = yaml.model;
  }

  // Validate optional permissionMode
  let permissionMode: (typeof agentPermissionModes)[number] | undefined;
  if (yaml.permissionMode !== undefined) {
    if (typeof yaml.permissionMode !== 'string' || !isValidAgentPermissionMode(yaml.permissionMode)) {
      throw new AgentMarkdownParseError(`Invalid permissionMode (must be one of: ${agentPermissionModes.join(', ')})`);
    }
    permissionMode = yaml.permissionMode;
  }

  // Parse tools array (simple string array in Claude Code format)
  let tools: Array<string> | undefined;
  if (yaml.tools !== undefined) {
    if (!Array.isArray(yaml.tools)) {
      throw new AgentMarkdownParseError('Tools must be an array');
    }

    tools = yaml.tools.map((tool, index) => {
      if (typeof tool !== 'string' || tool.length === 0) {
        throw new AgentMarkdownParseError(`Invalid tool at index ${index}: must be a non-empty string`);
      }
      return tool;
    });
  }

  // Parse disallowedTools array (simple string array)
  let disallowedTools: Array<string> | undefined;
  if (yaml.disallowedTools !== undefined) {
    if (!Array.isArray(yaml.disallowedTools)) {
      throw new AgentMarkdownParseError('DisallowedTools must be an array');
    }

    disallowedTools = yaml.disallowedTools.map((tool, index) => {
      if (typeof tool !== 'string' || tool.length === 0) {
        throw new AgentMarkdownParseError(`Invalid disallowedTool at index ${index}: must be a non-empty string`);
      }
      return tool;
    });
  }

  // Parse skills array (simple string array in Claude Code format)
  let skills: Array<string> | undefined;
  if (yaml.skills !== undefined) {
    if (!Array.isArray(yaml.skills)) {
      throw new AgentMarkdownParseError('Skills must be an array');
    }

    skills = yaml.skills.map((skill, index) => {
      if (typeof skill !== 'string' || skill.length === 0) {
        throw new AgentMarkdownParseError(`Invalid skill at index ${index}: must be a non-empty string`);
      }
      return skill;
    });
  }

  // Parse hooks object
  let hooks: AgentMarkdownHooks | undefined;
  if (yaml.hooks !== undefined) {
    if (typeof yaml.hooks !== 'object' || yaml.hooks === null) {
      throw new AgentMarkdownParseError('Hooks must be an object');
    }

    const hooksObj = yaml.hooks as Record<string, unknown>;
    hooks = {};

    for (const eventType of ['PreToolUse', 'PostToolUse', 'Stop'] as const) {
      if (hooksObj[eventType] !== undefined) {
        if (!Array.isArray(hooksObj[eventType])) {
          throw new AgentMarkdownParseError(`hooks.${eventType} must be an array`);
        }

        hooks[eventType] = (hooksObj[eventType] as Array<unknown>).map((entry, index) => {
          if (typeof entry !== 'object' || entry === null) {
            throw new AgentMarkdownParseError(`Invalid hook entry at hooks.${eventType}[${index}]: must be an object`);
          }

          const entryObj = entry as Record<string, unknown>;

          if (typeof entryObj.body !== 'string' || entryObj.body.length === 0) {
            throw new AgentMarkdownParseError(
              `Invalid hook entry at hooks.${eventType}[${index}]: missing or invalid body`
            );
          }

          const result: AgentMarkdownHookEntry = { body: entryObj.body };

          if (entryObj.matcher !== undefined) {
            if (typeof entryObj.matcher !== 'string') {
              throw new AgentMarkdownParseError(
                `Invalid hook entry at hooks.${eventType}[${index}]: matcher must be a string`
              );
            }
            result.matcher = entryObj.matcher;
          }

          return result;
        });
      }
    }
  }

  // Validate optional Clarify-specific fields
  let displayName: string | undefined;
  if (yaml.displayName !== undefined) {
    if (typeof yaml.displayName !== 'string') {
      throw new AgentMarkdownParseError('displayName must be a string');
    }
    displayName = yaml.displayName;
  }

  let type: string | undefined;
  if (yaml.type !== undefined) {
    if (typeof yaml.type !== 'string' || !isValidAgentType(yaml.type)) {
      throw new AgentMarkdownParseError(`Invalid type (must be one of: ${agentTypes.join(', ')})`);
    }
    type = yaml.type;
  }

  let color: string | undefined;
  if (yaml.color !== undefined) {
    if (typeof yaml.color !== 'string' || !isValidAgentColor(yaml.color)) {
      throw new AgentMarkdownParseError(`Invalid color (must be one of: ${agentColors.join(', ')})`);
    }
    color = yaml.color;
  }

  let version: number | undefined;
  if (yaml.version !== undefined) {
    if (typeof yaml.version !== 'number') {
      throw new AgentMarkdownParseError('version must be a number');
    }
    version = yaml.version;
  }

  // Construct frontmatter object with required fields
  const frontmatter: AgentMarkdownFrontmatter = {
    description: yaml.description,
    name: yaml.name,
  };

  // Add optional Claude Code fields
  if (model !== undefined) {
    frontmatter.model = model;
  }

  if (permissionMode !== undefined) {
    frontmatter.permissionMode = permissionMode;
  }

  if (tools !== undefined && tools.length > 0) {
    frontmatter.tools = tools;
  }

  if (disallowedTools !== undefined && disallowedTools.length > 0) {
    frontmatter.disallowedTools = disallowedTools;
  }

  if (skills !== undefined && skills.length > 0) {
    frontmatter.skills = skills;
  }

  if (hooks !== undefined && Object.keys(hooks).length > 0) {
    frontmatter.hooks = hooks;
  }

  // Add Clarify-specific fields
  if (displayName !== undefined) {
    frontmatter.displayName = displayName;
  }

  if (type !== undefined) {
    frontmatter.type = type;
  }

  if (color !== undefined) {
    frontmatter.color = color;
  }

  if (version !== undefined) {
    frontmatter.version = version;
  }

  return {
    frontmatter,
    systemPrompt,
  };
}

/**
 * Serializes agent data with tools and skills to markdown format.
 * Output matches the official Claude Code subagent specification.
 *
 * @param data - The agent data with relations to serialize
 * @returns The markdown string with YAML frontmatter
 */
export function serializeAgentToMarkdown(data: AgentWithRelations): string {
  const { agent, disallowedTools, hooks, skills, tools } = data;

  // Build frontmatter object with required Claude Code fields first
  const frontmatter: Record<string, unknown> = {
    description: agent.description ?? '',
    name: agent.name,
  };

  // Add optional Claude Code fields
  if (agent.model) {
    frontmatter.model = agent.model;
  }

  if (agent.permissionMode) {
    frontmatter.permissionMode = agent.permissionMode;
  }

  // Add tools as simple string array (Claude Code format)
  if (tools.length > 0) {
    frontmatter.tools = tools.map((tool) => tool.toolName);
  }

  // Add disallowedTools as simple string array
  if (disallowedTools.length > 0) {
    frontmatter.disallowedTools = disallowedTools.map((tool) => tool.toolName);
  }

  // Add skills as simple string array (Claude Code format)
  if (skills.length > 0) {
    frontmatter.skills = skills.map((skill) => skill.skillName);
  }

  // Add hooks if present
  if (hooks.length > 0) {
    const hooksObj: AgentMarkdownHooks = {};

    for (const hook of hooks) {
      const eventType = hook.eventType as keyof AgentMarkdownHooks;
      if (!hooksObj[eventType]) {
        hooksObj[eventType] = [];
      }

      const entry: AgentMarkdownHookEntry = { body: hook.body };
      if (hook.matcher) {
        entry.matcher = hook.matcher;
      }

      hooksObj[eventType]!.push(entry);
    }

    frontmatter.hooks = hooksObj;
  }

  // Add Clarify-specific fields (safely ignored by Claude Code parsers)
  // Add displayName if it differs from name
  if (agent.displayName && agent.displayName !== agent.name) {
    frontmatter.displayName = agent.displayName;
  }

  // Add type
  if (agent.type) {
    frontmatter.type = agent.type;
  }

  // Add color
  if (agent.color) {
    frontmatter.color = agent.color;
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
        description: parsed.frontmatter.description,
        displayName: parsed.frontmatter.displayName ?? parsed.frontmatter.name,
        model: parsed.frontmatter.model ?? null,
        name: parsed.frontmatter.name,
        permissionMode: parsed.frontmatter.permissionMode ?? null,
        systemPrompt: parsed.systemPrompt,
        type: parsed.frontmatter.type ?? 'specialist',
      },
      disallowedTools: (parsed.frontmatter.disallowedTools ?? []).map((toolName) => ({ toolName })),
      hooks: [],
      skills: (parsed.frontmatter.skills ?? []).map((skillName) => ({
        skillName,
      })),
      tools: (parsed.frontmatter.tools ?? []).map((toolName) => ({ toolName })),
    };

    // Convert hooks from object to array format
    if (parsed.frontmatter.hooks) {
      for (const eventType of ['PreToolUse', 'PostToolUse', 'Stop'] as const) {
        const eventHooks = parsed.frontmatter.hooks[eventType];
        if (eventHooks) {
          for (const hook of eventHooks) {
            agentData.hooks.push({
              body: hook.body,
              eventType,
              matcher: hook.matcher ?? null,
            });
          }
        }
      }
    }

    const serialized = serializeAgentToMarkdown(agentData);
    const reparsed = parseAgentMarkdown(serialized);

    // Compare required frontmatter fields
    if (parsed.frontmatter.name !== reparsed.frontmatter.name) return false;
    if (parsed.frontmatter.description !== reparsed.frontmatter.description) return false;

    // Compare system prompt
    if (parsed.systemPrompt !== reparsed.systemPrompt) return false;

    // Compare optional Claude Code fields
    if (parsed.frontmatter.model !== reparsed.frontmatter.model) return false;
    if (parsed.frontmatter.permissionMode !== reparsed.frontmatter.permissionMode) return false;

    // Compare tools (simple string arrays)
    const originalTools = parsed.frontmatter.tools ?? [];
    const reparsedTools = reparsed.frontmatter.tools ?? [];
    if (originalTools.length !== reparsedTools.length) return false;
    for (let i = 0; i < originalTools.length; i++) {
      if (originalTools[i] !== reparsedTools[i]) return false;
    }

    // Compare disallowedTools
    const originalDisallowed = parsed.frontmatter.disallowedTools ?? [];
    const reparsedDisallowed = reparsed.frontmatter.disallowedTools ?? [];
    if (originalDisallowed.length !== reparsedDisallowed.length) return false;
    for (let i = 0; i < originalDisallowed.length; i++) {
      if (originalDisallowed[i] !== reparsedDisallowed[i]) return false;
    }

    // Compare skills (simple string arrays)
    const originalSkills = parsed.frontmatter.skills ?? [];
    const reparsedSkills = reparsed.frontmatter.skills ?? [];
    if (originalSkills.length !== reparsedSkills.length) return false;
    for (let i = 0; i < originalSkills.length; i++) {
      if (originalSkills[i] !== reparsedSkills[i]) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a string is a valid agent color.
 */
function isValidAgentColor(color: string): color is (typeof agentColors)[number] {
  return agentColors.includes(color as (typeof agentColors)[number]);
}

/**
 * Validates that a string is a valid agent model.
 */
function isValidAgentModel(model: string): model is (typeof agentModels)[number] {
  return agentModels.includes(model as (typeof agentModels)[number]);
}

/**
 * Validates that a string is a valid agent permission mode.
 */
function isValidAgentPermissionMode(mode: string): mode is (typeof agentPermissionModes)[number] {
  return agentPermissionModes.includes(mode as (typeof agentPermissionModes)[number]);
}

/**
 * Validates that a string is a valid agent type.
 */
function isValidAgentType(type: string): type is (typeof agentTypes)[number] {
  return agentTypes.includes(type as (typeof agentTypes)[number]);
}
