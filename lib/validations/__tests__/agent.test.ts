import { describe, expect, it } from 'vitest';

import { createAgentFormSchema, createAgentSchema } from '../agent';

describe('createAgentSchema', () => {
  const validAgent = {
    displayName: 'Test Agent',
    name: 'test-agent',
    systemPrompt: 'You are a test agent.',
    type: 'planning' as const,
  };

  it('passes with all required fields', () => {
    const result = createAgentSchema.safeParse(validAgent);
    expect(result.success).toBe(true);
  });

  describe('name validation', () => {
    it('accepts lowercase with hyphens: my-agent', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, name: 'my-agent' });
      expect(result.success).toBe(true);
    });

    it('rejects uppercase: My Agent', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, name: 'My Agent' });
      expect(result.success).toBe(false);
    });

    it('rejects starting with number: 123-abc', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, name: '123-abc' });
      expect(result.success).toBe(false);
    });

    it('rejects starting with hyphen: -start', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, name: '-start' });
      expect(result.success).toBe(false);
    });

    it('accepts single letter: a', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, name: 'a' });
      expect(result.success).toBe(true);
    });
  });

  describe('maxThinkingTokens validation', () => {
    it('rejects 999 (below minimum)', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, maxThinkingTokens: 999 });
      expect(result.success).toBe(false);
    });

    it('accepts 1000 (minimum)', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, maxThinkingTokens: 1000 });
      expect(result.success).toBe(true);
    });

    it('accepts 128000 (maximum)', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, maxThinkingTokens: 128000 });
      expect(result.success).toBe(true);
    });

    it('rejects 128001 (above maximum)', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, maxThinkingTokens: 128001 });
      expect(result.success).toBe(false);
    });

    it('accepts null', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, maxThinkingTokens: null });
      expect(result.success).toBe(true);
    });
  });

  describe('systemPrompt validation', () => {
    it('rejects empty string', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, systemPrompt: '' });
      expect(result.success).toBe(false);
    });

    it('rejects string over 50000 chars', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, systemPrompt: 'x'.repeat(50001) });
      expect(result.success).toBe(false);
    });
  });

  describe('model validation', () => {
    it.each(['sonnet', 'opus', 'haiku', 'inherit'])('accepts valid model: %s', (model) => {
      const result = createAgentSchema.safeParse({ ...validAgent, model });
      expect(result.success).toBe(true);
    });

    it('rejects invalid model: gpt-4', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, model: 'gpt-4' });
      expect(result.success).toBe(false);
    });
  });

  describe('type validation', () => {
    it.each(['planning', 'specialist', 'review'])('accepts valid type: %s', (type) => {
      const result = createAgentSchema.safeParse({ ...validAgent, type });
      expect(result.success).toBe(true);
    });

    it('rejects invalid type: custom', () => {
      const result = createAgentSchema.safeParse({ ...validAgent, type: 'custom' });
      expect(result.success).toBe(false);
    });
  });
});

describe('createAgentFormSchema', () => {
  const validFormData = {
    color: 'blue' as const,
    displayName: 'Test Agent',
    name: 'test-agent',
    projectId: '1',
    systemPrompt: 'You are a test agent.',
    type: 'planning' as const,
  };

  it('accepts empty string for model (inherit)', () => {
    const result = createAgentFormSchema.safeParse({ ...validFormData, model: '' });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for permissionMode (default)', () => {
    const result = createAgentFormSchema.safeParse({ ...validFormData, permissionMode: '' });
    expect(result.success).toBe(true);
  });

  it('accepts projectId as a string', () => {
    const result = createAgentFormSchema.safeParse(validFormData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.projectId).toBe('string');
    }
  });
});
