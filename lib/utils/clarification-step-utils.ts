import type { ClarificationAnswer, ClarificationStepOutput } from '../validations/clarification';

import { clarificationStepOutputSchema } from '../validations/clarification';

/**
 * UI phase states for the clarification step component.
 */
export type ClarificationUiPhase = 'answered' | 'error' | 'parse_error' | 'pending' | 'running' | 'skipped' | 'unanswered';

/**
 * Determine the UI phase from step status and parsed output.
 * When a step is completed but the output fails validation, returns 'parse_error'.
 */
export function determineUiPhase(
  stepStatus: string,
  parsedOutput: ClarificationStepOutput | null,
  isParseError: boolean
): ClarificationUiPhase {
  if (stepStatus === 'pending') return 'pending';
  if (stepStatus === 'running') return 'running';
  if (stepStatus === 'failed') return 'error';
  if (stepStatus === 'skipped') return 'skipped';
  if (stepStatus === 'awaiting_input') return 'unanswered';

  // Status is completed
  if (stepStatus === 'completed') {
    // Output exists but failed schema validation
    if (isParseError) return 'parse_error';

    // Skipped via agent assessment or manual skip
    if (parsedOutput?.skipped) return 'skipped';

    // Has questions
    if (parsedOutput?.questions && parsedOutput.questions.length > 0) {
      // Check if answers are present
      if (parsedOutput.answers && Object.keys(parsedOutput.answers).length > 0) {
        return 'answered';
      }
      return 'unanswered';
    }

    // Completed with no questions (agent determined feature is clear)
    return 'skipped';
  }

  return 'pending';
}

/**
 * Format a ClarificationAnswer for display in the answered summary.
 */
export function formatAnswerText(answer: ClarificationAnswer): string {
  switch (answer.type) {
    case 'checkbox': {
      const parts = [...answer.selected];
      if (answer.other) parts.push(`Other: ${answer.other}`);
      return parts.join(', ');
    }
    case 'radio': {
      if (answer.other) return `Other: ${answer.other}`;
      return answer.selected;
    }
    case 'text': {
      return answer.text;
    }
  }
}

/**
 * Parse the step's outputStructured JSON into a typed ClarificationStepOutput.
 * Returns an object with the parsed data and whether parsing failed.
 */
export function parseStepOutput(outputStructured: null | Record<string, unknown>): {
  isParseError: boolean;
  output: ClarificationStepOutput | null;
} {
  if (!outputStructured) return { isParseError: false, output: null };

  const result = clarificationStepOutputSchema.safeParse(outputStructured);
  if (result.success) {
    return { isParseError: false, output: result.data };
  }

  return { isParseError: true, output: null };
}
