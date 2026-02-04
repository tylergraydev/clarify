import { createFormHook, createFormHookContexts } from '@tanstack/react-form';

import { PathInputField } from '@/components/settings/path-input-field';
import { CheckboxField } from '@/components/ui/form/checkbox-field';
import { CheckboxGroupField } from '@/components/ui/form/checkbox-group-field';
import { ColorPickerField } from '@/components/ui/form/color-picker-field';
import { FormError } from '@/components/ui/form/form-error';
import { MultiSelectField } from '@/components/ui/form/multi-select-field';
import { NumberFieldComponent } from '@/components/ui/form/number-field';
import { RadioField } from '@/components/ui/form/radio-field';
import { SelectField } from '@/components/ui/form/select-field';
import { SubmitButton } from '@/components/ui/form/submit-button';
import { SwitchField } from '@/components/ui/form/switch-field';
import { TextField } from '@/components/ui/form/text-field';
import { TextareaField } from '@/components/ui/form/textarea-field';

export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    CheckboxField,
    CheckboxGroupField,
    ColorPickerField,
    MultiSelectField,
    NumberField: NumberFieldComponent,
    PathInputField,
    RadioField,
    SelectField,
    SwitchField,
    TextareaField,
    TextField,
  },
  fieldContext,
  formComponents: {
    FormError,
    SubmitButton,
  },
  formContext,
});
