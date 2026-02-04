'use client';

import { Fragment } from 'react';

import type { ClarificationQuestion } from '@/lib/validations/clarification';

interface ClarificationAnswerFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  isDisabled?: boolean;
  question: ClarificationQuestion;
  questionIndex: number;
}

/**
 * ClarificationAnswerField renders different field types based on the question's questionType.
 * Supports radio (single select), checkbox (multi-select), and text (open-ended) questions.
 * Conditionally shows "Other" text input when allowOther is true for radio/checkbox types.
 */
export const ClarificationAnswerField = ({
  form,
  isDisabled = false,
  question,
  questionIndex,
}: ClarificationAnswerFieldProps) => {

  const questionType = question.questionType ?? 'radio';
  const _hasOtherOption = question.allowOther ?? false;

  // Radio field
  if (questionType === 'radio') {
    const options = (question.options ?? []).map((option) => ({
      description: option.description,
      label: option.label,
      value: option.label,
    }));

    const selectedFieldName = `${questionIndex}.selected`;
    const otherFieldName = `${questionIndex}.other`;

    return (
      <Fragment>
        <form.AppField name={selectedFieldName}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => <field.RadioField isDisabled={isDisabled} label={''} options={options} />}
        </form.AppField>

        {_hasOtherOption && (
          <div className={'mt-3'}>
            <form.AppField name={otherFieldName}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <field.TextField
                  isDisabled={isDisabled}
                  label={'Other (please specify)'}
                  placeholder={'Enter custom response...'}
                />
              )}
            </form.AppField>
          </div>
        )}
      </Fragment>
    );
  }

  // Checkbox field
  if (questionType === 'checkbox') {
    const options = (question.options ?? []).map((option) => ({
      description: option.description,
      label: option.label,
      value: option.label,
    }));

    const selectedFieldName = `${questionIndex}.selected`;
    const otherFieldName = `${questionIndex}.other`;

    return (
      <Fragment>
        <form.AppField name={selectedFieldName}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => <field.CheckboxGroupField isDisabled={isDisabled} label={''} options={options} />}
        </form.AppField>

        {_hasOtherOption && (
          <div className={'mt-3'}>
            <form.AppField name={otherFieldName}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(field: any) => (
                <field.TextField
                  isDisabled={isDisabled}
                  label={'Other (please specify)'}
                  placeholder={'Enter custom response...'}
                />
              )}
            </form.AppField>
          </div>
        )}
      </Fragment>
    );
  }

  // Text field
  if (questionType === 'text') {
    const textFieldName = `${questionIndex}.text`;

    return (
      <form.AppField name={textFieldName}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => (
          <field.TextField isDisabled={isDisabled} label={question.question} placeholder={'Enter your response...'} />
        )}
      </form.AppField>
    );
  }

  // Fallback (should never reach here)
  return null;
};
