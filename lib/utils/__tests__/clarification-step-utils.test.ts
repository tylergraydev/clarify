import { describe, expect, it } from 'vitest';

import type { ClarificationAnswer, ClarificationStepOutput } from '@/lib/validations/clarification';

import { determineUiPhase, formatAnswerText, parseStepOutput } from '../clarification-step-utils';

describe('determineUiPhase', () => {
  it('returns pending for pending status', () => {
    expect(determineUiPhase('pending', null, false)).toBe('pending');
  });

  it('returns running for running status', () => {
    expect(determineUiPhase('running', null, false)).toBe('running');
  });

  it('returns error for failed status', () => {
    expect(determineUiPhase('failed', null, false)).toBe('error');
  });

  it('returns skipped for skipped status', () => {
    expect(determineUiPhase('skipped', null, false)).toBe('skipped');
  });

  it('returns unanswered for awaiting_input status', () => {
    expect(determineUiPhase('awaiting_input', null, false)).toBe('unanswered');
  });

  it('returns parse_error for completed with parse error', () => {
    expect(determineUiPhase('completed', null, true)).toBe('parse_error');
  });

  it('returns skipped for completed with skipped output', () => {
    const output: ClarificationStepOutput = { questions: [], skipped: true };
    expect(determineUiPhase('completed', output, false)).toBe('skipped');
  });

  it('returns answered for completed with questions and answers', () => {
    const output: ClarificationStepOutput = {
      answers: { '0': { selected: 'Yes', type: 'radio' } },
      questions: [
        {
          allowOther: true,
          header: 'Scope',
          options: [
            { description: 'Yes desc', label: 'Yes' },
            { description: 'No desc', label: 'No' },
          ],
          question: 'Is this scoped?',
          questionType: 'radio',
        },
      ],
    };
    expect(determineUiPhase('completed', output, false)).toBe('answered');
  });

  it('returns unanswered for completed with questions but no answers', () => {
    const output: ClarificationStepOutput = {
      questions: [
        {
          allowOther: true,
          header: 'Scope',
          options: [
            { description: 'Yes desc', label: 'Yes' },
            { description: 'No desc', label: 'No' },
          ],
          question: 'Is this scoped?',
          questionType: 'radio',
        },
      ],
    };
    expect(determineUiPhase('completed', output, false)).toBe('unanswered');
  });

  it('returns skipped for completed with no questions', () => {
    const output: ClarificationStepOutput = { questions: [] };
    expect(determineUiPhase('completed', output, false)).toBe('skipped');
  });

  it('returns pending for unknown status', () => {
    expect(determineUiPhase('unknown_status', null, false)).toBe('pending');
  });
});

describe('formatAnswerText', () => {
  it('returns selected value for radio answer', () => {
    const answer: ClarificationAnswer = { selected: 'Option A', type: 'radio' };
    expect(formatAnswerText(answer)).toBe('Option A');
  });

  it('returns Other text for radio with other', () => {
    const answer: ClarificationAnswer = { other: 'Custom', selected: 'Other', type: 'radio' };
    expect(formatAnswerText(answer)).toBe('Other: Custom');
  });

  it('returns comma-joined values for checkbox', () => {
    const answer: ClarificationAnswer = { selected: ['A', 'B', 'C'], type: 'checkbox' };
    expect(formatAnswerText(answer)).toBe('A, B, C');
  });

  it('appends Other to checkbox selections', () => {
    const answer: ClarificationAnswer = { other: 'Extra', selected: ['A'], type: 'checkbox' };
    expect(formatAnswerText(answer)).toBe('A, Other: Extra');
  });

  it('returns text value for text answer', () => {
    const answer: ClarificationAnswer = { text: 'Some free text', type: 'text' };
    expect(formatAnswerText(answer)).toBe('Some free text');
  });
});

describe('parseStepOutput', () => {
  it('returns null output for null input', () => {
    const result = parseStepOutput(null);
    expect(result).toEqual({ isParseError: false, output: null });
  });

  it('parses valid schema-conforming object', () => {
    const valid = {
      questions: [
        {
          header: 'Test',
          options: [
            { description: 'd1', label: 'A' },
            { description: 'd2', label: 'B' },
          ],
          question: 'Q?',
        },
      ],
      skipped: false,
    };
    const result = parseStepOutput(valid);
    expect(result.isParseError).toBe(false);
    expect(result.output).not.toBeNull();
    expect(result.output?.questions).toHaveLength(1);
  });

  it('returns parse error for invalid object', () => {
    const invalid = { notAValidField: true };
    const result = parseStepOutput(invalid as Record<string, unknown>);
    expect(result.isParseError).toBe(true);
    expect(result.output).toBeNull();
  });
});
