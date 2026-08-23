'use client';

import React, { createContext, useContext } from 'react';
import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
}

const toastHelpers = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
};

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: (type, message) => {
    if (type === 'success') sonnerToast.success(message);
    else if (type === 'error') sonnerToast.error(message);
    else if (type === 'warning') sonnerToast.warning(message);
    else sonnerToast.info(message);
  },
  removeToast: () => {},
  toast: toastHelpers,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContext.Provider
      value={{
        toasts: [],
        addToast: (type, message) => {
          if (type === 'success') sonnerToast.success(message);
          else if (type === 'error') sonnerToast.error(message);
          else if (type === 'warning') sonnerToast.warning(message);
          else sonnerToast.info(message);
        },
        removeToast: () => {},
        toast: toastHelpers,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  return context || {
    toasts: [],
    addToast: () => {},
    removeToast: () => {},
    toast: toastHelpers,
  };
}

export { sonnerToast as toast };
