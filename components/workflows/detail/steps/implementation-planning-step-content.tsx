'use client';

import { Pencil, RotateCcw, SkipForward, Square } from 'lucide-react';
import { useState } from 'react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ImplementationStep {
  description: string;
  files: Array<string>;
  successCriteria: Array<string>;
  title: string;
  validationCommands: Array<string>;
}

const MOCK_IMPLEMENTATION_STEPS: Array<ImplementationStep> = [
  {
    description:
      'Define the user table schema using Drizzle ORM with proper column types, constraints, and indexes for efficient querying.',
    files: ['db/schema/users.schema.ts', 'db/schema/index.ts', 'drizzle.config.ts'],
    successCriteria: [
      'Schema file exports user table definition',
      'All required columns defined with correct types',
      'Migration generates without errors',
      'Index exists on email column',
    ],
    title: 'Create user schema',
    validationCommands: ['bun db:generate', 'bun db:migrate', 'bun typecheck'],
  },
  {
    description:
      'Implement the repository pattern for users with standard CRUD operations and any custom query methods needed.',
    files: ['db/repositories/users.repository.ts', 'db/repositories/index.ts'],
    successCriteria: [
      'Repository exports create, getById, getAll, update, and delete methods',
      'Custom findByEmail method implemented',
      'All methods use proper Drizzle query patterns',
    ],
    title: 'Add user repository',
    validationCommands: ['bun typecheck', 'bun lint'],
  },
  {
    description:
      'Build the user list page with a data table showing all users, including sorting, filtering, and pagination support.',
    files: ['app/(app)/users/page.tsx', 'components/users/user-table.tsx', 'components/users/user-table-toolbar.tsx'],
    successCriteria: [
      'Page renders user table with mock data',
      'Column sorting works on name and email columns',
      'Filter toolbar allows text search',
      'Pagination displays correct page counts',
    ],
    title: 'Build user list page',
    validationCommands: ['bun typecheck', 'bun lint', 'bun build'],
  },
  {
    description:
      'Create the user creation and editing form using TanStack Form with field-level validation and Zod schema integration.',
    files: [
      'components/users/create-user-dialog.tsx',
      'components/users/edit-user-dialog.tsx',
      'lib/validations/user.validations.ts',
    ],
    successCriteria: [
      'Create dialog opens and renders all form fields',
      'Validation errors display on invalid input',
      'Edit dialog pre-fills existing user data',
      'Form submission calls the correct handler',
    ],
    title: 'Create user form',
    validationCommands: ['bun typecheck', 'bun lint'],
  },
  {
    description:
      'Add React Query hooks for fetching, creating, updating, and deleting users with optimistic updates and cache invalidation.',
    files: ['hooks/queries/use-users.ts', 'lib/queries/users.ts', 'electron/ipc/users.ipc.ts'],
    successCriteria: [
      'Query key factory defined for users domain',
      'useUsers hook returns paginated user data',
      'useCreateUser mutation invalidates user list cache',
      'useUpdateUser mutation uses optimistic updates',
      'IPC handlers registered for all user operations',
    ],
    title: 'Add query hooks',
    validationCommands: ['bun typecheck', 'bun lint'],
  },
];

const handleRerun = () => {
  // No-op: placeholder
};

const handleRefinePlan = () => {
  // No-op: placeholder
};

const handleSkip = () => {
  // No-op: placeholder
};

export const ImplementationPlanningStepContent = () => {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  const selectedStep = MOCK_IMPLEMENTATION_STEPS[selectedStepIndex];

  const handleStepClick = (index: number) => {
    setSelectedStepIndex(index);
  };

  return (
    <div className={'flex flex-col gap-6'}>
      {/* Split Layout: Step List and Detail Panel */}
      <div className={'grid grid-cols-3 gap-6'}>
        {/* Left Panel: Step List */}
        <div className={'col-span-1 flex flex-col gap-1 overflow-y-auto rounded-md border border-border p-2'}>
          {MOCK_IMPLEMENTATION_STEPS.map((step, index) => {
            const isSelected = index === selectedStepIndex;

            return (
              <button
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-muted',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none',
                  isSelected && 'bg-accent text-accent-foreground hover:bg-accent-hover'
                )}
                key={step.title}
                onClick={() => handleStepClick(index)}
                type={'button'}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    isSelected ? 'bg-accent-foreground/20 text-accent-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </span>
                <span className={'truncate font-medium'}>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Panel: Step Detail */}
        {selectedStep && (
          <div className={'col-span-2 flex flex-col gap-5'}>
            {/* Step Title */}
            <div className={'flex flex-col gap-1'}>
              <h3 className={'text-base font-semibold text-foreground'}>
                Step {selectedStepIndex + 1}: {selectedStep.title}
              </h3>
              <p className={'text-sm text-muted-foreground'}>{selectedStep.description}</p>
            </div>

            {/* Files */}
            <div className={'flex flex-col gap-2'}>
              <h4 className={'text-sm font-medium text-foreground'}>Files</h4>
              <div className={'flex flex-wrap gap-1.5'}>
                {selectedStep.files.map((file) => (
                  <code className={'rounded-md bg-muted px-2 py-0.5 text-xs text-foreground'} key={file}>
                    {file}
                  </code>
                ))}
              </div>
            </div>

            {/* Validation Commands */}
            <div className={'flex flex-col gap-2'}>
              <h4 className={'text-sm font-medium text-foreground'}>Validation Commands</h4>
              <pre className={'overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs text-foreground'}>
                {selectedStep.validationCommands.join('\n')}
              </pre>
            </div>

            {/* Success Criteria */}
            <div className={'flex flex-col gap-2'}>
              <h4 className={'text-sm font-medium text-foreground'}>Success Criteria</h4>
              <ul className={'flex flex-col gap-1.5'}>
                {selectedStep.successCriteria.map((criterion) => (
                  <li className={'flex items-start gap-2 text-sm text-foreground'} key={criterion}>
                    <span className={'mt-0.5 shrink-0 text-muted-foreground'}>
                      <Square aria-hidden={'true'} className={'size-4'} />
                    </span>
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Action Bar */}
      <div className={'flex items-center gap-2'}>
        <Button onClick={handleRerun} variant={'outline'}>
          <RotateCcw aria-hidden={'true'} className={'size-4'} />
          Re-run
        </Button>

        <Button onClick={handleRefinePlan} variant={'outline'}>
          <Pencil aria-hidden={'true'} className={'size-4'} />
          Refine Plan
        </Button>

        <Button onClick={handleSkip} variant={'ghost'}>
          <SkipForward aria-hidden={'true'} className={'size-4'} />
          Skip
        </Button>

        {/* Agent Dropdown Placeholder */}
        <Fragment>
          <div className={'ml-auto'}>
            <Button disabled variant={'outline'}>
              Agent: Default
            </Button>
          </div>
        </Fragment>
      </div>
    </div>
  );
};
