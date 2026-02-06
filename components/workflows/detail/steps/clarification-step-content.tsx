'use client';

import { Plus, RotateCcw, SkipForward } from 'lucide-react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const handleSubmitAnswers = () => {
  // No-op: placeholder
};

const handleRerun = () => {
  // No-op: placeholder
};

const handleAskMore = () => {
  // No-op: placeholder
};

const handleSkip = () => {
  // No-op: placeholder
};

export const ClarificationStepContent = () => {
  return (
    <div className={'flex flex-col gap-6'}>
      {/* Question Form */}
      <div className={'flex flex-col gap-5'}>
        {/* Question 1: Text Input */}
        <div className={'flex flex-col gap-1.5'}>
          <label className={'text-sm font-medium text-foreground'} htmlFor={'q-audience'}>
            What is the target audience?
          </label>
          <input
            className={
              'h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none'
            }
            id={'q-audience'}
            placeholder={'Describe the target audience...'}
            type={'text'}
          />
        </div>

        {/* Question 2: Radio Group */}
        <fieldset className={'flex flex-col gap-2'}>
          <legend className={'text-sm font-medium text-foreground'}>What priority level?</legend>
          <div className={'flex flex-col gap-1.5 pl-1'}>
            {['High', 'Medium', 'Low'].map((option) => (
              <label className={'flex items-center gap-2 text-sm text-foreground'} key={option}>
                <input
                  className={'size-4 accent-accent'}
                  name={'priority'}
                  type={'radio'}
                  value={option.toLowerCase()}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Question 3: Checkbox Group */}
        <fieldset className={'flex flex-col gap-2'}>
          <legend className={'text-sm font-medium text-foreground'}>Which platforms?</legend>
          <div className={'flex flex-col gap-1.5 pl-1'}>
            {['Web', 'Mobile', 'Desktop'].map((platform) => (
              <label className={'flex items-center gap-2 text-sm text-foreground'} key={platform}>
                <input
                  className={'size-4 accent-accent'}
                  name={`platform-${platform.toLowerCase()}`}
                  type={'checkbox'}
                  value={platform.toLowerCase()}
                />
                {platform}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Submit Answers */}
      <div>
        <Button onClick={handleSubmitAnswers}>Submit Answers</Button>
      </div>

      <Separator />

      {/* Action Bar */}
      <div className={'flex items-center gap-2'}>
        <Button onClick={handleRerun} variant={'outline'}>
          <RotateCcw aria-hidden={'true'} className={'size-4'} />
          Re-run
        </Button>

        <Button onClick={handleAskMore} variant={'outline'}>
          <Plus aria-hidden={'true'} className={'size-4'} />
          Ask More
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
