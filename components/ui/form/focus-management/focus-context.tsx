'use client';
import type { RefObject } from 'react';

import { createContext, useContext, useMemo } from 'react';

import { useFocusManagement } from '@/components/ui/form/focus-management/use-focus-management';

export type FocusRef = RefObject<HTMLElement | null>;

interface FocusContextValue {
  focusFirstError: ReturnType<typeof useFocusManagement>['focusFirstError'];
  registerField: (name: string, ref: FocusRef) => void;
  unregisterField: (name: string) => void;
}
const FocusContext = createContext<FocusContextValue | null>(null);

export const useFocusContext = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocusContext must be used within a FocusProvider');
  }
  return context;
};

type FocusProviderProps = RequiredChildren;

export const FocusProvider = ({ children }: FocusProviderProps) => {
  const { focusFirstError, registerField, unregisterField } = useFocusManagement();

  const value = useMemo(
    () => ({
      focusFirstError,
      registerField,
      unregisterField,
    }),
    [focusFirstError, registerField, unregisterField]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
};
