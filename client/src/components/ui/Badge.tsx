import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'text-[var(--fn-success)] bg-[var(--fn-success)]/10',
  warning: 'text-[var(--fn-warning)] bg-[var(--fn-warning)]/10',
  error: 'text-[var(--fn-error)] bg-[var(--fn-error)]/10',
  info: 'text-[var(--fn-info)] bg-[var(--fn-info)]/10',
  neutral: 'text-[var(--fn-text-secondary)] bg-[var(--fn-elevated)]',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-[var(--fn-success)]',
  warning: 'bg-[var(--fn-warning)]',
  error: 'bg-[var(--fn-error)]',
  info: 'bg-[var(--fn-info)]',
  neutral: 'bg-[var(--fn-text-tertiary)]',
};

export default function Badge({
  variant = 'neutral',
  children,
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium
        rounded-full ${variantStyles[variant]} ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
