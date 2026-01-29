'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Card } from '../ui/card';
import { Separator } from '../ui/separator';

interface SettingsSectionProps extends ComponentPropsWithRef<'div'> {
  children: ReactNode;
  title: string;
}

export const SettingsSection = ({
  children,
  className,
  ref,
  title,
  ...props
}: SettingsSectionProps) => {
  return (
    <Card
      className={cn('flex flex-col', className)}
      ref={ref}
      {...props}
    >
      {/* Section Header */}
      <div className={'px-6 pt-6'}>
        <h3 className={'text-lg font-semibold tracking-tight'}>{title}</h3>
      </div>

      {/* Divider */}
      <div className={'px-6 py-4'}>
        <Separator />
      </div>

      {/* Section Content */}
      <div className={'flex flex-col gap-6 px-6 pb-6'}>{children}</div>
    </Card>
  );
};
