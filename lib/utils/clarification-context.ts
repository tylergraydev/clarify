import type { ClarificationStepOutput } from '@/lib/validations/clarification';

/**
 * Formats clarification Q&A pairs into structured context for refinement.
 * Returns an object with questions, answers, and optional assessment.
 *
 * @param output - The clarification step output containing questions and answers
 * @returns Structured context object or null if no Q&A data
 */
export function buildClarificationContextForRefinement(
  output: ClarificationStepOutput | null
): null | {
  answers: Record<string, string>;
  assessment?: { reason: string; score: number };
  questions: Array<{ header: string; options: Array<{ description: string; label: string }>; question: string }>;
} {
  if (!output?.questions?.length || !output.answers) {
    return null;
  }

  const answers: Record<string, string> = {};
  const questions = output.questions.map((q, idx) => {
    const answer = output.answers?.[String(idx)];
    let answerText = '';

    if (answer) {
      if (answer.type === 'radio') {
        answerText = answer.other ? `Other: ${answer.other}` : answer.selected;
      } else if (answer.type === 'checkbox') {
        answerText = answer.selected.join(', ');
        if (answer.other) {
          answerText += `, Other: ${answer.other}`;
        }
      } else {
        answerText = answer.text;
      }
    }

    answers[String(idx)] = answerText;

    return {
      header: q.header,
      options: q.options ?? [],
      question: q.question,
    };
  });

  return { answers, questions };
}

/**
 * Formats clarification Q&A pairs into a human-readable string context.
 * Used when passing prior answers as input text for subsequent clarification runs.
 *
 * @param output - The clarification step output containing questions and answers
 * @returns Formatted string or null if no Q&A data
 */
export function formatClarificationContext(output: ClarificationStepOutput | null): null | string {
  if (!output?.questions?.length || !output.answers) {
    return null;
  }

  const lines: Array<string> = [];

  output.questions.forEach((question, index) => {
    const answer = output.answers?.[String(index)];
    if (!answer) {
      return;
    }

    // Extract the selected value(s) based on answer type
    let answerText: string;
    if (answer.type === 'radio') {
      answerText = answer.selected;
      if (answer.other) {
        answerText = `Other: ${answer.other}`;
      }
    } else if (answer.type === 'checkbox') {
      answerText = answer.selected.join(', ');
      if (answer.other) {
        answerText += `, Other: ${answer.other}`;
      }
    } else {
      answerText = answer.text;
    }

    lines.push(`${index + 1}. ${question.header}`);
    lines.push(`Question: ${question.question}`);

    // Try to find the option description if it's a radio/checkbox answer
    if ((answer.type === 'radio' || answer.type === 'checkbox') && question.options) {
      const selectedOption = question.options.find((option) => option.label === answer.selected);
      if (selectedOption?.description) {
        lines.push(`Answer: ${answerText} - ${selectedOption.description}`);
      } else {
        lines.push(`Answer: ${answerText}`);
      }
    } else {
      lines.push(`Answer: ${answerText}`);
    }

    lines.push('');
  });

  const trimmed = lines.join('\n').trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Formats clarification Q&A pairs into a human-readable string for display.
 * Simplified version without option descriptions.
 *
 * @param output - The clarification step output containing questions and answers
 * @returns Formatted string or null if no Q&A data
 */
export function formatClarificationContextForDisplay(output: ClarificationStepOutput | null): null | string {
  if (!output?.questions?.length || !output.answers) {
    return null;
  }

  const lines: Array<string> = [];

  output.questions.forEach((question, index) => {
    const answer = output.answers?.[String(index)];
    if (!answer) {
      return;
    }

    let answerText: string;
    if (answer.type === 'radio') {
      answerText = answer.other ? `Other: ${answer.other}` : answer.selected;
    } else if (answer.type === 'checkbox') {
      answerText = answer.selected.join(', ');
      if (answer.other) {
        answerText += `, Other: ${answer.other}`;
      }
    } else {
      answerText = answer.text;
    }

    lines.push(`${index + 1}. ${question.header}`);
    lines.push(`Question: ${question.question}`);
    lines.push(`Answer: ${answerText}`);
    lines.push('');
  });

  const trimmed = lines.join('\n').trim();
  return trimmed.length > 0 ? trimmed : null;
}
