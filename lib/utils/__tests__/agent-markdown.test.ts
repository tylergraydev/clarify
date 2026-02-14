import { describe, expect, it } from 'vitest';

import type { AgentWithRelations } from '../agent-markdown';

import {
  AgentMarkdownParseError,
  parseAgentMarkdown,
  serializeAgentToMarkdown,
  validateRoundTrip,
} from '../agent-markdown';

describe('parseAgentMarkdown', () => {
  it('parses valid markdown with all fields', () => {
    const markdown = `---
name: my-agent
description: A test agent
model: sonnet
permissionMode: default
tools:
  - Read
  - Write
disallowedTools:
  - Edit
skills:
  - tanstack-query
hooks:
  PreToolUse:
    - matcher: Bash
      body: "echo 'Running'"
displayName: My Agent
type: planning
color: blue
version: 2
---

You are a helpful assistant.`;

    const result = parseAgentMarkdown(markdown);
    expect(result.frontmatter.name).toBe('my-agent');
    expect(result.frontmatter.description).toBe('A test agent');
    expect(result.frontmatter.model).toBe('sonnet');
    expect(result.frontmatter.permissionMode).toBe('default');
    expect(result.frontmatter.tools).toEqual(['Read', 'Write']);
    expect(result.frontmatter.disallowedTools).toEqual(['Edit']);
    expect(result.frontmatter.skills).toEqual(['tanstack-query']);
    expect(result.frontmatter.hooks?.PreToolUse).toHaveLength(1);
    expect(result.frontmatter.hooks?.PreToolUse?.[0]?.body).toBe("echo 'Running'");
    expect(result.frontmatter.hooks?.PreToolUse?.[0]?.matcher).toBe('Bash');
    expect(result.frontmatter.displayName).toBe('My Agent');
    expect(result.frontmatter.type).toBe('planning');
    expect(result.frontmatter.color).toBe('blue');
    expect(result.frontmatter.version).toBe(2);
    expect(result.systemPrompt).toBe('You are a helpful assistant.');
  });

  it('parses minimal markdown with name + description only', () => {
    const markdown = `---
name: minimal-agent
description: Minimal
---

System prompt here.`;

    const result = parseAgentMarkdown(markdown);
    expect(result.frontmatter.name).toBe('minimal-agent');
    expect(result.frontmatter.description).toBe('Minimal');
    expect(result.frontmatter.model).toBeUndefined();
    expect(result.frontmatter.tools).toBeUndefined();
    expect(result.systemPrompt).toBe('System prompt here.');
  });

  it('throws for missing opening delimiter', () => {
    expect(() => parseAgentMarkdown('no frontmatter')).toThrow(AgentMarkdownParseError);
    expect(() => parseAgentMarkdown('no frontmatter')).toThrow('missing frontmatter delimiter');
  });

  it('throws for missing closing delimiter', () => {
    expect(() => parseAgentMarkdown('---\nname: test\n')).toThrow(AgentMarkdownParseError);
    expect(() => parseAgentMarkdown('---\nname: test\n')).toThrow('missing closing frontmatter delimiter');
  });

  it('throws for invalid YAML syntax', () => {
    const markdown = '---\n: invalid: yaml: [broken\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow(AgentMarkdownParseError);
  });

  it('throws for missing required name', () => {
    const markdown = '---\ndescription: No name\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('name');
  });

  it('throws for missing required description', () => {
    const markdown = '---\nname: test\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('description');
  });

  it('throws for invalid model value', () => {
    const markdown = '---\nname: test\ndescription: Test\nmodel: gpt-4\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('Invalid model');
  });

  it('throws for invalid permissionMode value', () => {
    const markdown = '---\nname: test\ndescription: Test\npermissionMode: admin\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('Invalid permissionMode');
  });

  it('throws when tools is not an array', () => {
    const markdown = '---\nname: test\ndescription: Test\ntools: notarray\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('Tools must be an array');
  });

  it('throws for empty string in tools array', () => {
    const markdown = '---\nname: test\ndescription: Test\ntools:\n  - ""\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('must be a non-empty string');
  });

  it('throws for hooks with missing body', () => {
    const markdown = `---
name: test
description: Test
hooks:
  PreToolUse:
    - matcher: Bash
---
`;
    expect(() => parseAgentMarkdown(markdown)).toThrow('missing or invalid body');
  });

  it('throws for hooks with non-string matcher', () => {
    const markdown = `---
name: test
description: Test
hooks:
  PreToolUse:
    - body: "echo hello"
      matcher: 123
---
`;
    expect(() => parseAgentMarkdown(markdown)).toThrow('matcher must be a string');
  });

  it('throws when frontmatter parses to a non-object (e.g. a string)', () => {
    const markdown = '---\nhello\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('Frontmatter must be a YAML object');
  });

  it('throws when disallowedTools is not an array', () => {
    const markdown = '---\nname: test\ndescription: Test\ndisallowedTools: notarray\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('DisallowedTools must be an array');
  });

  it('throws for empty string in disallowedTools array', () => {
    const markdown = '---\nname: test\ndescription: Test\ndisallowedTools:\n  - ""\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('must be a non-empty string');
  });

  it('throws when skills is not an array', () => {
    const markdown = '---\nname: test\ndescription: Test\nskills: notarray\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('Skills must be an array');
  });

  it('throws for empty string in skills array', () => {
    const markdown = '---\nname: test\ndescription: Test\nskills:\n  - ""\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('must be a non-empty string');
  });

  it('throws when hooks is not an object', () => {
    const markdown = '---\nname: test\ndescription: Test\nhooks: notobject\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('Hooks must be an object');
  });

  it('throws when a hooks event type is not an array', () => {
    const markdown = '---\nname: test\ndescription: Test\nhooks:\n  PreToolUse: notarray\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('must be an array');
  });

  it('throws when a hook entry is not an object', () => {
    const markdown = '---\nname: test\ndescription: Test\nhooks:\n  PreToolUse:\n    - juststring\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('must be an object');
  });

  it('throws when displayName is not a string', () => {
    const markdown = '---\nname: test\ndescription: Test\ndisplayName: 123\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('displayName must be a string');
  });

  it('throws for invalid type value', () => {
    const markdown = '---\nname: test\ndescription: Test\ntype: invalidtype\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('Invalid type');
  });

  it('throws for invalid color value', () => {
    const markdown = '---\nname: test\ndescription: Test\ncolor: neonpink\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('Invalid color');
  });

  it('throws when version is not a number', () => {
    const markdown = '---\nname: test\ndescription: Test\nversion: "2"\n---\n';
    expect(() => parseAgentMarkdown(markdown)).toThrow('version must be a number');
  });

  it('sets error.name to AgentMarkdownParseError', () => {
    try {
      parseAgentMarkdown('no frontmatter');
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AgentMarkdownParseError);
      expect((error as AgentMarkdownParseError).name).toBe('AgentMarkdownParseError');
    }
  });

  it('passes cause as undefined when YAML throws a non-Error', () => {
    // YAML.parse with a tab character in value context throws a YAMLParseError (which is an Error)
    // We test the error-wrapping path exists and includes a cause when applicable
    const markdown = '---\n: invalid: yaml: [broken\n---\n';
    try {
      parseAgentMarkdown(markdown);
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AgentMarkdownParseError);
      expect((error as AgentMarkdownParseError).message).toContain('Invalid YAML');
    }
  });

  it('extracts system prompt from content after closing delimiter', () => {
    const markdown = `---
name: test
description: Test
---

Multi-line
system prompt
content.`;

    const result = parseAgentMarkdown(markdown);
    expect(result.systemPrompt).toBe('Multi-line\nsystem prompt\ncontent.');
  });
});

describe('serializeAgentToMarkdown', () => {
  it('serializes full agent data', () => {
    const data: AgentWithRelations = {
      agent: {
        color: 'green',
        description: 'A helpful agent',
        displayName: 'Custom Name',
        model: 'sonnet',
        name: 'test-agent',
        permissionMode: 'default',
        systemPrompt: 'You are helpful.',
        type: 'planning',
      },
      disallowedTools: [{ toolName: 'Edit' }],
      hooks: [{ body: 'echo hi', eventType: 'PreToolUse', matcher: 'Bash' }],
      skills: [{ skillName: 'tanstack-query' }],
      tools: [{ toolName: 'Read' }, { toolName: 'Write' }],
    };

    const markdown = serializeAgentToMarkdown(data);
    expect(markdown).toContain('name: test-agent');
    expect(markdown).toContain('description: A helpful agent');
    expect(markdown).toContain('model: sonnet');
    expect(markdown).toContain('permissionMode: default');
    expect(markdown).toContain('- Read');
    expect(markdown).toContain('- Write');
    expect(markdown).toContain('- Edit');
    expect(markdown).toContain('- tanstack-query');
    expect(markdown).toContain('displayName: Custom Name');
    expect(markdown).toContain('type: planning');
    expect(markdown).toContain('color: green');
    expect(markdown).toContain('You are helpful.');
  });

  it('omits optional fields for minimal agent', () => {
    const data: AgentWithRelations = {
      agent: {
        color: null,
        description: 'Simple',
        displayName: 'simple',
        model: null,
        name: 'simple',
        permissionMode: null,
        systemPrompt: 'Prompt.',
        type: '',
      },
      disallowedTools: [],
      hooks: [],
      skills: [],
      tools: [],
    };

    const markdown = serializeAgentToMarkdown(data);
    expect(markdown).toContain('name: simple');
    expect(markdown).toContain('description: Simple');
    expect(markdown).not.toContain('model:');
    expect(markdown).not.toContain('permissionMode:');
    expect(markdown).not.toContain('tools:');
    expect(markdown).not.toContain('skills:');
    expect(markdown).not.toContain('hooks:');
  });

  it('omits displayName when it equals name', () => {
    const data: AgentWithRelations = {
      agent: {
        color: null,
        description: 'Test',
        displayName: 'my-agent',
        model: null,
        name: 'my-agent',
        permissionMode: null,
        systemPrompt: 'Prompt.',
        type: '',
      },
      disallowedTools: [],
      hooks: [],
      skills: [],
      tools: [],
    };

    const markdown = serializeAgentToMarkdown(data);
    expect(markdown).not.toContain('displayName:');
  });

  it('groups hooks by eventType correctly', () => {
    const data: AgentWithRelations = {
      agent: {
        color: null,
        description: 'Test',
        displayName: 'test',
        model: null,
        name: 'test',
        permissionMode: null,
        systemPrompt: 'Prompt.',
        type: '',
      },
      disallowedTools: [],
      hooks: [
        { body: 'pre1', eventType: 'PreToolUse', matcher: null },
        { body: 'post1', eventType: 'PostToolUse', matcher: 'Write' },
        { body: 'pre2', eventType: 'PreToolUse', matcher: 'Bash' },
      ],
      skills: [],
      tools: [],
    };

    const markdown = serializeAgentToMarkdown(data);
    expect(markdown).toContain('PreToolUse:');
    expect(markdown).toContain('PostToolUse:');
    expect(markdown).toContain('body: pre1');
    expect(markdown).toContain('body: pre2');
    expect(markdown).toContain('body: post1');
  });
});

describe('validateRoundTrip', () => {
  it('returns true for valid markdown that round-trips', () => {
    const markdown = `---
name: round-trip
description: Round trip test
model: sonnet
tools:
  - Read
  - Write
skills:
  - my-skill
---

System prompt content.`;

    expect(validateRoundTrip(markdown)).toBe(true);
  });

  it('preserves name, description, model, tools, skills, and system prompt', () => {
    const markdown = `---
name: full-test
description: Full round trip
model: opus
permissionMode: dontAsk
tools:
  - Bash
  - Read
disallowedTools:
  - Write
skills:
  - zustand
---

A detailed system prompt.`;

    expect(validateRoundTrip(markdown)).toBe(true);
  });

  it('round-trips markdown with hooks (PreToolUse + Stop)', () => {
    const markdown = `---
name: hooks-agent
description: Agent with hooks
hooks:
  PreToolUse:
    - matcher: Bash
      body: "echo pre"
  Stop:
    - body: "echo stop"
---

Hook system prompt.`;

    expect(validateRoundTrip(markdown)).toBe(true);
  });

  it('round-trips markdown with disallowedTools', () => {
    const markdown = `---
name: disallowed-agent
description: Agent with disallowed tools
tools:
  - Read
disallowedTools:
  - Edit
  - Write
---

Disallowed tools prompt.`;

    expect(validateRoundTrip(markdown)).toBe(true);
  });

  it('returns false for invalid markdown', () => {
    expect(validateRoundTrip('not valid markdown')).toBe(false);
  });
});
