'use client';

import type { ReactElement } from 'react';

import { useStore } from '@tanstack/react-form';
import { useEffect, useMemo } from 'react';

import type { ClarificationAnswers, ClarificationQuestion } from '@/lib/validations/clarification';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useAppForm } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

interface ClarificationFormProps {
  /** Optional className for styling */
  className?: string;
  /** Existing answers (for pre-populating if user returns to form) */
  existingAnswers?: ClarificationAnswers;
  /** Loading state during submission */
  isSubmitting?: boolean;
  /** Callback when progress changes */
  onProgressChange?: (answeredCount: number, totalCount: number) => void;
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
  onProgressChange,
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
  const formValues = useStore(form.store, (state) => state.values);
  const answeredCount = useMemo(() => Object.values(formValues).filter((value) => Boolean(value)).length, [formValues]);
  const progressPercent = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0;
  const isIncomplete = answeredCount < questionCount;
  const _shouldShowDisabledTooltip = isIncomplete && !isSubmitting;

  useEffect(() => {
    onProgressChange?.(answeredCount, questionCount);
  }, [answeredCount, questionCount, onProgressChange]);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className={'border-b border-border/60 px-6 pt-6 pb-4'}>
        <div className={'flex flex-wrap items-center justify-between gap-3'}>
          <div>
            <div className={'text-xs tracking-[0.2em] text-muted-foreground uppercase'}>Questions</div>
            <div className={'mt-1 text-lg font-semibold text-foreground'}>
              Answer {questionCount} {questionLabel}
            </div>
          </div>
          <div className={'text-sm text-muted-foreground'}>
            {answeredCount} of {questionCount} answered
          </div>
        </div>
        <div className={'mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted'}>
          <div
            className={'h-full rounded-full bg-accent transition-all duration-300'}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <form
        className={'flex min-h-0 flex-1 flex-col'}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div className={'min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto'}>
          {questions.map((question, index) => {
            const fieldName = String(index);
            const options = question.options.map((option) => ({
              description: option.description,
              label: option.label,
              value: option.label,
            }));

            return (
              <div className={'px-6 py-5'} key={fieldName}>
                <div className={'flex items-start gap-3'}>
                  <div
                    className={
                      'mt-0.5 flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold'
                    }
                  >
                    {index + 1}
                  </div>
                  <div className={'flex-1'}>
                    <div className={'text-sm font-medium text-foreground'}>{question.header}</div>
                    <div className={'mt-1 text-sm text-muted-foreground'}>{question.question}</div>
                  </div>
                </div>
                <div className={'mt-4'}>
                  <form.AppField name={fieldName}>
                    {(field) => <field.RadioField isDisabled={isSubmitting} label={''} options={options} />}
                  </form.AppField>
                </div>
              </div>
            );
          })}
        </div>

        <div className={'sticky bottom-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur-sm'}>
          <div className={'flex flex-wrap items-center justify-between gap-3'}>
            <div className={'text-xs text-muted-foreground'}>
              You can skip clarification to continue without answering.
            </div>
            <div className={'flex items-center gap-3'}>
              <Button disabled={isSubmitting} onClick={onSkip} type={'button'} variant={'ghost'}>
                Skip
              </Button>
              <form.AppForm>
                {_shouldShowDisabledTooltip ? (
                  <Tooltip content={'Answer all questions to submit'} side={'top'}>
                    <span>
                      <form.SubmitButton isDisabled={true}>Submit Answers</form.SubmitButton>
                    </span>
                  </Tooltip>
                ) : (
                  <form.SubmitButton>{isSubmitting ? 'Submitting...' : 'Submit Answers'}</form.SubmitButton>
                )}
              </form.AppForm>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
