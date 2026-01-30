'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';

import { cn } from '@/lib/utils';

import { fieldWrapperVariants } from './field-wrapper';

type TanStackFieldRootProps = ClassName &
  RequiredChildren &
  VariantProps<typeof fieldWrapperVariants> & {
    isDirty?: boolean;
    isDisabled?: boolean;
    isInvalid?: boolean;
    isTouched?: boolean;
    name: string;
  };

export function TanStackFieldRoot({
  children,
  className,
  isDirty,
  isDisabled,
  isInvalid,
  isTouched,
  name,
  size,
}: TanStackFieldRootProps) {
  return (
    <Field.Root
      className={cn(fieldWrapperVariants({ size }), className)}
      dirty={isDirty}
      disabled={isDisabled}
      invalid={isInvalid}
      name={name}
      touched={isTouched}
    >
      {children}
    </Field.Root>
  );
}
