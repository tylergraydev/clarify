import { z } from 'zod';

/**
 * Schema for a single clarification option.
 * Each option has a label and description that the user can select.
 */
export const clarificationOptionSchema = z.object({
  description: z.string(),
  label: z.string().min(1, 'Option label is required'),
});

export type ClarificationOption = z.infer<typeof clarificationOptionSchema>;

/**
 * Schema for a single clarification question.
 * Each question has:
 * - question: The full question text to display
 * - header: Short label for the question (e.g., "Storage", "Scope")
 * - options: Array of 2-4 selectable options
 */
export const clarificationQuestionSchema = z.object({
  header: z.string().min(1, 'Question header is required'),
  options: z
    .array(clarificationOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(4, 'Maximum 4 options allowed'),
  question: z.string().min(1, 'Question text is required'),
});

export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;

/**
 * Schema for an array of clarification questions.
 */
export const clarificationQuestionsArraySchema = z.array(clarificationQuestionSchema);

export type ClarificationQuestions = z.infer<typeof clarificationQuestionsArraySchema>;

/**
 * Schema for clarification answers.
 * Maps question index (as string "0", "1", etc.) to the selected option label.
 */
export const clarificationAnswersSchema = z.record(z.string(), z.string());

export type ClarificationAnswers = z.infer<typeof clarificationAnswersSchema>;

/**
 * Schema for the assessment object in clarification output.
 * Contains a clarity score (1-5) and reason for the assessment.
 */
export const clarificationAssessmentSchema = z.object({
  reason: z.string(),
  score: z.number().int().min(1, 'Score must be at least 1').max(5, 'Score must be at most 5'),
});

export type ClarificationAssessment = z.infer<typeof clarificationAssessmentSchema>;

/**
 * Schema for the complete clarification step output structure.
 * This matches the outputStructured field in workflow steps for clarification.
 */
export const clarificationStepOutputSchema = z.object({
  answers: clarificationAnswersSchema.optional(),
  assessment: clarificationAssessmentSchema.optional(),
  questions: clarificationQuestionsArraySchema,
  rawOutput: z.string().optional(),
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
});

export type ClarificationStepOutput = z.infer<typeof clarificationStepOutputSchema>;
