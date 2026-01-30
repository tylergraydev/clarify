'use client';

import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Skeleton loading state for the settings page.
 * Mirrors the structure of SettingsForm with four sections:
 * - Workflow Execution (radio group + number input)
 * - Git Worktrees (path input + 3 switches)
 * - Logging & Audit (number input + 2 switches + path input)
 * - Appearance (theme selector with 3 radio options)
 */
export const SettingsSkeleton = () => {
  return (
    <div className={'flex flex-col gap-6'}>
      {/* Workflow Settings Section */}
      <SkeletonSection>
        {/* Section Header */}
        <div className={'px-6 pt-6'}>
          <div className={'h-6 w-40 animate-pulse rounded-sm bg-muted'} />
        </div>

        {/* Divider */}
        <div className={'px-6 py-4'}>
          <Separator />
        </div>

        {/* Section Content */}
        <div className={'flex flex-col gap-6 px-6 pb-6'}>
          {/* Radio Group Field */}
          <SkeletonRadioGroup optionCount={3} />

          {/* Number Input Field */}
          <SkeletonInputField />
        </div>
      </SkeletonSection>

      {/* Worktree Settings Section */}
      <SkeletonSection>
        {/* Section Header */}
        <div className={'px-6 pt-6'}>
          <div className={'h-6 w-28 animate-pulse rounded-sm bg-muted'} />
        </div>

        {/* Divider */}
        <div className={'px-6 py-4'}>
          <Separator />
        </div>

        {/* Section Content */}
        <div className={'flex flex-col gap-6 px-6 pb-6'}>
          {/* Path Input Field */}
          <SkeletonInputField isPathField={true} />

          {/* Switch Fields */}
          <SkeletonSwitchField />
          <SkeletonSwitchField />
          <SkeletonSwitchField />
        </div>
      </SkeletonSection>

      {/* Logging Settings Section */}
      <SkeletonSection>
        {/* Section Header */}
        <div className={'px-6 pt-6'}>
          <div className={'h-6 w-32 animate-pulse rounded-sm bg-muted'} />
        </div>

        {/* Divider */}
        <div className={'px-6 py-4'}>
          <Separator />
        </div>

        {/* Section Content */}
        <div className={'flex flex-col gap-6 px-6 pb-6'}>
          {/* Number Input Field */}
          <SkeletonInputField />

          {/* Switch Fields */}
          <SkeletonSwitchField />
          <SkeletonSwitchField />

          {/* Path Input Field */}
          <SkeletonInputField isPathField={true} />
        </div>
      </SkeletonSection>

      {/* UI Settings Section */}
      <SkeletonSection>
        {/* Section Header */}
        <div className={'px-6 pt-6'}>
          <div className={'h-6 w-24 animate-pulse rounded-sm bg-muted'} />
        </div>

        {/* Divider */}
        <div className={'px-6 py-4'}>
          <Separator />
        </div>

        {/* Section Content */}
        <div className={'flex flex-col gap-6 px-6 pb-6'}>
          {/* Theme Selector - Radio Group */}
          <SkeletonRadioGroup optionCount={3} />
        </div>
      </SkeletonSection>

      {/* Form Actions */}
      <div className={'flex justify-end'}>
        <div className={'h-9 w-28 animate-pulse rounded-md bg-muted'} />
      </div>
    </div>
  );
};

/**
 * Skeleton wrapper for a settings section card.
 */
const SkeletonSection = ({ children }: { children: ReactNode }) => {
  return <Card className={'flex flex-col'}>{children}</Card>;
};

/**
 * Skeleton for a radio group field with label and options.
 */
const SkeletonRadioGroup = ({ optionCount }: { optionCount: number }) => {
  return (
    <div className={'space-y-3'}>
      {/* Label */}
      <div className={'h-5 w-36 animate-pulse rounded-sm bg-muted'} />

      {/* Radio Options */}
      <div className={'space-y-2'}>
        {Array.from({ length: optionCount }).map((_, index) => (
          <div className={'flex items-center gap-3'} key={index}>
            {/* Radio Circle */}
            <div className={'size-4 animate-pulse rounded-full bg-muted'} />

            {/* Option Label and Description */}
            <div className={'space-y-1'}>
              <div className={'h-4 w-24 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-3 w-48 animate-pulse rounded-sm bg-muted'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for an input field (number or path).
 */
const SkeletonInputField = ({ isPathField = false }: { isPathField?: boolean }) => {
  return (
    <div className={'space-y-2'}>
      {/* Label */}
      <div className={'h-5 w-32 animate-pulse rounded-sm bg-muted'} />

      {/* Input with optional browse button for path fields */}
      <div className={'flex gap-2'}>
        <div className={`h-9 animate-pulse rounded-md bg-muted ${isPathField ? 'flex-1' : 'w-24'}`} />
        {isPathField && <div className={'h-9 w-20 animate-pulse rounded-md bg-muted'} />}
      </div>

      {/* Description */}
      <div className={'h-4 w-64 animate-pulse rounded-sm bg-muted'} />
    </div>
  );
};

/**
 * Skeleton for a switch/toggle field with label and description.
 */
const SkeletonSwitchField = () => {
  return (
    <div className={'flex items-center justify-between'}>
      {/* Label and Description */}
      <div className={'space-y-1'}>
        <div className={'h-5 w-36 animate-pulse rounded-sm bg-muted'} />
        <div className={'h-4 w-56 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Switch Toggle */}
      <div className={'h-5 w-9 animate-pulse rounded-full bg-muted'} />
    </div>
  );
};
