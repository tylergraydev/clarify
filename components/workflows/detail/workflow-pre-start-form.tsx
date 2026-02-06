'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { pauseBehaviors } from '@/db/schema/workflows.schema';
import { useAppForm } from '@/lib/forms';

const pauseBehaviorOptions = pauseBehaviors.map((behavior) => ({
  label: behavior
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' '),
  value: behavior,
}));

const clarificationAgentOptions = [
  { label: 'Default Agent', value: 'default' },
  { label: 'Custom Agent', value: 'custom' },
];

export const WorkflowPreStartForm = () => {
  const form = useAppForm({
    defaultValues: {
      clarificationAgent: '',
      featureName: '',
      featureRequest: '',
      isSkipClarification: false,
      pauseBehavior: 'auto_pause',
    },
    onSubmit: () => {
      // No-op: UI-only placeholder
    },
  });

  return (
    <div className={'mx-auto max-w-2xl'}>
      <Card>
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
        </CardHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <CardContent>
            <div className={'flex flex-col gap-4'}>
              {/* Feature Name */}
              <form.AppField name={'featureName'}>
                {(field) => (
                  <field.TextField
                    label={'Feature Name'}
                    placeholder={'Enter a name for this feature'}
                  />
                )}
              </form.AppField>

              {/* Feature Request */}
              <form.AppField name={'featureRequest'}>
                {(field) => (
                  <field.TextareaField
                    description={'Describe the feature you want to implement'}
                    label={'Feature Request'}
                    placeholder={'Describe the feature request...'}
                    rows={5}
                  />
                )}
              </form.AppField>

              {/* Pause Behavior */}
              <form.AppField name={'pauseBehavior'}>
                {(field) => (
                  <field.SelectField
                    description={'Controls when the workflow pauses for review'}
                    label={'Pause Behavior'}
                    options={pauseBehaviorOptions}
                    placeholder={'Select pause behavior'}
                  />
                )}
              </form.AppField>

              {/* Skip Clarification */}
              <form.AppField name={'isSkipClarification'}>
                {(field) => (
                  <field.SwitchField
                    description={'Skip the clarification step and proceed directly to refinement'}
                    label={'Skip Clarification'}
                  />
                )}
              </form.AppField>

              {/* Clarification Agent */}
              <form.AppField name={'clarificationAgent'}>
                {(field) => (
                  <field.SelectField
                    description={'The agent used for the clarification step'}
                    label={'Clarification Agent'}
                    options={clarificationAgentOptions}
                    placeholder={'Select an agent'}
                  />
                )}
              </form.AppField>
            </div>
          </CardContent>

          {/* Action Footer */}
          <CardFooter className={'justify-end'}>
            <form.AppForm>
              <form.SubmitButton>Start Workflow</form.SubmitButton>
            </form.AppForm>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
