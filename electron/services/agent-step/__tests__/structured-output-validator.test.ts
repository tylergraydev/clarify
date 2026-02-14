import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { StructuredOutputValidator } from '../structured-output-validator';

vi.mock('../../debug-logger.service', () => ({
  debugLoggerService: {
    logSdkEvent: vi.fn(),
  },
}));

const testSchema = z.object({
  name: z.string(),
  score: z.number(),
});

function makeResultMessage(overrides: Record<string, unknown>): SDKResultMessage {
  return {
    duration_ms: 1000,
    is_error: false,
    num_turns: 1,
    role: 'result',
    session_id: 'test-session',
    subtype: 'success',
    total_cost_usd: 0.01,
    type: 'result',
    usage: { input_tokens: 100, output_tokens: 50 },
    ...overrides,
  } as unknown as SDKResultMessage;
}

describe('StructuredOutputValidator.validate', () => {
  let validator: StructuredOutputValidator<typeof testSchema>;

  beforeEach(() => {
    validator = new StructuredOutputValidator(testSchema);
    vi.clearAllMocks();
  });

  it('returns failure for error_max_structured_output_retries subtype', () => {
    const msg = makeResultMessage({
      subtype: 'error_max_structured_output_retries',
    });
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('could not produce valid structured output');
    }
  });

  it('returns failure for error subtype', () => {
    const msg = makeResultMessage({ subtype: 'error' });
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Agent execution failed');
    }
  });

  it('returns failure for success with no structured_output', () => {
    const msg = makeResultMessage({ subtype: 'success' });
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('no structured output');
    }
  });

  it('returns success for valid structured output', () => {
    const msg = makeResultMessage({
      structured_output: { name: 'test', score: 42 },
      subtype: 'success',
    });
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'test', score: 42 });
    }
  });

  it('returns failure for error_max_structured_output_retries with errors property', () => {
    const msg = makeResultMessage({
      errors: ['parse error 1', 'parse error 2'],
      subtype: 'error_max_structured_output_retries',
    });
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('parse error 1');
      expect(result.error).toContain('parse error 2');
    }
  });

  it('returns failure for error_max_structured_output_retries without errors property', () => {
    const msg = makeResultMessage({
      subtype: 'error_max_structured_output_retries',
    });
    // Ensure no 'errors' property exists on the message
    delete (msg as Record<string, unknown>).errors;
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('could not produce valid structured output');
    }
  });

  it('returns failure for non-success subtype with errors property', () => {
    const msg = makeResultMessage({
      errors: ['some error'],
      subtype: 'error',
    });
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('some error');
    }
  });

  it('returns failure for non-success subtype without errors property', () => {
    const msg = makeResultMessage({ subtype: 'error' });
    // Ensure no 'errors' property exists on the message
    delete (msg as Record<string, unknown>).errors;
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Agent execution failed');
    }
  });

  it('returns failure for output failing Zod validation', () => {
    const msg = makeResultMessage({
      structured_output: { name: 123, score: 'not a number' },
      subtype: 'success',
    });
    const result = validator.validate(msg, 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('validation failed');
    }
  });
});

describe('StructuredOutputValidator.validateField', () => {
  let validator: StructuredOutputValidator<typeof testSchema>;

  beforeEach(() => {
    validator = new StructuredOutputValidator(testSchema);
    vi.clearAllMocks();
  });

  it('returns failure for undefined field', () => {
    const data = { other: 'value' } as unknown as Record<string, unknown>;
    const result = validator.validateField(data, 'missing', 'sess-1');
    expect(result.success).toBe(false);
  });

  it('returns failure for null field', () => {
    const data = { field: null };
    const result = validator.validateField(data, 'field', 'sess-1');
    expect(result.success).toBe(false);
  });

  it('returns failure for empty array', () => {
    const data = { items: [] as Array<string> };
    const result = validator.validateField(data, 'items', 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('empty array');
    }
  });

  it('returns failure for empty/whitespace string', () => {
    const data = { name: '   ' };
    const result = validator.validateField(data, 'name', 'sess-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('empty string');
    }
  });

  it('returns success for valid non-empty field', () => {
    const data = { name: 'test', score: 42 };
    const result = validator.validateField(data, 'name', 'sess-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });
});
