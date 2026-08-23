'use client';

import React, { useEffect, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl w-full h-[90vh]',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--fn-overlay)] backdrop-blur-xs animate-fn-fade-in"
        onClick={onClose}
      />

      {/* Modal Panel with Top/Bottom Margins & Scrollable Body */}
      <div
        className={`
          relative w-full ${sizeMap[size]}
          max-h-[92vh] flex flex-col my-auto
          bg-[var(--fn-elevated)] border border-[var(--fn-border)]
          rounded-[var(--fn-radius-xl)] shadow-2xl
          animate-fn-slide-down overflow-hidden z-10
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--fn-border)] bg-[var(--fn-surface)] shrink-0 select-none">
            <div className="text-base font-bold text-[var(--fn-text)] tracking-tight">
              {title}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--fn-radius-sm)] text-[var(--fn-text-tertiary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-[var(--fn-border)] bg-[var(--fn-surface)] flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
