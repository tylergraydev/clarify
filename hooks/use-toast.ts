"use client";

import { Toast } from "@base-ui/react/toast";

import type { ToastType } from "@/components/ui/toast";

/**
 * Hook to access the toast manager for displaying notifications.
 *
 * Must be used within a ToastProvider.
 *
 * @example
 * const toast = useToast();
 *
 * // Simple toast
 * toast.add({ description: 'Hello!' });
 *
 * // Toast with type
 * toast.success({ description: 'Operation completed!' });
 * toast.error({ description: 'Something went wrong!' });
 * toast.info({ description: 'Here is some information.' });
 * toast.warning({ description: 'Be careful!' });
 *
 * // Promise toast (loading -> success/error)
 * toast.promise(fetchData(), {
 *   loading: 'Loading...',
 *   success: 'Data loaded!',
 *   error: 'Failed to load data.',
 * });
 */
export const useToast = () => {
  const toastManager = Toast.useToastManager();

  return {
    /**
     * Add a toast notification
     */
    add: toastManager.add,

    /**
     * Close a toast by ID
     */
    close: toastManager.close,

    /**
     * Show an error toast
     */
    error: (options: ToastOptions) =>
      toastManager.add({
        ...options,
        type: "error",
      }),

    /**
     * Show an info toast
     */
    info: (options: ToastOptions) =>
      toastManager.add({
        ...options,
        type: "info",
      }),

    /**
     * Create a promise-based toast with loading, success, and error states
     */
    promise: toastManager.promise,

    /**
     * Show a success toast
     */
    success: (options: ToastOptions) =>
      toastManager.add({
        ...options,
        type: "success",
      }),

    /**
     * The raw toasts array
     */
    toasts: toastManager.toasts,

    /**
     * Update an existing toast
     */
    update: toastManager.update,

    /**
     * Show a warning toast
     */
    warning: (options: ToastOptions) =>
      toastManager.add({
        ...options,
        type: "warning",
      }),
  };
};

interface ToastOptions {
  description?: string;
  onClose?: () => void;
  onRemove?: () => void;
  timeout?: number;
  title?: string;
  type?: ToastType;
}
