'use client';

import { Toaster } from 'sonner';

export default function ToastRenderer() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        style: {
          fontFamily: 'Satoshi, sans-serif',
          borderRadius: '12px',
        },
      }}
    />
  );
}
