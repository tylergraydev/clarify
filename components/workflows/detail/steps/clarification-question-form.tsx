'use client';

import { useStore } from '@tanstack/react-form';
import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import type { ClarificationAnswer, ClarificationQuestion } from '@/lib/validations/clarification';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAppForm } from '@/lib/forms';
import { useWorkflowDetailStore } from '@/lib/stores/workflow-detail-store';
import { cn } from '@/lib/utils';

// =============================================================================
// Constants
// =============================================================================

const OTHER_OPTION_VALUE = '__other__';

// =============================================================================
// Types
// =============================================================================

/**
 * Form values shape for the clarification question form.
 * Uses a flat structure with indexed keys for each question's selection and optional "other" text.
 */
interface ClarificationFormValues {
  /** Checkbox selections keyed by question index (e.g., "checkbox_0": ["option1", "option2"]) */
  [key: `checkbox_${number}`]: Array<string>;
  /** "Other" text input keyed by question index (e.g., "other_0": "custom text") */
  [key: `other_${number}`]: string;
  /** Radio selection keyed by question index (e.g., "radio_0": "option1") */
  [key: `radio_${number}`]: string;
  /** Text response keyed by question index (e.g., "text_0": "user response") */
  [key: `text_${number}`]: string;
}

interface ClarificationQuestionFormProps {
  isSubmitting?: boolean;
  onSubmit: (answers: Array<ClarificationAnswer>) => void;
  questions: Array<ClarificationQuestion>;
}

// =============================================================================
// Helpers
// =============================================================================

interface QuestionCardProps {
  children: ReactNode;
  header: string;
  index: number;
  question: string;
}

/**
 * Builds default form values from questions and optional draft answers from Zustand.
 */
function buildDefaultValues(
  questions: Array<ClarificationQuestion>,
  draftAnswers: Record<string, ClarificationAnswer>
): ClarificationFormValues {
  const defaults: Record<string, Array<string> | string> = {};

  for (const [index, question] of questions.entries()) {
    const draft = draftAnswers[String(index)];

    switch (question.questionType) {
      case 'checkbox': {
        defaults[`checkbox_${index}`] = draft?.type === 'checkbox' ? draft.selected : [];
        defaults[`other_${index}`] = draft?.type === 'checkbox' ? (draft.other ?? '') : '';
        break;
      }
      case 'radio': {
        defaults[`radio_${index}`] = draft?.type === 'radio' ? draft.selected : '';
        defaults[`other_${index}`] = draft?.type === 'radio' ? (draft.other ?? '') : '';
        break;
      }
      case 'text': {
        defaults[`text_${index}`] = draft?.type === 'text' ? draft.text : '';
        break;
      }
    }
  }

  return defaults as ClarificationFormValues;
}

// =============================================================================
// Question Card Components
// =============================================================================

/**
 * Transforms flat form values into an array of typed ClarificationAnswer objects.
 */
function transformToAnswers(
  values: ClarificationFormValues,
  questions: Array<ClarificationQuestion>
): Array<ClarificationAnswer> {
  return questions.map((question, index): ClarificationAnswer => {
    switch (question.questionType) {
      case 'checkbox': {
        const selected = (values[`checkbox_${index}`] as Array<string> | undefined) ?? [];
        const otherText = (values[`other_${index}`] as string | undefined) ?? '';
        const isOtherSelected = selected.includes(OTHER_OPTION_VALUE);
        const filteredSelected = selected.filter((v) => v !== OTHER_OPTION_VALUE);
        // When only "Other" is selected with no predefined options, include the
        // other text in selected so the schema's min(1) constraint is satisfied.
        const finalSelected =
          filteredSelected.length === 0 && isOtherSelected && otherText ? [otherText] : filteredSelected;
        return {
          other: isOtherSelected && otherText ? otherText : undefined,
          selected: finalSelected,
          type: 'checkbox',
        };
      }
      case 'radio': {
        const radioValue = (values[`radio_${index}`] as string | undefined) ?? '';
        const otherText = (values[`other_${index}`] as string | undefined) ?? '';
        const isOtherSelected = radioValue === OTHER_OPTION_VALUE;
        return {
          other: isOtherSelected && otherText ? otherText : undefined,
          selected: isOtherSelected ? otherText || 'Other' : radioValue,
          type: 'radio',
        };
      }
      case 'text': {
        return {
          text: (values[`text_${index}`] as string | undefined) ?? '',
          type: 'text',
        };
      }
    }
  });
}

const QuestionCard = ({ children, header, index, question }: QuestionCardProps) => {
  return (
    <div className={'rounded-lg border border-border bg-card p-4'}>
      {/* Question Header */}
      <div className={'mb-3 flex flex-col gap-1'}>
        <span className={'text-sm font-medium text-muted-foreground'}>
          Question {index + 1}: {header}
        </span>
        <p className={'text-base font-medium text-foreground'}>{question}</p>
      </div>

      {/* Question Content */}
      {children}
    </div>
  );
};

interface RadioQuestionProps {
  index: number;
  onOtherChange: (value: string) => void;
  onSelectionChange: (value: string) => void;
  otherValue: string;
  question: ClarificationQuestion;
  selectedValue: string;
}

const RadioQuestion = ({
  index,
  onOtherChange,
  onSelectionChange,
  otherValue,
  question,
  selectedValue,
}: RadioQuestionProps) => {
  const isOtherSelected = selectedValue === OTHER_OPTION_VALUE;

  return (
    <QuestionCard header={question.header} index={index} question={question.question}>
      {/* Radio Options */}
      <RadioGroup onValueChange={onSelectionChange} value={selectedValue}>
        {(question.options ?? []).map((option) => (
          <label className={'flex cursor-pointer items-start gap-2'} key={option.label}>
            <RadioGroupItem value={option.label} />
            <div className={'flex flex-col gap-0.5'}>
              <span className={'text-base text-foreground'}>{option.label}</span>
              {option.description && <span className={'text-sm text-muted-foreground'}>{option.description}</span>}
            </div>
          </label>
        ))}

        {/* "Other" Option */}
        {question.allowOther && (
          <label className={'flex cursor-pointer items-start gap-2'}>
            <RadioGroupItem value={OTHER_OPTION_VALUE} />
            <span className={'text-sm text-foreground'}>Other</span>
          </label>
        )}
      </RadioGroup>

      {/* "Other" Text Input */}
      {question.allowOther && isOtherSelected && (
        <div className={'mt-2 pl-6'}>
          <Input onChange={(e) => onOtherChange(e.target.value)} placeholder={'Please specify...'} value={otherValue} />
        </div>
      )}
    </QuestionCard>
  );
};

interface CheckboxQuestionProps {
  index: number;
  onOtherChange: (value: string) => void;
  onSelectionChange: (selected: Array<string>) => void;
  otherValue: string;
  question: ClarificationQuestion;
  selectedValues: Array<string>;
}

const CheckboxQuestion = ({
  index,
  onOtherChange,
  onSelectionChange,
  otherValue,
  question,
  selectedValues,
}: CheckboxQuestionProps) => {
  const isOtherSelected = selectedValues.includes(OTHER_OPTION_VALUE);

  const handleCheckboxChange = useCallback(
    (optionValue: string, isChecked: boolean) => {
      if (isChecked) {
        if (!selectedValues.includes(optionValue)) {
          onSelectionChange([...selectedValues, optionValue]);
        }
      } else {
        onSelectionChange(selectedValues.filter((v) => v !== optionValue));
      }
    },
    [onSelectionChange, selectedValues]
  );

  return (
    <QuestionCard header={question.header} index={index} question={question.question}>
      {/* Checkbox Options */}
      <div className={'flex flex-col gap-2'}>
        {(question.options ?? []).map((option) => {
          const isChecked = selectedValues.includes(option.label);

          return (
            <label className={'flex cursor-pointer items-start gap-2'} key={option.label}>
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => handleCheckboxChange(option.label, checked)}
              />
              <div className={'flex flex-col gap-0.5'}>
                <span className={'text-sm text-foreground'}>{option.label}</span>
                {option.description && <span className={'text-xs text-muted-foreground'}>{option.description}</span>}
              </div>
            </label>
          );
        })}

        {/* "Other" Option */}
        {question.allowOther && (
          <label className={'flex cursor-pointer items-start gap-2'}>
            <Checkbox
              checked={isOtherSelected}
              onCheckedChange={(checked) => handleCheckboxChange(OTHER_OPTION_VALUE, checked)}
            />
            <span className={'text-sm text-foreground'}>Other</span>
          </label>
        )}
      </div>

      {/* "Other" Text Input */}
      {question.allowOther && isOtherSelected && (
        <div className={'mt-2 pl-6'}>
          <Input onChange={(e) => onOtherChange(e.target.value)} placeholder={'Please specify...'} value={otherValue} />
        </div>
      )}
    </QuestionCard>
  );
};

interface TextQuestionProps {
  index: number;
  onTextChange: (value: string) => void;
  question: ClarificationQuestion;
  textValue: string;
}

const TextQuestion = ({ index, onTextChange, question, textValue }: TextQuestionProps) => {
  return (
    <QuestionCard header={question.header} index={index} question={question.question}>
      {/* Text Response */}
      <Textarea
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={'Type your response...'}
        rows={4}
        value={textValue}
      />
    </QuestionCard>
  );
};

// =============================================================================
// Main Form Component
// =============================================================================

export const ClarificationQuestionForm = ({ isSubmitting, onSubmit, questions }: ClarificationQuestionFormProps) => {
  const { clarificationDraftAnswers, removeClarificationDraftAnswer, setClarificationDraftAnswer } =
    useWorkflowDetailStore();

  const defaultValues = useMemo(
    () => buildDefaultValues(questions, clarificationDraftAnswers),
    // Only compute defaults on mount - draft answers are synced via form changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions]
  );

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      const answers = transformToAnswers(value, questions);
      onSubmit(answers);
    },
  });

  // Sync form changes to Zustand draft answers (debounced)
  const formValues = useStore(form.store, (state) => state.values);
  const debounceTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      for (const [index, question] of questions.entries()) {
        const questionIndex = String(index);

        switch (question.questionType) {
          case 'checkbox': {
            const selected = (formValues[`checkbox_${index}`] as Array<string> | undefined) ?? [];
            const other = (formValues[`other_${index}`] as string | undefined) ?? '';
            const isOtherSelected = selected.includes(OTHER_OPTION_VALUE);
            const filteredSelected = selected.filter((v) => v !== OTHER_OPTION_VALUE);

            // Sync meaningful data or clear stale draft
            if (filteredSelected.length > 0 || (isOtherSelected && other)) {
              setClarificationDraftAnswer(questionIndex, {
                other: isOtherSelected && other ? other : undefined,
                selected: filteredSelected,
                type: 'checkbox',
              });
            } else {
              removeClarificationDraftAnswer(questionIndex);
            }
            break;
          }
          case 'radio': {
            const radioValue = (formValues[`radio_${index}`] as string | undefined) ?? '';
            const other = (formValues[`other_${index}`] as string | undefined) ?? '';
            const isOtherSelected = radioValue === OTHER_OPTION_VALUE;

            // Sync selection or clear stale draft
            if (radioValue) {
              setClarificationDraftAnswer(questionIndex, {
                other: isOtherSelected && other ? other : undefined,
                selected: isOtherSelected ? other || 'Other' : radioValue,
                type: 'radio',
              });
            } else {
              removeClarificationDraftAnswer(questionIndex);
            }
            break;
          }
          case 'text': {
            const text = (formValues[`text_${index}`] as string | undefined) ?? '';

            // Sync text or clear stale draft
            if (text) {
              setClarificationDraftAnswer(questionIndex, {
                text,
                type: 'text',
              });
            } else {
              removeClarificationDraftAnswer(questionIndex);
            }
            break;
          }
        }
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formValues, questions, removeClarificationDraftAnswer, setClarificationDraftAnswer]);

  return (
    <form
      className={cn(isSubmitting && 'pointer-events-none opacity-60')}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className={'flex flex-col gap-4'}>
        {/* Question Cards */}
        {questions.map((question, index) => (
          <Fragment key={index}>
            {question.questionType === 'radio' && (
              <form.Field name={`radio_${index}` as keyof ClarificationFormValues}>
                {(radioField) => (
                  <form.Field name={`other_${index}` as keyof ClarificationFormValues}>
                    {(otherField) => (
                      <RadioQuestion
                        index={index}
                        onOtherChange={(value) =>
                          otherField.handleChange(value as ClarificationFormValues[`other_${number}`])
                        }
                        onSelectionChange={(value) =>
                          radioField.handleChange(value as ClarificationFormValues[`radio_${number}`])
                        }
                        otherValue={(otherField.state.value as string) ?? ''}
                        question={question}
                        selectedValue={(radioField.state.value as string) ?? ''}
                      />
                    )}
                  </form.Field>
                )}
              </form.Field>
            )}

            {question.questionType === 'checkbox' && (
              <form.Field name={`checkbox_${index}` as keyof ClarificationFormValues}>
                {(checkboxField) => (
                  <form.Field name={`other_${index}` as keyof ClarificationFormValues}>
                    {(otherField) => (
                      <CheckboxQuestion
                        index={index}
                        onOtherChange={(value) =>
                          otherField.handleChange(value as ClarificationFormValues[`other_${number}`])
                        }
                        onSelectionChange={(selected) =>
                          checkboxField.handleChange(selected as ClarificationFormValues[`checkbox_${number}`])
                        }
                        otherValue={(otherField.state.value as string) ?? ''}
                        question={question}
                        selectedValues={(checkboxField.state.value as Array<string>) ?? []}
                      />
                    )}
                  </form.Field>
                )}
              </form.Field>
            )}

            {question.questionType === 'text' && (
              <form.Field name={`text_${index}` as keyof ClarificationFormValues}>
                {(textField) => (
                  <TextQuestion
                    index={index}
                    onTextChange={(value) => textField.handleChange(value as ClarificationFormValues[`text_${number}`])}
                    question={question}
                    textValue={(textField.state.value as string) ?? ''}
                  />
                )}
              </form.Field>
            )}
          </Fragment>
        ))}

        {/* Submit Button */}
        <div className={'mt-2 flex justify-end'}>
          <form.AppForm>
            <form.SubmitButton>{isSubmitting ? 'Submitting Answers...' : 'Submit Answers'}</form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
};
