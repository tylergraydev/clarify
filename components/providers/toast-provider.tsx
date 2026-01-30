'use client';

import { Toast } from '@base-ui/react/toast';
import { Fragment } from 'react';

import type { ToastType } from '@/components/ui/toast';

import {
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastIcon,
  ToastPortal,
  ToastRootStyled,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

/** Toast data structure for custom rendering */
interface ToastData {
  type?: ToastType;
}

type ToastProviderProps = RequiredChildren;

export const ToastProvider = ({ children }: ToastProviderProps) => {
  return (
    <Toast.Provider timeout={5000}>
      {children}
      <ToastPortal>
        <ToastViewport
          className={`
            fixed right-4 bottom-4 z-50 flex flex-col gap-2 outline-none
          `}
        >
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </Toast.Provider>
  );
};

/** Internal component to render the list of toasts using the toast manager */
const ToastList = () => {
  const toastManager = Toast.useToastManager();

  return (
    <Fragment>
      {toastManager.toasts.map((toast) => {
        const data = toast.data as ToastData | undefined;
        const type = (toast.type as ToastType) || data?.type || 'default';

        return (
          <ToastRootStyled key={toast.id} toast={toast} variant={type}>
            <ToastContent className={'flex items-start gap-3 pr-6'}>
              {/* Icon */}
              <ToastIcon type={type} />

              {/* Content */}
              <div className={'flex min-w-0 flex-1 flex-col gap-0.5'}>
                {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
                {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
              </div>
            </ToastContent>
            <ToastClose />
          </ToastRootStyled>
        );
      })}
    </Fragment>
  );
};
