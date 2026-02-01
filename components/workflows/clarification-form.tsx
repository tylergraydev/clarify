'use client';

import type { ReactElement } from 'react';

import { useMemo } from 'react';

import type { ClarificationAnswers, ClarificationQuestion } from '@/lib/validations/clarification';

import { Button } from '@/components/ui/button';
import { useAppForm } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

interface ClarificationFormProps {
  /** Optional className for styling */
  className?: string;
  /** Existing answers (for pre-populating if user returns to form) */
  existingAnswers?: ClarificationAnswers;
  /** Loading state during submission */
  isSubmitting?: boolean;
  /** Callback when user clicks Skip */
  onSkip: () => void;
  /** Callback when user submits answers */
  onSubmit: (answers: ClarificationAnswers) => void;
  /** Questions array from outputStructured.questions */
  questions: Array<ClarificationQuestion>;
}

/**
 * ClarificationForm renders clarification questions as a form with RadioField options.
 * Each option includes a description to help users make informed choices.
 * Users can select answers for each question and either submit or skip the clarification step.
 */
export const ClarificationForm = ({
  className,
  existingAnswers,
  isSubmitting = false,
  onSkip,
  onSubmit,
  questions,
}: ClarificationFormProps): ReactElement => {
  // Build default values from questions array, using existing answers if available
  const defaultValues = useMemo(() => {
    const values: Record<string, string> = {};
    questions.forEach((_, index) => {
      const key = String(index);
      values[key] = existingAnswers?.[key] ?? '';
    });
    return values;
  }, [questions, existingAnswers]);

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      // Transform form values to ClarificationAnswers format
      const answers: ClarificationAnswers = {};
      Object.entries(value).forEach(([key, val]) => {
        if (val) {
          answers[key] = val;
        }
      });
      onSubmit(answers);
    },
  });

  const questionCount = questions.length;
  const questionLabel = questionCount === 1 ? 'question' : 'questions';

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Question Count Header */}
      <div className={'text-sm text-muted-foreground'}>
        {questionCount} {questionLabel} to answer
      </div>

      {/* Form */}
      <form
        className={'flex flex-col gap-6'}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        {/* Questions */}
        <div className={'flex flex-col gap-6'}>
          {questions.map((question, index) => {
            const fieldName = String(index);
            const options = question.options.map((option) => ({
              description: option.description,
              label: option.label,
              value: option.label,
            }));

            return (
              <div className={'rounded-lg border border-border bg-card/50 p-4'} key={fieldName}>
                {/* Question Header */}
                <div className={'mb-1 text-sm font-medium text-foreground'}>{question.header}</div>

                {/* Question Text */}
                <div className={'mb-4 text-sm text-muted-foreground'}>{question.question}</div>

                {/* Radio Field - Shows options with descriptions */}
                <form.AppField name={fieldName}>
                  {(field) => <field.RadioField isDisabled={isSubmitting} label={''} options={options} />}
                </form.AppField>
              </div>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className={'flex items-center justify-end gap-3'}>
          {/* Skip Button */}
          <Button disabled={isSubmitting} onClick={onSkip} type={'button'} variant={'ghost'}>
            Skip
          </Button>

          {/* Submit Button */}
          <form.AppForm>
            <form.SubmitButton>{isSubmitting ? 'Submitting...' : 'Submit Answers'}</form.SubmitButton>
          </form.AppForm>
        </div>
      </form>
    </div>
  );
};
